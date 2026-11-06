---
name: design-system-landing-scaffold
description: Extracts, unifies, and maintains design system tokens (colors, typography, components) and scaffolds high-converting, standard 5-section landing pages and portal shells with clean semantic HTML.
---

# Design System Builder & Landing Page Scaffold Skill

Establish unified design systems and rapidly scaffold high-converting, accessible 5-section landing pages and portal interfaces.

## When to Use
- Auditing and extracting design tokens into structured Tailwind / CSS variables.
- Building standard 5-section landing pages or marketing portal shells.
- Enforcing consistent component primitives (buttons, badges, accordions, dialogs, form cards).
- Packaging clean, deployable single-page previews or multi-page layouts.

---

## 1. Design System Token Architecture

Every cohesive platform must define its foundational design tokens in one central source of truth:

```ts
// Example Design Tokens Schema
export const DESIGN_TOKENS = {
  colors: {
    canvas: {
      default: '#07080B',
      card: '#0E1117',
      surface: '#141923',
      subtle: '#1C2230'
    },
    border: {
      subtle: 'rgba(255, 255, 255, 0.08)',
      interactive: 'rgba(255, 255, 255, 0.16)',
      highlight: '#3B82F6'
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#94A3B8',
      muted: '#64748B',
      accent: '#60A5FA'
    }
  },
  radius: {
    pill: '9999px',
    sm: '8px',
    md: '12px',
    lg: '16px'
  }
};
```

---

## 2. Standard 5-Section Landing Page Scaffold

Follow this battle-tested 5-section architecture for educational, SaaS, or career platform homepages:

### Section 1: Hero & Value Proposition (The Hook)
- **Top Badge**: Eyebrow tag indicating official source or accredited version (e.g., `BỘ GD&ĐT 2026 AUDITED`).
- **Headline**: Clear, benefit-driven statement (no buzzwords): *"Hệ Thống Định Hướng Nghề Nghiệp & Tuyển Sinh Đại Học Chuẩn Hóa"*.
- **Sub-headline**: 2 sentences explaining who it is for and how it works.
- **Dual CTA**: Primary actionable button (*"Khám phá ngay"*) + Secondary proof button (*"Xem danh mục 300 trường"*) or live interactive mini-widget.

### Section 2: Trust & Audited Metrics (Social Proof)
- Key metrics banner:
  - 300+ Trường đại học kiểm định độc lập.
  - 219 Tổ hợp môn xét tuyển chuẩn Thông tư 09 & 74/2026.
  - 100% Khung trần học phí Nghị định 238/2025/NĐ-CP.
- Institutional accreditation logos / data badges.

### Section 3: The Core Interactive Feature (Product in Action)
- Embed the main interactive engine directly in the viewport (e.g., 4-Step Career Portal, Holland RIASEC survey, or Admission Calculator).
- Immediate feedback loop without forcing login or paywalls.

### Section 4: Methodology & Deep Comparison (The Proof)
- Explain the algorithmic integrity:
  - *Pearson correlation matching 6-dimensional vectors*.
  - *Conflict matrix avoiding personal weaknesses*.
  - *Deterministic 3-tier school grouping (Mơ ước, Vừa sức, An toàn)*.
- Side-by-side comparison: *"Định hướng cảm tính thông thường vs. Định hướng dữ liệu kiểm chứng Nexora"*.

### Section 5: Final Call-to-Action & Compliance Footer (Conversion)
- High-contrast closing CTA box with direct entry point.
- Institutional footer: Legal disclaimers, ministerial circular references, sitemap, privacy, and feedback channel.

---

## 3. Reusable Component Primitives Checklist

Ensure every design system exports these clean primitives:
1. `<Button variant="primary | secondary | outline | ghost" size="sm | md | lg">`
2. `<Badge variant="neutral | success | warning | info">`
3. `<Input>` and `<Textarea>` with visible labels, helper text, and error messages.
4. `<Card>` with consistent border, background, and padding.
5. `<Accordion>` with keyboard accessibility and chevron indicators.
