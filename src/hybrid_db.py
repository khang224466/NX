import os
import sys
from typing import Any, Dict, List, Optional, Tuple
import duckdb
import chromadb
from chromadb.config import Settings

# Ensure UTF-8 output
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

DEFAULT_SQL_PATH = os.path.join("data", "career_guidance.duckdb")
DEFAULT_CHROMA_PATH = os.path.join("data", "chroma_db")

class HybridDatabase:
    """
    Hệ thống cơ sở dữ liệu kết hợp (Hybrid SQL + Vector Database)
    cho nền tảng Hướng nghiệp & Phân tích Thất nghiệp / Trái ngành tại Việt Nam.
    """
    def __init__(self, sql_path: str = DEFAULT_SQL_PATH, chroma_path: str = DEFAULT_CHROMA_PATH):
        self.sql_path = sql_path
        self.chroma_path = chroma_path
        os.makedirs(os.path.dirname(self.sql_path), exist_ok=True)
        os.makedirs(self.chroma_path, exist_ok=True)
        
        self.con = duckdb.connect(database=self.sql_path, read_only=False)
        self.chroma_client = chromadb.PersistentClient(path=self.chroma_path)
        self.init_sql_schema()
        self.init_vector_collections()

    def get_sql_connection(self) -> duckdb.DuckDBPyConnection:
        return self.con

    def init_sql_schema(self):
        """Khởi tạo toàn bộ các bảng quan hệ phân tích trong DuckDB."""
        # 1. Bảng universities_majors
        self.con.execute("""
            CREATE TABLE IF NOT EXISTS universities_majors (
                id VARCHAR PRIMARY KEY,
                university_code VARCHAR,
                university_name VARCHAR,
                major_code VARCHAR,
                major_name VARCHAR,
                major_group VARCHAR,
                admission_combination VARCHAR,
                benchmark_score DOUBLE,
                tuition_fee_per_year DOUBLE,
                tuition_tier VARCHAR,
                input_condition TEXT,
                admission_target TEXT,
                admission_method TEXT,
                location_province VARCHAR,
                degree_level VARCHAR
            );
        """)

        # 2. Bảng job_postings_summary
        self.con.execute("""
            CREATE TABLE IF NOT EXISTS job_postings_summary (
                id VARCHAR PRIMARY KEY,
                job_title VARCHAR,
                industry_group VARCHAR,
                company_name VARCHAR,
                required_degree VARCHAR,
                skills_required TEXT,
                salary_text VARCHAR,
                salary_min DOUBLE,
                salary_max DOUBLE,
                salary_avg DOUBLE,
                experience_required VARCHAR,
                location VARCHAR,
                job_description TEXT,
                year INTEGER
            );
        """)

        # 3. Bảng resume_career_match
        self.con.execute("""
            CREATE TABLE IF NOT EXISTS resume_career_match (
                id VARCHAR PRIMARY KEY,
                candidate_name VARCHAR,
                university VARCHAR,
                major_studied VARCHAR,
                normalized_major_group VARCHAR,
                actual_job_title VARCHAR,
                actual_job_group VARCHAR,
                skills TEXT,
                is_field_matched VARCHAR,
                match_score DOUBLE,
                career_trajectory TEXT
            );
        """)

        # 4. Bảng labor_unemployment_stats
        self.con.execute("""
            CREATE TABLE IF NOT EXISTS labor_unemployment_stats (
                id VARCHAR PRIMARY KEY,
                province_name VARCHAR,
                region VARCHAR,
                year INTEGER,
                labor_force DOUBLE,
                employed_count DOUBLE,
                unemployment_rate DOUBLE,
                underemployment_rate DOUBLE,
                trained_labor_rate DOUBLE,
                youth_unemployment_rate DOUBLE,
                neet_rate DOUBLE,
                education_level VARCHAR,
                source_dataset VARCHAR
            );
        """)

        # 5. Bảng phụ trợ: student_feedback_stats (từ uitnlp/vietnamese_students_feedback)
        self.con.execute("""
            CREATE TABLE IF NOT EXISTS student_feedback_stats (
                id VARCHAR PRIMARY KEY,
                feedback_text TEXT,
                sentiment VARCHAR,
                topic VARCHAR,
                school_or_major VARCHAR
            );
        """)

        # 6. Bảng phụ trợ: demographic_personas (từ nvidia/Nemotron-Personas-Vietnam)
        self.con.execute("""
            CREATE TABLE IF NOT EXISTS demographic_personas (
                uuid VARCHAR PRIMARY KEY,
                professional_persona TEXT,
                occupation VARCHAR,
                education_level VARCHAR,
                age INTEGER,
                sex VARCHAR,
                region VARCHAR,
                skills TEXT
            );
        """)

        # Tạo View phân tích trực quan
        self.con.execute("""
            CREATE OR REPLACE VIEW view_mismatch_by_major AS
            SELECT 
                normalized_major_group,
                COUNT(*) AS total_resumes,
                COUNT(CASE WHEN is_field_matched = 'Trái ngành' THEN 1 END) AS mismatched_count,
                COUNT(CASE WHEN is_field_matched = 'Liên quan' THEN 1 END) AS related_count,
                COUNT(CASE WHEN is_field_matched = 'Đúng ngành' THEN 1 END) AS matched_count,
                ROUND(100.0 * COUNT(CASE WHEN is_field_matched = 'Trái ngành' THEN 1 END) / COUNT(*), 2) AS mismatch_rate_pct,
                ROUND(100.0 * COUNT(CASE WHEN is_field_matched = 'Đúng ngành' THEN 1 END) / COUNT(*), 2) AS match_rate_pct
            FROM resume_career_match
            GROUP BY normalized_major_group
            HAVING COUNT(*) > 0
            ORDER BY mismatch_rate_pct DESC;
        """)

        self.con.execute("""
            CREATE OR REPLACE VIEW view_industry_salary_demand AS
            SELECT 
                industry_group,
                COUNT(*) AS total_postings,
                ROUND(AVG(NULLIF(salary_avg, 0)), 2) AS avg_salary_million,
                ROUND(MIN(NULLIF(salary_min, 0)), 2) AS min_salary_million,
                ROUND(MAX(salary_max), 2) AS max_salary_million
            FROM job_postings_summary
            GROUP BY industry_group
            ORDER BY total_postings DESC;
        """)

    def init_vector_collections(self):
        """Khởi tạo 2 Vector Collections cho RAG tư vấn tuyển sinh và luật lao động."""
        # 1. admission_career_qa
        self.col_qa = self.chroma_client.get_or_create_collection(
            name="admission_career_qa",
            metadata={"description": "Hỏi đáp tư vấn tuyển sinh và định hướng ngành học Việt Nam"}
        )

        # 2. labor_law_docs
        self.col_labor_law = self.chroma_client.get_or_create_collection(
            name="labor_law_docs",
            metadata={"description": "Quy định pháp lý việc làm, bảo hiểm thất nghiệp và GDNN"}
        )

    # ------------------- VECTOR DB METHODS -------------------
    def add_admission_qa(self, ids: List[str], documents: List[str], metadatas: Optional[List[Dict[str, Any]]] = None):
        if not ids:
            return
        self.col_qa.upsert(ids=ids, documents=documents, metadatas=metadatas)

    def add_labor_law(self, ids: List[str], documents: List[str], metadatas: Optional[List[Dict[str, Any]]] = None):
        if not ids:
            return
        self.col_labor_law.upsert(ids=ids, documents=documents, metadatas=metadatas)

    def search_admission_qa(self, query: str, n_results: int = 5) -> List[Dict[str, Any]]:
        count = self.col_qa.count()
        if count == 0:
            return []
        n_results = min(n_results, count)
        res = self.col_qa.query(query_texts=[query], n_results=n_results)
        items = []
        if res and res.get("documents") and res["documents"][0]:
            for i in range(len(res["documents"][0])):
                doc = res["documents"][0][i]
                meta = res["metadatas"][0][i] if res.get("metadatas") else {}
                dist = res["distances"][0][i] if res.get("distances") else 0.0
                doc_id = res["ids"][0][i] if res.get("ids") else str(i)
                items.append({
                    "id": doc_id,
                    "document": doc,
                    "metadata": meta,
                    "distance": dist
                })
        return items

    def search_labor_law(self, query: str, n_results: int = 5) -> List[Dict[str, Any]]:
        count = self.col_labor_law.count()
        if count == 0:
            return []
        n_results = min(n_results, count)
        res = self.col_labor_law.query(query_texts=[query], n_results=n_results)
        items = []
        if res and res.get("documents") and res["documents"][0]:
            for i in range(len(res["documents"][0])):
                doc = res["documents"][0][i]
                meta = res["metadatas"][0][i] if res.get("metadatas") else {}
                dist = res["distances"][0][i] if res.get("distances") else 0.0
                doc_id = res["ids"][0][i] if res.get("ids") else str(i)
                items.append({
                    "id": doc_id,
                    "document": doc,
                    "metadata": meta,
                    "distance": dist
                })
        return items

    def close(self):
        try:
            self.con.close()
        except Exception:
            pass
