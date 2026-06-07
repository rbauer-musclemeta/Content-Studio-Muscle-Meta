---
name: muscle-meta-design
description: >
  Master design system skill for the Muscle-Meta Matrix™ (MM™) platform. Use this skill
  WHENEVER Randy asks to build, create, style, convert, redesign, brand, or generate any
  visual artifact — including HTML tools, Claude artifacts (JSX), Netlify pages, landing
  sections, assessments, handouts, dashboards, cards, modals, emails, or any UI element.
  Also trigger when Randy says things like "make it match the brand," "use the design
  system," "follow the MM™ style," "build me a component," "convert this to branded HTML,"
  or references any visual output for the MM™ platform. This skill enforces TWO non-negotiable
  laws: (1) brand tokens are absolute — no colors, fonts, or spacing outside the design
  system, and (2) MM™ framework integrity — pillars, categories, risk tiers, and GMMBB
  axis must always be architecturally correct.
---

# Muscle-Meta Matrix™ — Design System Skill

**Clinical Intelligence for Active Aging**
*Randy Bauer PT | Mayo Clinic–trained | 35+ years | Area Manager So Cal*

---

## ⚡ FIRST STEP — ALWAYS ASK FORMAT

Before writing any code, ask Randy:

> "Which output format do you want?
> - **A** — Claude artifact (React JSX, renders in chat)
> - **B** — Standalone HTML (single file, Netlify-deployable)
> - **C** — Production React component (for Next.js/Convex platform)"

Do not assume. Do not skip this. Format choice drives the entire build approach.

---

## ☠️ THE TWO CARDINAL VIOLATIONS

These are the most catastrophic errors. Never commit either.

### Violation 1 — Wrong Brand Tokens
Using ANY color, font, spacing, or shadow not from `tokens.css` is a violation.
- **Fonts:** ONLY `Cormorant Garamond` (display/headings) + `Outfit` (body/UI). Never Inter, Fraunces, or system fonts alone.
- **Primary teal:** `#009090` only. Never a different teal variant for primary actions.
- **Gold:** `#D4AF37` only. Never yellow, amber, or a different gold shade for brand accents.
- **Background:** `#f7f6f3` (surface) — warm off-white, never pure white `#ffffff` as page bg.
- **Headlines:** `#1a2332` (ink). Body: `#344256` (ink-soft). Never black.

### Violation 2 — MM™ Framework Architecture Errors
- Never invent pillar names, colors, or counts. There are exactly **4 pillars** — see framework reference.
- Never show GMMBB as a separate pillar. It is a **modifying factor / interconnected axis view**.
- Never flatten the 12 categories. Each pillar has exactly **3 categories**.
- Risk tier colors are **fixed by semantic meaning** — never swap amber for orange, etc.
- Population overlays (Pickleball, Osteoporosis, GLP-1, Post-Hospital) re-weight categories; they do NOT add pillars.

→ Read `references/framework.md` for all authoritative MM™ data before building any assessment, radar, or scoring UI.

---

## 🎨 DESIGN LANGUAGE AT A GLANCE

### Core Identity
- **Clinical luxury** — not medical sterile, not wellness-soft. Warm, trustworthy, sophisticated.
- **Grain texture** (`.mmm-grain::before`) on hero sections for tactile depth.
- **Scroll reveal** (`.mmm-reveal` + IntersectionObserver) for sequential content.
- **Frosted glass nav** (backdrop-filter blur) — never opaque solid nav.

### Token Quick Reference
```
Fonts:
  Display/headings → 'Cormorant Garamond', Georgia, serif
  Body/UI          → 'Outfit', 'Helvetica Neue', Arial, sans-serif

Brand colors:
  --teal        #009090    Primary CTA, active states, links, logo
  --teal-dark   #006b6b    Hover states
  --teal-muted  #e6f5f5    Teal backgrounds, subtle fills
  --gold        #D4AF37    Achievement, milestones, accent
  --gold-dark   #B5952F    Gold hover
  --purple      #7c3aed    Pillar 3 (Recovery & Stress)
  --green       #16a34a    Pillar 4 (Balance & Brain Health)

Neutrals:
  --ink         #1a2332    Headlines
  --ink-soft    #344256    Body text
  --ink-muted   #6b7b8f    Captions, eyebrows
  --surface     #f7f6f3    Page background (warm off-white)
  --border      #e8e6e1    Default border
  --white       #ffffff    Card fills only (not page bg)

Risk tier colors (SEMANTIC — never reassign):
  Tier 1 Optimized  → #009090  (teal)
  Tier 2 Functional → #3b82f6  (blue)
  Tier 3 Declining  → #f59e0b  (amber)
  Tier 4 At Risk    → #f97316  (orange)
  Tier 5 Critical   → #dc2626  (red)

Spacing (8pt grid):
  --s-1:4px  --s-2:8px  --s-3:12px  --s-4:16px  --s-5:24px
  --s-6:32px --s-7:48px --s-8:64px  --s-9:96px  --s-10:128px

Type scale:
  eyebrow: 11px / 0.18em tracking / uppercase / Outfit semi
  caption: 12px | micro: 13px | body: 16px | lede: 19px
  h4: 22px | h3: 28px | h2: 40px | h1: 64px | display: 88px
  (Mobile: h1→40px, h2→30px, h3→24px, display→56px)

Radii:
  --r-1:6px  --r-2:10px  --r-3:14px  --r-4:20px  --r-5:28px  --r-pill:999px

Shadows:
  --shadow-sm  → default card
  --shadow-md  → hover elevation
  --shadow-lg  → modal, featured card
  --shadow-teal → primary CTA glow (0 8px 30px rgba(0,144,144,0.15))
  --shadow-gold → gold accent glow

Motion:
  Easing: cubic-bezier(0.16, 1, 0.3, 1)  (ease-out)
  Fast: 150ms | Base: 240ms | Slow: 420ms | Reveal: 900ms
  Always add: @media (prefers-reduced-motion: reduce) overrides
```

→ Full canonical token file: `assets/tokens.css` — embed inline when building standalone HTML.

---

## 🧱 CANONICAL COMPONENT PATTERNS

Read `references/components.md` for full implementation details. Summary:

| Component | Class/Pattern | Notes |
|---|---|---|
| Button Primary | `.mmm-btn.mmm-btn-primary` | Teal fill, pill radius, gold border on hover |
| Button Ghost | `.mmm-btn.mmm-btn-ghost` | Transparent, teal on hover |
| Button Gold | `.mmm-btn.mmm-btn-gold` | Gold fill, for milestone/achievement actions |
| Card | `.mmm-card` | White fill, `--border`, `--r-3`, `--shadow-sm` |
| Card hover | `.mmm-card.mmm-card-hover` | `translateY(-3px)` + `--shadow-lg` |
| Container | `.mmm-container` | max-width 1200px, `--gutter` padding |
| Section | `.mmm-section` | `96px` top/bottom padding |
| Eyebrow | `.eyebrow` | 11px / uppercase / teal / 0.18em tracking |
| Frosted Nav | `FrostedNav` pattern | Blur 16px, scrolled border teal-15% |
| Pillar icons | `PillarIcon` kinds | force, cellular, wave, neural — SVG, no emoji |
| Radar graph | `FourPillarMatrix` | Diamond orientation (E top, N right, R bottom, B left) |
| Pentagon | `GMMBBPentagon` | G top, clockwise: G-M-M-B-B |
| Risk badge | Tier badge pattern | Pill shape, tier color fill, muted bg variant |

**Production components available in:** `assets/data.js` (BRAND, PILLARS, AXES, TIERS, tierForScore)

---

## ✍️ CLINICAL VOICE RULES

### Must Use
- **Sentence case** always (headings, buttons, labels, nav). Exception: "Muscle-Meta Matrix™" always capitalized.
- Address reader as **you**. Speak as **we** for the product/team.
- Promise words: *reclaim, rebuild, renew, restore, vitality, strength, independence, thriving*
- Structure words: *roadmap, path, journey, step*
- Agency words: *your body, your pace, your terms*

### Never Use
- Emoji anywhere in product UI or marketing copy
- Fear copy: "before it's too late," "don't let this happen"
- Youth worship: "feel 20 again," "anti-aging"
- Hustle language: "crush it," "no excuses," "beast mode"
- Clinical jargon without plain-language explanation
- Generic filler: "holistic journey to your best self"
- Title Case headings

### CTA Voice Examples
- ✅ "Discover your personalized path" / "Take the assessment" / "Start your roadmap"
- ❌ "Sign Up Now!" / "Get Started!" / "Join Today!"

---

## 📐 BUILD CHECKLIST

Before delivering any output, verify:

- [ ] Format confirmed with Randy (JSX / standalone HTML / production React)
- [ ] Google Fonts CDN loaded: Cormorant Garamond 400,600,700italic + Outfit 400,500,600,700
- [ ] `tokens.css` embedded or imported (standalone HTML: inline in `<style>`)
- [ ] No colors, fonts, or spacing outside the token system
- [ ] Page background is `--surface` (#f7f6f3), not white
- [ ] Headlines use `--font-display`, body uses `--font-body`
- [ ] Mobile breakpoint at 768px with responsive type scale
- [ ] `prefers-reduced-motion` override included for animations
- [ ] Minimum body font: 16px. Min hit targets: 44×44px
- [ ] WCAG AA contrast on all text (critical text: target AAA 7:1)
- [ ] If MM™ framework visible: pillar count = 4, categories = 3 per pillar, GMMBB = 5-axis pentagon
- [ ] Risk tier colors match semantic system exactly
- [ ] No emoji anywhere
- [ ] CTA copy follows clinical voice (sentence case, agency language)

---

## 🔀 OUTPUT FORMAT GUIDE

### Format A — Claude Artifact (React JSX)
- Single `.jsx` file with default export
- Tailwind via CDN or inline styles only (no separate CSS files in artifacts)
- Import from: `react`, `lucide-react`, recharts if needed
- Include `BRAND`, `PILLARS`, `TIERS`, `tierForScore` inline (copy from `assets/data.js`)
- Font: load via `<style>` tag inside component using `@import url(Google Fonts CDN)`

### Format B — Standalone HTML (Netlify)
- Single `.html` file, complete and self-contained
- Inline ALL CSS in `<style>` (include full `tokens.css` content)
- Load Google Fonts via CDN `<link>` in `<head>`
- No external dependencies except Google Fonts + optionally Lucide CDN icons
- Script tag at bottom with vanilla JS or React via CDN (esm.sh)
- Test: must open with `file://` and render correctly

### Format C — Production React (Next.js/Convex)
- TypeScript preferred
- Import `tokens.css` from platform token file (do not inline)
- Use `data.js` PILLARS/TIERS/AXES constants
- Tailwind classes mapped to token values
- Component must be named exports, not default

---

## 📁 REFERENCE FILES

Read these when needed:
- `references/framework.md` — Authoritative MM™ 4-Pillar × 12-Category data, GMMBB axes, Modifying Factors, Population Overlays, Convergence Patterns
- `references/components.md` — Full component implementation patterns, copy examples, JSX and HTML variants
- `assets/tokens.css` — Complete canonical token file (embed this in standalone HTML builds)
- `assets/data.js` — JS constants for BRAND, PILLARS, AXES, TIERS (use in JSX/production builds)
