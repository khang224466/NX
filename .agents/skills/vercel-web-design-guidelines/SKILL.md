---
name: vercel-web-design-guidelines
description: Enforces Vercel's benchmark design standards for web applications covering layout, spacing, typography, border styling, color tokens, and complete UI state coverage (loading, empty, error, active).
---

# Vercel Web Design Guidelines Skill

Build web applications that match the precision, polish, and aesthetic restraint of Vercel, Linear, and modern developer tooling.

## When to Use
- Establishing design tokens, themes, and global Tailwind configurations.
- Styling cards, navigation bars, dropdowns, dialogs, and tables.
- Building robust state architectures: skeleton loading, empty states, error fallbacks, and optimistic feedback.
- Polishing typography, borders, and micro-alignments across desktop and mobile viewports.

---

## 1. Monochromatic Foundation & Purposeful Accents

- **Neutral Canvas**: Base interfaces on deep neutrals rather than tinted purples or saturated blues:
  - Dark mode backgrounds: `#0A0D14`, `#0E1117`, `#141923`.
  - Light mode backgrounds: `#FFFFFF`, `#F9FAFB`, `#F3F4F6`.
- **Hairline Borders**: Use precise 1px borders with low contrast to define structure:
  - Dark borders: `border-slate-800` (subtle) or `border-slate-700` (interactive).
  - Light borders: `border-slate-200` or `border-slate-300`.
- **Functional Semantic Accents Only**:
  - **Primary Action**: Crisp blue (`bg-blue-600 hover:bg-blue-500 text-white`).
  - **Success / Validated**: Emerald (`text-emerald-400 bg-emerald-950/60 border-emerald-500/30`).
  - **Warning / Notice**: Amber (`text-amber-300 bg-amber-950/60 border-amber-500/30`).
  - **Danger / Error**: Rose/Red (`text-rose-400 bg-rose-950/60 border-rose-500/30`).
  - **Monospace Tags**: Slate / Zinc muted pills (`font-mono text-xs bg-slate-900 border-slate-800 text-slate-400`).

---

## 2. Typography & Letter-Spacing Hierarchy

- **Font Family**: Prefer clean, geometric grotesque or neo-grotesque typefaces (Geist, Inter, SF Pro).
- **Heading Optical Sizing**:
  - `h1` (32px-40px): `font-bold tracking-tight text-white`
  - `h2` (24px-28px): `font-bold tracking-tight text-white`
  - `h3` (18px-20px): `font-semibold text-slate-100`
  - `body` (14px-16px): `font-normal text-slate-300 leading-relaxed`
  - `caption / label` (12px-13px): `font-medium text-slate-400`
  - `data / stats` (11px-12px): `font-mono font-semibold tracking-wider uppercase text-slate-400`

---

## 3. Four-Corner State Architecture (Zero Unhandled States)

Every interactive view or data-driven component must explicitly handle 4 distinct states:

### 1. Loading State (Never use a bare spinner alone)
- Use **Content Skeletons** (`animate-pulse bg-slate-800/60 rounded`) matching the exact shape of cards or lists.
- Avoid full-page blocking loaders; preserve visible navigation and header context while content loads.

### 2. Empty State (Friendly guidance, not a dead end)
- When search results, saved bookmarks, or matching majors return empty:
  - Display a clear icon or glyph.
  - State clearly: *"Không tìm thấy kết quả phù hợp"*.
  - Provide an actionable recovery step: *"Thử tìm bằng từ khóa khác hoặc bấm 'Đặt lại bộ lọc'"*.

### 3. Error State (Actionable and resilient)
- Present a polite, Vietnamese error message with an immediate retry button.
- Log error details defensively without crashing React tree (`ErrorBoundary` pattern).

### 4. Active / Success State
- Display concise confirmation badges (e.g., `✓ Đã xác lập Mật mã IRC`, `✓ Đã lưu nguyện vọng`).
- Use subtle optimistic UI updates before network responses finish where safe.

---

## 4. Cards, Containers & Corner Radius Scale

- **Radius Hierarchy**:
  - Small elements (badges, buttons, inputs): `rounded-lg` (8px).
  - Cards, panels, dropdowns: `rounded-xl` (12px).
  - Outer page wrappers, main wizard modals: `rounded-2xl` (16px).
- **Card Styling Formula**:
  ```tsx
  className="rounded-xl border border-slate-800 bg-[#0E1117] p-5 shadow-sm hover:border-slate-700 transition-colors"
  ```
- **Depth & Shadows**:
  - Use subtle dark shadows (`shadow-sm`, `shadow-md shadow-black/40`), never harsh black cutouts.

---

## 5. Keyboard Navigation & Accessibility Standards

- All tabs, accordions, and dialogs must support keyboard focus (`Tab`, `Enter`, `Space`, `Esc`).
- Interactive buttons must have visible `:focus-visible` outline rings (`focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none`).
- Provide screen reader labels (`sr-only`) on icon-only buttons (search, close, refresh).
