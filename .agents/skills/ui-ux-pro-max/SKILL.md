---
name: ui-ux-pro-max
description: Directs AI to craft professional, human-designed user interfaces across desktop and mobile, enforcing strict anti-AI slop standards, deliberate visual hierarchy, and cohesive design systems.
---

# UI/UX Pro Max Skill: Professional Interface Design & Anti-AI Slop Manifesto

Transform generic, robotic AI-generated layouts into high-end, human-crafted interfaces that prioritize clarity, visual hierarchy, ergonomics, and institutional credibility.

## When to Use
- Designing new pages, modals, assessment wizards, or dashboards.
- Refactoring clunky, cluttered, or amateur-looking UI components.
- Eradicating "AI slop" (overused neon gradients, floating blur orbs, buzzword copy, meaningless cards).
- Establishing responsive layout grids, spacing rules, and interaction patterns.

---

## 1. Anti-"AI Slop" Design Manifesto

### 🚫 The "AI Slop" Hall of Shame (Never Do These)
- **No Purplish-Neon Sci-Fi Slop**: Do not paint everything in dark `#0b0f19` with saturated magenta, cyan, and violet neon glows unless specifically instructed for a cyber game. Use elegant slate, zinc, neutral darks, or crisp light mode.
- **No Meaningless Floating Blur Balls**: Avoid pseudo-futuristic `backdrop-blur-3xl bg-purple-500/10 rounded-full blur-3xl` blobs that float randomly behind text and reduce contrast readability.
- **No Buzzword Boilerplate Copy**: Ban phrases like *"Unlock your limitless potential with next-gen cutting-edge AI power"*, *"Revolutionize your journey"*, or *"Empowering your future with advanced algorithms"*. Use direct, humble, professional Vietnamese: *"Hệ thống đối chiếu hồ sơ tuyển sinh và hướng nghiệp đại học"*.
- **No Monotonous Card-Soup**: Avoid tiling 12 identical rectangular cards with an icon inside a rounded square, a bold 1-line title, and 2 lines of filler text. Differentiate primary information from secondary context with varied density.
- **No Fake AI Personas**: Do not plaster smiling robot avatars, floating spark icons on every button, or fake "AI thinking" animations when the data is deterministic math or catalog lookups.

---

## 2. Core Visual Hierarchy & Typography

### The 3-Second Eye Scan
1. **Anchor Point (Primary)**: The user's eye must immediately land on the page title or primary input task (e.g., *Mật mã Holland*, *Kết quả Top 3 Ngành*).
2. **Context & Rationale (Secondary)**: 1-2 concise sentences explaining what this screen accomplishes and why.
3. **Data Grid & Action Core (Tertiary)**: High-contrast inputs, distinct action buttons, and clear data cards.

### Typography Rules
- **Font Stack**: Default to clean modern sans-serifs (Geist, Inter, SF Pro, Roboto) with excellent Vietnamese diacritics support.
- **Contrast Ratios**: Body text must maintain WCAG AAA/AA contrast (`text-slate-200` or `text-slate-300` on dark backgrounds; `text-slate-800` on light). Never use low-contrast `text-slate-500` for critical instructions.
- **Micro-Typography**:
  - Headings: `font-bold tracking-tight` (reduces letter spacing for punchy headlines).
  - Code & Metric Badges: `font-mono text-xs uppercase tracking-wider`.
  - Body Text: `leading-relaxed` (1.6 to 1.7 line height) for comfortable long-form reading.

---

## 3. Spacing, Grids & Layout Density

- **Strict 8px Grid**: Spacing must scale in multiples of 4px/8px:
  - Tight related elements: `gap-1.5` (6px) or `gap-2` (8px).
  - Card internal padding: `p-4 sm:p-5` or `p-6`.
  - Section vertical rhythm: `space-y-4` to `space-y-6`.
  - Major page breaks: `py-8 sm:py-12`.
- **Content Density Balance**:
  - High-information views (e.g., admission cutoff tables, subject scores, Holland vector meters) should be compact and scannable without horizontal scrolling on mobile.
  - Form steps must feel focused: group 3-5 inputs per logical accordion or sub-step.

---

## 4. Input Fields & Form Ergonomics

- **Visible Labels**: Always pair inputs with clear, visible labels. Never rely solely on placeholder text for instructions.
- **Tactile Inputs**: Provide subtle border rings on focus (`focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30`), comfortable min-height (`min-h-11` or `min-h-12` for touch friendliness).
- **Explicit Helper Texts**: Give realistic examples in placeholders (e.g., `placeholder="Ví dụ: thích thiết kế đồ họa, vẽ tay, máy tính"`).
- **Disabled State Clarity**: Dim disabled controls visibly (`opacity-60 bg-slate-800 cursor-not-allowed`) and pair with an explicit reason or warning message.

---

## 5. Verification Checklist Before Marking UI Done
1. [ ] Is the interface free of generic neon purple/cyan AI gradients?
2. [ ] Does every text string sound natural, respectful, and authoritative in Vietnamese?
3. [ ] Are all touch targets at least 44x44px on mobile screens?
4. [ ] Does every interactive element have clear hover, active, focus, and disabled states?
5. [ ] Is there zero layout shift (CLS) during state transitions or async data fetches?
