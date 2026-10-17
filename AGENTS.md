<!-- BEGIN:nextjs-agent-rules -->
## This is NOT the Next.js you know
This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Context: Career Guidance Platform (Website Hướng Nghiệp)

## 1. Tech Stack & Environment
- **IDE & Agent Workflow**: Google Antigravity + VS Code, GitHub version control, deployed on Vercel.
- **Framework**: React 19 / Vite 8 & Next.js (App Router, TypeScript strict mode), React Server Components (RSC) by default where applicable.
- **Development Server**: Dev server running on `$PORT` (default 8443). Changes to source files hot-reload immediately via Vite HMR.
- **Styling & UI**: Tailwind CSS v4 + `shadcn/ui` components + Lucide Icons. Follow `web-design-guidelines` and `react-view-transitions`.
- **AI & Data Layer**: Vercel AI SDK (`ai` package) & Google GenAI SDK (`@google/genai`) with Gemini models for streaming career counseling and structured output (`zod`), Supabase (PostgreSQL + `pg_vector`) / local audited database for assessment results and occupation/university catalogs.

## 2. Core Domain Modules
1. **Assessment Engine (`/app/(assessment)/` or `/src/services/assessment/`)**: Multi-step psychometric tests (Holland RIASEC, MBTI, Big Five, Ikigai) with client-side progress persistence and server-side scoring.
2. **Career & Major Explorer (`/app/careers/`, `/app/universities/` or `/src/components/`)**: Filterable, SEO-optimized pages detailing job market trends, salary ranges, required competencies, and university admission pathways in Vietnam (300 audited universities, 219 combinations).
3. **AI Career Counselor & Roadmap Generator (`/app/advisor/`, `/app/api/advisor/` or `/src/services/`)**: Interactive chat and structured roadmap generator grounded in the user's test scores and profile.

## 3. Mandatory Coding & Vibe-Coding Rules
- **Verify Docs First**: Always inspect `node_modules/next/dist/docs/` before using routing, caching (`"use cache"`), or Server Actions when working with Next.js.
- **Skill Activation**:
  - When building or editing UI/UX, forms, or quiz flows -> follow `web-design-guidelines`, `composition-patterns`, and `react-best-practices`.
  - When working on psychometric tests or scoring logic -> follow `career-assessment-engine`.
  - When working on AI chat, prompts, or CV/roadmap analysis -> follow `ai-career-counselor-rag`.
  - Before finishing any feature or committing -> run the verification workflow in `next-dev-loop` and `vibe-code-github-vercel-ship`.
- **No Unhandled States**: Every async route and AI streaming component must include a `<Suspense>` skeleton fallback, clear empty state, and friendly Vietnamese error message.
- **Code Quality**:
  - Use double quotes for strings containing apostrophes (`"We're here to help"`), or escape them in single-quoted strings.
  - Ensure JSX tags are closed and braces are balanced.
  - Export components cleanly and maintain type safety.
