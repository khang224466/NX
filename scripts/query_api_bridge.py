import argparse
import json
import os
import sys

# Ensure UTF-8 output on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# Add workspace to path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from src.ai_query_engine import CareerAIQueryEngine

def main():
    parser = argparse.ArgumentParser(description="CLI Bridge for Web Server to AI Query Engine")
    parser.add_argument("--question", type=str, default="", help="Câu hỏi từ người dùng")
    args = parser.parse_args()

    question = args.question
    if not question:
        try:
            # Read from stdin if piped
            raw_input = sys.stdin.read().strip()
            if raw_input:
                try:
                    data = json.loads(raw_input)
                    question = data.get("question", "")
                except Exception:
                    question = raw_input
        except Exception:
            pass

    if not question:
        question = "Ngành học nào hiện có tỷ lệ sinh viên ra trường làm trái ngành cao nhất?"

    engine = CareerAIQueryEngine()
    try:
        res = engine.answer_career_question(question)
        output = {
            "success": True,
            "question": question,
            "reply": res.get("final_answer", ""),
            "sql_analysis": res.get("sql_analysis", None),
            "vector_knowledge": res.get("vector_knowledge", None),
            "source": "HYBRID_ENGINE_RAG_DUCKDB_CHROMADB"
        }
        print(json.dumps(output, ensure_ascii=False))
    except Exception as e:
        error_output = {
            "success": False,
            "question": question,
            "error": str(e),
            "reply": f"Lỗi truy vấn cơ sở dữ liệu thực chứng: {str(e)}",
            "source": "ERROR"
        }
        print(json.dumps(error_output, ensure_ascii=False))
    finally:
        engine.close()

if __name__ == "__main__":
    main()
