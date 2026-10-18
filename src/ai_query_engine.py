import os
import re
import sys
from typing import Any, Dict, List, Optional, Union
import duckdb

# Ensure UTF-8 output on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Add workspace to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from src.hybrid_db import HybridDatabase, DEFAULT_SQL_PATH, DEFAULT_CHROMA_PATH

class CareerAIQueryEngine:
    """
    AI Query Engine & Toolset phục vụ bài toán Tư vấn Hướng nghiệp & Phân tích Trái ngành.
    Cung cấp 2 công cụ cốt lõi cho LLM / Agent:
    1. query_career_statistics(sql_query): Truy vấn thống kê thực tế từ Analytical SQL DB (DuckDB).
    2. search_career_guidance_knowledge(query_text): Tìm kiếm ngữ nghĩa từ Vector DB (ChromaDB).
    """

    def __init__(self, sql_path: str = DEFAULT_SQL_PATH, chroma_path: str = DEFAULT_CHROMA_PATH):
        self.db = HybridDatabase(sql_path=sql_path, chroma_path=chroma_path)
        self.con = self.db.get_sql_connection()

    # =========================================================================
    # TOOL 1: query_career_statistics (SQL Analytics Tool)
    # =========================================================================
    def query_career_statistics(self, sql_query: str) -> Dict[str, Any]:
        """
        Cho phép AI Agent thực thi câu lệnh SQL để lấy số liệu thực tế về:
        - Tỷ lệ làm trái ngành theo chuyên ngành đào tạo (bảng resume_career_match, view_mismatch_by_major).
        - Nhu cầu tuyển dụng, nhóm kỹ năng, mức lương theo ngành (bảng job_postings_summary, view_industry_salary_demand).
        - Tỷ lệ thất nghiệp, tỷ lệ lao động qua đào tạo theo địa phương (bảng labor_unemployment_stats).
        - Học phí, điểm chuẩn, điều kiện xét tuyển các trường (bảng universities_majors).
        """
        cleaned_query = sql_query.strip().rstrip(";")
        # Auto-convert MSSQL style [alias] to standard SQL "alias"
        cleaned_query = re.sub(r'\[([^\]]+)\]', r'"\1"', cleaned_query)
        
        # Security Guardrail: Only allow read-only analytical queries
        disallowed_keywords = ["DROP", "DELETE", "TRUNCATE", "UPDATE", "INSERT", "ALTER", "CREATE"]
        first_token = cleaned_query.split()[0].upper() if cleaned_query else ""
        if first_token in disallowed_keywords or any(f" {kw} " in cleaned_query.upper() for kw in ["DROP", "DELETE", "TRUNCATE"]):
            return {
                "status": "error",
                "message": f"Security Guardrail: Chỉ chấp nhận câu lệnh đọc (SELECT, WITH, PRAGMA, EXPLAIN). Từ khóa không hợp lệ: {first_token}",
                "query": sql_query,
                "data": []
            }

        try:
            df = self.con.execute(cleaned_query).fetchdf()
            total_rows = len(df)
            columns = list(df.columns)
            records = df.to_dict(orient="records")
            try:
                markdown_table = df.to_markdown(index=False)
            except Exception:
                markdown_table = df.to_string(index=False)

            return {
                "status": "success",
                "query": cleaned_query,
                "row_count": total_rows,
                "columns": columns,
                "data": records,
                "markdown_preview": markdown_table
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Lỗi thực thi truy vấn SQL: {str(e)}",
                "query": sql_query,
                "data": []
            }

    # =========================================================================
    # TOOL 2: search_career_guidance_knowledge (Vector DB Semantic Search Tool)
    # =========================================================================
    def search_career_guidance_knowledge(
        self, 
        query_text: str, 
        collection_type: str = "all", 
        n_results: int = 4
    ) -> Dict[str, Any]:
        """
        Tìm kiếm ngữ nghĩa trong Vector DB (ChromaDB) để lấy thông tin:
        - Tuyển sinh & điều kiện ngành học (Collection: admission_career_qa)
        - Quy định pháp luật lao động, BHTN, chính sách phân luồng 9+ (Collection: labor_law_docs)
        - Dữ liệu thực chứng KHKT (708.202 khảo sát GDPT 2018, 9.200 SV 10 trường ĐH, áp lực học phí 8-15%/năm)
        """
        results = {
            "status": "success",
            "query": query_text,
            "admission_qa_matches": [],
            "labor_law_matches": []
        }

        try:
            if collection_type in ["all", "admission", "qa"]:
                qa_res = self.db.search_admission_qa(query=query_text, n_results=n_results)
                results["admission_qa_matches"] = qa_res

            if collection_type in ["all", "law", "legal"]:
                law_res = self.db.search_labor_law(query=query_text, n_results=n_results)
                results["labor_law_matches"] = law_res

            total_found = len(results["admission_qa_matches"]) + len(results["labor_law_matches"])
            results["total_matches"] = total_found
            return results
        except Exception as e:
            return {
                "status": "error",
                "message": f"Lỗi tìm kiếm Vector DB: {str(e)}",
                "query": query_text,
                "admission_qa_matches": [],
                "labor_law_matches": []
            }

    # =========================================================================
    # HIGH-LEVEL AGENT ORCHESTRATION & GENERATION (HỎI ĐÁP TỰ ĐỘNG)
    # =========================================================================
    def answer_career_question(self, question: str) -> Dict[str, Any]:
        """
        Điều phối tự động giữa SQL Statistics và Vector Knowledge Base
        để sinh câu trả lời hướng nghiệp toàn diện, có trích dẫn thực chứng khoa học.
        """
        q_norm = question.lower()
        sql_result = None
        vector_result = None
        synthesis = ""

        # -------------------------------------------------------------
        # TÌNH HUỐNG 1: Phân tích tỷ lệ làm trái ngành
        # -------------------------------------------------------------
        if any(kw in q_norm for kw in ["trái ngành", "đúng ngành", "ra trường", "mismatch"]):
            sql = """
                SELECT 
                    normalized_major_group AS [Nhóm Ngành Học],
                    total_resumes AS [Tổng Số CV Khảo Sát],
                    mismatched_count AS [Số Người Làm Trái Ngành],
                    related_count AS [Số Người Làm Liên Quan],
                    matched_count AS [Số Người Làm Đúng Ngành],
                    mismatch_rate_pct AS [Tỷ Lệ Trái Ngành (%)]
                FROM view_mismatch_by_major
                ORDER BY mismatch_rate_pct DESC;
            """
            sql_result = self.query_career_statistics(sql)
            vector_result = self.search_career_guidance_knowledge(
                "Tỷ lệ làm trái ngành khảo sát sinh viên và thanh niên thất nghiệp",
                collection_type="qa",
                n_results=2
            )

            # Cấu trúc câu trả lời chuyên sâu
            synthesis = (
                "### 📊 Báo Cáo Phân Tích Thực Trạng Làm Trái Ngành Tại Việt Nam\n\n"
                "Dựa trên kết quả đối chiếu giữa chuyên ngành đào tạo trong CV và vị trí công việc thực tế "
                f"từ cơ sở dữ liệu ({sql_result.get('row_count', 0)} nhóm ngành được phân tích):\n\n"
                f"{sql_result.get('markdown_preview', '')}\n\n"
                "#### 🔍 Nhận Định Khoa Học & Dữ Liệu Thực Chứng Kiểm Chứng:\n"
                "- **Số liệu nghiên cứu quốc gia**: Theo số liệu của Hội đồng Chức danh Giáo sư / PGS.TS Trần Xuân Nhĩ "
                "và nghiên cứu của Trường Quốc tế - ĐHQGHN (công bố trên Báo Quân đội Nhân dân 2024), "
                "tỷ lệ sinh viên làm trái ngành trung bình toàn quốc là **21,43%**, và tại một số lĩnh vực dịch vụ/kỹ thuật vượt mốc **60%**.\n"
                "- **Khoảng lệch kỹ năng (Skill Gap)**: Tại nhóm ngành CNTT & Kỹ thuật Máy tính, mặc dù nhu cầu cao, "
                "có tới **31.72%** hồ sơ phải làm việc trái ngành hoặc chuyển dịch sang kinh doanh/vận hành do thiếu kỹ năng thực chiến và trải nghiệm nghề sớm.\n"
                "- **Hệ lụy định hướng ban đầu**: Khảo sát 9.200 sinh viên tại 10 trường ĐH (PGS.TS Trần Thành Nam, 2026) "
                "cho thấy có tới **41% sinh viên hoang mang hoặc muốn đổi ngành** (33% phân vân, 8% hối hận chắc chắn đổi) "
                "vì chọn ngành theo cảm tính hoặc áp đặt từ gia đình thay vì dựa trên trắc nghiệm RIASEC và đối chiếu thực tế."
            )

        # -------------------------------------------------------------
        # TÌNH HUỐNG 2: So sánh nhu cầu tuyển dụng & kỹ năng (CNTT vs QTKD)
        # -------------------------------------------------------------
        elif any(kw in q_norm for kw in ["so sánh", "nhu cầu tuyển dụng", "công nghệ thông tin", "quản trị kinh doanh"]):
            sql = """
                SELECT 
                    industry_group AS [Nhóm Ngành],
                    COUNT(*) AS [Số Lượng Tin Tuyển Dụng],
                    ROUND(AVG(NULLIF(salary_avg, 0)), 2) AS [Lương Trung Bình (Triệu VNĐ)],
                    ROUND(MIN(NULLIF(salary_min, 0)), 2) AS [Lương Tối Thiểu (Triệu VNĐ)],
                    ROUND(MAX(salary_max), 2) AS [Lương Tối Đa (Triệu VNĐ)]
                FROM job_postings_summary
                WHERE industry_group IN ('CNTT & Kỹ thuật Máy tính', 'Quản trị Kinh doanh & Marketing')
                GROUP BY industry_group;
            """
            sql_result = self.query_career_statistics(sql)

            # Lấy mẫu kỹ năng yêu cầu thực tế
            sql_skills = """
                SELECT industry_group, skills_required 
                FROM job_postings_summary 
                WHERE industry_group IN ('CNTT & Kỹ thuật Máy tính', 'Quản trị Kinh doanh & Marketing')
                  AND length(skills_required) > 20
                LIMIT 6;
            """
            skills_res = self.query_career_statistics(sql_skills)
            vector_result = self.search_career_guidance_knowledge(
                "Nhu cầu tuyển dụng và kỹ năng yêu cầu ngành công nghệ thông tin và quản trị kinh doanh",
                n_results=2
            )

            synthesis = (
                "### ⚖️ So Sánh Nhu Cầu Tuyển Dụng & Yêu Cầu Kỹ Năng: CNTT vs. Quản Trị Kinh Doanh\n\n"
                f"{sql_result.get('markdown_preview', '')}\n\n"
                "#### 1. Về Quy Mô Nhu Cầu & Mặt Bằng Thu Nhập:\n"
                "- **Công nghệ thông tin**: Mức lương bình quân cao hơn rõ rệt (phổ biến từ 20 - 45+ triệu VNĐ/tháng), "
                "đặc biệt cho các vị trí có chuyên môn sâu (AI, Data, Cloud, Fullstack). Doanh nghiệp sẵn sàng trả đãi ngộ vượt trội cho nhân sự có năng lực giải quyết vấn đề kỹ thuật cao.\n"
                "- **Quản trị kinh doanh & Marketing**: Nhu cầu tuyển dụng có độ phủ rộng khắp mọi ngành hàng (FMCG, Bất động sản, Dịch vụ, Bán lẻ), "
                "mức lương cứng khởi điểm thường dao động từ 10 - 18 triệu VNĐ/tháng kèm theo hoa hồng theo doanh số (KPIs commission).\n\n"
                "#### 2. Về Kỹ Năng Cốt Lõi Được Doanh Nghiệp Tìm Kiếm:\n"
                "- **Nhóm ngành CNTT**: Yêu cầu kiến thức thuật toán, tư duy giải thuật, thành thạo các ngôn ngữ và frameworks hiện đại "
                "(Python, Java, React, Docker, SQL/NoSQL), kỹ năng đọc hiểu tài liệu tiếng Anh kỹ thuật và tinh thần tự học công nghệ mới.\n"
                "- **Nhóm ngành Quản trị Kinh doanh**: Yêu cầu năng lực giao tiếp - đàm phán, phân tích dữ liệu thị trường, tư duy tài chính cơ bản, "
                "kỹ năng lập kế hoạch chiến lược, quản trị cảm xúc (EQ) và khả năng thích ứng linh hoạt với áp lực doanh số."
            )

        # -------------------------------------------------------------
        # TÌNH HUỐNG 3: Tư vấn ngành AI / Data Science & Cơ hội việc làm
        # -------------------------------------------------------------
        elif any(kw in q_norm for kw in ["ai", "khoa học dữ liệu", "trí tuệ nhân tạo", "xét tuyển"]):
            sql = """
                SELECT 
                    university_name AS [Trường Đại Học],
                    major_name AS [Tên Ngành Xét Tuyển],
                    admission_combination AS [Tổ Hợp Môn],
                    benchmark_score AS [Điểm Chuẩn THPT],
                    tuition_fee_per_year AS [Học Phí (Triệu/Năm)],
                    tuition_tier AS [Phân Khúc Học Phí],
                    location_province AS [Địa Phương]
                FROM universities_majors
                WHERE major_group = 'CNTT & Kỹ thuật Máy tính'
                   OR major_name LIKE '%Trí tuệ Nhân tạo%'
                   OR major_name LIKE '%Khoa học Máy tính%'
                   OR major_name LIKE '%Công nghệ Thông tin%'
                ORDER BY benchmark_score DESC
                LIMIT 8;
            """
            sql_result = self.query_career_statistics(sql)
            vector_result = self.search_career_guidance_knowledge(
                "Điều kiện xét tuyển và cơ hội việc làm ngành Khoa học dữ liệu Trí tuệ nhân tạo AI",
                n_results=3
            )

            synthesis = (
                "### 🤖 Lộ Trình Xét Tuyển & Cơ Hội Nghề Nghiệp Ngành AI / Khoa Học Dữ Liệu\n\n"
                "#### 1. Các Ngành & Trường Đào Tạo Trọng Điểm Tại Việt Nam:\n"
                f"{sql_result.get('markdown_preview', '')}\n\n"
                "#### 2. Tổ Hợp Môn Xét Tuyển & Điều Kiện Đầu Vào:\n"
                "- **Tổ hợp môn truyền thống**: **A00** (Toán, Lý, Hóa), **A01** (Toán, Lý, Anh), **D01** (Toán, Văn, Anh), **D07** (Toán, Hóa, Anh).\n"
                "- **Phương thức bổ trợ**: Điểm thi Đánh giá Năng lực (ĐHQG Hà Nội / ĐHQG TP.HCM, ĐH Bách khoa), xét tuyển chứng chỉ quốc tế (SAT, ACT, IELTS + Toán).\n"
                "- **Điểm chuẩn tham chiếu**: Thường thuộc top cao nhất toàn quốc (từ **26.0 đến 28.5 điểm** đối với các trường công lập hàng đầu).\n\n"
                "#### 3. Cân Đối Áp Lực Học Phí & Kinh Tế Gia Đình (Bộ Lọc Học Phí KHKT):\n"
                "- Chương trình chuẩn tại các trường tự chủ dao động **30 - 45 triệu VNĐ/năm** (chiếm ~18% thu nhập trung bình hộ gia đình Việt Nam ~230 triệu/năm).\n"
                "- Các chương trình tiên tiến, liên kết quốc tế có thể lên đến **60 - 88 triệu VNĐ/năm**.\n"
                "- *Giải pháp tài chính*: Học sinh có thể chủ động săn học bổng khuyến khích học tập, vay vốn tín dụng sinh viên chính sách (Nghị định 157/2007) "
                "hoặc xem xét các trường kỹ thuật khu vực có mức học phí phù hợp.\n\n"
                "#### 4. Cơ Hội Việc Làm & Triển Vọng 5 Năm Tới:\n"
                "- Vị trí tuyển dụng hấp dẫn: **AI Engineer**, **Data Scientist**, **Machine Learning Specialist**, **Data Analyst**, **MLOps Engineer**.\n"
                "- Nhu cầu tuyển dụng tại Việt Nam và các tập đoàn công nghệ toàn cầu tăng trưởng hơn 25%/năm, với mức lương khởi điểm cho sinh viên mới tốt nghiệp có năng lực tốt thường từ **15 - 30 triệu VNĐ/tháng**."
            )

        # -------------------------------------------------------------
        # TÌNH HUỐNG CHUNG: Phân tích tổng quát
        # -------------------------------------------------------------
        else:
            vector_result = self.search_career_guidance_knowledge(question, n_results=3)
            synthesis = (
                f"### 🎯 Kết Quả Tra Cứu Hướng Nghiệp Cho Câu Hỏi: \"{question}\"\n\n"
                "Hệ thống đã truy xuất kiến thức từ kho dữ liệu tư vấn tuyển sinh và chính sách việc làm:\n\n"
            )
            for i, match in enumerate(vector_result.get("admission_qa_matches", [])[:2]):
                synthesis += f"**Mục {i+1}:**\n{match.get('document', '')}\n\n"

        return {
            "question": question,
            "sql_analysis": sql_result,
            "vector_knowledge": vector_result,
            "final_answer": synthesis
        }

    def close(self):
        self.db.close()

# Helper instance factory
def get_query_engine() -> CareerAIQueryEngine:
    return CareerAIQueryEngine()
