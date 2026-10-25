---
name: ai-career-counselor-rag
description: Implements AI-powered career counseling, personalized learning roadmaps, skill-gap analysis, and CV feedback using Vercel AI SDK, Gemini models, and structured outputs. Use when creating AI endpoints, system prompts, RAG pipelines for Vietnamese job/university data, or streaming counselor interfaces.
---

# AI Career Counselor & RAG Skill

Build grounded, empathetic, and structured AI career guidance experiences tailored to Vietnamese students and career switchers.

## When to Use
- Implementing `/api/chat` or Server Actions using the Vercel AI SDK (`streamText`, `generateObject`) or Gemini SDK.
- Designing prompts or RAG retrieval over occupation catalogs, university admission data, or labor market trends.
- Building structured Career Roadmaps (3-month, 6-month, 1-year milestones) or Skill Gap analyzers.

## Core Implementation Steps

### 1. Ground AI Responses in User Profile & Retrieved Data
- Always inject the user's verified context into the system prompt:
  - Target audience stage (High school student choosing university major, University student seeking internship, or Working professional switching careers).
  - Normalized assessment scores (e.g., Holland RIASEC vector, top strengths, work values).
  - Retrieved occupation/major records from the database (salary ranges, core skills, Vietnamese university blocks/majors).
- Instruct the AI to distinguish clearly between **verified catalog data** and **general career advice**.

### 2. Prefer Structured Outputs for Roadmaps and Action Plans
- When generating a learning roadmap, skill gap matrix, or career comparison, use `generateObject` or `streamObject` with a strict `zod` schema:
  - `fitSummary`: Why the career aligns or conflicts with the user's assessment profile.
  - `skillGaps`: List of hard and soft skills to acquire, prioritized by urgency.
  - `roadmapPhases`: Concrete 30-60-90 day or semester-by-semester milestones with verifiable portfolio projects.
  - `alternativePaths`: 2 adjacent career roles in case the primary path changes.

### 3. Ethical & Empathetic Guardrails
- Never treat a personality test result as a rigid limitation ("You cannot be a software engineer because your score is X"). Frame results as natural inclinations and highlight how unique trait combinations create advantages (e.g., high Artistic + Enterprising in Product Design or UI Engineering).
- Keep language natural, encouraging, and clear in Vietnamese, avoiding vague translationese.

## Gotchas to Avoid
- Do not let the LLM invent university admission scores (diem chuan) or tuition fees if they are not present in the retrieved database context; explicitly prompt the model to state when exact current-year admission cutoffs need official verification.
- Always implement rate-limiting and input length validation on AI routes before deploying to Vercel to prevent token abuse.
