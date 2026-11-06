---
name: taste-motion-impeccable
description: Implements refined animation taste, micro-interactions, spring physics, and tactile polish inspired by Emil Kowalski and modern craft design, avoiding sluggish or gimmicky animations.
---

# Taste & Impeccable Motion Skill

Infuse user interfaces with tactile responsiveness, refined spring physics, and subtle micro-interactions that feel alive without slowing users down.

## When to Use
- Adding animations, tab transitions, dialog open/close choreography, or accordion reveals.
- Designing button click feedback, hover lifts, badges, and card interactions.
- Polishing drag-and-drop, sliders, progress indicators, or radar chart entries.
- Eliminating jerky, sluggish, or motion-sickness-inducing CSS keyframe animations.

---

## 1. The Core Philosophy of Motion Taste

- **Fast & Tactile**: Animations should feel like responsive physical materials (wood, metal, glass, spring wire). They should finish in **150ms - 250ms**, never lingering past 350ms.
- **Animate Transforms & Opacity Only**:
  - ✅ DO animate `transform: scale()`, `transform: translateY()`, and `opacity`. These are GPU-composited, 60-120 FPS, and cause zero browser layout recalculations.
  - ❌ NEVER animate layout properties: `height`, `width`, `top`, `left`, `margin`, `padding`. (Use FLIP technique or `scaleY` / `max-h` transitions carefully if unavoidable).
- **Subtle Over Showy**: If an animation draws attention to itself rather than facilitating user orientation, delete it. Good motion directs focus to changed data, not to the animation itself.

---

## 2. Spring Physics Standards (Emil Kowalski Spec)

When using Framer Motion, Motion, GSAP, or CSS spring curves:

### Standard Spring Presets
- **Snappy Button / Toggle**:
  `type: "spring", stiffness: 450, damping: 35, mass: 1`
  *(Very responsive, negligible bounce, crisp settling)*.
- **Card / Modal Transition**:
  `type: "spring", stiffness: 350, damping: 30, mass: 1`
  *(Graceful ease-in, gentle organic landing)*.
- **Micro-Pop / Badge Notification**:
  `type: "spring", stiffness: 500, damping: 25, mass: 0.8`
  *(Playful micro-settle for confirmations and alerts)*.

### CSS Bezier Fallbacks
When using native Tailwind/CSS transitions:
- Quick entrance/exit: `transition-all duration-150 ease-out`
- Content fade/scale: `transition-opacity duration-200 cubic-bezier(0.16, 1, 0.3, 1)`

---

## 3. Micro-Interaction Polish Patterns

### 1. The Active Button Press (Scale-Down Feedback)
Give buttons tactile weight when clicked:
```tsx
className="transition-all duration-150 active:scale-[0.98] hover:brightness-110 cursor-pointer"
```

### 2. Card Hover Lift & Border Shimmer
```tsx
className="rounded-xl border border-slate-800 bg-[#0E1117] transition-all duration-200 hover:border-slate-600 hover:-translate-y-0.5"
```

### 3. Tab Indicator Sliding (Layout Transition)
When switching between tabs (e.g. *Làm trắc nghiệm 60 câu* vs *Tự chỉnh 6 miền*):
- Highlight active pill with instant color change or smooth `layoutId` pill glide.
- Content cross-fades gently without abrupt vertical jumps.

### 4. Audio Feedback (Defensive Sfx)
- Pair key milestone clicks (e.g., *Chốt chọn ngành*, *Xác nhận Mật mã*) with subtle, pleasant click/success frequencies (< 100ms duration).
- Always wrap audio calls in guarded proxies to prevent any synchronous TypeError from ever halting UI logic.

---

## 4. Accessibility: Prefers-Reduced-Motion

Always respect users who suffer from vestibular disorders or prefer instant state changes:
```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
Or in Tailwind: `motion-reduce:transition-none motion-reduce:transform-none`.
