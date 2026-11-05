---
name: vibe-code-github-vercel-ship
description: Enforces a clean verification, Git commit, and Vercel deployment readiness workflow during vibe coding sessions. Use before committing code, opening pull requests, fixing Vercel build failures, or finishing a feature milestone.
---

# Vibe Code GitHub & Vercel Ship Skill

Ensure every vibe-coded feature compiles cleanly, passes runtime checks, and deploys to Vercel without build or environment regressions.

## When to Use
- Completing a feature or UI change before running `git commit` / `git push`.
- Troubleshooting failed Vercel Preview or Production builds.
- Auditing environment variables, caching, and route performance.

## Pre-Ship Checklist

### 1. Static & Runtime Verification
1. Run `npx tsc --noEmit` to verify zero TypeScript type errors across Server and Client Components.
2. Check the running Next.js / Vite server to confirm zero hydration mismatches, missing `"use client"` directives, or uncached dynamic data blocking static prerendering.
3. Run `npm run lint` and verify all dynamic route params (`params`, `searchParams`) are properly awaited as Promises in Next.js 15/16+.

### 2. Vercel Deployment Hygiene
1. Verify that any new secret or API key (e.g., `GOOGLE_GENERATIVE_AI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`) is documented with a placeholder in `.env.example` and never hardcoded or committed in `.env.local` or `.env`.
2. Ensure AI streaming routes set an appropriate `maxDuration` export (e.g., `export const maxDuration = 60;`) so Vercel Serverless Functions do not time out mid-stream.
3. Verify images use `next/image` with configured `remotePatterns` in `next.config.ts` or standard responsive image tags.

### 3. Clean Git & GitHub Workflow
1. Stage logical, atomic changes and write clear Conventional Commit messages (e.g., `feat(assessment): add RIASEC cosine similarity matching engine`).
2. Keep `AGENTS.md` and `.agents/skills/` tracked in Git so every collaborator and cloud coding agent shares the exact same project intelligence.
