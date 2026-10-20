const apiKey = 'AQ.Ab8RN6Iufs8Djj-3UZGfp4PuCUsMF208uGAF_T4L2PmI6zR-RQ';
const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=' + apiKey;
const userPrompt = `HỒ SƠ HỌC SINH CẦN PHÂN TÍCH:
- Điểm các môn đã có: Ngữ văn: 8.5đ, Lịch sử: 9.0đ, Địa lý: 8.0đ
- Xu hướng mục tiêu nghề nghiệp: CREATIVE
- Câu hỏi: Em muốn học thiết kế đồ họa hoặc truyền thông`;

const systemPrompt = `Bạn là Chuyên gia Tư vấn Tuyển sinh & Hướng nghiệp Cấp cao tại Việt Nam.
Trả về DUY NHẤT một JSON hợp lệ có đúng các trường sau:
{
  "headline": "Tiêu đề nhận định chiến lược",
  "directAnswer": "Lời khuyên chuyên môn trực tiếp",
  "strengthsEvaluation": "Đánh giá thế mạnh",
  "risksAndBottlenecks": "Cảnh báo điểm nghẽn",
  "recommendedKeywords": ["từ khóa 1", "từ khóa 2"],
  "recommendedSectors": ["KIEN_TRUC_NGHE_THUAT_TDTT", "XA_HOI_NHAN_VAN"]
}`;

const start = Date.now();
fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2500,
      responseMimeType: 'application/json',
      thinkingConfig: { thinkingBudget: 0 }
    }
  })
}).then(async r => {
  console.log('Status:', r.status);
  const d = await r.json();
  const text = d.candidates?.[0]?.content?.parts?.[0]?.text;
  console.log('Time:', Date.now() - start, 'ms');
  console.log('Parsed JSON:\n', JSON.parse(text));
}).catch(console.error);
