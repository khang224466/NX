/**
 * NEXORA AI CAREER COUNSELOR BACKEND HANDLER
 * Handles conversational counselor requests using server-side GEMINI_API_KEY or GROQ_API_KEY.
 * Provides resilient timeout handling, rate limiting, and structured JSON parsing.
 */

export function buildCounselorSystemPrompt(profileOrOpts, maybeRealityAnswer) {
  const profile = (profileOrOpts && typeof profileOrOpts === 'object' && 'statedInterests' in profileOrOpts)
    ? profileOrOpts
    : (profileOrOpts?.profile || {});
  const realityAnswer = profileOrOpts?.realityAnswer || maybeRealityAnswer || '';

  const stated = (profile?.statedInterests || []).join(', ') || 'Chưa rõ';
  const untested = (profile?.untestedInterests || []).join(', ') || 'Không có';
  const rejected = (profile?.rejectedActivities || []).join(', ') || 'Không có';
  const strengths = (profile?.academicStrengths || []).join(', ') || 'Chưa rõ';
  const weaknesses = (profile?.academicWeaknesses || []).join(', ') || 'Chưa rõ';
  const workEnv = (profile?.workEnvironmentPrefs || []).join(', ') || 'Chưa rõ';
  const constraints = (profile?.realConstraints || []).join(', ') || 'Không có';
  const contradictions = (profile?.unresolvedContradictions || []).join(', ') || 'Không có';
  const turns = profile?.turnsCount || 1;

  // Evaluate readiness from profile data
  const hasInterests = (profile?.statedInterests || []).length > 0;
  const hasCapabilities = (profile?.academicStrengths || []).length > 0 || (profile?.academicWeaknesses || []).length > 0;
  const hasEnv = (profile?.workEnvironmentPrefs || []).length > 0 || (profile?.personalValues || []).length > 0;
  const isReady = hasInterests && hasCapabilities && !contradictions.length && turns >= 2;

  return `Bạn là Cố Vấn Hướng Nghiệp & Tuyển Sinh AI cấp cao của NEXORA (AI Career Counselor), được đào tạo theo chuẩn tâm lý giáo dục và dữ liệu tuyển sinh Việt Nam 2026.
Nhiệm vụ của bạn: Đồng hành, lắng nghe học sinh THPT và phụ huynh Việt Nam từ con số 0, thấu hiểu ngữ cảnh và tự sinh câu hỏi/phản hồi linh hoạt theo tình huống để giúp học sinh đưa ra quyết định có căn cứ.

=== HỒ SƠ BẰNG CHỨNG HIỆN TẠI (EVIDENCE PROFILE) ===
- Lượt hội thoại hiện tại: Lượt ${turns}
- Sở thích tích cực đã xác nhận: ${stated}
- Sở thích chưa thử nghiệm: ${untested}
- Hoạt động / Môi trường học sinh từ chối / e ngại: ${rejected}
- Môn học thế mạnh / Năng lực nhận thức: ${strengths}
- Điểm yếu môn học / Phạm vi e ngại: ${weaknesses}
- Môi trường làm việc mong muốn: ${workEnv}
- Rào cản thực tế (tài chính, địa lý, gia đình): ${constraints}
- Mâu thuẫn chưa giải quyết: ${contradictions}
${realityAnswer ? `- Tâm thế đối diện thực tế ban đầu: "${realityAnswer}"` : ''}
- Trạng thái sẵn sàng kết luận nghề: ${isReady ? 'ĐÃ ĐỦ BẰNG CHỨNG' : 'CHƯA ĐỦ BẰNG CHỨNG (Tuyệt đối KHÔNG chốt danh sách nghề cuối cùng)'}

=== NGUYÊN TẮC HỘI THOẠI CỐT LÕI (BẮT BUỘC TUÂN THỦ) ===
1. TỰ SINH CÂU HỎI THEO TÌNH HUỐNG: Tuyệt đối không dùng kịch bản câu hỏi rập khuôn. Dựa vào câu nói mới nhất của học sinh để phản hồi tự nhiên, gần gũi như một người thầy cố vấn thấu cảm.
2. HIỂU NGÔN NGỮ TỰ NHIÊN: Học sinh có thể viết ngắn gọn ("em ko bit", "...", "toán 6.5"), viết tắt, sai chính tả, hoặc bộc lộ tâm lý hoang mang. Hãy kiên nhẫn và giải tỏa tâm lý trước khi đi sâu vào nghiệp vụ.
3. PHÂN BIỆT RÕ RÀNG:
   - "Chưa thử" khác với "Không thích/Từ chối".
   - "Thích lĩnh vực công nghệ" nhưng "Không muốn lập trình/code" là 2 vế độc lập.
   - "Không phải ghét Toán, chỉ sợ Toán nâng cao" nghĩa là không ghét Toán căn bản, chỉ e ngại giải tích chuyên sâu.
4. XỬ LÝ ĐỔI Ý & MÂU THUẪN:
   - Nếu học sinh thay đổi ý kiến (ví dụ: trước thích máy tính nhưng nay đổi sang động vật): Lập tức ghi nhận và chuyển hướng theo sở thích mới, không níu giữ ý cũ.
   - Nếu có mâu thuẫn (ví dụ: ghét văn phòng nhưng lại muốn công việc bàn giấy ổn định 8 tiếng): Đặt 1 câu hỏi trọng tâm giúp học sinh tự soi chiếu sự đánh đổi.
5. TRẢ LỜI CÂU HỎI TRỰC TIẾP: Nếu học sinh hỏi cụ thể về một ngành, trường, điểm chuẩn hay học phí, hãy trả lời thẳng thắn và chính xác, sau đó mới hỏi tiếp.
6. TÍNH TRUNG THỰC DỮ LIỆU: Chỉ nêu điểm chuẩn, mã ngành, học phí khi có căn cứ chuẩn xác theo quy chế Bộ GD&ĐT Việt Nam 2026. Nếu chưa xác minh được, phải nói rõ "Chưa xác minh được trong hệ thống".
7. ĐIỀU KIỆN ĐỀ XUẤT NGHỀ:
   - Nếu hồ sơ còn mơ hồ, thiếu bằng chứng năng lực hoặc môi trường: TIẾP TỤC ĐẶT CÂU HỎI KHÁM PHÁ hoặc đưa ra tình huống thực tế. Tuyệt đối KHÔNG ép đưa ra danh sách 3 nghề chốt hạ.
   - Chỉ khi nào học sinh đã bộc lộ rõ cả Sở thích, Năng lực và Môi trường làm việc: Mới đúc kết và mở ra các hướng nghề nghiệp phù hợp.

=== YÊU CẦU ĐẦU RA (OUTPUT FORMAT) ===
Hãy trả về DUY NHẤT một chuỗi JSON hợp lệ theo cấu trúc sau (không kèm văn bản thừa ngoài JSON):
{
  "replyText": "Nội dung phản hồi của bạn dành cho học sinh (ấm áp, tự nhiên, phân tích sâu sắc, nếu hỏi thì đặt duy nhất 1 câu hỏi trọng tâm rõ ràng)",
  "quickReplies": ["Gợi ý phản hồi nhanh 1 (ngắn gọn, phù hợp ngữ cảnh vừa nói)", "Gợi ý phản hồi nhanh 2", "Gợi ý phản hồi nhanh 3"],
  "detectedUpdates": {
    "statedInterests": ["Các sở thích tích cực mới được xác nhận trong câu này (nếu có)"],
    "retractedInterests": ["Các sở thích học sinh đã từ bỏ / đổi ý trong câu này (nếu có)"],
    "untestedInterests": ["Các sở thích học sinh muốn thử hoặc chưa từng làm"],
    "rejectedActivities": ["Các hoạt động / công việc học sinh nói rõ không thích / từ chối"],
    "academicStrengths": ["Môn học hoặc năng lực học sinh nói mình học tốt / có thế mạnh"],
    "academicWeaknesses": ["Môn học điểm thấp hoặc e ngại"],
    "workEnvironmentPrefs": ["Môi trường làm việc mong muốn"],
    "realConstraints": ["Rào cản tài chính, gia đình, vị trí địa lý"]
  }
}
`;
}

/**
 * Clean and parse JSON from model output
 */
export function parseAIModelOutput(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      replyText: 'Xin lỗi bạn, phản hồi từ máy chủ AI không có nội dung. Bạn vui lòng thử lại nhé.',
      quickReplies: ['Chia sẻ thêm về bản thân', 'Tìm hiểu ngành nghề phù hợp'],
      detectedUpdates: {}
    };
  }

  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.replyText && typeof parsed.replyText === 'string') {
      return {
        replyText: parsed.replyText.trim(),
        quickReplies: Array.isArray(parsed.quickReplies) ? parsed.quickReplies.filter(Boolean) : [],
        detectedUpdates: parsed.detectedUpdates && typeof parsed.detectedUpdates === 'object' ? parsed.detectedUpdates : {}
      };
    }
  } catch {
    // If JSON parsing fails, regex extract fields or use the cleaned text as reply
    const replyMatch = cleaned.match(/"replyText"\s*:\s*"((?:\\.|[^"\\])*)"/);
    if (replyMatch) {
      try {
        const extractedReply = JSON.parse(`"${replyMatch[1]}"`);
        return {
          replyText: extractedReply,
          quickReplies: ['Chia sẻ thêm về bản thân', 'Khám phá các hướng đi'],
          detectedUpdates: {}
        };
      } catch {}
    }
  }

  // Fallback: return raw text cleaned
  return {
    replyText: cleaned,
    quickReplies: ['Chia sẻ thêm về trải nghiệm học tập', 'Khám phá môn thế mạnh'],
    detectedUpdates: {}
  };
}

/**
 * Handle POST /api/ai/counselor/chat
 */
export async function handleCounselorChatRequest({ body, headers = {}, env = process.env }) {
  const { sessionId, message, history = [], profile = {}, realityAnswer = '' } = body || {};

  if (!message || typeof message !== 'string' || !message.trim()) {
    return {
      status: 400,
      data: { success: false, code: 'INVALID_INPUT', error: 'Nội dung tin nhắn không được để trống.' }
    };
  }

  // Priority 1: User-supplied header key or body key (BYOK from secure client modal)
  // Priority 2: Server environment variable
  const clientKey = headers['x-gemini-key'] || headers['x-groq-key'] || body?.clientApiKey || '';
  const isClientGroq = clientKey.startsWith('gsk_');
  const geminiKey = (!isClientGroq && clientKey) ? clientKey : (headers['x-gemini-key'] || env.GEMINI_API_KEY || '');
  const groqKey = (isClientGroq ? clientKey : '') || headers['x-groq-key'] || env.GROQ_API_KEY || '';

  if (!geminiKey && !groqKey) {
    return {
      status: 503,
      data: {
        success: false,
        code: 'MISSING_API_KEY',
        error: 'Hệ thống AI chưa được cấu hình API Key trên máy chủ (biến GEMINI_API_KEY trong file .env). Vui lòng cấu hình API Key trên server để kích hoạt AI Career Counselor thời gian thực.'
      }
    };
  }

  const systemInstruction = buildCounselorSystemPrompt({ profile, realityAnswer });

  // 1. If Gemini Key is present, call Google Gemini 2.0 Flash
  if (geminiKey) {
    const model = 'gemini-2.0-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

    // Format chat history for Gemini API
    const contents = [];
    const recentHistory = Array.isArray(history) ? history.slice(-6) : [];

    for (const item of recentHistory) {
      if (item && item.content && typeof item.content === 'string') {
        const role = item.role === 'model' || item.role === 'assistant' ? 'model' : 'user';
        contents.push({
          role,
          parts: [{ text: item.content }]
        });
      }
    }

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: message.trim() }]
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

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
            maxOutputTokens: 1000
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const status = response.status;
        const errJson = await response.json().catch(() => ({}));
        let userMsg = 'Đã có lỗi xảy ra khi kết nối tới dịch vụ Google Gemini.';

        if (status === 429) {
          userMsg = 'Hệ thống AI đang nhận được nhiều yêu cầu cùng lúc (vượt hạn mức tốc độ). Bạn vui lòng chờ một lát rồi nhấn Thử lại nhé.';
        } else if (status === 401 || status === 403) {
          userMsg = 'Khóa API Gemini trên máy chủ không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại cấu hình GEMINI_API_KEY.';
        } else if (errJson?.error?.message) {
          userMsg = `Lỗi dịch vụ AI: ${errJson.error.message}`;
        }

        return {
          status: status >= 400 && status < 600 ? status : 500,
          data: { success: false, code: `AI_HTTP_${status}`, error: userMsg }
        };
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const parsed = parseAIModelOutput(rawText);

      return {
        status: 200,
        data: {
          success: true,
          sessionId: sessionId || `sess_${Date.now()}`,
          modelUsed: model,
          ...parsed
        }
      };
    } catch (err) {
      const isTimeout = err.name === 'AbortError';
      const userMsg = isTimeout
        ? 'Yêu cầu kết nối AI bị quá thời gian chờ (timeout sau 15 giây). Bạn vui lòng thử lại nhé.'
        : `Lỗi kết nối mạng: ${err.message || 'Không thể liên lạc với máy chủ AI'}.`;

      return {
        status: 504,
        data: {
          success: false,
          code: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
          error: userMsg
        }
      };
    }
  }

  // 2. Fallback to Groq if only GROQ_API_KEY is configured
  if (groqKey) {
    const model = 'llama-3.3-70b-versatile';
    const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

    const messages = [
      { role: 'system', content: systemInstruction }
    ];

    const recentHistory = Array.isArray(history) ? history.slice(-6) : [];
    for (const item of recentHistory) {
      if (item && item.content) {
        messages.push({
          role: item.role === 'model' ? 'assistant' : 'user',
          content: item.content
        });
      }
    }
    messages.push({ role: 'user', content: message.trim() });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 1000,
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
          error: isTimeout ? 'Kết nối Groq bị quá thời gian chờ (15s).' : `Lỗi mạng: ${err.message}`
        }
      };
    }
  }

  return {
    status: 500,
    data: { success: false, code: 'UNEXPECTED_STATE', error: 'Trạng thái xử lý không xác định.' }
  };
}
