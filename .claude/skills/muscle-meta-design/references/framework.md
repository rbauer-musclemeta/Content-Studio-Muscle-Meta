# MM™ Framework Reference — Authoritative Architecture

**DO NOT MODIFY.** This is the canonical source for all MM™ framework data.
Any UI displaying pillars, categories, GMMBB, tiers, or overlays must match this exactly.

---

## Layer 1 — The 4 Pillars × 12 Categories (PRIMARY ARCHITECTURE)

The Radar Graph showing all 4 pillars simultaneously is the PRIMARY visual.
Gaps in the radar = intentional growth signals → "Short Steps, Exponential Growth"

### Pillar 1 — Exercise & Mobility
- **Color:** Teal `#009090` / `--teal`
- **Icon kind:** `force`
- **Pillar letter (radar):** E (top, angle: -90°)
- **Problem framing:** Sarcopenia, mobility loss, force decline
- **Belief narrative:** "The Power Lie"
- **Categories:**
  1. Joint Health (score example: 82)
  2. Functional Independence (score example: 79)
  3. Strength & Endurance (score example: 73)
- **Clinical tags:** Sarcopenia, VILPA Protocol, Force Absorption, VO₂ Max

### Pillar 2 — Nutrition & Metabolism
- **Color:** Gold `#D4AF37` / `--gold`
- **Icon kind:** `cellular`
- **Pillar letter (radar):** N (right, angle: 0°)
- **Problem framing:** Metabolic inflexibility, GLP-1 muscle risk
- **Belief narrative:** "The Fuel Betrayal"
- **Categories:**
  1. Metabolic Flexibility (score example: 68)
  2. Gut Microbiome (score example: 61)
  3. Nutrient Density (score example: 63)
- **Clinical tags:** Metabolic Flex, GLP-1 Risk, Gut Microbiome, Mito Output

### Pillar 3 — Recovery & Stress
- **Color:** Purple `#7c3aed` / `--purple`
- **Icon kind:** `wave`
- **Pillar letter (radar):** R (bottom, angle: 90°)
- **Problem framing:** Catabolic cascade, cortisol dysregulation
- **Belief narrative:** "The Invisible Crisis"
- **Categories:**
  1. Sleep Quality (score example: 58)
  2. HRV Baseline (score example: 64)
  3. Cortisol Regulation (score example: 61)
- **Clinical tags:** Catabolic Risk, Cortisol Load, HRV Baseline, Sleep Quality

### Pillar 4 — Balance & Brain Health
- **Color:** Green `#16a34a` / `--green`
- **Icon kind:** `neural`
- **Pillar letter (radar):** B (left, angle: 180°)
- **Problem framing:** Fall risk, cognitive decline, dual-task deficit
- **Belief narrative:** "The Cognitive Cliff"
- **Categories:**
  1. Dual-Task Processing (score example: 85)
  2. Bone Density (score example: 78)
  3. Cognitive Reserve (score example: 83)
- **Clinical tags:** Fall Risk, Dual-Task, Bone Density, Cognitive Reserve

### Radar Graph Geometry
- Diamond orientation: E top / N right / R bottom / B left
- Render optimal score ring + user score polygon
- Color pillar areas by pillar color
- Radar gaps = intentional signals, label as "growth opportunity"

---

## Layer 2 — Modifying Factors (6 factors, NOT separate pillars)

These factors influence category scores within the 4-pillar framework.
They are NOT displayed as additional pillars. They modify scoring weights.

1. **Gut Health** — affects Pillar 2 (Gut Microbiome category)
2. **Bone Reserve** — affects Pillar 4 (Bone Density category)
3. **Hormonal Balance** — affects Pillar 1 & 2 scoring
4. **Mitochondrial Function** — affects Pillar 1 & 2 (cellular energy)
5. **Inflammation Status** — affects all pillars (systemic modifier)
6. **Neurological Reserve** — affects Pillar 4 (cognitive/balance)

---

## GMMBB Axis — 5-Axis Pentagon (Layer 2 Interconnected View)

**Critical:** GMMBB is ONE interconnected view among others, NOT the primary architecture.
Display as a pentagon (not radar). The radar graph is primary.

### 5 Axes
- **G — Gut Health Axis** (Gut): angle -90° (top)
  - Microbiome diversity, GI inflammation, nutrient absorption efficiency
- **M — Muscle Integrity Axis** (Muscle): angle -18°
  - Lean mass retention, fiber-type composition, anabolic sensitivity
- **M — Metabolic Function Axis** (Metabolic): angle 54°
  - Insulin sensitivity, mitochondrial output, metabolic flexibility
- **B — Brain Health Axis** (Brain): angle 126°
  - Cognitive reserve, neuroplasticity markers, dual-task processing
- **B — Bone-Balance Axis** (Bone): angle 198°
  - Bone mineral density, trabecular integrity, force absorption capacity

### Pentagon Math
```javascript
const toRad = d => d * Math.PI / 180;
const polar = (cx, cy, angle, r) => ({
  x: cx + r * Math.cos(toRad(angle)),
  y: cy + r * Math.sin(toRad(angle))
});
```

---

## Layer 3 — Population Overlays (live WITHIN the framework)

These overlays RE-WEIGHT category priorities. They do NOT add new pillars or categories.
Overlays can STACK (e.g., a pickleball player on GLP-1 = both overlays active simultaneously).

1. **Pickleball Overlay** — elevates: Joint Health, Dual-Task, Force Absorption
2. **Osteoporosis Overlay** — elevates: Bone Density, Functional Independence, Fall Risk
3. **GLP-1 Overlay** — elevates: Metabolic Flexibility, Lean Mass, Nutrient Density
4. **Post-Hospital Overlay** — elevates: Functional Independence, Sleep Quality, Cortisol

---

## 5-Tier Risk Stratification System (CCRAF)

Score → tier mapping is a hard function. Do not round or approximate.

```javascript
function tierForScore(score) {
  if (score >= 85) return TIERS[0]; // Optimized
  if (score >= 70) return TIERS[1]; // Functional
  if (score >= 55) return TIERS[2]; // Declining
  if (score >= 40) return TIERS[3]; // At Risk
  return TIERS[4];                  // Critical
}
```

| Tier | Label | Color | Muted | Score Band | Clinical Copy |
|------|-------|-------|-------|-----------|---------------|
| 1 | Optimized | `#009090` | `#e6f5f5` | 85–100 | Top-decile profile. Maintenance protocols only. |
| 2 | Functional | `#3b82f6` | `#eff6ff` | 70–84 | Strong foundation. Targeted optimization wins available. |
| 3 | Declining | `#f59e0b` | `#fef3c7` | 55–69 | Measurable signals of age-related drift. Highest-leverage intervention window. |
| 4 | At Risk | `#f97316` | `#ffedd5` | 40–54 | Multiple systems under strain. Clinical protocol indicated. |
| 5 | Critical | `#dc2626` | `#fee2e2` | < 40 | Immediate clinical consultation recommended. |

---

## Key Convergence Patterns (Content Engine)

Named patterns that emerge when multiple categories align. Use in personalized content.

- **Catabolic Cascade** — Cortisol high + Sleep low + HRV low (Pillar 3 triple-low)
- **Mitochondrial Crisis** — Metabolic Flex low + Mito Output low + Gut low
- **Osteosarcopenic Frailty** — Bone Density low + Strength low + Fall Risk high
- **Anabolic Resistance Pattern** — Nutrient Density low + Lean Mass low + GLP-1 present
- **Neuromotor Drift** — Dual-Task low + Cognitive Reserve low + Balance declining

---

## Brand Mantra
> "Short Steps, Exponential Growth."

Radar gaps are never presented as failures — always as the highest-leverage intervention opportunity.
