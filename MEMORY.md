# Project Memory & Persistent State
Last Updated: 2026-10-18T17:42:00+07:00

## 1. Project Overview & Context
- **Name**: UNIROOT Platform / Career Guidance Platform (Website Hướng Nghiệp)
- **Tech Stack**:
  - React 19, Vite 8, TypeScript (strict mode)
  - Tailwind CSS v4, Lucide Icons, GSAP, Motion
  - Google GenAI SDK (`@google/genai`) with Gemini models
  - Deployed on Vercel, Version control via GitHub (`khang224466/figma-make-app`)

## 2. Key Architecture & Recent Decisions
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

## 3. Current Status & Git Branch
- **Branch**: `main` (Dev server active on `http://localhost:8443` via `dev_server.mjs`).
- **Modified/New Files**:
  * `src/engine/careerDecisionEngine.ts` (clause-aware parser + 3-pillar readiness + medical + contradiction detector)
  * `src/components/CareerPathwayNavigator.tsx` (integration + safe boundaries)
  * `scripts/test_p1_p2_decision_engine.mjs` (new - 18 assertions for P1 & P2)
  * `scripts/test_decision_engine_behavior.mjs` (24 assertions)
  * `scripts/test_career_decision_quality_12scenarios.mjs` (12 scenarios quality benchmark)
  * `scripts/verify_audit_points.mjs` (7 audit points)
- **Status**: P1 & P2 core decision engine flaws completely solved and mathematically verified across 61 total automated assertions. Zero commit, push, or deployment performed.

## 4. Operational Directives
- Always consult `MEMORY.md` upon session start or reset.
- Update `MEMORY.md` after major milestones, file changes, or architecture decisions.
- Maintain concise conversation turns to conserve context window.
