---
name: nx-career-guidance
description: Use when editing the NX/NEXORA career guidance portal, major and admission-combination matching, university recommendations, Gemini analysis, or Vercel deployment behavior.
---

# NX career guidance

## Read the current project first

- Confirm the live architecture from `package.json`. The current application is React 19 with Vite; the root `AGENTS.md` contains stale Next.js-era instructions, so do not apply Next.js conventions unless the package and deployment config have actually changed.
- Read the relevant parts of `MEMORY.md` and check them against current source before relying on historical notes.
- Main portal: `src/components/Scientific4TabPortal.tsx`.
- Major, program and admission data: `src/services/careerCatalog.ts`, `src/data/verifiedAdmissionDatabase.ts`, `src/data/auditedInstitutionsData.ts`, and `src/data/seed_data.json`.
- Vercel AI endpoint: `api/ai/counselor/analyze.ts`; provider logic: `scripts/counselor_backend.mjs`.

## Counseling workflow rules

- Recommendations appear only after the user clicks the corresponding action. Do not render seeded recommendation results or the entire institution directory by default.
- Send the relevant entered profile together: interests, strengths, subject scores, aptitude scores, selected major, selected combination, expected score, annual tuition budget, region, and province/city. Do not add an aspiration-order selector or free-text aspiration/preferences field.
- Show the three subjects for every selected combination. Combination codes can be university-, major-, and year-specific. For physical-education majors, T00 is Toán + Sinh học + Năng khiếu TDTT and T01 is Toán + Ngữ văn + Năng khiếu TDTT. Verify other combinations from current official university admission notices; do not assume a code means the same subjects everywhere.
- Distinguish an audited program/combination match from a verified official cutoff. A matching program may be recommended without a cutoff only when that exact major and combination exist in the catalog. Say that its cutoff is unavailable; never fabricate a cutoff or admission probability.
- Keep official program/combination evidence separate from cutoff data. If nationwide matches exist but none meet the selected region or province, explain that location mismatch and offer the Toàn quốc filter; if no verified match exists anywhere, say so precisely. Missing cutoff data alone is not a reason to skip analysis.
- Add verified major/combination records only with official admissions evidence. Keep the source URLs and year on the catalog record; do not treat a program match as a verified cutoff.
- Keep the model constrained to institution codes in the candidate catalog and preserve server-side validation of every recommendation.

## Gemini and Vercel

- Keep all credentials server-side. The supported server environment variables are `GEMINI_API_KEY`, `DAM1`, and `DAM2`; try configured keys with a bounded total deadline and keep API keys out of URLs, browser bundles, and logs.
- Use a concise low-latency model configuration and a request deadline below the Vercel function maximum. Configure generic Vite function duration in `vercel.json` for the exact `api/ai/counselor/analyze.ts` path.
- Preserve actionable error distinctions for missing configuration, model/key failures, timeouts, and missing catalog matches. Do not report missing cutoff data as a Gemini or server failure.

## Review and delivery

- Check that edits preserve the explicit-click flow and do not reintroduce the institution directory or preset recommendations.
- Validate the UI and API payload together: region, province, tuition, and the selected combination must affect the candidate filter/prompt, and result copy must disclose missing cutoff values. Confirm no aspiration fields remain in the school step.
- Prefer the project's actual build/deployment checks for verification. Update `MEMORY.md` after meaningful workflow changes.
