---
name: ultimate-fullstack-engineer
description: Orchestrates end-to-end full-stack web engineering from ideation to production architecture, enforcing strict type-safe APIs, clean domain boundaries, resilient error handling, and scalable serverless/database design.
---

# Ultimate Full-Stack Engineer Skill

Orchestrate complete full-stack web applications with industrial-grade resilience, strict type safety, clean domain architecture, and scalable performance.

## When to Use
- Architecting a new full-stack feature or entire application from scratch.
- Designing API contracts, Server Actions, route handlers, or serverless functions.
- Integrating databases (PostgreSQL, Supabase, SQLite), ORMs, or vector storage.
- Implementing AI streaming pipelines (Vercel AI SDK, Google GenAI, DeepSeek) with structured schemas (`zod`).
- Resolving complex full-stack runtime bugs, hydration mismatches, or timeout issues.

---

## 1. Clean Domain-Driven Architecture

Enforce strict unidirectional dependency flow:

```
┌────────────────────────────────────────────────────────┐
│           Presentation Layer (React UI / RSC)          │
│  Components, Pages, Wizards, Interactive Canvas Views  │
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│         Application Services & Server Actions          │
│   counselorBackend, recommendationEngine, scoringEngine │
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────┴────────────────────────────┐
│        Data Access & External Adapters Layer           │
│  seedData, Supabase, Gemini SDK, Admissions DB, Cache  │
└────────────────────────────────────────────────────────┘
```

- **Domain Isolation**: Core calculation engines (scoring, vector correlation, admission calculations) must be pure TypeScript functions with zero UI or framework dependencies. They must run in both Node.js and browser environments and be 100% unit testable.
- **RSC vs. Client Boundary**:
  - Keep data fetching and heavy catalog processing on the server or cached memo layers.
  - Mark only leaves with `"use client"` where user interactions (keystrokes, sliders, local state) occur.

---

## 2. Type Safety & Schema Contracts (Zero `any`)

- **Strict TypeScript (`strict: true`)**: Every object, function argument, and API response must have an explicit type.
- **Runtime Validation with Zod**:
  ```ts
  import { z } from 'zod';

  export const UserDossierSchema = z.object({
    riasecScores: z.record(z.enum(['R', 'I', 'A', 'S', 'E', 'C']), z.union([z.number().min(0).max(100), z.literal('')])),
    careerInterests: z.string().max(1000),
    careerStrengths: z.string().max(1000),
    careerWeaknesses: z.string().max(1000),
    subjectScores: z.record(z.string(), z.union([z.number().min(0).max(10), z.literal('')]))
  });
  export type UserDossier = z.infer<typeof UserDossierSchema>;
  ```
- **Typed Result Pattern**: Avoid throwing raw exceptions for expected failures. Return typed results:
  ```ts
  type Result<T, E = string> = { success: true; data: T } | { success: false; error: E; code?: string };
  ```

---

## 3. Resilient API & Streaming AI Endpoints

- **Timeout Ceilings**: Never allow an API call or AI prompt to hang indefinitely. Wrap all network calls with a hard ceiling (`Promise.race` with 6-8s client timeout).
- **Graceful Fallbacks**: If an AI model or external API fails or rate-limits, immediately fall back to local heuristic/algorithmic engines (e.g. `fallbackDiagnosis` + `linkAndRankMajorsWithDossier`). The user must NEVER see a frozen screen or unhandled crash.
- **Zero Secrets in Client Bundles**: Never prefix private API keys with `VITE_` or `NEXT_PUBLIC_`. Keep keys on the server or in secured Edge functions.

---

## 4. Full-Stack Verification Workflow

Before completing any full-stack task:
1. Run `npx tsc --noEmit` across all server and client files.
2. Run automated unit test suites (`*.test.ts`, `*.test.mjs`).
3. Verify that environment variables have placeholders in `.env.example`.
4. Ensure all async operations have visible loading skeletons and friendly error states.
