---
name: frontend-project-structure
description: Governs frontend project directory hierarchy, atomic component architecture, GitHub workflows, preview verification, and clean refactoring to keep project codebases scalable and prevent architectural decay.
---

# Frontend & Project Structure Skill

Maintain pristine folder structures, modular component hierarchies, and clean Git/preview workflows to prevent codebase fragmentation and architectural rot.

## When to Use
- Adding new pages, features, or modular sub-packages to the project.
- Organizing files, types, hooks, services, and assets cleanly.
- Refactoring sprawling monolithic files into manageable atomic components.
- Running preview builds, diagnosing deployment breaks, and staging Git commits cleanly.

---

## 1. Standard Modular Project Hierarchy

Organize the repository with strict layer boundaries:

```
src/
├── components/          # Reusable UI presentation & container components
│   ├── ui/              # Dumb atomic primitives (Button, Badge, Card, Modal, Input)
│   ├── forms/           # Form-specific steps (RiasecAssessment, ProfileStep)
│   └── visualizers/     # Canvas, charts, graphs (ContourTerrainCanvas, RadarChart)
├── services/            # Pure business logic, calculation engines & API clients
│   ├── assessment/      # Scoring, psychometrics, vector similarity
│   ├── admissions/      # Ministry circular mapping, cutoff interpolation
│   └── ai/              # AI prompt templates, schema adapters, streaming clients
├── data/                # Static catalogs, official JSON evidence, lookup tables
├── hooks/               # Custom React hooks (useLocalStorage, useDebounce, useMediaQuery)
├── types/               # Shared TypeScript interfaces, types, and schemas
└── styles/              # Global CSS, Tailwind v4 theme variables, animations
```

---

## 2. Component Composition & Single Responsibility

- **Max File Length Rule**: When a component exceeds ~400-500 lines, extract logical sub-sections into child components:
  - Separate state management from presentation: Container Component (handles state, callbacks) vs. Presentational Component (receives props, renders JSX).
- **No Barrel File Performance Traps**:
  - Avoid massive `index.ts` files that re-export 50+ heavy modules, which slows down Vite HMR and increases bundle sizes.
  - Import directly from specific module paths.
- **Strict Prop Interfaces**:
  - Explicitly define `interface ComponentProps { ... }`.
  - Pass handlers as descriptive callbacks (e.g., `onProfileChange`, `onSelectMajor`), not raw setter functions.

---

## 3. Safe Refactoring & Zero-Regression Protocol

When modifying existing features:
1. **Never Blindly Delete Working Code**: Preserve existing comments, docstrings, and edge-case handling unless explicitly instructed.
2. **Verify Line Endings (CRLF vs. LF)**: In Windows environments, ensure scripts respect CRLF when performing string replacements.
3. **Run Isolated Checks Before Global Runs**:
   - Test the specific modified module first: `npx tsx src/services/assessment/recommendationEngine.test.ts`.
   - Then run full type check: `npx tsc --noEmit`.
4. **Isolate Breaking Changes**: Use feature branches or isolated test scripts before merging to `main`.

---

## 4. Git & Vercel Preview Readiness Workflow

- **Atomic Commits**: Stage only related files (e.g., do not bundle virtual machine disk files or unrelated logs into source commits).
- **Commit Format**: Conventional commits with Vietnamese/English domain tags:
  - `feat(career): ...`
  - `fix(admissions): ...`
  - `style(ui): ...`
  - `docs(memory): ...`
- **Verify Before Push**: Ensure the working directory is clean, tests pass 100%, and deployment environment variables are preserved.
