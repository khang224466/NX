import 'dotenv/config';

const DEFAULT_KEY = 'AQ.Ab8RN6Iufs8Djj-3UZGfp4PuCUsMF208uGAF_T4L2PmI6zR-RQ';
const key = process.env.GEMINI_API_KEY || DEFAULT_KEY;
const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${key}`;

const prompt = `Bạn là Hệ thống Trí Tuệ Nhân Tạo Hướng Nghiệp NEXORA.
Phân tích hồ sơ học sinh:
- Điểm: Toán 8.8, Tin 9.0, Tiếng Anh 8.5, Vật lý 8.2, Ngữ văn 7.0
- RIASEC: R=35, I=48, A=25, S=22, E=28, C=40 (Mã đỉnh: ICR)
- Ngân sách học phí: 35 triệu/năm
- Câu hỏi băn khoăn của chính học sinh: "Em sợ học CNTT sau này khó cạnh tranh với AI"

YÊU CẦU: Trả về DUY NHẤT một chuỗi JSON hợp lệ theo cấu trúc:
{
  "headline": "Tiêu đề chiến lược cho hồ sơ",
  "directAnswer": "Giải đáp chân thực, trực tiếp cho câu hỏi về cạnh tranh với AI",
  "strengthsEvaluation": "Đánh giá thế mạnh Toán Tin và tư duy phân tích",
  "risksAndBottlenecks": "Cảnh báo thách thức thực tế",
  "tuitionFeasibility": "Nhận định học phí theo NĐ 238/2025",
  "recommendedMajors": [
    {
      "codeTT09": "7480201",
      "codeTT74": "748020",
      "name": "Công nghệ thông tin",
      "sector": "CNTT_BAN_DAN_AI",
      "sectorName": "Máy tính, CNTT, Bán dẫn & AI",
      "fitPercent": 95,
      "fitReason": "Lý do vì sao phù hợp",
      "targetJobs": ["Kỹ sư phần mềm", "Kỹ sư AI/ML"],
      "salaryMedian": "28 triệu/tháng",
      "aiRisk": "Thấp",
      "aiRiskPercent": 28,
      "popularCombos": ["A00", "A01"]
    }
  ],
  "optimalComboAdvice": "Khuyên dùng tổ hợp nào",
  "universityAdvice": "Chiến lược chọn trường"
}`;

async function run() {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 2500 }
    })
  });
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  console.log('Gemini Result:');
  console.log(text);
  const parsed = JSON.parse(text);
  console.log('\nParsed successfully! Headline:', parsed.headline);
  console.log('Direct Answer snippet:', parsed.directAnswer.slice(0, 100) + '...');
  console.log('Majors count:', parsed.recommendedMajors.length);
}

run().catch(console.error);
