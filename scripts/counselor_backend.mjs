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

export function getTuitionContext(msg) {
  if (!msg || typeof msg !== 'string') return '';
  if (!/(học phí|tiền học|chi phí|tài chính|nghị định 116|miễn học phí|bao nhiêu tiền|học bổng|ngân sách|đắt không|rẻ không)/i.test(msg)) {
    return '';
  }
  if (/(sư phạm|giáo viên|dạy học)/i.test(msg)) {
    return 'Dữ liệu học phí: Sư phạm miễn 100% học phí + trợ cấp 3.63 tr/tháng (NĐ 116/2020 & NĐ 238/2025). Ngoài SP thu 17.5-21 tr/năm.';
  }
  if (/(quân đội|công an|an ninh|cảnh sát|sĩ quan)/i.test(msg)) {
    return 'Dữ liệu học phí: Khối Quân đội & Công an bao cấp 100% học phí, ăn ở và sinh hoạt phí.';
  }
  if (/(ngành y|y khoa|y dược|y tế|bác sĩ|răng hàm mặt|dược)/i.test(msg)) {
    return 'Dữ liệu học phí: Y Dược công lập tự chủ 35-90 tr/năm (Y Hà Nội 24.5-62.2 tr, Y Dược TPHCM 35-90 tr); Quân Y miễn 100%; Tư thục 45-140 tr/năm.';
  }
  if (/(bách khoa|công nghệ|cntt|it|khoa học máy tính)/i.test(msg)) {
    return 'Dữ liệu học phí: Bách Khoa HN 29.5-42 tr/năm; ĐH Công nghệ ĐHQGHN 40 tr/năm; PTIT 38.5 tr/năm; Bách Khoa HCM 31.5 tr/năm; FPT 62 tr/năm.';
  }
  if (/(kinh tế|ngoại thương|neu|ftu|tài chính|ueh|hvtc)/i.test(msg)) {
    return 'Dữ liệu học phí: Kinh tế Quốc dân 23.5-52 tr/năm; Ngoại thương 30-85 tr/năm; Học viện Tài chính 28-52.5 tr/năm; UEH 43.5-72 tr/năm.';
  }
  return 'Dữ liệu học phí (NĐ 238/2025/NĐ-CP): Bình quân ĐH 33.7 tr/năm. Công lập 18-35 tr; Tự chủ/Y Dược 35-70 tr; Quốc tế 200-350 tr. Miễn 100%: Sư phạm (NĐ 116 + 3.63 tr/th) & Quân đội, Công an.';
}

export function buildCounselorSystemPrompt(profileOrOpts, maybeRealityAnswer, tuitionContext) {
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

  return `Bạn là Cố Vấn Hướng Nghiệp Nexora. Bạn trò chuyện 1:1 chân thành, ấm áp, thấu cảm với học sinh Việt Nam.
Hồ sơ: Lượt ${turns} | Sở thích: ${stated} | Thế mạnh: ${strengths} | Môi trường: ${workEnv} | Muốn tránh: ${rejected}${realityAnswer ? ` | Tâm thế tự vấn ban đầu: "${realityAnswer}"` : ''}${tuitionContext ? ` | ${tuitionContext}` : ''}

Quy tắc:
1. Phản hồi súc tích, tự nhiên (1-2 đoạn ngắn), tuyệt đối không dùng văn mẫu hay sáo rỗng.
2. Không vội vàng chốt ngành/nghề khi chưa đủ cơ sở.
3. Mỗi lượt chỉ đặt ĐÚNG 1 CÂU HỎI gợi mở nhẹ nhàng để học sinh tự soi chiếu.
4. Trả về DUY NHẤT chuỗi JSON hợp lệ (không kèm chữ ngoài JSON):
{
  "reply": "Nội dung phản hồi súc tích, ấm áp kèm 1 câu hỏi định hướng",
  "quickReplies": ["Gợi ý trả lời ngắn 1", "Gợi ý 2", "Gợi ý 3"]
}`;
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
  const parsedBody = typeof body === 'string' ? (() => { try { return JSON.parse(body); } catch { return {}; } })() : (body || {});
  const { sessionId, message, history = [], profile = {}, realityAnswer = '' } = parsedBody;

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

  const DEFAULT_SERVER_GEMINI_KEY = 'AQ.Ab8RN6Iufs8Djj-3UZGfp4PuCUsMF208uGAF_T4L2PmI6zR-RQ';
  const geminiKey = env.GEMINI_API_KEY !== undefined ? env.GEMINI_API_KEY.trim() : DEFAULT_SERVER_GEMINI_KEY;
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

  const tuitionContext = getTuitionContext(cleanMessage);
  const systemInstruction = buildCounselorSystemPrompt({ profile, realityAnswer }, undefined, tuitionContext);

  // 1. If Gemini Key is present, call Google Gemini with resilient model fallback
  if (geminiKey) {
    const geminiModels = ['gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.8-flash'];
    const contents = [];
    const recentHistory = Array.isArray(history) ? history.slice(-6) : [];

    for (const item of recentHistory) {
      if (item && item.content && typeof item.content === 'string') {
        const role = item.role === 'model' || item.role === 'assistant' ? 'model' : 'user';
        contents.push({
          role,
          parts: [{ text: item.content.slice(0, 1000) }]
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
              maxOutputTokens: 500,
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
  const DEFAULT_SERVER_GEMINI_KEY = 'AQ.Ab8RN6Iufs8Djj-3UZGfp4PuCUsMF208uGAF_T4L2PmI6zR-RQ';
  const hasGemini = Boolean((env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim()) || DEFAULT_SERVER_GEMINI_KEY);
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

/**
 * AI DOSSIER INTELLIGENCE ANALYZER
 * Analyzes the user's full academic dossier, RIASEC vector, tuition constraints,
 * and directly answers their genuine question/băn khoăn.
 */
export async function handleDossierAnalysisRequest({ body, headers = {}, env = process.env }) {
  const parsedBody = typeof body === 'string' ? (() => { try { return JSON.parse(body); } catch { return {}; } })() : (body || {});
  const {
    scores = {},
    hsaScore,
    vactScore,
    tsaScore,
    ieltsBand,
    satScore,
    riasec = { R: 30, I: 30, A: 30, S: 30, E: 30, C: 30 },
    maxTuition = 35,
    priorityRegion = 'KV2',
    priorityObject = 'DT_0',
    targetRegionFilter = 'ALL',
    personalQuestion = ''
  } = parsedBody;

  const clientIdentifier = (headers['x-forwarded-for'] || 'dossier_client').toString();
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

  // Determine Dominant RIASEC code
  const sortedRiasec = Object.entries(riasec).sort((a, b) => b[1] - a[1]);
  const dominantCode = sortedRiasec.slice(0, 3).map(e => e[0]).join('');

  // Prepare Exam String
  const exams = [];
  if (hsaScore) exams.push(`ĐGNL HSA: ${hsaScore}/150`);
  if (vactScore) exams.push(`ĐGNL V-ACT: ${vactScore}/1200`);
  if (tsaScore) exams.push(`ĐGTD TSA: ${tsaScore}/100`);
  if (ieltsBand) exams.push(`IELTS: ${ieltsBand}`);
  if (satScore) exams.push(`SAT: ${satScore}/1600`);
  const examSummary = exams.length > 0 ? exams.join(', ') : 'Chưa thi chứng chỉ/ĐGNL';

  const systemInstruction = `Bạn là Hệ thống Trí Tuệ Nhân Tạo Hướng Nghiệp NEXORA (AI Career Intelligence Engine) tại Việt Nam.
Nhiệm vụ: Phân tích toàn diện hồ sơ năng lực học tập THPT, trắc nghiệm tâm trắc RIASEC, điều kiện tài chính gia đình và TRỰC TIẾP GIẢI ĐÁP câu hỏi băn khoăn của chính học sinh.
Tuân thủ chuẩn danh mục ngành cấp IV (Thông tư 09/2022 & Thông tư 74/2026/TT-BGDĐT), khung trần học phí Nghị định 238/2025/NĐ-CP (miễn HP Sư phạm NĐ 116), và quy chế tuyển sinh Thông tư 06/2026/TT-BGDĐT.

YÊU CẦU ĐẦU RA: Trả về DUY NHẤT chuỗi JSON hợp lệ (không kèm chữ ngoài JSON):
{
  "headline": "Tiêu đề chiến lược cô đọng cho hồ sơ (1 câu súc tích)",
  "directAnswer": "Giải đáp sâu sắc, chân thực, đồng cảm và có căn cứ khoa học trực tiếp cho câu hỏi của học sinh (2-3 đoạn ngắn, tuyệt đối không dùng văn mẫu)",
  "strengthsEvaluation": "Đánh giá chi tiết thế mạnh học thuật nổi trội, phản xạ tư duy và tương thích sở thích",
  "risksAndBottlenecks": "Cảnh báo thẳng thắn về môn học nghẽn, mức độ cạnh tranh điểm chuẩn hoặc nguy cơ làm trái ngành",
  "tuitionFeasibility": "Nhận định về khả năng đáp ứng tài chính gia đình so với học phí các trường mục tiêu (NĐ 238/2025)",
  "recommendedMajors": [
    {
      "codeTT09": "mã 7 chữ số (TT 09/2022)",
      "codeTT74": "mã 6 chữ số (TT 74/2026)",
      "name": "Tên ngành đào tạo",
      "sector": "CNTT_BAN_DAN_AI | KY_THUAT_CONG_NGHE | KINH_TE_QUAN_TRI | Y_DUOC_SUC_KHOE | SU_PHAM_GIAO_DUC | LUAT_HANH_CHINH | XA_HOI_NHAN_VAN | KIEN_TRUC_NGHE_THUAT_TDTT | NONG_LAM_NGU_SINH_HOC | CONG_AN_QUAN_DOI",
      "sectorName": "Tên lĩnh vực",
      "fitPercent": 92,
      "fitReason": "Lý do cá nhân hóa vì sao ngành này khớp với học sinh dựa trên điểm số và RIASEC cụ thể",
      "targetJobs": ["Vị trí 1", "Vị trí 2", "Vị trí 3"],
      "salaryMedian": "Mức lương trung vị (ví dụ: 25 triệu/tháng)",
      "aiRisk": "Cực thấp | Thấp | Trung bình | Cao",
      "aiRiskPercent": 25,
      "popularCombos": ["A00", "A01"]
    }
  ],
  "optimalComboAdvice": "Khuyên dùng tổ hợp môn nào có lợi thế điểm xét tuyển cao nhất kèm cách tối ưu",
  "universityAdvice": "Chiến lược phân tầng 3 cấp nguyện vọng (Mơ ước, Vừa sức, An toàn)"
}`;

  const userPrompt = `HỒ SƠ HỌC SINH CẦN PHÂN TÍCH:
- Điểm 10 môn THPT: Toán=${scores.math || 8.0}, Văn=${scores.literature || 8.0}, Anh=${scores.english || 8.0}, Lý=${scores.physics || 8.0}, Hóa=${scores.chemistry || 8.0}, Sinh=${scores.biology || 8.0}, Sử=${scores.history || 8.0}, Địa=${scores.geography || 8.0}, Tin=${scores.informatics || 8.0}, GDKT&PL=${scores.economicLegal || 8.0}.
- Bài thi năng lực / Chứng chỉ: ${examSummary}.
- Điểm RIASEC: R=${riasec.R}, I=${riasec.I}, A=${riasec.A}, S=${riasec.S}, E=${riasec.E}, C=${riasec.C} (Mã đỉnh: ${dominantCode}).
- Ngân sách học phí: ${maxTuition} triệu VNĐ/năm.
- Khu vực: ${priorityRegion}, Đối tượng: ${priorityObject}, Vùng mong muốn: ${targetRegionFilter}.
- Câu hỏi / Băn khoăn từ chính học sinh: "${personalQuestion || 'Em muốn AI phân tích toàn diện tiềm năng học tập và tư vấn định hướng ngành trường phù hợp nhất.'}"

Hãy phân tích toàn diện và trả về JSON theo đúng định dạng.`;

  const DEFAULT_SERVER_GEMINI_KEY = 'AQ.Ab8RN6Iufs8Djj-3UZGfp4PuCUsMF208uGAF_T4L2PmI6zR-RQ';
  const geminiKey = (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim()) || DEFAULT_SERVER_GEMINI_KEY;
  const groqKey = env.GROQ_API_KEY && env.GROQ_API_KEY.trim();

  // 1. Try Gemini
  if (geminiKey) {
    const geminiModels = ['gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.8-flash'];
    for (const model of geminiModels) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 18000);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: {
              temperature: 0.6,
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
          let cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
          let parsed = null;
          try {
            parsed = JSON.parse(cleaned);
          } catch {
            const m = cleaned.match(/\{[\s\S]*\}/);
            if (m) {
              try { parsed = JSON.parse(m[0]); } catch {}
            }
          }

          if (parsed && parsed.headline && parsed.directAnswer) {
            return {
              status: 200,
              data: {
                success: true,
                modelUsed: model,
                provider: 'gemini',
                analysis: parsed
              }
            };
          }
        }
      } catch (err) {
        continue;
      }
    }
  }

  // 2. Try Groq
  if (groqKey) {
    try {
      const endpoint = 'https://api.groq.com/openai/v1/chat/completions';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.6,
          max_tokens: 2000,
          response_format: { type: 'json_object' }
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const rawText = data.choices?.[0]?.message?.content || '';
        const parsed = JSON.parse(rawText);
        if (parsed && parsed.headline) {
          return {
            status: 200,
            data: {
              success: true,
              modelUsed: 'llama-3.3-70b-versatile',
              provider: 'groq',
              analysis: parsed
            }
          };
        }
      }
    } catch (err) {}
  }

  // 3. Deterministic Grounded Fallback (Personalized to exact grades and RIASEC)
  const isHighStem = (scores.math || 8) >= 8.0 && (scores.physics || 8) >= 7.5;
  const isHighHumanities = (scores.literature || 8) >= 8.0 || (scores.history || 8) >= 8.0;
  const isHighLang = (scores.english || 8) >= 8.0;

  const fallbackAnalysis = {
    headline: isHighStem
      ? `Chiến lược Định hướng: Tối ưu Tư duy STEM & Năng lực Phân tích ${dominantCode}`
      : `Chiến lược Định hướng: Khai phóng Đa Trí Tuệ & Thế mạnh Ngôn ngữ ${dominantCode}`,
    directAnswer: personalQuestion
      ? `Đối với băn khoăn của bạn ("${personalQuestion}"): Phân tích dữ liệu học tập cho thấy bạn hoàn toàn có cơ sở để chủ động định hình lộ trình. Đừng quá lo lắng về áp lực xã hội hay những nhận định phiến diện. Sự kết hợp giữa năng lực thực tế và định hướng rõ ràng sẽ giúp bạn vượt trội trong môi trường học thuật 2026.`
      : `Hồ sơ của bạn sở hữu nền tảng học tập đồng đều và vững vàng. Mã đỉnh ${dominantCode} cho thấy tiềm năng thích ứng linh hoạt trong môi trường đại học hiện đại.`,
    strengthsEvaluation: `Điểm GPA bình quân phản ánh thái độ học tập nghiêm túc. Thế mạnh môn ${isHighStem ? 'Toán - Tin logic' : 'Văn - Ngoại ngữ'} kết hợp với miền sở thích ${dominantCode} là đòn bẩy lớn trong các phương thức xét tuyển kết hợp.`,
    risksAndBottlenecks: `Cần lưu ý kiểm soát các môn điều kiện trong tổ hợp chính và theo dõi sát sao điểm chuẩn 3 năm gần nhất để tránh tình trạng dồn toàn bộ nguyện vọng vào nhóm ngành có tỷ lệ chọi quá cao.`,
    tuitionFeasibility: `Ngân sách ${maxTuition} triệu VNĐ/năm hoàn toàn nằm trong khung trần Nghị định 238/2025/NĐ-CP đối với các trường đại học công lập và chương trình chuẩn chất lượng cao.`,
    recommendedMajors: [
      {
        codeTT09: isHighStem ? '7480201' : '7340101',
        codeTT74: isHighStem ? '748020' : '734010',
        name: isHighStem ? 'Công nghệ thông tin' : 'Quản trị kinh doanh & Kinh tế số',
        sector: isHighStem ? 'CNTT_BAN_DAN_AI' : 'KINH_TE_QUAN_TRI',
        sectorName: isHighStem ? 'Máy tính, CNTT, Bán dẫn & AI' : 'Kinh doanh, Quản lý & Tài chính',
        fitPercent: 94,
        fitReason: `Phù hợp với hồ sơ có nền tảng điểm Toán ${(scores.math || 8.0).toFixed(1)} và mã đỉnh ${dominantCode}.`,
        targetJobs: isHighStem ? ['Kỹ sư phần mềm', 'Chuyên viên dữ liệu', 'Kỹ sư AI'] : ['Chuyên viên phân tích kinh doanh', 'Quản trị dự án số'],
        salaryMedian: isHighStem ? '28 triệu/tháng' : '22 triệu/tháng',
        aiRisk: isHighStem ? 'Thấp' : 'Trung bình',
        aiRiskPercent: isHighStem ? 28 : 42,
        popularCombos: isHighStem ? ['A00', 'A01', 'D01'] : ['A01', 'D01', 'A00']
      }
    ],
    optimalComboAdvice: isHighLang ? 'Khuyên dùng tổ hợp có môn Tiếng Anh (A01, D01) để tận dụng tối đa năng lực ngôn ngữ.' : 'Khuyên dùng tổ hợp A00 hoặc D01 theo thế mạnh cốt lõi.',
    universityAdvice: `Phân bổ nguyện vọng theo chiến lược 3 tầng: 1-2 nguyện vọng Mơ ước (điểm chuẩn cao hơn 0.5-1.0đ), 2-3 nguyện vọng Vừa sức (biên độ an toàn), và ít nhất 1 nguyện vọng An toàn tuyệt đối.`
  };

  return {
    status: 200,
    data: {
      success: true,
      modelUsed: 'heuristic-grounded-engine',
      provider: 'nexora',
      analysis: fallbackAnalysis
    }
  };
}
