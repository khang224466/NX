/**
 * NEXORA AI CAREER COUNSELOR BACKEND HANDLER (ES MODULE)
 * Decoupled multi-provider adapter supporting Google Gemini & Groq.
 * Validates EXORA response contract, schema normalization, rate limiting, and timeout safety.
 */

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 25;

export function checkRateLimit(identifier = 'global') {
  const now = Date.now();
  const timestamps = rateLimitMap.get(identifier) || [];
  const validTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = validTimestamps[0];
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - oldest)) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds: Math.max(1, retryAfter) };
  }

  validTimestamps.push(now);
  rateLimitMap.set(identifier, validTimestamps);
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - validTimestamps.length };
}

export function validateAndNormalizeCounselorResponse(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      reply: 'Xin lỗi bạn, phản hồi từ máy chủ AI không có nội dung. Bạn vui lòng thử lại nhé.',
      profileUpdates: {},
      decision: {
        stage: 'DISCOVERY',
        action: 'ASK_CLARIFYING_QUESTION',
        question: null,
        reason: 'Tiếp tục tìm hiểu thông tin định hướng',
        evidenceSufficiency: 'LOW'
      },
      quickReplies: ['Chia sẻ thêm về trải nghiệm học tập', 'Khám phá môn thế mạnh']
    };
  }

  let cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed = null;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {}
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    // Trích xuất trường reply ngay cả khi JSON bị cắt cụt giữa chừng
    const replyMatch = cleaned.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const fallbackText = replyMatch ? replyMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : cleaned.slice(0, 1500);

    return {
      reply: fallbackText,
      profileUpdates: {},
      decision: {
        stage: 'DISCOVERY',
        action: 'ASK_CLARIFYING_QUESTION',
        question: null,
        reason: 'Tiếp tục tìm hiểu thông tin định hướng',
        evidenceSufficiency: 'LOW'
      },
      quickReplies: ['Chia sẻ thêm về trải nghiệm học tập', 'Khám phá môn thế mạnh']
    };
  }

  const reply = typeof parsed.reply === 'string' && parsed.reply.trim()
    ? parsed.reply.trim()
    : (typeof parsed.replyText === 'string' && parsed.replyText.trim()
        ? parsed.replyText.trim()
        : 'Mình đã lắng nghe chia sẻ của bạn. Hãy cùng đào sâu thêm một khía cạnh nhé.');

  const rawUpdates = parsed.profileUpdates || parsed.detectedUpdates || {};
  const sanitize = arr => Array.isArray(arr) ? arr.filter(x => typeof x === 'string' && x.trim()).map(x => x.trim()) : [];

  const profileUpdates = {
    interests: sanitize(rawUpdates.interests || rawUpdates.statedInterests),
    retractedInterests: sanitize(rawUpdates.retractedInterests),
    demonstratedStrengths: sanitize(rawUpdates.demonstratedStrengths || rawUpdates.academicStrengths),
    learningEvidence: sanitize(rawUpdates.learningEvidence || rawUpdates.academicWeaknesses),
    workPreferences: sanitize(rawUpdates.workPreferences || rawUpdates.workEnvironmentPrefs),
    constraints: sanitize(rawUpdates.constraints || rawUpdates.realConstraints),
    values: sanitize(rawUpdates.values || rawUpdates.personalValues),
    dislikes: sanitize(rawUpdates.dislikes || rawUpdates.rejectedActivities),
    uncertainties: sanitize(rawUpdates.uncertainties || rawUpdates.missingEvidence)
  };

  const rawDecision = parsed.decision || {};
  const stage = rawDecision.stage || 'DISCOVERY';
  const action = rawDecision.action || 'ASK_CLARIFYING_QUESTION';
  const question = typeof rawDecision.question === 'string' && rawDecision.question.trim() ? rawDecision.question.trim() : null;
  const reason = typeof rawDecision.reason === 'string' && rawDecision.reason.trim() ? rawDecision.reason.trim() : 'Thu thập thêm bằng chứng định hướng';
  const evidenceSufficiency = ['LOW', 'MEDIUM', 'HIGH'].includes(rawDecision.evidenceSufficiency) ? rawDecision.evidenceSufficiency : 'LOW';

  let quickReplies = sanitize(parsed.quickReplies);
  if (quickReplies.length === 0) {
    quickReplies = ['Chia sẻ thêm về trải nghiệm học tập', 'Khám phá môn thế mạnh'];
  }

  let careers = undefined;
  if (Array.isArray(parsed.careers) && parsed.careers.length > 0) {
    careers = parsed.careers
      .filter(c => c && typeof c.title === 'string' && c.title.trim())
      .slice(0, 3)
      .map((c, idx) => ({
        id: String(c.id || `c_ai_${idx + 1}`),
        title: String(c.title).trim(),
        sector: String(c.sector || 'Chuyên môn đa ngành').trim(),
        riasecCode: String(c.riasecCode || 'RIC').trim(),
        matchPercent: typeof c.matchPercent === 'number' ? Math.min(100, Math.max(50, c.matchPercent)) : 80,
        whyFit: String(c.whyFit || 'Phù hợp với đặc điểm hứng thú và năng lực bạn vừa chia sẻ.').trim(),
        whyNotOthers: c.whyNotOthers ? String(c.whyNotOthers).trim() : undefined,
        uncertaintiesAndRisks: c.uncertaintiesAndRisks ? String(c.uncertaintiesAndRisks).trim() : undefined,
        selfVerificationTask: String(c.selfVerificationTask || 'Thử làm 1 dự án nhỏ hoặc trao đổi với người trong nghề 30 phút.').trim(),
        recommendedMajors: sanitize(c.recommendedMajors)
      }));
  }

  let fullReply = reply;
  if (question && !reply.includes(question)) {
    fullReply = `${reply}\n\n👉 **${question}**`;
  }

  return {
    reply: fullReply,
    profileUpdates,
    decision: { stage, action, question, reason, evidenceSufficiency },
    quickReplies: quickReplies.slice(0, 4),
    careers
  };
}

export function buildCounselorSystemPrompt(profileOrOpts, maybeRealityAnswer) {
  const profile = (profileOrOpts && typeof profileOrOpts === 'object' && ('statedInterests' in profileOrOpts || 'interests' in profileOrOpts))
    ? profileOrOpts
    : (profileOrOpts?.profile || {});
  const realityAnswer = profileOrOpts?.realityAnswer || maybeRealityAnswer || '';

  const stated = (profile?.interests || profile?.statedInterests || []).join(', ') || 'Chưa rõ';
  const retracted = (profile?.retractedInterests || []).join(', ') || 'Không có';
  const untested = (profile?.untestedInterests || []).join(', ') || 'Không có';
  const rejected = (profile?.dislikes || profile?.rejectedActivities || []).join(', ') || 'Không có';
  const strengths = (profile?.demonstratedStrengths || profile?.academicStrengths || []).join(', ') || 'Chưa rõ';
  const weaknesses = (profile?.learningEvidence || profile?.academicWeaknesses || []).join(', ') || 'Chưa rõ';
  const workEnv = (profile?.workPreferences || profile?.workEnvironmentPrefs || []).join(', ') || 'Chưa rõ';
  const constraints = (profile?.constraints || profile?.realConstraints || []).join(', ') || 'Không có';
  const values = (profile?.values || profile?.personalValues || []).join(', ') || 'Chưa rõ';
  const contradictions = (profile?.unresolvedContradictions || []).join(', ') || 'Không có';
  const turns = profile?.turnsCount || 1;

  const hasInterests = (profile?.interests || profile?.statedInterests || []).length > 0;
  const hasCapabilities =
    (profile?.demonstratedStrengths || profile?.academicStrengths || []).length > 0 ||
    (profile?.learningEvidence || profile?.academicWeaknesses || []).length > 0;
  const hasEnv =
    (profile?.workPreferences || profile?.workEnvironmentPrefs || []).length > 0 ||
    (profile?.values || profile?.personalValues || []).length > 0;
  const isReady = hasInterests && hasCapabilities && hasEnv && !contradictions.length && turns >= 2;

  return `Bạn là Cố Vấn Hướng Nghiệp & Tuyển Sinh AI cấp cao của NEXORA (AI Career Counselor), được đào tạo theo chuẩn tâm lý giáo dục và dữ liệu tuyển sinh Việt Nam 2026.
Nhiệm vụ của bạn: Đồng hành, lắng nghe học sinh THPT và phụ huynh Việt Nam từ con số 0, thấu hiểu ngữ cảnh và tự sinh câu hỏi/phản hồi linh hoạt theo tình huống để giúp học sinh đưa ra quyết định có căn cứ.

=== KHUNG SUY LUẬN EXORA (7 GIAI ĐOẠN) ===
- Giai đoạn A (DISCOVERY): Khám phá bản thân (trải nghiệm hằng ngày, sự tò mò, sở thích tự nhiên, việc muốn tránh).
- Giai đoạn B (CAPABILITIES): Làm rõ năng lực (môn học thế mạnh, cách giải quyết vấn đề, khả năng tự học, điểm yếu).
- Giai đoạn C (WORK_ENVIRONMENT): Làm rõ môi trường & giá trị (mức độ giao tiếp, không gian làm việc, tính ổn định, tự do sáng tạo).
- Giai đoạn D (CAREERS): Đề xuất tối đa 3 hướng nghề nghiệp (CHỈ KHI ĐỦ BẰNG CHỨNG 3 TRỤ CỘT trên).
- Giai đoạn E (MAJORS): Kết nối vị trí nghề sang các chuyên ngành đào tạo đại học/cao đẳng phù hợp.
- Giai đoạn F (ADMISSIONS): Thông tin trường, tổ hợp môn xét tuyển thực tế, học phí và điểm chuẩn có kiểm chứng.
- Giai đoạn G (ROADMAP): Lộ trình phát triển năng lực 4 năm đại học và kỹ năng thực tế.

=== HỒ SƠ BẰNG CHỨNG HIỆN TẠI (EVIDENCE PROFILE) ===
- Lượt hội thoại hiện tại: Lượt ${turns}
- Sở thích tích cực đã ghi nhận: ${stated}
- Sở thích học sinh đã đổi ý / từ bỏ: ${retracted}
- Sở thích chưa từng thử nghiệm: ${untested}
- Hoạt động / Môn học học sinh từ chối / không thích: ${rejected}
- Năng lực / Môn học thế mạnh đã có minh chứng: ${strengths}
- Khó khăn học tập / Phạm vi môn học e ngại: ${weaknesses}
- Môi trường làm việc mong muốn & phong cách giao tiếp: ${workEnv}
- Giá trị ưu tiên (ổn định, thu nhập, sáng tạo...): ${values}
- Rào cản thực tế (tài chính, địa lý, gia đình): ${constraints}
- Mâu thuẫn chưa giải quyết: ${contradictions}
${realityAnswer ? `- Tâm thế đối diện thực tế ban đầu: "${realityAnswer}"` : ''}
- Trạng thái sẵn sàng kết luận nghề: ${isReady ? 'ĐÃ ĐỦ BẰNG CHỨNG (Có thể mở rộng danh sách nghề tiềm năng)' : 'CHƯA ĐỦ BẰNG CHỨNG (Tuyệt đối KHÔNG chốt danh sách nghề cuối cùng vội vã)'}

=== NGUYÊN TẮC HỘI THOẠI BẮT BUỘC TUÂN THỦ ===
1. KHÔNG LẶP CÂU HỎI: Tuyệt đối không hỏi lại những điều học sinh đã trả lời trong hồ sơ.
2. MỖI LƯỢT CHỈ 1 CÂU HỎI TRỌNG TÂM: Tập trung vào khoảng trống thông tin lớn nhất còn thiếu để phân biệt các hướng nghề.
3. PHÂN TÍCH ĐA TÍN HIỆU NGÔN NGỮ TỰ NHIÊN:
   - Học sinh có thể viết câu phức tạp chứa nhiều vế trái ngược: "Em thích sáng tạo ý tưởng mới, không thích lặp lại, nhưng em cũng muốn công việc ổn định."
   - Bóc tách đầy đủ: ghi nhận cả sáng tạo, không thích lặp lại, muốn ổn định, và đặt câu hỏi gợi mở về năng lực thực tế hoặc mức độ chấp nhận đánh đổi.
   - "Chưa thử" khác với "Từ chối / Không thích".
   - "Thích công nghệ nhưng không muốn code" là 2 tín hiệu độc lập.
   - "Không phải ghét Toán, chỉ sợ Toán nâng cao" là e ngại giải tích chuyên sâu, không ghét Toán căn bản.
5. GIỌNG ĐIỆU CỐ VẤN 1:1: Ấm áp, gần gũi, tôn trọng người học, không phán xét, không dạy đời. Tuyệt đối không dùng câu từ máy móc như "Hệ thống ghi nhận", "Dữ liệu đã được lưu".
6. NGUYÊN TẮC VÀNG CHO BUỔI TƯ VẤN 1:1 KHI BẮT ĐẦU TỪ CON SỐ 0:
   - Nếu học sinh chia sẻ: "tôi không biết phải làm gì bây giờ", "em mất định hướng", "chưa biết chọn gì", "mông lung", "bắt đầu từ số 0", "chưa vội chốt ngành":
     * TUYỆT ĐỐI KHÔNG xuất danh sách nghề nghiệp (trả về "careers": []). KHÔNG bắt học sinh chọn bất kỳ nghề nào ngay lúc này.
     * Phản hồi như một chuyên gia tư vấn hướng nghiệp 1:1 thực thụ: trấn an ngay rằng cảm giác bế tắc ở thời điểm này là hoàn toàn tự nhiên; khẳng định buổi tư vấn 1:1 sẽ không ép chọn nghề hay chọn khối; cùng bóc tách từng mảnh ghép từ trải nghiệm đời thường.
     * Đặt ĐÚNG 1 CÂU HỎI gợi mở nhẹ nhàng về trải nghiệm hoặc hoạt động đời thường (khi rảnh rỗi hoặc không áp lực bài vở, điều gì khiến em thấy cuốn hút, dễ chịu hoặc đỡ chán nhất).
     * Gợi ý 3-4 quickReplies đời thường, gần gũi.
7. TÍNH CHÂN THỰC DỮ LIỆU: Tuyệt đối không bịa đặt điểm chuẩn, học phí, mã ngành hoặc mức lương.

=== YÊU CẦU ĐẦU RA (OUTPUT FORMAT) ===
Hãy trả về DUY NHẤT một chuỗi JSON hợp lệ theo cấu trúc sau (không kèm văn bản thừa ngoài JSON):
{
  "reply": "Nội dung phản hồi của bạn dành cho học sinh (ấm áp, tự nhiên, phân tích sâu sắc, nếu hỏi thì đặt duy nhất 1 câu hỏi trọng tâm rõ ràng)",
  "profileUpdates": {
    "interests": ["Các sở thích tích cực mới được xác nhận trong câu này (nếu có)"],
    "retractedInterests": ["Các sở thích học sinh đã từ bỏ / đổi ý trong câu này (nếu có)"],
    "demonstratedStrengths": ["Môn học hoặc năng lực học sinh nói mình học tốt / có thế mạnh"],
    "learningEvidence": ["Môn học điểm thấp hoặc e ngại"],
    "workPreferences": ["Môi trường làm việc mong muốn"],
    "constraints": ["Rào cản tài chính, gia đình, vị trí địa lý"],
    "values": ["Giá trị công việc ưu tiên"],
    "dislikes": ["Các hoạt động / công việc học sinh nói rõ không thích / từ chối"],
    "uncertainties": ["Giả thuyết cần làm rõ thêm"]
  },
  "decision": {
    "stage": "DISCOVERY",
    "action": "ASK_CLARIFYING_QUESTION",
    "question": "Câu hỏi tiếp theo (nếu có, tối đa 1 câu trọng tâm)",
    "reason": "Lý do vì sao câu hỏi này giúp lấp đầy khoảng trống thông tin",
    "evidenceSufficiency": "LOW"
  },
  "quickReplies": ["Gợi ý phản hồi nhanh 1", "Gợi ý 2", "Gợi ý 3"],
  "careers": []
}
`;
}

export function parseAIModelOutput(rawText) {
  const contract = validateAndNormalizeCounselorResponse(rawText);
  return {
    replyText: contract.reply,
    quickReplies: contract.quickReplies,
    contract,
    detectedUpdates: {
      statedInterests: contract.profileUpdates.interests,
      retractedInterests: contract.profileUpdates.retractedInterests,
      academicStrengths: contract.profileUpdates.demonstratedStrengths,
      academicWeaknesses: contract.profileUpdates.learningEvidence,
      workEnvironmentPrefs: contract.profileUpdates.workPreferences,
      realConstraints: contract.profileUpdates.constraints,
      personalValues: contract.profileUpdates.values,
      rejectedActivities: contract.profileUpdates.dislikes,
      missingEvidence: contract.profileUpdates.uncertainties
    }
  };
}

export async function handleCounselorChatRequest({ body, headers = {}, env = process.env }) {
  const { sessionId, message, history = [], profile = {}, realityAnswer = '' } = body || {};

  if (!message || typeof message !== 'string' || !message.trim()) {
    return {
      status: 400,
      data: { success: false, code: 'INVALID_INPUT', error: 'Nội dung tin nhắn không được để trống.' }
    };
  }

  const cleanMessage = message.trim().slice(0, 2000);
  const clientIdentifier = (sessionId || headers['x-forwarded-for'] || 'global_client').toString();
  const rateLimit = checkRateLimit(clientIdentifier);
  if (!rateLimit.allowed) {
    return {
      status: 429,
      data: {
        success: false,
        code: 'RATE_LIMIT_EXCEEDED',
        error: `Bạn đang gửi yêu cầu quá nhanh. Vui lòng đợi ${rateLimit.retryAfterSeconds || 5} giây rồi thử lại nhé.`
      }
    };
  }

  const geminiKey = env.GEMINI_API_KEY?.trim() || '';
  const groqKey = env.GROQ_API_KEY?.trim() || '';

  if (!geminiKey && !groqKey) {
    return {
      status: 503,
      data: {
        success: false,
        code: 'ADMIN_KEY_REQUIRED',
        error: 'Hệ thống AI chưa được cấu hình API Key trên máy chủ (biến GEMINI_API_KEY trong file .env hoặc trên Vercel). Quản trị viên vui lòng cấu hình để kích hoạt AI Career Counselor thời gian thực.'
      }
    };
  }

  const systemInstruction = buildCounselorSystemPrompt({ profile, realityAnswer });

  // 1. If Gemini Key is present, call Google Gemini with resilient model fallback
  if (geminiKey) {
    const geminiModels = ['gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.8-flash'];
    const contents = [];
    const recentHistory = Array.isArray(history) ? history.slice(-10) : [];

    for (const item of recentHistory) {
      if (item && item.content && typeof item.content === 'string') {
        const role = item.role === 'model' || item.role === 'assistant' ? 'model' : 'user';
        contents.push({
          role,
          parts: [{ text: item.content.slice(0, 2000) }]
        });
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: cleanMessage }]
    });

    let lastError = null;

    for (const model of geminiModels) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{ text: systemInstruction }]
            },
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2500,
              responseMimeType: 'application/json'
            }
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const parsed = parseAIModelOutput(rawText);

          return {
            status: 200,
            data: {
              success: true,
              sessionId: sessionId || `sess_${Date.now()}`,
              modelUsed: model,
              provider: 'gemini',
              ...parsed
            }
          };
        }

        const status = response.status;
        const errJson = await response.json().catch(() => ({}));
        lastError = { status, message: errJson?.error?.message || `HTTP ${status}` };

        // If rate limited or service overloaded, try next model in fallback list
        if (status === 503 || status === 429 || status === 404) {
          continue;
        }

        // If invalid API key (401 / 403), do not retry other models with the same bad key
        if (status === 401 || status === 403) {
          break;
        }

      } catch (err) {
        lastError = { status: 504, message: err.message };
        continue;
      }
    }

    // If all models in the fallback chain were exhausted
    if (lastError) {
      let userMsg = 'Đã có lỗi xảy ra khi kết nối tới dịch vụ Google Gemini.';
      if (lastError.status === 429 || lastError.status === 503) {
        userMsg = 'Hệ thống AI đang nhận được nhiều yêu cầu cùng lúc. Bạn vui lòng thử lại nhé.';
      } else if (lastError.status === 401 || lastError.status === 403) {
        userMsg = 'Khóa API Gemini trên máy chủ không hợp lệ hoặc đã hết hạn. Quản trị viên vui lòng kiểm tra lại cấu hình GEMINI_API_KEY.';
      } else if (lastError.message) {
        userMsg = `Lỗi dịch vụ AI: ${lastError.message}`;
      }

      return {
        status: lastError.status >= 400 && lastError.status < 600 ? lastError.status : 500,
        data: { success: false, code: `AI_HTTP_${lastError.status}`, error: userMsg }
      };
    }
  }

  // 2. Groq Fallback
  if (groqKey) {
    const model = 'llama-3.3-70b-versatile';
    const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

    const messages = [{ role: 'system', content: systemInstruction }];
    const recentHistory = Array.isArray(history) ? history.slice(-10) : [];
    for (const item of recentHistory) {
      if (item && item.content) {
        messages.push({
          role: item.role === 'model' || item.role === 'assistant' ? 'assistant' : 'user',
          content: item.content.slice(0, 2000)
        });
      }
    }
    messages.push({ role: 'user', content: cleanMessage });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 1200,
          response_format: { type: 'json_object' }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const status = response.status;
        return {
          status: status >= 400 && status < 600 ? status : 500,
          data: {
            success: false,
            code: `GROQ_HTTP_${status}`,
            error: status === 429
              ? 'Hệ thống Groq đang quá tải hạn mức. Vui lòng thử lại sau vài giây.'
              : 'Lỗi xác thực hoặc kết nối tới dịch vụ Groq AI.'
          }
        };
      }

      const data = await response.json();
      const rawText = data.choices?.[0]?.message?.content || '';
      const parsed = parseAIModelOutput(rawText);

      return {
        status: 200,
        data: {
          success: true,
          sessionId: sessionId || `sess_${Date.now()}`,
          modelUsed: model,
          provider: 'groq',
          ...parsed
        }
      };
    } catch (err) {
      const isTimeout = err.name === 'AbortError';
      return {
        status: 504,
        data: {
          success: false,
          code: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
          error: isTimeout ? 'Kết nối Groq bị quá thời gian chờ (25s).' : `Lỗi mạng: ${err.message}`
        }
      };
    }
  }

  return {
    status: 500,
    data: { success: false, code: 'UNEXPECTED_STATE', error: 'Trạng thái xử lý không xác định.' }
  };
}

export function handleCounselorStatusRequest(env = process.env) {
  const hasGemini = Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim());
  const hasGroq = Boolean(env.GROQ_API_KEY && env.GROQ_API_KEY.trim());
  const hasServerKey = hasGemini || hasGroq;

  return {
    status: 200,
    data: {
      success: true,
      hasServerKey,
      provider: hasGemini ? 'gemini' : (hasGroq ? 'groq' : 'none'),
      model: hasGemini ? 'gemini-3.1-flash-lite' : (hasGroq ? 'llama-3.3-70b-versatile' : 'none'),
      requiresAdminSetup: !hasServerKey
    }
  };
}
