---
name: career-assessment-engine
description: Designs, implements, and validates psychometric career assessments (Holland RIASEC, MBTI, Big Five, Ikigai), scoring algorithms, radar chart visualizations, and career matching logic. Use when building quiz UI, calculating personality/career scores, mapping test results to occupations or university majors, or persisting assessment state.
---

# Career Assessment Engine Skill

Build deterministic, scientifically structured, and user-friendly career assessment flows.

## When to Use
- Creating or updating multi-step quiz interfaces (Holland RIASEC, MBTI, Big Five, Ikigai, Skill Audit).
- Writing scoring calculation functions, normalization formulas, or tie-breaking rules.
- Mapping assessment scores to occupation profiles, university majors, or training roadmaps.
- Visualizing user results with Radar charts, progress bars, or trait breakdown cards.

## Core Implementation Steps

### 1. Separate Scoring Logic from UI Components
- Place all scoring and matching algorithms in pure, unit-testable TypeScript modules under `src/lib/assessment/` or `src/services/assessment/` (never calculate scores inline inside React components).
- Define strict `zod` schemas for question payloads, user responses, raw scores, normalized scores (0-100 scale), and top trait codes (e.g., 3-letter Holland code like `ISA` or `RIC`).

### 2. Handle Tie-Breaking and Normalization Deterministically
- **Normalization**: Normalize raw dimension sums to a 0-100 percentage scale based on the maximum possible score per dimension so users can compare results across different test lengths (e.g., Mini 18-question vs. Full 60-question RIASEC).
- **Tie-Breaking**: When two dimensions have identical normalized scores, resolve ties using high-weight anchor questions or return dual-code variations with transparent explanations rather than arbitrary array sorting.
- **Cosine Similarity / Weighted Matching**: Match the user's normalized 6-dimensional RIASEC vector against occupation target vectors using cosine similarity or weighted Euclidean distance, returning the top matches with an explicit match percentage and "Why this fits you" bullet points.

### 3. Resilient Multi-Step Quiz UX
- Persist answers after every question step to `localStorage` (or session draft) so accidental page refreshes on mobile never lose user progress.
- Support keyboard shortcuts (`1`-`5` for Likert scale, `ArrowLeft`/`ArrowRight` for navigation) and accessible radio groups following `web-design-guidelines`.
- Group questions into digestible chunks (5-6 questions per screen) with a clear progress indicator and non-judgmental Vietnamese phrasing.

## Gotchas to Avoid
- Never expose raw prompt-generated guesses as psychometric scores; scoring must always be computed deterministically in TypeScript.
- Do not block the result page on slow AI generation: render the deterministic score breakdown, Radar chart, and matched careers immediately, and stream the personalized AI analysis inside a `<Suspense>` or client streaming block.
