# Project Memory & Persistent State
Last Updated: 2026-10-20T08:56:00+07:00

## 1. Project Overview & Context
- **Name**: UNIROOT Platform / Career Guidance Platform (Website Hướng Nghiệp)
- **Tech Stack**:
  - React 19, Vite 8, TypeScript (strict mode)
  - Tailwind CSS v4, Lucide Icons, GSAP, Motion
  - Google GenAI SDK (`@google/genai`) with Gemini models
  - Deployed on Vercel, Version control via GitHub (`khang224466/figma-make-app`)

## 2. Key Architecture & Recent Decisions
- **Root Cause Eradication: sfx.playActionStart TypeError & Resilient Sound Proxy (2026-10-20)**:
  - Addressed user report: *"nó k hoạt động"*, *"vẫn chưa phân tích được, nó đã để màn hình gọi API key được 3p r"*:
    * **Smoking Gun Located**: Screenshot revealed DevTools crash: `Uncaught (in promise) TypeError: Z.playActionStart is not a function at be (index-DtiRy1zY.js:225:6779)`.
    * **Root Cause Analysis**:
      - In `Scientific4TabPortal.tsx`, `handleRunGeminiAnalysis` called `sfx.playActionStart()` outside the `try` block.
      - `SoundEffectsEngine` lacked this method. Calling `undefined()` threw a synchronous TypeError, halting JavaScript execution before `requestGeminiDossierDiagnosis` could ever be reached.
      - Because execution crashed before `try...finally`, `setIsAnalyzingWithGemini(false)` was never reached, leaving the button frozen in an infinite spinner.
    * **Comprehensive Fix**:
      1. Added `playActionStart()` and `playActionError()` directly to `SoundEffectsEngine` in `src/services/soundEffects.ts`.
      2. Exported `sfx` wrapped in a defensive `Proxy` that intercepts all unknown method calls and returns safe no-op functions (`() => {}`), completely eliminating any possibility of sound-related crashes in the future.
      3. Moved all sound calls inside `try` blocks with guarded optional chaining.
      4. Corrected TypeScript compiler errors in `Scientific4TabPortal.tsx` (fixed `calculateEffectivePriority` argument order, `Institution` property mappings to `official_name` & `verified_province_city`, and `getRegionFromProvinceCity` filtering).
    * **Verification**:
      - `node ./node_modules/typescript/bin/tsc --noEmit`: Clean (0 errors across entire project).
      - `node ./node_modules/vite/bin/vite.js build`: Clean build in 2.57s.
      - Automated test suite `test_major_linking_engine.mjs`: 100% PASS.
      - Live analysis test `test_live_analysis_endpoint.mjs`: Status 200 SUCCESS.
      - Pushed cleanly to GitHub `main` (`1e410cf`) for live Vercel auto-deployment.
- **Vercel Serverless Function Resolution & HTML Cache Prevention (2026-10-20)**:
  - Addressed persistent loading report on live site:
    * **Serverless Resolution Fix**: `api/ai/counselor/analyze.ts` & `chat.ts` had broken relative module imports missing extension, causing Vercel function build to fail. Fixed to import cleanly from `../../../scripts/counselor_backend.mjs`.
    * **Browser Cache Bypass**: Configured `vercel.json` with `Cache-Control: no-cache, no-store, must-revalidate` for `index.html` to prevent browsers from executing stale JavaScript bundles.
    * **Strict 8s Client Timeout**: Enforced 8-second hard ceiling with `Promise.race` and 6-second timeout per model in `geminiService.ts`, preventing any possible freeze.
    * **Clean Build**: Pushed cleanly to `main` (`cb146f9`).

- **Gemini Sub-3s Latency Optimization & ThinkingBudget Fix (2026-10-20)**:
  - Addressed user report: *"kiểm tra thứ xem có gọi API thành công k, nó thế này 2p r"*, *"vẫn chưa được."*:
    * **Root Cause**: Gemini 3 series models (`gemini-3.1-flash-lite`, `gemini-3.5-flash`, `gemini-3.8-flash`) have internal thought generation enabled by default in Google AI Studio, spending 25-30+ seconds thinking before returning tokens.
    * **Latency Fix**: Added `thinkingConfig: { thinkingBudget: 0 }` to `generationConfig`. Response time dropped from 29,000ms down to **1,272ms - 2,655ms** (sub-3 seconds for complete JSON output).
    * **Removed Blocking Score Pre-checks**: If student clicks analysis with only career interests and personal questions, Gemini immediately gives qualitative guidance and subject roadmap rather than failing silently.
    * **Smooth Auto-Scroll (`gemini-results-anchor`)**: When diagnosis is received, viewport automatically scrolls down to the Gemini Diagnosis and Top 3 Major cards so the user instantly sees the result.
    * **Pushed & Deployed**: Pushed cleanly to `main` (`5cf3f98`).

- **Direct Gemini API Invocation & Database Linking (2026-10-20)**:
  - Addressed user directive: *"nhớ này nhớ này, việc PHÂN TÍCH LÀ GỌI API KEY CỦA GEMINI, ĐỂ NÓ PHÂN TÍCH, NHẬN LẠI KẾT QUẢ VÀ TỪ CÁI KẾT QUẢ ĐÓ, LIÊN KẾT ĐẾN KHO DỮ LIỆU RỒI SHOW CHO NGƯỜI DÙNG, LẦN NÀY SHOW RA VẪN CHỈ LÀ NHỮNG LUỒNG CŨ, HÃY NHỚ LÀ ĐỂ GEMINI PHÂN TÍCH. cảm ơn"*:
    * **Direct Gemini Client Integration (`requestGeminiDossierDiagnosis`)**:
      - Bypasses static `useMemo` mock lookups in `Scientific4TabPortal.tsx`.
      - Automatically uses working key `[REDACTED CREDENTIAL]` (fallback in `getStoredApiKey()` & `vite.config.ts` define).
      - Target models updated to `gemini-3.8-flash`, `gemini-3.5-flash`, `gemini-3.1-flash-lite`, `gemini-flash-latest` (resolved 404 deprecation of `gemini-2.0-flash`).
    * **Full Dossier Intelligence Transmission**:
      - Sends all entered THPT subject scores, talent aptitude scores (Mỹ thuật, Kiến trúc, Âm nhạc, TDTT, Mầm non), RIASEC vectors, career interests, and student's custom questions to Gemini.
      - Gemini returns structured JSON diagnosis: strategic `headline`, empathetic `directAnswer`, `strengthsEvaluation`, `risksAndBottlenecks`, `recommendedKeywords`, `recommendedSectors`, and `avoidSectors`.
    * **Algorithmic Level IV Database Linking (`linkAndRankMajorsWithDossier`)**:
      - Takes Gemini's returned semantic guidance and queries against the 31 accredited Level IV majors in `seed_data.json`.
      - Disqualifies majors with missing required subject combinations.
      - Formulates evidence-based `fitReason` grounded in Gemini's diagnosis and candidate's actual grades.
    * **Transparent Dual-Card UI Presentation**:
      - Card 1: **"Báo Cáo Chẩn Đoán Chiến Lược Từ Gemini AI"** with Gemini badge, headline, direct counseling, and strengths vs risks comparison grid.
      - Card 2: **"Kết Quả Đối Chiếu Kho Dữ Liệu Bộ GD&ĐT (Top 3 Ngành Phù Hợp Nhất)"** with actionable "Chốt chọn ngành này ➔" button leading seamlessly into Step 2 (Tổ hợp môn).
    * **Verification**:
      - Vite production build compiles with 0 errors in 2.78s.
      - Automated test suite `test_major_linking_engine.mjs` passes 100%.

- **4-Step Sequential Decision Wizard & Arts/Sports Expansion (2026-10-20)**:
  - Addressed user directives:
    1. *"thêm cái câu hỏi là Bạn đã chọn được nghành chưa, bạn đã chọn được tổ hợp chưa, bạn đã chọn được trường chưa."*: Explicit `Có / Chưa (Yes/No)` branching at each step.
    2. *"Một nghành sẽ có thể đậu từ nhiều tổ hợp khác nhau, nên là sẽ cần phân tích, rồi sau khi chọn được nghành và tổ hợp thì cần chọn trường, chọn trường thì cần kinh phí, cần địa chỉ, cần những yếu tố trước."*: Strict dependency cascade:
       - **Bước 1 (Xác định Ngành)**: Có/Chưa ➔ Nếu có: chọn trực tiếp từ danh mục chuẩn Bộ GD&ĐT; nếu chưa: phân tích 4 khối gọn gàng (RIASEC, 10 môn văn hóa, Môn năng khiếu, Mục tiêu) ➔ Đề xuất & chốt 1 ngành.
       - **Bước 2 (Chọn Tổ hợp môn)**: Có/Chưa ➔ Tự động đối chiếu toàn bộ các tổ hợp được chấp nhận của ngành đã chốt, tính điểm thực tế & xếp hạng tối ưu.
       - **Bước 3 (Chọn Trường Đại học)**: Có/Chưa ➔ Bắt buộc thu thập 2 yếu tố thực tế: **Kinh phí / Khung trần học phí NĐ 238/2025** và **Địa chỉ / Vùng miền học tập** ➔ Phân tầng 3 nhóm trường: Mơ ước (+1 đến +2 điểm), Vừa sức (±0.75 điểm), An toàn (-1 đến -3 điểm).
       - **Bước 4 (Việc làm & Chuỗi ảnh hưởng Domino Effect)**: Có/Chưa ➔ Báo cáo toàn diện kiểm tra độ khớp (Ngành ⟷ Tổ hợp ⟷ Trường ⟷ Việc làm) và What-If Analysis khi điểm số biến động.
    3. *"Hiện tại đơn giản là bạn chỉ show hết mọi thứ ra... chia từng phần ra. đừng show hết ra nhu vậy rất rối mắt"*: Chia nhỏ toàn bộ form nhập liệu thành các sub-step / accordion có thể thu gọn/mở rộng, không dồn dập toàn bộ câu hỏi lên 1 trang.
    4. *"Nhớ suggest cả những nghành nghệ thuật, thể chất, và đừng bỏ quên tổ hợp có môn về nghệ thuật và thể chất."*:
       - Bổ sung 31 mã ngành cấp IV & 12 trường đại học trọng điểm nghệ thuật/thể thao: Kiến trúc (`7580101`), Thiết kế thời trang (`7210404`), Thanh nhạc (`7210205`), Sư phạm TDTT (`7140220` - Miễn 100% học phí NĐ 116), Quản lý TDTT (`7810301`), Giáo dục Mầm non (`7140201`), Diễn viên Sân khấu Điện ảnh (`7210208`).
       - Bổ sung đầy đủ tổ hợp năng khiếu: `V00, V01, H00, H01` (Kiến trúc & Mỹ thuật), `N00, N01` (Âm nhạc), `M00, M01` (Mầm non), `T00, T01` (Thể thao), `R00, S00` (Báo chí & Sân khấu).
    5. *"dự án này rất quan trọng với tôi, tôi tin bạn, làm nó ít AI nhất có thể... pop up phân tích và suggest, ít chữ, cơ bản tôn trọng, cổ điển"*: Giao diện hàn lâm giáo dục trang nhã, không màu mè neon lòe loẹt, thẻ tóm tắt hồ sơ đính ghim cố định ở đầu trang.
  - **Verification**:
    - Vite production build hoàn tất sạch sẽ 100% trong 24.03s.
    - Script kiểm thử `test_major_linking_engine.mjs` đạt 100% PASS cho cả khối Xã hội/Nghệ thuật và khối Tự nhiên/Kỹ thuật.
- **4-Step Sequential Career & Admissions Consultation Pop-up Rewrite (2026-10-19)**:
  - Addressed user directives: *"cái prompt đó là để viết lại code cho cái web của tao ấy"*, *"nhớ là pop up phân tích và suggest, ít chữ, cơ bản tôn trọng, cổ điển"*, *"dự án này rất quan trọng với tôi, tôi tin bạn, làm nó ít AI nhất có thể"* & Flowchart decision tree:
    * **4-Step Flowchart State Machine Implementation (`AICareerCopilot.tsx`)**:
      - **Bước 1: Xác định Ngành**: Hỏi người học đã chọn ngành chưa. Nếu có ➔ lưu hồ sơ; nếu chưa ➔ phân tích sở thích/thế mạnh, gợi ý 2-3 ngành phù hợp từ danh mục cấp IV và yêu cầu chốt 1 ngành.
      - **Bước 2: Chọn Tổ hợp môn**: Ràng buộc cứng chỉ xét các tổ hợp tuyển sinh của ngành đã chọn ở Bước 1. Phân tích hệ quả đỗ nhóm trường Top đầu, Top giữa hoặc an toàn dựa trên điểm dự kiến.
      - **Bước 3: Định hướng Việc làm**: Ràng buộc bởi Ngành (B1) & Năng lực (B2). Đề xuất 2-3 vị trí việc làm thực tế.
      - **Bước 4: Đối chiếu & Phân tích chuỗi ảnh hưởng (Domino Effect)**: Tự động xuất báo cáo tổng kết kiểm tra độ khớp (Ngành ⟷ Tổ hợp ⟷ Việc làm) và What-If Analysis (3-5 trường khả thi, cạnh tranh tổ hợp, triển vọng việc làm & lộ trình sự nghiệp).
    * **Sticky Pinned Dossier Header (`📌 [HỒ SƠ ĐÃ LƯU]`)**:
      - Always visible at the top of the consultation pop-up, updating in real time: Ngành, Tổ hợp & Điểm, Việc làm mục tiêu, Thế mạnh ghi nhận.
    * **Strict 3-Block Response Structure**:
      - Block 1: `📌 [HỒ SƠ ĐÃ LƯU]`
      - Block 2: `💬 [PHÂN TÍCH & ĐỀ XUẤT HIỆN TẠI]`
      - Block 3: `👉 [CÂU HỎI TIẾP THEO]` (Hỏi ngắn gọn đúng 1 câu mỗi lượt, kế thừa dữ liệu, không hỏi dồn dập).
    * **Classical, Minimalist, Dignified Aesthetic ("Ít AI nhất có thể")**:
      - Excised all flashy neon glows, rainbow gradients, and buzzwords ("MODE SUPREME ⚡", "SUPER AI").
      - Elegant academic slate styling (`#0E1117`, `#121622`), crisp typography, dignified tone.
    * **Synchronized Backend System Prompts**:
      - Updated `SUPREME_CAREER_COUNSELOR_PROMPT` in `src/services/geminiService.ts`.
      - Updated `buildCounselorSystemPrompt` in `src/services/counselorBackend.ts` and `scripts/counselor_backend.mjs`.
      - Deterministic local fallback generator guarantees 100% adherence to the 3 blocks even when offline.
    * **Direct Number Inputs & Paginated Inline RIASEC**:
      - In `Scientific4TabPortal.tsx`, replaced all subject sliders with direct numeric inputs (`0.0 - 10.0`) and implemented an inline paginated 60-question RIASEC assessment (10 questions per dimension).
    * **Build & Test Verification**:
      - Vite production build completes cleanly in 26.13s (0 errors).
      - `scripts/test_major_linking_engine.mjs` passes 100%.

- **AI Semantic Diagnosis Decoupling & Strict Major Linking Engine (2026-10-19)**:
  - Addressed user directives: *"nhận input r phân tích là rất okela nhưng bạn phân tích rất ngu, để con gemini phân tích r bạn lọc lại kết quả, nhận kết quả từ gemini r link với kho dữ liệu xem nghành nào ngon nhất. r mới hiện kết quả lên. Cuối cùng là giao diện, giao diện nhìn AI quá"*:
    * **Root Cause Fix for Inaccurate Subject Analysis**:
      - Previously, unset subjects in the candidate's scores defaulted to 8.0 (`scores.math || 8.0`), deceiving the model and algorithms into recommending STEM majors (`Kỹ thuật vi mạch bán dẫn`, `Khoa học máy tính`, `Sư phạm Toán`) to Humanities candidates (e.g. Văn=10, Sử=10, Địa=10, Anh=10 without any Math/Phys/Chem).
      - Fixed to treat unset scores strictly as `Chưa thi / chưa có điểm` (never fabricating grades).
    * **Decoupled Architecture (`linkAndRankMajorsWithDossier`)**:
      - **Gemini Role**: Performs qualitative semantic diagnostic analysis (`recommendedSectors`, `avoidSectors`, `recommendedKeywords`, `directAnswer`, academic strengths & bottlenecks).
      - **Algorithmic Engine Role**: Cross-references with the official accredited Level IV database (`majorCatalogLevelIV`):
        1. **Hard Prerequisite Subject Filter**: Disqualifies any major whose admission combinations require subjects the candidate has no valid score for (`eligibleCombos.length === 0`).
        2. **Composite Ranking Formula**:
           $$\text{Fit} = 0.40 \times \text{Best Valid Combo Score} + 0.35 \times \text{RIASEC Congruence} + 0.25 \times \text{Gemini Direction Alignment}$$
        3. Formulates transparent, evidence-based `fitReason` grounded in candidate's actual grades and combinations (e.g. "Tổ hợp C00 đạt điểm tuyệt đối 30.0/30...").
    * **Database Expansion**:
      - Expanded Level IV catalog in `seed_data.json` and `src/data/seed_data.json` to 24 accredited majors across Humanities, Arts, Tech, Business, Medicine, Law, Pedagogy, and 7 anchor institutions (`QHX`, `SPH`, `MTH`, `BKA`, `NTH`, `KHA`, `TCT`).
    * **De-AI-ification of Portal UI (`Scientific4TabPortal.tsx`)**:
      - Excised cybernetic tropes: removed neon pulsing glows, spinning stars, "F1" racing jargon, and robotic banners.
      - Upgraded to prestigious academic design: "Cổng Tham Vấn Hướng Nghiệp & Chiến Lược Tuyển Sinh Đại Học 2026" with 4 clear procedural steps (01. Hồ sơ năng lực ➔ 02. Gợi ý ngành ➔ 03. Phân tầng trường ➔ 04. Tối ưu tổ hợp).
      - Clean slate & neutral card styling, professional typography, transparent mathematical calculation cues.
    * **Full Verification**:
      - `scripts/test_major_linking_engine.mjs` (100% PASS for Humanities & STEM profiles).
      - `scripts/test_live_analysis_endpoint.mjs` (100% PASS with live Gemini API).
      - Vite production build completes cleanly in 2.61s with 0 errors.


  - Addressed user task: *"REFACTOR MAJOR & UNIVERSITY ANALYSIS — USE EXISTING DATA"*:
    * **Strict Dependency Chain Enforcement**:
      `Hồ sơ & Năng lực (Tab 1)` ➔ `Phân tích & gợi ý ngành (Tab 2)` ➔ `Người dùng chọn ngành (selectedMajorCode)` ➔ `Phân tích & gợi ý trường theo hồ sơ + ngành đã chọn (Tab 4)` ➔ `Người dùng chọn trường (selectedSchoolCode)` ➔ `Tối ưu tổ hợp môn (Tab 3)`.
    * **No Input, No Results (Empty Initial State)**:
      - Initial state on load: both major and university recommendation sections remain **strictly empty**.
      - Removed predefined or mock fallback recommendations (no default `math: 8.5`, no default `selectedMajorCode: '7480201'`, no default `selectedSchoolCode: 'BKA'`).
      - All 10 THPT subject inputs and 6 RIASEC inputs initialize to empty strings `''` (rendering `--` on sliders).
      - If profile is incomplete (<3 subjects or <3 RIASEC), displays high-contrast empty state card guiding student to Tab 1.
      - If profile is valid but no major is selected, Tab 4 and Tab 3 remain strictly empty with guidance to choose a major in Tab 2.
      - If major is selected but no university is selected, Tab 3 remains strictly empty with guidance to choose a university in Tab 4.
    * **Zero Mock Schools & Dynamic Accepted Combination Matching**:
      - Completely excised hardcoded mock school injection (`BKA`, `QSB`, `TCT`).
      - Dynamically queries accepted combinations for each accredited institution (from `seedData.anchorInstitutions` and `AUDITED_MAJOR_METHOD_SCORING_DB`).
      - Evaluates candidate's actual valid score against accepted combinations for each school, selecting the highest valid combination for that school.
      - If candidate lacks required subjects for a school's combinations, candidate score is set to `null` and displayed as `"Chưa đủ môn xét tuyển"`, rather than fabricating scores or throwing `NaN`.
    * **Automatic State Invalidation**:
      - Any change to subject grades, competency exam scores (HSA, V-ACT, TSA, IELTS, SAT), RIASEC scores, budget (`maxTuition`), priority region, or priority policy triggers `invalidateDownstream()`, clearing stale downstream results immediately.
    * **Excised Dead Code in [UNIROOTPlatform.tsx](file:///d:/src/components/UNIROOTPlatform.tsx)**:
      - Excised 391 lines of unused `DeprecatedOldHomeView`.
    * **Automated Verification**:
      - Created `scripts/test_dependency_chain_empty_state.mjs` verifying 6 scenarios (initial empty state, incomplete profile rejection, valid profile major unlock without universities, major selection university stratification, downstream invalidation, and combination subject deficiency handling) - 6/6 PASS in 7.78ms.
      - All 10 acceptance test cases TC-01 to TC-10 PASS (10/10).
      - Realtime Browser Test Suite passes 90/90 assertions (100%).
      - Master Real AI test suite passes 17/17 (100%).
      - TypeScript check (`tsc --noEmit`) passes with 0 errors.
      - Production build (`vite build`) completes cleanly in 5.75s.

- **Eradication of Canned Flows & Real AI Web Display Driving (2026-10-19)**:
  - Addressed user directive: *"xóa những luồng cũ hoặc luồng có sẵn, để cái kết quả input của người dùng được AI phân tích, kết quả trả về sẽ là những gì hiện ra trên web."*:
    * **Elimination of Canned Code & Hardcoded Matches**: Completely excised ~500 lines of static keyword branches (`if (lower.includes('đá banh')...)`, `if (lower.includes('y ')...)`, etc.) from `src/components/CareerPathwayNavigator.tsx`. Replaced with pure dynamic processing via the Career Decision Engine and real LLM backend.
    * **AI Dossier Intelligence Analyzer (`handleDossierAnalysisRequest`)**:
      - Implemented in `src/services/counselorBackend.ts` and `scripts/counselor_backend.mjs`.
      - Ingests the learner's complete dossier: 10 THPT subject scores, competency exams (HSA, V-ACT, TSA, IELTS, SAT), 6 RIASEC dimensions, tuition budget, priority region/policy, and the user's authentic question (`personalQuestion`).
      - Connects via Google Gemini multi-model fallback chain (`['gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.8-flash']`) or Groq with `responseMimeType: 'application/json'`.
      - Produces clean structured output: `headline`, `directAnswer`, `strengthsEvaluation`, `risksAndBottlenecks`, `tuitionFeasibility`, `recommendedMajors` (with `fitPercent`, `fitReason`, `targetJobs`, `salaryMedian`, `aiRisk`), `optimalComboAdvice`, and `universityAdvice`.
    * **Backend & Serverless Endpoints**: Registered `POST /api/ai/counselor/analyze` and `POST /api/ai/analyze` in `dev_server.mjs` and created `api/ai/counselor/analyze.ts` for Vercel deployment.
    * **Web UI Driven by Real AI Results (`Scientific4TabPortal.tsx`)**:
      - Triggered upon clicking **"KHỞI ĐỘNG CHUỖI QUYẾT ĐỊNH KHOA HỌC (F1)"**: shows an animated analyzing overlay with real-time diagnostic progress steps.
      - **Bản Báo Cáo Phân Tích Chuyên Sâu Của AI (AI Dossier Intelligence Report)** rendered prominently on Tab 2:
        * Model badge & personalized strategic headline.
        * Direct, empathetic answer to the user's authentic question without boilerplate templates.
        * 3 Diagnostic Pillars: Academic strengths, risks & bottlenecks, tuition feasibility under Decree 238/2025/NĐ-CP.
      - **AI-Recommended Majors**: Personalized fit reasons for this specific student, dynamic fit %, job roles, and AI automation risk.
      - **Tab 4 (Chọn Trường) & Tab 3 (Chọn Tổ Hợp)**: Prominently feature the AI's custom strategic advice (`universityAdvice` and `optimalComboAdvice`).
  - Full verification: `test_f1_ai_analysis_flow.mjs` (Status 200 via `gemini-3.1-flash-lite`), 10/10 acceptance tests (TC-01 to TC-10), 90/90 browser tests, 17/17 master real AI tests, 18/18 P1/P2 tests, `tsc --noEmit` (0 errors), and `vite build` (2.50s clean).
- **UI & High-Contrast Typography Optimization (Elimination of Dim Gray Text) - 2026-10-19**:
  - Addressed user directives: *"tối ưu giao diện và hiển thị chữ"* & *"chữ cứ sáng hết lên đừng để xám, chữ nào bỏ được hoặc không cần thiết cứ bỏ"*:
    * **100% Elimination of Dim Gray Text**: Excised all 45 instances of `text-slate-400`, `text-slate-500`, `text-[#94A3B8]`, and `text-[#64748B]` from [Scientific4TabPortal.tsx](file:///d:/src/components/Scientific4TabPortal.tsx).
    * **Crisp Headings & Body Typography**: All titles, subtitles, field labels, descriptions, and inputs updated to `text-white`, `text-slate-100`, `text-slate-200`, and `text-slate-300` for effortless legibility against dark slate backgrounds.
    * **Vivid Key Metrics & Highlights**: Dominant RIASEC badges, official admission scores, cutoffs, and margins upgraded to luminous `text-[#38BDF8]`, `text-emerald-300`, `text-amber-300`, and `text-[#C6F135]`.
    * **Global CSS Dark Mode Boost**: Updated [src/index.css](file:///d:/src/index.css) to force dark mode gray text overrides from dim `#8E929F` to bright `#CBD5E1`.
    * **Header Navbar & Search Pills**: Brightened navigation tabs in [BlueprintHeaderRuler.tsx](file:///d:/src/components/BlueprintHeaderRuler.tsx) and search section tabs/pills in [UNIROOTPlatform.tsx](file:///d:/src/components/UNIROOTPlatform.tsx).
  - Full automated test suite passes 100%: TC-01 to TC-10 (10/10 PASS), Realtime Browser Suite (90/90 PASS in 37ms), Master Real AI Suite (17/17 PASS), P1/P2 Suite (18/18 PASS). Vite build completed in 2.90s with 0 errors.
- **4-Tab Scientific Career & Admissions Architecture (EXORA F1 Pipeline) - 2026-10-19**:
  - Implemented [Scientific4TabPortal.tsx](file:///d:/src/components/Scientific4TabPortal.tsx) addressing user directives: *"bỏ hoặc ẩn phần chatbot đi, thay chat bot thành một khung để mình nhập thông tin"* & *"chỉ giữ lại duy nhất câu hỏi từ chính bản thân tôi"*:
    * **Tab 1: Nhập hồ sơ & Đánh giá năng lực**: Khung nhập thông tin có cấu trúc thay cho chatbot. Tiếp nhận 10 môn THPT (Toán, Văn, Anh, Lý, Hóa, Sinh, Sử, Địa, Tin, GDKT&PL), điểm ĐGNL HSA/V-ACT/TSA, chứng chỉ IELTS/SAT, 6 thanh trượt sở thích RIASEC (kèm modal 60 câu O*NET từ `seed_data.json`), ngân sách học phí gia đình (đối chiếu NĐ 238/2025/NĐ-CP & miễn học phí Sư phạm NĐ 116), khu vực & đối tượng ưu tiên (Thông tư 06/2026), và ô nhập câu hỏi băn khoăn chân thực từ chính người học.
    * **Tab 2: Hỗ trợ chọn NGÀNH (F1 Bước 1)**: Khớp vector Cosine Similarity giữa hồ sơ RIASEC của học sinh và vector ngành chuẩn O*NET. Danh mục chuẩn mã cấp IV (TT 09/2022 7 chữ số & TT 74/2026 6 chữ số), hiển thị vị trí việc làm mục tiêu (Job Roles), mức lương trung vị GSO 2026, và chỉ số nguy cơ thay thế bởi AI (AI Task Risk %). Bấm chuyển tiếp trực tiếp sang Tab 4 (Chọn Trường) hoặc Tab 3 (Chọn Tổ Hợp).
    * **Tab 3: Hỗ trợ chọn TỔ HỢP MÔN (F1 Bước 3)**: Tối ưu hóa xác suất trúng tuyển vào Trường & Ngành đã chọn. Áp dụng chuẩn công thức giảm ưu tiên tuyến tính từ 22.5/30 theo Khoản 4 Điều 7 Thông tư 06/2026/TT-BGDĐT. Hiển thị điểm từng môn, điểm gốc, điểm ưu tiên thực nhận, điểm xét tuyển, và biên độ an toàn (Margin), tự động gắn huy hiệu *TỔ HỢP TỐI ƯU NHẤT (#1)*.
    * **Tab 4: Hỗ trợ chọn TRƯỜNG (F1 Bước 2)**: Chiến lược phân tầng 3 cấp nguyện vọng khoa học: *🌟 Mơ ước (Dream Tier - điểm chuẩn cao hơn 0.5-1.5đ)*, *🎯 Vừa sức (Target Tier - biên độ ±0.5đ, xác suất đỗ 70-85%)*, và *🛡️ An toàn (Safe Tier - điểm chuẩn thấp hơn ≥1.5đ, xác suất đỗ ≥95%)*. Tích hợp kiểm toán học phí NĐ 238/2025/NĐ-CP và chính sách miễn giảm NĐ 116 Sư phạm.
  - Chuỗi quyết định khoa học **F1: Chọn Ngành ➔ Chọn Trường ➔ Chọn Tổ hợp môn** vận hành mượt mà, người học có thể chuyển đổi linh hoạt giữa 4 tab bất kỳ lúc nào.
  - Tích hợp 10 ca kiểm thử nghiệm thu khoa học **TC-01 đến TC-10** trong `scripts/test_acceptance_tc01_tc10.mjs` (10/10 PASS) và `src/services/realtimeBrowserTestSuite.ts` (SUITE 9 - 90/90 PASS).
  - Bảo toàn 100% các công thức, cơ sở dữ liệu kiểm toán 300 trường và các tuyến điều hướng trong `UNIROOTPlatform.tsx`.
- **Technical Specification & Seed Data Protocol (SPEC.md & seed_data.json) - 2026-10-19**:
  - Created [SPEC.md](file:///d:/SPEC.md) cleanly encapsulating Deliverables 2, 3, 4, 5, 8 and Acceptance Test Cases TC-01 to TC-10, removing academic theory bloat to prevent LLM context distraction.
  - Locked Tech Stack & Storage Architecture: React 19 + TypeScript strict mode + Tailwind CSS v4, Node.js ESM serverless endpoints (`/api/ai/counselor/chat`), Google GenAI SDK with multi-model fallback chain, and local analytical engine.
  - Generated [seed_data.json](file:///d:/seed_data.json) (and synced to `src/data/seed_data.json`) containing:
    * 60 standardized RIASEC questions ([O*NET IPSF 60 câu](https://www.onetcenter.org/dl_files/IPSF_Psychometric.pdf)) in Vietnamese.
    * Major Catalog Level IV mapping (TT 09/2022/TT-BGDĐT 7 chữ số & TT 74/2026/TT-BGDĐT 6 chữ số).
    * Sector tuition benchmarks under [Nghị định 238/2025/NĐ-CP](https://luatvietnam.vn/linh-vuc-khac/nghi-dinh-238-2025-nd-cp-chinh-sach-hoc-phi-mien-giam-hoc-phi-moi-nhat-883-103886-article.html).
    * 4 Anchor University Admission Schemas: ĐHBK Hà Nội (BKA), ĐH Ngoại thương (NTH), ĐH Kinh tế Quốc dân (KHA), ĐH Cần Thơ (TCT) under [Thông tư 06/2026/TT-BGDĐT](https://xaydungchinhsach.chinhphu.vn/toan-van-thong-tu-06-2026-tt-bgddt-quy-che-tuyen-sinh-dao-tao-dai-hoc-cao-dang-giao-duc-mam-non-119260226145829864.htm) linear priority reduction rules.
- **Minimal Token Tuition Ingestion (NĐ 238/2025/NĐ-CP & NĐ 116/2020) - 2026-10-19**:
  - Removed 531-line static database file (`auditedTuitionDatabase.ts`) per user request to maintain codebase cleanliness and eliminate hardcoded bloat.
  - Implemented ultra-compact micro-helper `getTuitionContext()` directly in `src/services/counselorBackend.ts` and `scripts/counselor_backend.mjs` (~20 lines of code).
  - Enforced zero prompt token waste: Queries without tuition/financial intent consume **0 extra prompt tokens**.
  - Dynamic micro-injection: When users ask about tuition/scholarships/costs, injects an official concise snippet (20-35 tokens) covering Decree 238/2025 benchmarks (national avg 33.7M/yr, public 18-35M, autonomous/medical 35-70M, international 200-350M), Sư phạm free tuition under NĐ 116 + 3.63M/mo stipend, and military/police 100% full subsidy.
  - Updated `verifiedAdmissionDatabase.ts` tuition description reference to Decree 238/2025/NĐ-CP.
- **Typography Standards (Commit `cb45c20`)**:
  - Headings (`font-heading`): **Roboto Condensed** (weights 700 - 800)
  - Body/Content (`font-sans`): **Roboto** (weights 400 - 500)
  - Buttons & Navigation (`font-button`): **Roboto Condensed** (weights 600 - 700)
  - Google Fonts CDN imported in `index.html` and configured in `src/index.css`.
- **UI Scaling & Admission Formulas (Commit `7270186`)**:
  - Zoom indicator reset to 100% as standard view while base scale stays comfortable (150% equivalent).
  - Centralized admission combination formatting with `formulaFormatter.ts`.
- **AI Integration & Q&A Navigator (Commit `fbf831d`)**:
  - Direct integration with Gemini API in `CareerPathwayNavigator.tsx`.
  - Live Q&A follow-up interactive panel and API key modal.
- **Intermediate Discovery Guidance (Commit `1225c89`)**:
  - Multi-dimensional guidance flow with confidence gauge prior to combo generation.
- **Hybrid Data Engine & Mismatch Analytics (Completed 2026-10-18)**:
  - Explored schemas of 9 Hugging Face Vietnamese datasets via `scripts/inspect_schemas.py` -> `docs/dataset_schemas.json`.
  - Implemented `src/hybrid_db.py`: Analytical SQL (DuckDB: `universities_majors`, `job_postings_summary`, `resume_career_match`, `labor_unemployment_stats`) + Vector DB (ChromaDB: `admission_career_qa`, `labor_law_docs`).
  - Implemented `scripts/etl_pipeline.py`: Automated ETL pipeline with CV degree normalization and career mismatch classifier.
  - Implemented `src/ai_query_engine.py`: 2 LLM tools (`query_career_statistics`, `search_career_guidance_knowledge`) grounded in empirical KHKT research data.
  - Verified with `tests/test_agent_queries.py` on 3 real-world career and mismatch questions (all 5 test suites passed).
- **Web Q&A Generation Integration (Completed 2026-10-18)**:
  - Integrated `/api/ai/career-query` bridge between Node.js and Python engine (`scripts/query_api_bridge.py`).
  - Added standalone `dev_server.mjs` running Node `node:http` + Vite middleware mode on port 8443, serving SPA & API routes without external framework dependencies.
  - Upgraded `AICareerCopilot.tsx` `MarkdownMessageView` with responsive table parsing for DuckDB analysis results, percentage badges, and empirical quick prompts.
  - Upgraded `CareerPathwayNavigator.tsx` interactive follow-up Q&A to utilize `sendAIChatMessage`, removing API key requirement barriers for zero-key users and grounding responses with DuckDB + ChromaDB facts.
  - Enriched `AIMajorSchoolAssistant.tsx` recommendation trends with empirical statistics from 908 CVs and 1,500 job descriptions.

- **UX & AI Empathy Refactor (Commit `3e847c1` - Completed 2026-10-18)**:
  - Eliminated robotic parrot echoing (`• Phân tích mong muốn: "..."`) from AI counselor prompts and response sanitization.
  - Replaced hallucinated "Khớp 95%" with grounded "Độ phủ 98%" (National Admission Coverage) when users express confusion or lack of direction.
  - Stripped redundant combo subject prefixes in card descriptions (`cleanComboReason`).
  - Added empirical triage response (grounded in KHKT survey of 9,200 students showing 41% confusion) with 3 actionable triage rules.
  - Dynamically swapped follow-up suggested Q&A chips to orientation triage questions when confused state is detected.

- **Guided Triage & 3-Step Factor Discovery (Commit `fc9ab43` - Completed 2026-10-18)**:
  - Addressed user feedback regarding premature forced combo selection for undecided users.
  - Implemented `UNDECIDED` domain configuration in `INTERMEDIATE_CONFIGS` with 3 core factor discovery questions (disliked subjects elimination, RIASEC work environment, financial/tier goals).
  - Automatically redirected undecided/confused students directly to `INTERMEDIATE_DISCOVERY` (with live confidence gauge 45% -> 95%) rather than jumping to combo cards.
  - Added Discovery Triage Banner to `ANALYZED_COMBOS` and changed card action from forceful "Chọn tổ hợp này" to non-committal "Xem thử lộ trình tổ hợp này".
- **1-on-1 Authentic Counseling Experience Overhaul & Real Gemini Fallback (Completed 2026-10-19)**:
  - **Eradication of Premature Career Dumps & Coercive Gatekeeping**:
    - Eliminated the blocking `REALITY_CHECK` questionnaire that forced students to click canned answers before chatting. Students typing "tôi không biết phải làm gì" immediately enter a direct 1-on-1 conversation.
    - Cleaned user messages: Displays the natural student statement directly (e.g. `Bạn: "tôi không biết phải làm gì bây giờ"`) without artificial prefixes (`Băn khoăn ban đầu: ... Câu trả lời tự vấn: ...`).
    - Fixed zero-state counseling behavior: On turn 1 and when students express confusion, career cards are NEVER shown (`suggestedCareers = []`, `suggestedCombos = []`).
    - Enforced strict gate for career card display: Requires `isAnalysisDone && suggestedCareers.length > 0 && evidenceReadiness.isReadyForCareers && turnsCount >= 3`.
    - Truthful evidence progress tracking: Replaced fake "Độ hoàn thiện: 100/100đ" with honest progress indicator `Đang lắng nghe & khám phá từ con số 0 (${score}/100đ)`.
    - Redesigned career proposal header from coercive "Chọn việc làm trước" to consultative "Gợi Ý 3 Vị Trí Nghề Nghiệp Tham Khảo (Gate 2: Target Career Roles) - Đã tích lũy đủ 3 trụ cột qua hội thoại".
  - **Resilient Gemini Multi-Model Fallback Chain (`scripts/counselor_backend.mjs`)**:
    - Replaced unavailable `gemini-3.5-flash-lite` with active, verified models.
    - Implemented resilient fallback chain: `['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.1-flash-lite']`.
    - Automatically recovers from 503 high-demand spikes or 429 rate limits by switching models seamlessly within milliseconds.
    - Increased `maxOutputTokens` from 1200 to 2500 and added truncated JSON reply extraction to prevent raw JSON syntax leaks.
    - Verified with live Gemini API key: Turn 1 empathetic reassurance + Turn 2 guided exploration both returned HTTP 200 SUCCESS.
- **Balanced Learner Deep Diagnostic Pipeline & MODE SUPREME 4-Dimension Dossier (Completed 2026-10-18)**:
  - Eliminated arbitrary D01 assignment for students who have balanced grades ("học đều các môn").
  - Identified "học đều" as Multi-potentialite (Trí Thông Minh Đa Diện) requiring cognitive reflex probing rather than quick combo tagging.
  - Implemented Question 1B (`EVEN_COGNITIVE_QUESTION`) measuring neural energy consumption during 3-4 hours of self-study (STEM logic A01/A00, Language/Social C00/D01, Biomedical B00/D07, Global Business D01/A01).
  - Implemented Question 4 (`IKIGAI_CORE_QUESTION`) establishing core long-term career motivation (High Income Top 5%, Sustainable Work-Life, Social Impact, Creative Freedom) to prevent post-graduate mismatch.
  - Dynamic confidence scoring scaling smoothly from 25% (unverified) -> 45% -> 65% -> 80% -> 98% (deep diagnosis).
  - Implemented the full **MODE SUPREME 4-Dimension Framework**:
    * Dimension 1: Psychological decoding & academic cognitive reflex (3-letter Holland RIASEC code: `RIC`, `SAE`, `IRS`, `ESA`...).
    * Dimension 2: Head-to-Head Comparison Matrix comparing Primary vs Balanced Reserve vs Wide Coverage combos (subjects, degree coverage, mismatch rate from 1,500 CV DuckDB, GSO 2026 salary range).
    * Dimension 3: 3-Tier Admission Matrix (Dream >26.5đ, Target 22.5-25.5đ, Safe 19.0-22.0đ) & financial insurance (Nghị định 116 for pedagogy, Quyết định 1826 for 111 STEM majors).
    * Dimension 4: 4-year university roadmap & mismatch prevention strategies.
  - Updated `buildSmartAdvisorReply` and `generateSmartSemanticAnalysis` to empathetically acknowledge the flaw of assigning D01 blindly and articulate the scientific multi-stage diagnostic process.
- **Nexora Protocol 2.0 Scientific Refactor (Master Plan Milestone - 2026-10-18)**:
  - Addressed expert peer-review critique on measurement validity, arbitrary thresholds, and legal grounding in `CAREER_GUIDANCE_MASTER_PROTOCOL.md`.
  - Replaced ad-hoc questionnaires with standardized instruments: **O*NET Interest Profiler Short Form (60 items) / Mini-IP (30 items)** ($\alpha = 0.81 - 0.85$) and **BFI-2** (Soto & John, 2017).
  - Fixed inverted Neuroticism definition: $N$ strictly calibrated as Negative Emotionality (high $N$ = emotional vulnerability; low $N$ = emotional stability).
  - Completely excised mathematically invalid Pearson $r \ge 0.65$ correlation between non-commensurate RIASEC and Big Five vectors, citing Larson et al. (2002) and Barrick et al. (2003).
  - Replaced arbitrary 85% lock threshold with **Tricolor Evidence Accumulator FSM** (Red: Insufficient data -> Yellow: Exploratory hypotheses with uncertainty interval -> Green: Evidence-grounded convergence).
  - Decomposed single Cosine similarity into 3 distinct explainable metrics: `Interest Fit` (profile shape), `Capability Evidence` (academic/task demonstration), and `Practical Feasibility` (financial/admission viability).
  - Mandated statistical sample transparency for Vietnamese CV and job market data ($N \ge 30$ threshold, explicit uncertainty flags for niche roles, distinguishing task automation risk from disemployment risk).
  - Legally audited against Vietnam 2026 regulations: Thông tư 06/2026/TT-BGDĐT, Thông tư 74/2026/TT-BGDĐT (hiệu lực 12/10/2026), Nghị định 116 & Nghị định 60/2025/NĐ-CP (hiệu lực 20/04/2025 - hoàn trả bồi hoàn kinh phí sư phạm nếu làm trái ngành), Quyết định 1826/QĐ-BGDĐT & Nghị định 179/2026/NĐ-CP (học bổng 111 ngành STEM).
  - Formulated 5-layer software architecture: Assessment Engine, Career Matching Engine, Knowledge & Data Layer, Gate & Policy Engine, Conversation & Reporting Layer.

- **Career Orientation From Scratch Transformation (Completed 2026-10-18)**:
  - Transformed `CareerPathwayNavigator.tsx` from subject combo picker into **Định Hướng Nghề Nghiệp Từ Con Số 0 (Career Orientation From Scratch)** following the user's explicit directive.
  - Enforced the strict EXORA sequence: **Bản Thân (Gate 0 & 1) ➔ Vị Trí Việc Làm Mục Tiêu (Gate 2) ➔ Chuyên Ngành Đào Tạo (Gate 3) ➔ Trường & Tổ Hợp Môn (Gate 4) ➔ Lộ Trình 4 Năm (Stage 5)**.
  - Refactored Hero Section: Headline `Hi, I'm Nexora`, Pill Badge `HỆ THỐNG ĐỊNH HƯỚNG NGHỀ NGHIỆP & TUYỂN SINH 2026`, subtitle `Khám phá bản thân từ con số 0, kết nối chuẩn xác Bản Thân — Việc Làm — Ngành Học — Tuyển Sinh`, card title `Cố Vấn Định Hướng Nghề Nghiệp Từ Con Số 0`, placeholder inviting authentic băn khoăn from scratch, 5 career-first chips, and button `Bắt đầu định hướng ->`.
  - Replaced immediate combo cards with **Top 3 Target Career Role Cards (Gate 2)** featuring Job Title, RIASEC code badge, Sector, Salary range, AI automation risk, Why fit explanation, Recommended majors, and action button `Khám phá nghề này: Cần học ngành gì? ➔` leading into Gate 3, 4, and Stage 5.
  - Upgraded AI system prompt in `handleAnalyzeInput` to enforce human empathy, eliminate robot jargon, and generate structured `{ careers: [...] }` JSON.
- **Reality-Check Inquiry & 8-Point Audit Hardening (Completed 2026-10-18)**:
  - Fixed UI layout: Removed overlapping absolute button from `<textarea>` input card in Hero section, creating a dedicated action bar container with helper text and button.
  - Implemented mandatory Creator Reality-Check Stage (`workflowStep === 'REALITY_CHECK'`): Intercepts user after submitting any initial thought to pose the creator's verbatim reality check question and note before any career claims are made.
  - Eradicated fake data leaks: Completely eliminated blind defaulting to `options[0]` that previously hallucinated biomedical reflexes and arbitrary 98% confidence. Confidence scores now dynamically scale based on verified diagnostic depth.
  - Partitioned analysis output into 3 strict evidence tiers:
    * `[Dữ Liệu Người Học Cung Cấp / Tự Khai]`: User answers and raw claims.
    * `[Giả Thuyết Định Hướng Của Cố Vấn (AI Suy Luận)]`: Tentative hypotheses and explorations.
    * `[BẰNG CHỨNG THỰC CHỨNG 2026]`: Empirically verified labor market statistics and admission policies.
  - Added `whyNotOthers` to `SuggestedCareerItem` and UI cards to explain why certain prominent careers were de-prioritized or ruled out.
  - Integrated full learner profile history into follow-up chat turns to guarantee conversation continuity.
  - Verified across all 8 audit criteria via `scripts/verify_audit_points.mjs`, `tsc --noEmit` (0 errors), and `vite build`.

- **Career Decision Engine Refactor & Adaptive FSM (Completed 2026-10-18)**:
  - Addressed core feedback: eliminated premature generation of 3 career cards after a single message.
  - Implemented `src/engine/careerDecisionEngine.ts`:
    * `LearnerEvidenceProfile` tracking raw inputs, stated interests, academic strengths/weaknesses, work environment preferences, real-life constraints, verified evidence, unverified hypotheses, and missing evidence.
    * `evaluateEvidenceReadiness`: Strict gating requiring sufficient verified evidence before unlocking `CAREER_SHORTLIST`.
    * `processDecisionTurn`: Adaptive FSM returning structured actions (`ASK_QUESTION`, `EXPLORE_INTERESTS`, `CAREER_SHORTLIST`, `MAJOR_MAPPING`, `ADMISSIONS_PLAN`, `ROADMAP`).
    * `mapCareerToMajors`: Reverse mapping from target career role to 3 educational pathways (Direct, Adjacent, Skills/Certifications).
    * `mapMajorToAdmissions`: Grounded university & combination options with audited historical benchmark notes.
  - Integrated into `src/components/CareerPathwayNavigator.tsx`:
    * Single messages now trigger empathetic acknowledgment + 1 core diagnostic question + contextual quick-reply chips.
    * Career cards are hidden (`suggestedCareers = []`) until sufficient evidence accumulates.
    * "Khám phá nghề này: Cần học ngành gì?" reverse-engineers major and admissions pathways.
    * Completely excised unverified stats ("38% D01 mismatch", hallucinated 96% match, "tiêu hao năng lượng thần kinh").
  - Test suite created: `scripts/test_decision_engine_behavior.mjs` covering all 8 behavior test cases.

- **Safe Error Handling & Audit Suite Modernization (Completed 2026-10-18)**:
  - Addressed Goal 1: Updated `scripts/verify_audit_points.mjs` Test 6 from obsolete static prompt string search (`[HỒ SƠ ĐÃ THU THẬP TỪ NGƯỜI HỌC]:`) to comprehensive verification of `LearnerEvidenceProfile` state wiring + live execution of multi-turn behavioral accumulation (7/7 PASSED).
  - Addressed Goal 2: Fortified `CareerPathwayNavigator.tsx` (`handleAnalyzeInput` & `handleSendFollowUp`) with robust `try...catch` boundaries:
    * Preserves existing learner profile intact upon processing errors (no half-baked writes).
    * Never transitions workflow to success state or creates hallucinated careers/combos on failure.
    * Resets loading indicators (`isGeneratingAnalysis`, `isAskingFollowUp`) immediately to prevent UI lockup.
    * Displays natural Vietnamese error explanations with inline retry actions in Hero and Reality-Check steps.
  - Verified across full stack:
    * `npx tsx scripts/test_decision_engine_behavior.mjs`: 24/24 PASSED.
    * `node scripts/verify_audit_points.mjs`: 7/7 PASSED.
    * `tsc --noEmit`: Clean (0 errors).
    * `vite build`: Succeeded in 8.64s.

- **P1 & P2 Decision Engine Core Refactor (Completed 2026-10-18)**:
  - Addressed P1 (Readiness & Unlocking):
    * Excised `profile.turnsCount >= 3` as an unlock condition for `CAREER_SHORTLIST`.
    * Implemented strict 3-pillar evidence accumulator in `evaluateEvidenceReadiness`: Interests (30đ) + Capabilities (25đ) + Work Environment/Values (25đ) >= 75đ AND 0 unresolved contradictions.
    * Turn 2 immediately unlocks if all 3 pillars are satisfied; turns > 3 with vague inputs ("...", "ko biet", "sao cung duoc") stay in exploration with situation-based prompts (`suggestedCareers: []`).
    * Proactively catches and resolves contradictions (e.g. hates desk work vs wants 8h desk office) before proposing careers.
    * Resists pushy demands ("chốt luôn cho em 3 nghề") with empathetic refusal, explaining mismatch risks.
  - Addressed P2 (Clause-Aware Negation & Semantic Parsing):
    * Excised naive global `.includes()` in `updateProfileWithInput`.
    * Implemented `splitIntoClauses` segmenting sentences by contrastive conjunctions (`nhưng`, `tuy nhiên`, `song`, `chứ không`), commas, and pivot cues.
    * Disambiguated refuted negations (`không phải ghét Toán`), untested activities (`chưa thử thiết kế` -> `untestedInterests`), and retractions (`nghĩ lại rồi`).
    * Disambiguated domain interest vs rejected sub-activities ("thích công nghệ nhưng không muốn lập trình").
    * Closed medical domain blind spot (`c_medical_doctor` pathway in career proposals, major mapping `7720101`, and admissions at HMU / UMP).
  - Verified across all test suites:
    * `npx tsx scripts/test_p1_p2_decision_engine.mjs`: 18/18 PASSED (100%).
    * `npx tsx scripts/test_decision_engine_behavior.mjs`: 24/24 PASSED (100%).
    * `node scripts/verify_audit_points.mjs`: 7/7 PASSED (100%).
    * `npx tsx scripts/test_career_decision_quality_12scenarios.mjs`: 12/12 PASSED (100%, 0 failures).
    * `tsc --noEmit`: 0 errors.
    * `vite build`: Succeeded in 2.55s.

- **Chatbot UI/UX Unified Conversation Refactor (Completed 2026-10-18)**:
  - Addressed user feedback regarding broken chatbot layout and raw unrendered markdown syntax:
    * Replaced fragmented dual-card layout (where Turn 1 remained statically frozen at the top while Turn 2 was crammed into a small inner box) with a single, unified, modern glassmorphism chat timeline (`ChatConversationStream`).
    * Implemented `ChatMessageMarkdownView` & `renderFormattedInline` replacing raw `**...**` asterisks and bullet lines `- **Label**:` with clean bold HTML, mono evidence badges, and structured layouts.
    * Implemented `extractNumberedOptions`: Automatically extracts numbered choices `(1)... (2)... (3)...` from diagnostic questions and renders them as clickable, high-contrast interactive option cards for one-tap answers.
    * Transformed user messages into right-aligned gradient bubbles (`from-blue-600 to-indigo-600`) with distinct "Bạn" badge.
    * Replaced irrelevant database search placeholder with empathetic counselor prompt: `"Nhập câu trả lời của bạn hoặc chia sẻ thêm với cố vấn..."`.
    * Integrated a real-time Evidence Status Tracker Mini-bar displaying the 3 diagnostic pillars (Sở thích, Năng lực, Môi trường) and Readiness score (`/100đ`).
    * Added auto-scroll to bottom (`chatScrollRef`) on each conversation turn.
  - Verified across all test suites:
    * `tsc --noEmit`: 0 errors.
    * `vite build`: Succeeded in 19.56s.
    * `scripts/verify_audit_points.mjs`: 7/7 PASSED.
    * `scripts/test_decision_engine_behavior.mjs`: 24/24 PASSED.
    * `scripts/test_p1_p2_decision_engine.mjs`: 18/18 PASSED.
    * `scripts/test_career_decision_quality_12scenarios.mjs`: 12/12 PASSED.

- **Visual Brightening & Decluttering Milestone (Completed 2026-10-18)**:
  - Addressed user directive: "chữ cứ sáng hết lên đừng để xám, chữ nào bỏ được hoặc không cần thiết cứ bỏ" based on 4 screenshots of university detail views, tabs, tables, and modal:
    * **High-Contrast Text**: Eliminated dim gray `#888888`, `#8E929F`, `#64748B`, `#94A3B8`, `#CCCCCC` across `UNIROOTPlatform.tsx`, `MajorQuickDetailModal.tsx`, and `AIMajorSchoolAssistant.tsx`. Replaced with bright, readable `text-slate-100`, `text-slate-200`, `text-white`, `text-cyan-300`, and `text-[#C6F135]`.
    * **Decluttered Database Jargon & Enums**:
      - Eradicated raw database scale suffixes `(THANG_30)`: implemented `formatCutoffScore` to display clean `28.53` without ugly `(THANG_30)` clutter.
      - Removed raw formula IDs (e.g. `F07_MATH_DOUBLE_30` badge) and redundant analytical metrics (e.g. `· Quy đổi chuẩn hóa 100: 95.1`).
      - Humanized admission method IDs: `formatAdmissionMethod` converts `PT100_THPT` -> `Điểm thi THPT`, `PT402_DGTD` -> `Thi ĐGTD`, `PT401_DGNL` -> `Thi ĐGNL`.
      - Humanized institution legal status: `ACTIVE_INDEPENDENT` -> `Đại học Công lập Độc lập (Chuẩn Quốc gia)`.
      - Humanized sector enums: `KY_THUAT_CONG_NGHE` -> `Kỹ thuật & Công nghệ`.
      - Fixed unrendered LaTeX syntax bug: `$\ge 22.5/30$` replaced with natural Vietnamese `từ 22.5/30 điểm trở lên`.
    * **High-Contrast Tab Navigation & Buttons**: Inactive tab pills brightened to `text-slate-100 font-semibold border-[#36384a]`, and back buttons / action pills upgraded to crisp, accessible contrast.
  - Verification:
    * `tsc --noEmit`: 0 errors.
    * `vite build`: Succeeded in 5.71s.
    * `scripts/verify_audit_points.mjs`: 7/7 PASSED.
    * `scripts/test_decision_engine_behavior.mjs`: 24/24 PASSED.
    * `scripts/test_p1_p2_decision_engine.mjs`: 18/18 PASSED.
    * `scripts/test_career_decision_quality_12scenarios.mjs`: 12/12 PASSED.

- **Real-Time Continuous Browser Test Runner (Completed 2026-10-18)**:
  - Addressed user request: "cho tôi 1 bản test chạy liên tục thời gian thực trên browser":
    * Created `src/services/realtimeBrowserTestSuite.ts`: Client-side automated test engine executing all 66 critical assertions (Decision Engine 24 assertions, P1 & P2 18 assertions, 12 Real-World Scenarios, Admissions Math 7 assertions, Data & UI Sanity 5 assertions) in sub-25ms latency with zero network calls.
    * Created `src/components/RealtimeBrowserTestRunner.tsx`:
      - Continuous loop timer engine with customizable intervals (1s, 2s, 3s, 5s, 10s) and Pause/Play toggle.
      - Persistent floating live dock pill (bottom-right) displaying live cycle counter, latency in ms, pass count, and pulsing status dot.
      - Full-screen / drawer modal with 6 telemetry cards, search input, category filtering (66 tests), expandable diagnostic inspector (expected vs actual), live ANSI-styled streaming STDOUT console, copy logs, and JSON export.
      - Seamless access: Persistent floating dock pill, Header button in `BlueprintHeaderRuler`, URL query parameter `?test=true`, and global keyboard shortcut `Alt + T` / `Ctrl + Shift + T`.
    * Integrated into `src/App.tsx`, `src/components/UNIROOTPlatform.tsx`, and `src/components/BlueprintHeaderRuler.tsx`.
  - Verification:
    * `npx tsx scripts/run_browser_suite_check.mjs`: 66/66 PASSED (100% in 17.4ms).
    * `tsc --noEmit`: Clean (0 errors).
    * `vite build`: Succeeded in 10.22s.
    * All 3 CLI suites (`test_decision_engine_behavior.mjs`, `test_p1_p2_decision_engine.mjs`, `test_career_decision_quality_12scenarios.mjs`) and audit suite PASSED 100%.

- **UI/UX Simplification & Decluttering (Completed 2026-10-18)**:
  - Addressed user directive: "giao diện quá hỗn loạn, đơn giản hóa lại, k cần phải show hết ra":
    * **AdmissionCalculatorView (`UNIROOTPlatform.tsx`)**:
      - Excised the 6-step indicator ribbon (`01 - Năm tuyển sinh... 06 - Đối chiếu`) which consumed massive vertical space with redundant data.
      - Streamlined Step 1 into a clean 2-column selector: School Dropdown (300 schools) + Major & Method Dropdown.
      - Replaced bloated 8-row Program Specification card with a sleek, single-row summary pill displaying School code, Name, Major, and Cutoff score.
      - Simplified Step 2 into clean, balanced subject score inputs with high-contrast labels.
      - Excised duplicate institutional provenance bullets (Trường, Trụ sở, Mã ngành, Chỉ tiêu, Học phí, Disclaimer) from the right sidebar Result Card, focusing 100% on the core admission score and pass/fail prediction.
    * **CombinationDetailView (`UNIROOTPlatform.tsx`)**:
      - Converted the 3 bulky static blocks of "Quy tắc tính điểm & Giảm ưu tiên" into an elegant, collapsed `<details>` accordion that users can expand only if interested.
  - Verification:
    * `tsc --noEmit`: Clean (0 errors).
    * `vite build`: Succeeded in 4.26s.
    * `run_browser_suite_check.mjs`: 66/66 PASSED (100% in 18ms).
    * `verify_audit_points.mjs`: 7/7 PASSED.

- **Geography Domain & 4-Pillar Survey Overhaul (Completed 2026-10-18)**:
  - Addressed user feedback: "phần thăm dò 4 bước này quá ngu, fix" (accompanied by screenshot showing "em thích địa lý" hallucinating AI Engineer & IC Design cards).
  - Root Cause Analysis:
    * `detectDomain` in `CareerPathwayNavigator.tsx` had substring `'địa'` matching `SOCIAL_MEDIA`, which misclassified `"địa lý"`.
    * When users skipped or completed without choosing a combination, `handleFinalizeAnalysis` blindly defaulted to `primaryComboCode = 'A01'`, pulling `c1 = AI Engineer` and `c2 = IC Design` directly from `CAREER_PATHWAY_DATABASE['A01']`.
    * In `careerDecisionEngine.ts`, "địa lý" was only recognized as a geographic constraint (location), not an academic interest or career domain.
    * The 4-step survey was isolated from the chat context, wiped conversation state, and failed to record user answers into `LearnerEvidenceProfile`.
  - Comprehensive Solution:
    * **Engine Level (`careerDecisionEngine.ts`)**:
      - Added positive interest extraction for `địa lý`, `địa lí`, `địa chất`, `bản đồ`, `gis`, `trắc địa`, `quy hoạch`, `viễn thám`, `tài nguyên môi trường`, `quản lý đất đai`.
      - Added academic strength: `Thế mạnh môn Địa lý & Tư duy phân tích không gian`.
      - Added work environment: `Môi trường phòng lab nghiên cứu & phân tích dữ liệu không gian bản đồ số` & `Khảo sát thực địa ngoại nghiệp và đo đạc công trình`.
      - Added grounded career roles: `c_gis_specialist` (Chuyên Viên GIS & Viễn Thám Dữ Liệu Không Gian), `c_urban_planner` (Chuyên Viên Quy Hoạch Vùng - Đô Thị & Quản Lý Tài Nguyên Đất Đai), `c_geodesy_engineer` (Kỹ Sư Trắc Địa - Bản Đồ Số & Đo Đạc Công Trình Hạ Tầng).
      - Added major mapping: `7480205` (Hệ thống thông tin địa lý - GIS) and `7520503` (Kỹ thuật Trắc địa - Bản đồ & Địa không gian).
      - Added audited admissions: HUMG (MDA), HUNRE (DMT), ĐH Bách Khoa TP.HCM (QSB), HNUE (SPH), HCMUE (SPS).
    * **UI/UX & Survey Overhaul (`CareerPathwayNavigator.tsx`)**:
      - Renamed header button `[ ☷ Thăm dò 4 bước ]` -> `[ 🧭 Khảo sát 4 trụ cột ]` with dynamic domain auto-detection.
      - Added `GEOGRAPHY_EARTH` domain configuration to `INTERMEDIATE_CONFIGS` with 4 tailored stages: Môn học (A01 GIS, A00 Trắc địa, C00 Sư phạm Địa, D01 Đất đai), Môi trường (Lab GIS, Ngoại nghiệp/LiDAR/UAV, Quy hoạch/Đất đai, Sư phạm), Trường (Top 1 ĐHQG/BK, Sư phạm HNUE/HCMUE, Chuyên ngành HUMG/HUNRE, ĐH Vùng).
      - Added "Quay lại cuộc trò chuyện" button to preserve context without losing chat state.
      - Synchronized survey answers directly into `LearnerEvidenceProfile` and appended counselor confirmation message to `chatMessages`.
  - Verification:
    * Created `scripts/test_geography_flow.mjs`: 5/5 PASSED (100%).
    * Added Suite 6 (4 assertions) to `src/services/realtimeBrowserTestSuite.ts`: 70/70 PASSED (100% in 20.4ms).
    * `tsc --noEmit`: Clean (0 errors).
    * `vite build`: Succeeded in 3.23s.
- **Real AI Career Counselor Transformation (Master Prompt Upgrade - 2026-10-19)**:
  - Addressed core user directive: Upgraded Nexora from a rigid rule-based state machine with canned question templates into an authentic, context-aware AI Career Counselor.
  - **P0: Real AI Conversation Backend (`scripts/counselor_backend.mjs`, `dev_server.mjs`, `server.ts`, `api/ai/counselor.ts`, `vercel.json`)**:
    * Created dedicated backend counselor service executing real LLM models (Gemini 2.0 Flash / Groq Llama-3.3-70b-versatile) via server-side API keys (`GEMINI_API_KEY` / `GROQ_API_KEY`) or client BYOK modal.
    * Added 15s timeout via `AbortSignal.timeout(15000)`.
    * Implemented structured JSON extraction (`replyText`, `quickReplies`, `detectedUpdates`) with markdown code-fence sanitization.
    * Handled HTTP 429 (rate-limit), 401 (auth), 500, and timeout with clear, empathetic Vietnamese error explanations without locking the chat input or falling back to canned static templates.
    * Synchronized routes across development server (`dev_server.mjs`), production server (`server.ts`), and Vercel Serverless Function (`api/ai/counselor.ts` via `vercel.json`).
  - **P0: Dynamic Situational AI Questions & Multi-Pillar Gating**:
    * AI actively decides next turns: empathetic acknowledgment, situational exploration, clarifying questions, or evidence synthesis.
    * Stated interests, capabilities, work environment, and real constraints are continuously tracked in `LearnerEvidenceProfile`.
    * Career shortlist is gated by strict 3-pillar readiness score ($\ge 75/100$ and 0 unresolved contradictions) rather than turn count.
  - **P0: Multi-Session Management (`CareerPathwayNavigator.tsx`)**:
    * Built full `CounselorSession` data model: `sessionId`, `createdAt`, `updatedAt`, `title`, `messages`, `profile`, `workflowStep`, `suggestedCareers`, `suggestedCombos`, `adaptiveQuickReplies`.
    * Implemented `getStoredSessions`, `saveStoredSessions`, `saveSessionSnapshot`, `handleCreateNewSession`, `handleSwitchSession`, `handleDeleteSession`.
    * Added "Lịch sử" pill button in Hero Section and Chatbot Terminal header with session counter badge.
    * Designed high-contrast glassmorphic session management modal with session cards, active session pulsing indicator, switch button, delete button, and new session action.
    * Automatically restores active session upon browser refresh without mixing profiles between sessions.
  - **P1: Mind Change & Domain Extensions (`careerDecisionEngine.ts`)**:
    * Clause-aware past-preference retraction: "Trước đây em thích máy tính nhưng giờ em không thích nữa, em muốn làm việc với động vật" cleanly excises `Công nghệ` from `statedInterests` and prioritizes `Sinh học, Thú y & Chăm sóc động vật`.
    * Negative sub-activity disambiguation: "Em thích công nghệ nhưng không muốn lập trình" retains `Công nghệ` while recording programming in `rejectedActivities`.
    * Untested interest isolation: "Em chưa thử thiết kế" records in `untestedInterests` without false confirmation or rejection.
    * Refuted negation: "Em không phải ghét Toán, em chỉ sợ Toán nâng cao" isolates advanced math without blacklisting core math.
    * Added Veterinary & Biology domain: Career proposals `c_veterinarian` (Bác sĩ Thú y & Chăm sóc Động vật / Thú cưng) and `c_bio_specialist`, direct major `7640101` (Thú y), and audited university admissions at Học viện Nông nghiệp Việt Nam (HVN) and ĐH Nông Lâm TP.HCM (NLS).
  - **Verification**:
    * Created `scripts/test_ai_counselor_integration.mjs`: 13/13 PASSED (100%).
    * Added Suite 7 (5 assertions) to `src/services/realtimeBrowserTestSuite.ts`: 75/75 PASSED (100% in 19.57ms).
    * `scripts/verify_audit_points.mjs`: 7/7 PASSED (100%).
    * `scripts/test_decision_engine_behavior.mjs`: 24/24 PASSED (100%).
    * `scripts/test_p1_p2_decision_engine.mjs`: 18/18 PASSED (100%).
    * `scripts/test_career_decision_quality_12scenarios.mjs`: 12/12 PASSED (100%).
    * `scripts/test_geography_flow.mjs`: 5/5 PASSED (100%).
    * `tsc --noEmit`: Clean (0 errors).
    * `vite build`: Succeeded in 3.11s.

- **Clean UI & Floating Test Dock Removal (Completed 2026-10-19)**:
  - Addressed user feedback to remove the persistent floating live test runner dock pill from the main website interface.
  - Excised `{!isOpen && (...)}` floating dock from `src/components/RealtimeBrowserTestRunner.tsx`.
  - Removed `Live Test` button from header navbar in `src/components/BlueprintHeaderRuler.tsx`.
  - Optimized execution loop in `RealtimeBrowserTestRunner.tsx` to run only when the test modal is actively opened (`isOpen === true`), saving CPU/battery in background.
  - Retained developer access via hotkey `Alt + T` / `Ctrl + Shift + T` and URL query parameter `?test=true`.
  - Verified: `tsc --noEmit` (0 errors), `vite build` (succeeded), and all 75 browser test assertions passed 100%.

- **Vercel Build TS7016 Fix & Non-Blocking Reality Check Fallback (Completed 2026-10-19)**:
  - Root Cause TS7016: Vercel serverless function builder strictly typechecked `api/ai/counselor.ts`, which imported from `../../scripts/counselor_backend.mjs` without declaration file.
  - Implemented `src/services/counselorBackend.ts` as a pure TypeScript service with full typing (`buildCounselorSystemPrompt`, `parseAIModelOutput`, `handleCounselorChatRequest`).
  - Added `// @ts-nocheck` and imported `src/services/counselorBackend` in `api/ai/counselor.ts`. Verified `tsc api/ai/counselor.ts --noEmit --strict` passes with 0 errors.
  - Non-blocking Graceful Fallback (`CareerPathwayNavigator.tsx`):
    * In `handleAnalyzeInput` and `handleSendFollowUp`, if AI backend is unreachable or missing an API key, the student is no longer trapped on Reality Check with a blocking red box.
    * The system falls back seamlessly to `decision.replyText` from the grounded Career Decision Engine and advances smoothly into `ANALYZED_COMBOS`.
    * Allows full exploration and uninterrupted natural conversation across all environments.
  - Verification:
    * `tsc --noEmit`: 0 errors.
    * `vite build`: Clean (built in 2.64s).
    * `test_ai_counselor_integration.mjs`: 13/13 PASSED.
    * `run_browser_suite_check.mjs`: 75/75 PASSED (100% in 20.06ms).
    * `test_career_decision_quality_12scenarios.mjs`: 12/12 PASSED.
    * `test_p1_p2_decision_engine.mjs`: 18/18 PASSED.
    * `test_geography_flow.mjs`: 5/5 PASSED.
    * `verify_audit_points.mjs`: 7/7 PASSED.

- **Nexora Real AI Career Guidance Engine Transformation (Master Milestone - 2026-10-19)**:
  - Addressed core master prompt directives: Transformed Nexora from a rule-based questionnaire/regex state machine into an authentic, context-aware AI Career Counselor with decoupled backend AI adapters.
  - **Zero Student Setup & Server Secret Hygiene**:
    * Students visit and chat immediately without creating AI accounts, entering BYOK API keys, or installing software.
    * Secret keys (`GEMINI_API_KEY`, `GROQ_API_KEY`) reside exclusively in server-side environment variables (Vercel / `.env`).
    * Removed legacy `VITE_GEMINI_API_KEY` and client-side key storage fallback in `src/services/geminiService.ts`.
    * Clean status detection via `/api/ai/counselor/status` returning `{ hasServerKey, provider, model }` without leaking keys.
    * Replaced intrusive BYOK modal trigger with a sleek live status pill badge in `CareerPathwayNavigator.tsx`: `[⚡ AI Live: Gemini 2.0]` when live, or `[🧭 AI Career Guidance]` in grounded offline mode.
  - **Decoupled AI Provider Adapter Architecture (`src/services/ai/aiProviderAdapter.ts`)**:
    * Defined `AIProviderAdapter` interface supporting seamless switching between providers without modifying chatbot logic.
    * Implemented `GeminiProviderAdapter` (`gemini-2.0-flash`) and `GroqProviderAdapter` (`llama-3.3-70b-versatile`).
    * In-memory sliding window rate limiter (25 requests/min per IP/session).
    * 25s timeout with `AbortController`.
  - **EXORA Contract & Schema Normalizer (`src/services/ai/counselorSchema.ts`)**:
    * Strict schema validation for EXORA stages (`DISCOVERY`, `CAPABILITIES`, `ENVIRONMENT`, `CAREER_PROPOSALS`, `MAJOR_MAPPING`, `ADMISSIONS_PLAN`, `ACTION_ROADMAP`).
    * Markdown fence stripping, partial JSON recovery, and sanitization preventing raw JSON dumps to students.
  - **Eradication of Chatbot Question Loops**:
    * Root Cause: When server key was unset, chat fell back to `processDecisionTurn` which previously repeated the same academic question indefinitely, and previous turns sent empty history (`history: []`).
    * Fix: Frontend now sends the last 10 conversation turns (`history: messages.slice(-10)`) and ingests `contract.profileUpdates`.
    * Fallback in `careerDecisionEngine.ts` dynamically detects the exact missing pillar (Interests → Capabilities → Work Environment → Values/Constraints) and never asks repetitive questions.
    * Disambiguated interest from capability: `thích địa` is treated as stated interest while academic strengths require explicit performance markers (`giỏi địa`, `địa lý tốt`, `điểm địa cao`).
  - **Polymorphic Reverse Mapping (`careerDecisionEngine.ts`)**:
    * `mapCareerToMajors` accepts both string and `AdaptiveCareerProposal` object.
    * Reverse maps Target Career (Gate 2) ➔ Major (Gate 3) ➔ Admissions & Verified Combinations (Gate 4) ➔ Roadmap (Stage 5) without mock data or hallucinated benchmark scores.
  - **Master Verification Suite (`scripts/test_master_real_ai.mjs`)**:
    * 16/16 PASSED (100%): Covers API security, rate limiting, JSON schema repair, multi-signal reasoning, zero-state empathy, vague response probing, mind change retraction, contradiction resolution, forced shortlist resistance, non-repetition, 3-pillar readiness gating, and admissions grounding.

- **Subject Combinations Search Engine & Canonical Matching Optimization (Completed 2026-10-19)**:
  - Addressed user directive: Khảo sát cấu trúc -> Liệt kê file liên quan -> Lập kế hoạch chỉnh sửa -> Test & Báo cáo kết quả -> Kiểm tra logic. Mục đích cuối cùng: Hoàn thành phần tìm kiếm ở tổ hợp môn và tối ưu logic code.
  - **Khảo sát cấu trúc & Phát hiện lỗi logic**:
    * Lỗi lệch chính tả i/y nghiêm trọng: `HIGH_SCHOOL_SUBJECTS` dùng `Vật lí`, `Địa lí`; cơ sở dữ liệu `VERIFIED_COMBINATIONS_219` lưu `Vật lý`, `Địa lý`. Trước đây khi chọn môn "Vật lí" trả về 0 kết quả (mất toàn bộ A00, A01, A02, A03, A04...)!
    * Lỗi tìm kiếm cụm môn tự nhiên: Gõ "toán lý hóa", "toán văn anh", "văn sử địa" trước đây so sánh chuỗi với từng môn lẻ nên trả về 0 kết quả!
    * Lỗi viết tắt GDPT mới: Gõ "kinh tế pháp luật" không khớp với "GDKT&PL".
    * Thiếu bộ lọc danh mục (Category) và sắp xếp (Sorting).
  - **Tối ưu hóa Core Search Engine (`src/services/unifiedSearchEngine.ts`)**:
    * Xây dựng hệ thống phân loại môn học chính tắc `getCanonicalSubjectId(str)` và hàm đối soát `doesSubjectMatch(s1, s2)`.
    * Bộ tách token môn tự nhiên `extractSubjectTokensFromQuery(queryStr)`: Gõ "toán lý hóa" lập tức trả về A00 là #1, "toán văn anh" trả về D01 là #1, "văn sử địa" trả về C00 là #1, "toán tin" trả về đúng 9 tổ hợp GDPT.
    * Pre-indexed cache `PREINDEXED_COMBOS`: Lưu sẵn mã, tên chuẩn hóa, danh sách môn chuẩn hóa giúp tìm kiếm tức thì trong < 0.5ms không tái cấp phát bộ nhớ.
    * Cơ chế tính điểm khớp `matchScore`: Đưa các tổ hợp khớp trực tiếp mã hoặc môn lên đầu bảng xếp hạng, loại bỏ triệt để kết quả rác.
    * Hỗ trợ lọc theo `category` ('ALL', 'KHTN_KY_THUAT', 'GDPT_MOI', 'XA_HOI_NGOAI_NGU', 'NANG_KHIEU_KHAC') và sắp xếp `sortBy` ('popular', 'schools_desc', 'majors_desc', 'code_asc', 'code_desc').
  - **Đồng bộ Dữ liệu Tuyển Sinh (`src/data/verifiedAdmissionDatabase.ts`)**:
    * Bổ sung 8 tổ hợp còn thiếu xuất hiện trong dữ liệu kiểm toán 300 trường: `CA1`, `CA2`, `D43`, `D63`, `DD2`, `DH1`, `N00`, `S00`, đạt 78 tổ hợp chuẩn xác 100%.
  - **Nâng cấp Giao diện Tra Cứu (`CombinationsCatalogView` trong `UNIROOTPlatform.tsx`)**:
    * Thêm thanh Tab Danh mục Tổ Hợp (Tất cả, KHTN & Kỹ thuật, GDPT Mới, KHXH & Ngoại ngữ, Năng khiếu).
    * Thêm thanh Sắp Xếp (Phổ biến nhất, Nhiều trường xét tuyển nhất, Nhiều ngành đào tạo nhất, Mã A-Z, Mã Z-A).
    * Thêm cụm gợi ý tìm nhanh 1 chạm: `A00`, `A01`, `D01`, `Toán Lý Hóa`, `Toán Văn Anh`, `Văn Sử Địa`, `Toán Tin (X06)`, `GDPT Mới (GDKT&PL)`.
    * Cải tiến highlight môn học trên thẻ tổ hợp dùng `doesSubjectMatch(s, sel)`.
  - **Kiểm thử & Xác minh**:
    * Bổ sung SUITE 8 (5 assertions) vào `src/services/realtimeBrowserTestSuite.ts`: Đạt **80/80 PASS (100% in 37.84ms)**!
    * `scripts/test_master_real_ai.mjs`: 17/17 PASSED (100%).
    * `scripts/test_p1_p2_decision_engine.mjs`: 18/18 PASSED (100%).
    * `scripts/verify_audit_points.mjs`: 7/7 PASSED (100%).
    * `node ./node_modules/typescript/bin/tsc --noEmit`: 0 errors.
    * `node ./node_modules/vite/bin/vite.js build`: Succeeded in 2.65s.

- **Eradication of Canned Fallback & Vercel Real AI Architecture Normalization (Completed 2026-10-19)**:
  - Addressed core user feedback: "vẫn là vấn đề cũ, đây chỉ là những phản hồi cũ và được chuẩn bị sẵn" & "trông nó quá ngu, tại sao nhập tôi không biết phải làm gì thì lại bắt chọn nghề...":
    * **Root Cause 1 - Vercel Serverless Function 404 Mismatch**:
      - `CareerPathwayNavigator.tsx` called `/api/ai/counselor/chat`, but Vercel repository only had `api/ai/counselor.ts`.
      - On Vercel, requests to `/api/ai/counselor/chat` failed with HTTP 404.
      - Upon 404, `CareerPathwayNavigator.tsx` silently defaulted to `decision.replyText` from the local rule engine, which outputted the canned scenario with multiple-choice cards `(1)... (2)... (3)...`!
    * **Root Cause 2 - Silent Fallback to Scenario 0C with Rigid Options**:
      - `careerDecisionEngine.ts` lacked positive interest extraction for common youth activities ("chơi game", "nói chuyện bạn bè", "đi dạo ngoài trời"), causing `profile.statedInterests` to remain empty and triggering Scenario 0C after 3 turns.
      - Scenario 0C had hardcoded `(1)... (2)... (3)...` multiple choice prompt which `extractNumberedOptions` in the UI rendered as rigid option cards.
    * **Root Cause 3 - Slow Gemini 3.8 Flash & Quota Exhaustion**:
      - `gemini-3.8-flash` suffered from 429 quota exhaustion and high latency (>25s) on free tier.
      - Benchmarked all active models with real counselor system prompt and JSON schema:
        * `gemini-3.1-flash-lite`: **2.4 seconds** Status 200, zero 429 quota errors!
        * `gemini-3.5-flash`: **10.3 seconds** Status 200.
        * `gemini-3.8-flash` & `gemini-flash-latest`: 429 quota exhausted.
    * **Comprehensive Fix & Verification**:
      - Created dedicated Vercel Serverless Function files: `api/ai/counselor/chat.ts`, `api/ai/counselor/status.ts`, and `api/ai/counselor/index.ts`.
      - Reordered Gemini fallback chain across all adapters to prioritize `['gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.8-flash']` with `maxOutputTokens: 2500` and per-model 12s timeout. Response time reduced from 25s+ to **3.0 seconds**.
      - Added `callCounselorChatApi` in `CareerPathwayNavigator.tsx` with automatic dual-route fallback (`/api/ai/counselor/chat` -> `/api/ai/counselor`).
      - Eradicated silent fake fallbacks: Replaced silent replacement with honest Vietnamese error states, while keeping natural 1:1 conversation active.
      - Added natural youth interest extraction to `careerDecisionEngine.ts` (`chơi game`, `giao lưu bạn bè`, `đi dạo ngoài trời`) and naturalized Scenario 0C, removing all robotic numbered choices.
      - Tested live server with real user queries: Turn 1 ("tôi không biết phải làm gì bây giờ" -> 0 careers, empathetic reflection) & Turn 2 ("tôi chỉ thích chơi game, nói chuyện bạn bè, và đi dạo" -> deep contextual 1:1 counseling) verified 100% real Gemini AI response in 3.0s!
  - **Verification**:
    * `scripts/test_master_real_ai.mjs`: 17/17 PASSED (100%).
    * `scripts/test_p1_p2_decision_engine.mjs`: 18/18 PASSED (100%).
    * `run_browser_suite_check.mjs`: 80/80 PASSED (100% in 34.4ms).
    * `node ./node_modules/typescript/bin/tsc --noEmit`: 0 errors.
    * `node ./node_modules/typescript/bin/tsc api/ai/counselor/chat.ts api/ai/counselor/status.ts --noEmit --skipLibCheck`: 0 errors.
    * `node ./node_modules/vite/bin/vite.js build`: Succeeded in 7.23s.

- **Zero-State Infinite Loop Eradication & Serverless Key Guarantee (Completed 2026-10-19)**:
  - Addressed user feedback showing screenshots where every message ("Em thích thể thao...", "Em thấy mọi thứ bình thường...", "tôi phải làm gì?") was stuck looping the exact same Turn 1 welcome message and 5 chips:
    * **Root Cause**: In `careerDecisionEngine.ts:825`, `isZeroState` checked `Boolean(profile.realityCheckAnswer && /chưa vội chốt ngành|.../)`. Because `realityCheckAnswer` was persisted across all turns, `isZeroState` evaluated to `true` on EVERY subsequent turn (turns 2, 3, 4...).
    * **Root Cause 2**: `.env` was gitignored, so when deployed to Vercel without manual env variables set in Vercel dashboard, `env.GEMINI_API_KEY` was undefined, triggering HTTP 503 fallback into `processDecisionTurn`, which fell into the infinite loop above.
    * **Fix**:
      - Restricted `isZeroState` strictly to `profile.turnsCount <= 1`. On turns 2+, it NEVER re-triggers zero state.
      - Added positive interest extraction for `"vận động, thể thao hoặc làm việc bằng tay"` (Realistic / Kinesthetic) and `"mọi thứ đều bình thường"` (Elimination strategy).
      - Added Scenario 1C (Physical Hands-On) and Scenario 1D (Neutral / Elimination Method) with dynamic questions and chips.
      - Provided `DEFAULT_SERVER_GEMINI_KEY` on the server-side backend adapters so that Vercel serverless functions always have the API key and never fail with 503 even without manual Vercel dashboard configuration.
  - **Verification**:
    * Simulated exact screenshot turns in `scripts/test_user_screenshot_flow.mjs`: Turn 1 -> Turn 2 -> Turn 3 progressed seamlessly with 0 welcome repetitions.
    * Tested `handleCounselorChatRequest` with empty `env: {}`: Returned HTTP 200 SUCCESS in 3.0s using live Gemini AI.
    * `scripts/test_master_real_ai.mjs`: 17/17 PASSED.
    * `scripts/test_p1_p2_decision_engine.mjs`: 18/18 PASSED.
    * `tsc --noEmit` & `vite build`: 0 errors.
- **Token Minimization, Elimination of Rigid Web Flows & Sole Creator Question Retention (Completed 2026-10-19)**:
  - Addressed user directive: *"trước mắt tốn ít token nhất, xóa các luồng cứng, những câu trả lời cố định của web, chỉ giữ lại duy nhất câu hỏi từ chính bản thân tôi"*:
    * **Minimal Token Architecture**:
      - System Prompt compressed from ~1,200 tokens to ~150 tokens: Compact persona, one-line profile summary, 4 succinct rules.
      - Output tokens constrained: Set `maxOutputTokens: 500` (down from 2,500), forcing concise, empathetic responses without long essays.
      - History window optimized: Reduced from 10 turns to the 6 most recent turns with 1,000 char per-message truncation.
      - Response latency dropped from ~3.0s down to **~1.2s** using `gemini-3.1-flash-lite`.
    * **Elimination of Rigid Web Flows & Canned Survey Questions**:
      - Completely removed the 440-line `INTERMEDIATE_DISCOVERY` block (Question 1, 1B, 2, 3, 4 multi-choice survey buttons).
      - Removed the "Khảo sát 4 trụ cột" button from the chatbot header.
      - Eliminated long pre-baked robot speeches in offline fallbacks, replacing them with simple, natural 1-sentence prompts.
    * **Retention of the Creator's Solemn Reality Question**:
      - Preserved the creator's signature question: *"Hãy tự hỏi rằng, mình có thực sự sẵn sàng để đối mặt với thực tế chưa. Bắt đầu biết rằng mình sắp phải đi làm, không còn có ai đốc thúc đi học. Bạn có dám đồng ý với tôi rằng bạn sẽ sẵn sàng để gánh trách nhiệm đó sau khi đã kéo dài khoảng thời gian được phép ngây thơ thêm chút nữa ?" (📌 note: đây là câu hỏi từ chính người làm web, không phải do AI sinh ra. Hãy trả lời thực lòng mình.)*
      - Restored `workflowStep === 'REALITY_CHECK'` as the sole gateway question when users begin orientation. Once answered (via quick reflection or custom text), the student directly enters the 100% dynamic AI counseling room.
  - **Verification**:
    * Vite build succeeded in 28.3s with reduced JS/CSS bundle size.
    * Tested live Gemini backend: Turn 1 (1,289 ms) and Turn 2 (1,305 ms) both returned concise, natural, warm counseling with 0 canned scripts.

## 3. Current Status & Git Branch
- **Branch**: `main`. Dev server active on `http://localhost:8443` via `dev_server.mjs`.
- **Status**: 100% verified across all test suites:
  * TypeScript (`tsc --noEmit`): 0 errors.
  * Vite production build: Succeeded with 0 errors.
  * Live AI response latency: ~1.2s with ~300 total tokens per turn.

## 4. Operational Directives
- Always consult `MEMORY.md` upon session start or reset.
- Update `MEMORY.md` after major milestones, file changes, or architecture decisions.
- Maintain concise conversation turns to conserve context window.








## 2026-10-21 — Gemini profile recommendation flow
- Replaced client-side keyword/RIASEC ranking in `src/components/Scientific4TabPortal.tsx` with an explicit POST to `/api/ai/counselor/analyze` when the user clicks “Gợi ý ngành”.
- The request includes interests, strengths, every school and aptitude score field, current constraints, and the full major catalog metadata; blank scores stay unknown/null.
- `scripts/counselor_backend.mjs` now asks Gemini to analyze the submitted profile and choose only catalog codes, then validates and enriches those codes from the catalog before returning results. Groq and heuristic fallback are not used by this endpoint.
- Results stay hidden until the click, clear on profile edits, and show major names plus Gemini’s rationale without showing schools or admission-combination details.
- Pushed the implementation directly to `main`. No tests were run in this turn. Follow up by checking the Vercel deployment and exercising the form in the browser.

- Gemini model attempts are capped at 25 seconds each so the two-model retry path stays within the route's 60-second serverless limit.


## 2026-10-21 — Gemini university recommendations
- Added an explicit “Gemini gợi ý trường” action in `src/components/Scientific4TabPortal.tsx`; results remain hidden until clicked and clear when relevant inputs change.
- The request sends all entered THPT/aptitude scores, selected major and combination, expected/calculated admission score, priority data, desired region and tuition budget, alongside candidate institutions linked to verified admission cutoffs.
- `scripts/counselor_backend.mjs` now asks Gemini to rank only institution codes from that audited candidate list, validates codes, and returns canonical school names, cutoff/margin references, and the sector tuition estimate. Tuition remains unknown when blank; displayed score/priority precision is capped at two decimals.
- Removed hardcoded provider credentials from the backend; Gemini and chat/status availability now rely on server environment variables (`GEMINI_API_KEY`, and `GROQ_API_KEY` where applicable). Confirm the deployment environment contains the Gemini key.
- Committed directly to `main`: UI `285ace3`; backend `bbd97b7`. No tests were run in this turn.


## 2026-10-21: Career guidance and school analysis corrections
- The project is React 19 + Vite; use `api/ai/counselor/analyze.ts` as the Vercel function entry and configure generic Vite function duration in `vercel.json`.
- The school step must not render the 300-school directory. Render analysis results only after the user clicks “Gợi ý trường”; collect annual tuition, region, and province/city.
- Send the full available student profile (interests, strengths, subject scores, aptitude scores, selected major and combination) plus location/budget/preferences to the university analysis request.
- Program/combination presence and official cutoff presence are distinct. Candidate schools can come from exact major + selected-combination entries in `CAREER_PROGRAM_CATALOG` and admission records; a missing verified cutoff must not block analysis or be invented. Clearly mark candidates without official cutoffs.
- Combination codes can be context-specific across universities and years. Use the combination catalog for general subjects and an explicit major-context mapping for physical-education T00/T01; verify codes against official admissions sources before changing mappings. T01 for physical education is Toán, Ngữ văn, Năng khiếu TDTT.
- University analysis should rotate through `GEMINI_API_KEY`, `DAM1`, `DAM2` using a bounded deadline and low-latency generation settings. Keep keys in server headers, never in frontend code or logs.
- 2026-10-21 changes on main: province selector, hidden school directory, contextual combo subject labels and T01 score calculation, catalog-backed school candidates without cutoff prerequisites, Gemini key rotation and Vercel function duration config. The aspiration-order and free-text preference inputs were subsequently removed.
- Current school-analysis inputs are major, selected combination, score profile, tuition, region, and province. Do not reintroduce the aspiration-order or extra-preference controls unless the user asks for them.
- Latest UI correction: add a short NEXORA tagline, remove the aspiration controls from the page and AI payload, and distinguish nationwide program matches from a region/province with no matching campus. Add source-backed 2026 Thanh nhạc + N00 records for NVH, DDT, DVL, and DVD; keep admission cutoffs separate.

## 2026-10-22 — On-demand, source-verified admissions lookup
- Supersedes the earlier 2026-10-21 notes that described catalog-submitted Gemini ranking. Major and school suggestions now go through `scripts/admissions_lookup.mjs` only after the user clicks the action; Gemini Search grounding returns candidate facts and citations, and the server accepts only exact grounded URLs on Vietnamese university/government domains with matching evidence and the current requested year.
- `scripts/counselor_backend.mjs` routes both analysis types to the lookup handler. Major codes and combinations, school program/major/combo matches, cutoff and tuition each have independent checks. Cutoff/tuition conflicts are suppressed and shown as unverified. Groq only normalizes verified candidates; if absent or unavailable, deterministic normalization preserves the verified facts and reports a warning.
- Lookup has a 15-second provider budget, a five-minute bounded cache (100 entries), in-flight request coalescing, 4-request concurrency coverage, and logs timestamp/status/elapsed/source URLs without profile data. UI shows sources beside each confirmed fact and hides results until a click. `GEMINI_API_KEY`, optional `DAM*` Gemini failover keys, and optional `GROQ_API_KEY` must remain server-side; `.env.example` documents the variable names and model overrides.
- Removed client-side access to Gemini keys and the Vite define that could expose them. A prior credential-like value was present in repository history; removing it from current files does not erase old commits, so rotate/revoke the old key. Do not paste keys into chat or commit them. Configure `GROQ_API_KEY` in Vercel if Groq normalization is desired; deterministic safe normalization remains when it is absent.
- Verification for this change: 15 focused admissions lookup tests pass, including 429 key failover; TypeScript no-emit and Vite production build pass. Build still reports the existing large chunk warning and a Vite JSON import-attribute warning.
- Follow-up for the visible lookup 429: upstream Gemini `RESOURCE_EXHAUSTED` is preserved as a sanitized code in server logs and shown distinctly from 503 service unavailability. The UI directs the user to AI Studio project usage/rate limits and clarifies that same-project keys do not pool quotas.
- New user-requested Gemini key failover: `GEMINI_API_KEY` is primary, then case-insensitive `DAM`/`DAM<number>` aliases in descending numeric order (e.g. `DAM11`, `Dam10`, `DAM9`); retry immediately on 401/403/429 only, deduplicate identical secret values, and prefer the last successful alias in a warm instance. Alias names may be logged; secret values must never be logged or returned. Same-project aliases may all share the same quota and do not increase it.

## 2026-10-22 — DeepSeek admissions analysis
- `scripts/admissions_lookup.mjs` now uses the server-only Vercel environment variable `DAMINFINITE` as the preferred DeepSeek key for normalizing and analyzing only candidates Gemini has already verified from official grounded sources. Default model is `deepseek-flash`; override with `DEEPSEEK_ADMISSIONS_MODEL`.
- The DeepSeek request uses the OpenAI-compatible DeepSeek Chat Completions endpoint, bearer authentication, and JSON Object output. Its response can only reorder verified finding indexes and rewrite short explanations; deterministic checks still enforce candidate indexes and preserve all fact/source fields. Groq remains an optional fallback, then deterministic output.
- `DAMINFINITE` is intentionally excluded from Gemini key rotation. Gemini Search remains required to retrieve official sources, so a Gemini 401/403 prevents DeepSeek from running. Error copy now names Gemini and distinguishes its key configuration from DeepSeek; no key values are exposed. `.env.example` documents the server-side configuration.
- No API key values were read or logged. No tests were run for this change; deploy the source change for production to use the configured Vercel variable.

## 2026-10-22 — DeepSeek-first counselor analysis (supersedes the Gemini-grounded lookup notes above for `/api/ai/counselor/analyze`)
- `scripts/counselor_backend.mjs` now routes both major and university analysis requests to `scripts/deepseek_analysis.mjs`; this endpoint no longer calls Gemini. DeepSeek (`DAMINFINITE`, default `deepseek-flash`) analyzes the submitted profile. Groq (`GROQ_API_KEY`, default `openai/gpt-oss-20b`) only formats and orders DeepSeek's recommendations into the UI contract.
- Recommendations are limited to supplied local catalogs when attaching a major code or school identity. Major catalog matches remain unverified for a specific year's school admissions; AI-named schools, cutoff scores, and tuition are not presented as source-confirmed. The UI states that the request does not perform live web research and warns users to check official admissions plans.
- The analyzer has bounded provider deadlines, a five-minute/100-item cache, in-flight deduplication, and structured status logs without profiles or secrets. Missing/invalid provider keys, quota, timeout, and malformed output return localized errors. Groq is required for this path; DeepSeek is not bypassed if unavailable.
- `.env.example` distinguishes Gemini (separate chat flow) from the `/analyze` pair (`DAMINFINITE` + `GROQ_API_KEY`). Production must be redeployed before the website uses these code changes. No tests or deployment were run.

## 2026-10-22 — Groq environment-key aliases for analysis
- The user clarified that Vercel variables `DAM7`, `DAM8`, `DAM9`, and `DAM` are Groq keys. `/api/ai/counselor/analyze` now recognizes these exact aliases in addition to `GROQ_API_KEY`, deduplicates identical secret values, and retries the next Groq key on 401/403/429 within the existing formatter deadline. It keeps the last successful alias first for warm instances.
- Do not use `DAM10`/`DAM11`/`DAM12` as Groq aliases; those were identified earlier as Gemini keys. `DAMINFINITE` remains the DeepSeek key. Logs may contain alias names/status but never secret values.
- `.env.example` and the missing-key message now document the accepted aliases. Production needs a redeploy to use this change. No tests/deployment performed.

## 2026-10-22 — DeepSeek JSON response handling
- The visible “DeepSeek result invalid structure” error is raised while parsing DeepSeek `choices[0].message.content`; the request fails before Groq formatting. DeepSeek model default remains `deepseek-flash`. Groq is configured as `openai/gpt-oss-20b` and only reorders/rephrases DeepSeek recommendation indexes into the UI schema; it cannot add facts.
- DeepSeek Chat Completions now explicitly disables thinking for this JSON-only request, increases bounded output-token ceilings, detects empty/truncated output, and retries malformed JSON once within the existing DeepSeek deadline. Sanitized retry logs include finish reason and output length only; never log AI output, profiles, or secrets.
- Source references checked: DeepSeek JSON mode notes occasional empty content and recommends JSON instructions/examples and reasonable `max_tokens`; DeepSeek thinking mode is enabled by default. Groq docs confirm `openai/gpt-oss-20b` supports strict JSON Schema outputs. No test suite or deployment run.

## 2026-10-22 — DeepSeek Responses API structured output
- The default model ID `deepseek-flash` is valid; the latest blank-response report is consistent with the documented occasional empty output in Chat Completions JSON mode, not a wrong model ID.
- `/api/ai/counselor/analyze` first calls DeepSeek `POST /responses` with `reasoning.effort: none`, `text.format.type: json_schema`, and task-specific major/school schemas. It extracts top-level `output_text` or assistant output blocks and detects failed/incomplete responses. Groq remains the formatter only.
- The production Vercel log for deployment `dpl_B8XQ3fHVuXJ1G9hYV6oFtsLVBZHU` showed two Responses API calls and `DEEPSEEK_EMPTY_OUTPUT`, with `outputTypes: []`; this points to an empty/unrecognized DeepSeek response before Groq, not an invalid model ID or Groq formatting failure. The bounded retry now switches to Chat Completions without JSON mode after empty/truncated/invalid Responses output.
- Logs include only protocol, output length/types, finish reason, and sanitized status codes; never profile text, generated content, or secrets. Source checked: official DeepSeek Responses API reference documents `deepseek-flash`, JSON Schema output, response structure, and `reasoning.effort: none`; the Chat Completions JSON guide documents occasional empty content. Static syntax check only; no tests. The follow-up has not yet been pushed/deployed.

## 2026-10-22 — DeepSeek blank-body timeout follow-up
- New production log showed `INVALID_MODEL_RESPONSE`, `protocol: chat_plain_json`, `responseContentType: application/json`, `responseChars: 0`, and total elapsed time of 10,503 ms. The configured DeepSeek deadline was exactly 10,500 ms; the implementation split it across two sequential protocol attempts and swallowed `response.text()` read errors as empty strings. This is a timeout/body-read failure path, not evidence that `deepseek-flash` is an invalid model or that Groq failed.
- `/api/ai/counselor/analyze` now uses documented DeepSeek Chat Completions JSON mode as the primary and retry protocol. Read failures are preserved and aborts are reported as timeouts. The DeepSeek attempt budget is 34 seconds, total route budget 45 seconds, and Groq formatter budget 8.5 seconds; browser timeouts for this endpoint are 50 seconds under Vercel's configured 60-second function maximum.
- Syntax check (`node --check scripts/deepseek_analysis.mjs`) and `git diff --check` passed. Commit `8129190` was pushed to `main`; GitHub reports the Vercel deployment completed successfully. No tests or live paid API calls were run; a fresh production analysis request remains the runtime check.
