# MM™ Component Patterns Reference

Full implementation patterns for canonical MM™ components.
Read this when building any UI element — copy patterns exactly, adapting content only.

---

## Google Fonts — Load in Every Build

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

## Eyebrow + Heading Pattern

```html
<p class="eyebrow">Clinical Assessment</p>
<h2>Reclaim your strength on your terms</h2>
<p class="lede">Your comprehensive roadmap to optimizing muscle-metabolic health.</p>
```

Rule: eyebrow is always teal, sentence case (except after eyebrow). Headings: Cormorant Garamond. Lede: Outfit regular 19px.

---

## Button Variants

```html
<!-- Primary — teal fill, pill, gold border hover -->
<button class="mmm-btn mmm-btn-primary">Take the assessment</button>
<button class="mmm-btn mmm-btn-primary mmm-btn-lg">Discover your personalized path</button>

<!-- Ghost — transparent, teal border on hover -->
<button class="mmm-btn mmm-btn-ghost">Learn more</button>

<!-- Gold — for achievement/milestone moments only -->
<button class="mmm-btn mmm-btn-gold">View your results</button>

<!-- Dark — ink background -->
<button class="mmm-btn mmm-btn-dark">Download report</button>
```

---

## Card Pattern

```html
<div class="mmm-card mmm-card-hover">
  <p class="eyebrow">Pillar One</p>
  <h4>Exercise & Mobility</h4>
  <p>Lean mass preservation, neuromuscular coordination, and force absorption capacity.</p>
</div>
```

Cards: white fill, `--border`, `--r-3` (14px), `--shadow-sm`. Hover: `translateY(-3px)` + `--shadow-lg`.

---

## Pillar Color Card (Assessment Result)

```html
<div style="
  background: var(--teal-muted);
  border: 1.5px solid var(--teal);
  border-radius: var(--r-3);
  padding: var(--s-6);
">
  <div style="display:flex; align-items:center; gap: var(--s-3); margin-bottom: var(--s-4);">
    <!-- PillarIcon kind="force" color="#009090" -->
    <div>
      <p class="eyebrow">Pillar One</p>
      <h4 style="color: var(--teal);">Exercise & Mobility</h4>
    </div>
  </div>
  <div style="font-size: 48px; font-family: var(--font-display); color: var(--teal); font-weight: 700;">78</div>
  <p class="eyebrow-muted" style="margin-top: var(--s-2);">Functional • 70–84</p>
</div>
```

Use pillar's color for border + heading + score number. Use pillar's muted for background.

---

## Risk Tier Badge

```html
<!-- Tier 3 example — Declining -->
<span style="
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 14px;
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #f59e0b;
  border-radius: var(--r-pill);
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
">
  <span style="width:6px;height:6px;border-radius:50%;background:#f59e0b;flex-shrink:0;"></span>
  Declining
</span>
```

Always: dot indicator + label. Use tier color for dot + border. Use tier muted for background. Text: slightly darkened tier color.

---

## Frosted Glass Nav (HTML)

```html
<header id="nav" style="
  position: fixed; top: 0; left: 0; right: 0; z-index: 50;
  background: rgba(247, 246, 243, 0.72);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid transparent;
  transition: all 300ms ease;
">
  <div class="mmm-container" style="display:flex; align-items:center; justify-content:space-between; padding: 18px 32px;">
    <!-- Logo wordmark -->
    <a href="#" style="font-family: var(--font-display); font-size: 22px; font-weight: 700; color: var(--ink); text-decoration:none;">
      Muscle-Meta Matrix<sup style="font-size:10px; color: var(--teal);">™</sup>
    </a>
    <!-- CTA -->
    <button class="mmm-btn mmm-btn-primary">Take the assessment</button>
  </div>
</header>
<script>
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      nav.style.background = 'rgba(247, 246, 243, 0.88)';
      nav.style.borderBottomColor = 'rgba(0,144,144,0.15)';
    } else {
      nav.style.background = 'rgba(247, 246, 243, 0.72)';
      nav.style.borderBottomColor = 'transparent';
    }
  }, { passive: true });
</script>
```

---

## Grain Texture (Hero backgrounds)

```html
<section style="position:relative;">
  <!-- Content goes here -->
  <!-- Grain overlay — always last child -->
  <div style="
    position: absolute; inset: 0; pointer-events: none; z-index: 1;
    opacity: 0.018;
    background-image: url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\");
    mix-blend-mode: multiply;
  "></div>
</section>
```

---

## Scroll Reveal

```html
<div class="mmm-reveal">Content here</div>
<div class="mmm-reveal mmm-reveal-delay-1">Staggered content</div>

<script>
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('is-visible'); });
}, { threshold: 0.15 });
document.querySelectorAll('.mmm-reveal').forEach(el => revealObserver.observe(el));
</script>
```

---

## Pillar Icons (SVG — no emoji ever)

```javascript
// kind: 'force' | 'cellular' | 'wave' | 'neural'
// Pillar 1 → force (teal), Pillar 2 → cellular (gold)
// Pillar 3 → wave (purple), Pillar 4 → neural (green)
function PillarIcon({ kind, color = '#009090', size = 28 }) {
  const s = { width: size, height: size, fill: 'none', stroke: color,
               strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const icons = {
    force: <svg viewBox="0 0 32 32" {...s}>
             <path d="M4 22 L12 14 L18 20 L28 10"/>
             <circle cx="12" cy="14" r="1.6" fill={color} stroke="none"/>
             <circle cx="18" cy="20" r="1.6" fill={color} stroke="none"/>
             <path d="M24 10 L28 10 L28 14"/>
           </svg>,
    cellular: <svg viewBox="0 0 32 32" {...s}>
                <path d="M16 4 C10 10 8 14 8 19 C8 24 11.5 28 16 28 C20.5 28 24 24 24 19 C24 14 22 10 16 4 Z"/>
                <path d="M16 12 C13 15 12 17 12 20 C12 23 13.8 25 16 25 C18.2 25 20 23 20 20 C20 17 19 15 16 12 Z" opacity="0.5"/>
              </svg>,
    wave: <svg viewBox="0 0 32 32" {...s}>
            <path d="M3 12 Q8 6 13 12 T23 12 T29 12"/>
            <path d="M3 20 Q8 14 13 20 T23 20 T29 20" opacity="0.6"/>
            <path d="M3 26 Q8 22 13 26 T23 26 T29 26" opacity="0.35"/>
          </svg>,
    neural: <svg viewBox="0 0 32 32" {...s}>
              <circle cx="16" cy="16" r="11"/>
              <path d="M16 5 L16 27 M5 16 L27 16" strokeDasharray="2 3" opacity="0.5"/>
              <circle cx="16" cy="10" r="1.8" fill={color} stroke="none"/>
              <circle cx="10" cy="20" r="1.8" fill={color} stroke="none"/>
              <circle cx="22" cy="20" r="1.8" fill={color} stroke="none"/>
              <path d="M16 10 L10 20 L22 20 Z" opacity="0.4"/>
            </svg>
  };
  return icons[kind] || icons.force;
}
```

---

## Mini Assessment Flow Pattern

Standard 3-step assessment structure:
1. **Screener** — 5 quick questions, pillar targeting
2. **Profile reveal** — radar graph or bar visualization
3. **Personalized CTA** — tier-appropriate recommendation

Assessment microcopy rules:
- Progress: "Question 2 of 5" (never "Step 2/5")
- Answer labels: plain language (never medical codes)
- Encouragement: "You're doing great. Two more." (not "80% complete")
- Empty state: "No assessments yet. When you're ready, we'll walk through it together — it takes about eight minutes."
- Result reveal: never "your score is X" — instead "here's where you stand" or "your profile shows..."

---

## Section Layout Pattern (Full Page)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MM™ — [Page Title]</title>
  [Google Fonts link]
  <style>
    [Full tokens.css content inline]
    [Page-specific styles]
  </style>
</head>
<body class="mmm-grain">
  [Frosted Nav]
  
  <main style="padding-top: 80px;">
    <!-- Hero Section -->
    <section class="mmm-section" style="background: var(--surface);">
      <div class="mmm-container">
        <p class="eyebrow mmm-reveal">Clinical Intelligence for Active Aging</p>
        <h1 class="mmm-reveal mmm-reveal-delay-1">Reclaim your strength,<br><em class="serif-italic">on your terms.</em></h1>
        <p class="lede mmm-reveal mmm-reveal-delay-2">Your comprehensive roadmap to optimizing muscle-metabolic health and lasting vitality.</p>
        <button class="mmm-btn mmm-btn-primary mmm-btn-lg mmm-reveal mmm-reveal-delay-3">Discover your personalized path</button>
      </div>
    </section>

    <!-- Content Sections -->
    [Additional sections with mmm-section class]
  </main>
  
  [Footer]
  [Scroll reveal script]
</body>
</html>
```

---

## Copy Voice Quick Reference

| Context | ✅ Do | ❌ Don't |
|---|---|---|
| Hero headline | "Reclaim your strength at any age" | "Feel 20 again!" |
| CTA | "Discover your personalized path" | "Sign Up Now!" |
| Assessment prompt | "Let's see where you stand" | "Find out your score" |
| Result: good | "You're in a strong position here" | "You crushed it!" |
| Result: gap | "This is your highest-leverage area" | "You're failing here" |
| Risk tier 5 | "We recommend connecting with a clinician" | "You're in critical condition!" |
| Progress | "Two more questions" | "80% complete" |
| Encouragement | "Nice work. That's three weeks in a row." | "Keep grinding!" |
