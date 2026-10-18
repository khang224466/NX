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

## 3. Current Status & Git Branch
- **Branch**: `main` (Latest commit: `fc9ab43` - *pushed to GitHub `origin/main` & Vercel deployment triggered*).
- **Server**: Running on `http://localhost:8443` via `dev_server.mjs`.
- **Hybrid DB State**: Initialized in `data/career_guidance.duckdb` (8+ tables & views) and `data/chroma_db` (797 vectors indexed).

## 4. Operational Directives
- Always consult `MEMORY.md` upon session start or reset.
- Update `MEMORY.md` after major milestones, file changes, or architecture decisions.
- Maintain concise conversation turns to conserve context window.
