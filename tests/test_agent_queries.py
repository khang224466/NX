import os
import sys
import unittest

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

class TestCareerAITools(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        print("\n" + "="*80)
        print("KHỞI CHẠY KIỂM THỬ: BỘ CÔNG CỤ TRUY VẤN AI CHO HỆ THỐNG HƯỚNG NGHIỆP & TRÁI NGÀNH")
        print("="*80)
        cls.engine = CareerAIQueryEngine()

    @classmethod
    def tearDownClass(cls):
        cls.engine.close()
        print("\n" + "="*80)
        print("HOÀN TẤT TOÀN BỘ KIỂM THỬ AI QUERY ENGINE!")
        print("="*80)

    def test_01_tool_sql_query(self):
        """Kiểm thử công cụ Tool 1: query_career_statistics"""
        print("\n[*] TEST 1: Kiểm tra thực thi SQL Analytics Tool...")
        sql = "SELECT COUNT(*) AS total_resumes FROM resume_career_match;"
        res = self.engine.query_career_statistics(sql)
        self.assertEqual(res["status"], "success")
        self.assertGreater(res["row_count"], 0)
        self.assertIn("total_resumes", res["columns"])
        print(f"    [+] SQL query thành công! Tổng số CV: {res['data'][0]['total_resumes']}")

    def test_02_tool_vector_search(self):
        """Kiểm thử công cụ Tool 2: search_career_guidance_knowledge"""
        print("\n[*] TEST 2: Kiểm tra tìm kiếm ngữ nghĩa Vector DB Tool...")
        res = self.engine.search_career_guidance_knowledge("Học phí đại học và trợ cấp thất nghiệp", n_results=3)
        self.assertEqual(res["status"], "success")
        self.assertGreater(res["total_matches"], 0)
        print(f"    [+] Vector search thành công! Tìm thấy {res['total_matches']} tài liệu phù hợp.")

    def test_03_question_1_career_mismatch_rate(self):
        """
        Câu hỏi thực tế 1:
        'Ngành học nào hiện có tỷ lệ sinh viên ra trường làm trái ngành cao nhất trong tập dữ liệu CV?'
        """
        print("\n" + "-"*80)
        print("[*] CÂU HỎI THỰC TẾ 1:")
        print("    'Ngành học nào hiện có tỷ lệ sinh viên ra trường làm trái ngành cao nhất trong tập dữ liệu CV?'")
        print("-"*80)
        q = "Ngành học nào hiện có tỷ lệ sinh viên ra trường làm trái ngành cao nhất trong tập dữ liệu CV?"
        ans = self.engine.answer_career_question(q)
        
        self.assertIsNotNone(ans["sql_analysis"])
        self.assertEqual(ans["sql_analysis"]["status"], "success")
        self.assertGreater(len(ans["sql_analysis"]["data"]), 0)
        self.assertIn("Trái Ngành", ans["final_answer"])

        print("\n[KẾT QUẢ SINH TỰ ĐỘNG - PHÂN TÍCH TRÁI NGÀNH]:\n")
        print(ans["final_answer"])

    def test_04_question_2_compare_it_vs_business(self):
        """
        Câu hỏi thực tế 2:
        'So sánh nhu cầu tuyển dụng và kỹ năng yêu cầu của ngành Công nghệ thông tin so với Quản trị kinh doanh?'
        """
        print("\n" + "-"*80)
        print("[*] CÂU HỎI THỰC TẾ 2:")
        print("    'So sánh nhu cầu tuyển dụng và kỹ năng yêu cầu của ngành Công nghệ thông tin so với Quản trị kinh doanh?'")
        print("-"*80)
        q = "So sánh nhu cầu tuyển dụng và kỹ năng yêu cầu của ngành Công nghệ thông tin so với Quản trị kinh doanh?"
        ans = self.engine.answer_career_question(q)

        self.assertIsNotNone(ans["sql_analysis"])
        self.assertEqual(ans["sql_analysis"]["status"], "success")
        self.assertIn("Lương", ans["final_answer"])
        self.assertIn("Kỹ Năng", ans["final_answer"])

        print("\n[KẾT QUẢ SINH TỰ ĐỘNG - SO SÁNH THỊ TRƯỜNG LAO ĐỘNG]:\n")
        print(ans["final_answer"])

    def test_05_question_3_ai_datascience_pathway(self):
        """
        Câu hỏi thực tế 3:
        'Học sinh muốn theo mảng AI/Khoa học dữ liệu thì có thể xét tuyển vào ngành nào và cơ hội việc làm ra sao?'
        """
        print("\n" + "-"*80)
        print("[*] CÂU HỎI THỰC TẾ 3:")
        print("    'Học sinh muốn theo mảng AI/Khoa học dữ liệu thì có thể xét tuyển vào ngành nào và cơ hội việc làm ra sao?'")
        print("-"*80)
        q = "Học sinh muốn theo mảng AI/Khoa học dữ liệu thì có thể xét tuyển vào ngành nào và cơ hội việc làm ra sao?"
        ans = self.engine.answer_career_question(q)

        self.assertIsNotNone(ans["sql_analysis"])
        self.assertEqual(ans["sql_analysis"]["status"], "success")
        self.assertIn("Trường Đại Học", ans["final_answer"])
        self.assertIn("Học Phí", ans["final_answer"])

        print("\n[KẾT QUẢ SINH TỰ ĐỘNG - TƯ VẤN NGÀNH AI & DATA SCIENCE]:\n")
        print(ans["final_answer"])

if __name__ == "__main__":
    unittest.main()
