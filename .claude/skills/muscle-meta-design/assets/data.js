// =============================================================================
// MUSCLE-META MATRIX™ — SHARED BRAND DATA
// Used across Home, Design System, and standalone component embeds.
// =============================================================================

const BRAND = {
  teal: '#009090', tealDark: '#006b6b', tealLight: '#00b3b3', tealMuted: '#e6f5f5', tealTint: '#f0f9f9',
  gold: '#D4AF37', goldDark: '#B5952F', goldLight: '#e3c56a', goldMuted: '#faf6e8',
  purple: '#7c3aed', purpleDark: '#6d28d9', purpleMuted: '#f3f0fd',
  green: '#16a34a', greenDark: '#15803d', greenMuted: '#f0fdf4',
  ink: '#1a2332', inkSoft: '#344256', inkMuted: '#6b7b8f', inkFaint: '#a8b3c2',
  surface: '#f7f6f3', surfaceTint: '#fdfcfa', border: '#e8e6e1', white: '#ffffff'
};

// ----- The 5 GMMBB axes (pentagon) -------------------------------------------
// Angles positioned so G is at top (-90°), rotating clockwise.
const AXES = [
  { letter: 'G', name: 'Gut',       fullName: 'Gut Health Axis',       score: 58, angle: -90,
    desc: 'Microbiome diversity, GI inflammation, nutrient absorption efficiency.' },
  { letter: 'M', name: 'Muscle',    fullName: 'Muscle Integrity Axis', score: 81, angle: -18,
    desc: 'Lean mass retention, fiber-type composition, anabolic sensitivity.' },
  { letter: 'M', name: 'Metabolic', fullName: 'Metabolic Function Axis', score: 74, angle:  54,
    desc: 'Insulin sensitivity, mitochondrial output, metabolic flexibility.' },
  { letter: 'B', name: 'Brain',     fullName: 'Brain Health Axis',     score: 79, angle: 126,
    desc: 'Cognitive reserve, neuroplasticity markers, dual-task processing.' },
  { letter: 'B', name: 'Bone',      fullName: 'Bone-Balance Axis',     score: 62, angle: 198,
    desc: 'Bone mineral density, trabecular integrity, force absorption capacity.' }
];

// ----- The 4 Muscle-Meta Matrix pillars --------------------------------------
const PILLARS = [
  {
    id: 'exercise',
    label: 'Pillar One',
    name: 'Exercise & Mobility',
    color: BRAND.teal, colorDark: BRAND.tealDark, muted: BRAND.tealMuted,
    problem: 'Sarcopenia, mobility loss, force decline',
    desc: 'Lean mass preservation, neuromuscular coordination, and force absorption capacity.',
    tags: ['Sarcopenia', 'VILPA Protocol', 'Force Absorption', 'VO₂ Max'],
    // iconKind drives the SVG rendered in PillarIcon — no emoji
    iconKind: 'force'
  },
  {
    id: 'nutrition',
    label: 'Pillar Two',
    name: 'Nutrition & Metabolism',
    color: BRAND.gold, colorDark: BRAND.goldDark, muted: BRAND.goldMuted,
    problem: 'Metabolic inflexibility, GLP-1 muscle risk',
    desc: 'Metabolic flexibility, mitochondrial output, and GLP-1 interaction — your cellular engine.',
    tags: ['Metabolic Flex', 'GLP-1 Risk', 'Gut Microbiome', 'Mito Output'],
    iconKind: 'cellular'
  },
  {
    id: 'recovery',
    label: 'Pillar Three',
    name: 'Recovery & Stress',
    color: BRAND.purple, colorDark: BRAND.purpleDark, muted: BRAND.purpleMuted,
    problem: 'Catabolic cascade, cortisol dysregulation',
    desc: 'Cortisol dysregulation, catabolic cascade management, and restorative physiology.',
    tags: ['Catabolic Risk', 'Cortisol Load', 'HRV Baseline', 'Sleep Quality'],
    iconKind: 'wave'
  },
  {
    id: 'balance',
    label: 'Pillar Four',
    name: 'Balance & Brain Health',
    color: BRAND.green, colorDark: BRAND.greenDark, muted: BRAND.greenMuted,
    problem: 'Fall risk, cognitive decline, dual-task deficit',
    desc: 'Dual-task processing, bone-balance integration, and cognitive reserve.',
    tags: ['Fall Risk', 'Dual-Task', 'Bone Density', 'Cognitive Reserve'],
    iconKind: 'neural'
  }
];

// ----- Risk tier system ------------------------------------------------------
const TIERS = [
  { n: 1, label: 'Optimized',   color: BRAND.teal,    muted: BRAND.tealMuted,   band: '85–100', copy: 'Top-decile profile. Maintenance protocols only.' },
  { n: 2, label: 'Functional',  color: '#3b82f6',     muted: '#eff6ff',         band: '70–84',  copy: 'Strong foundation. Targeted optimization wins available.' },
  { n: 3, label: 'Declining',   color: '#f59e0b',     muted: '#fef3c7',         band: '55–69',  copy: 'Measurable signals of age-related drift. Highest-leverage intervention window.' },
  { n: 4, label: 'At Risk',     color: '#f97316',     muted: '#ffedd5',         band: '40–54',  copy: 'Multiple systems under strain. Clinical protocol indicated.' },
  { n: 5, label: 'Critical',    color: '#dc2626',     muted: '#fee2e2',         band: '< 40',   copy: 'Immediate clinical consultation recommended.' }
];

function tierForScore(score) {
  if (score >= 85) return TIERS[0];
  if (score >= 70) return TIERS[1];
  if (score >= 55) return TIERS[2];
  if (score >= 40) return TIERS[3];
  return TIERS[4];
}

// ----- Pentagon math ---------------------------------------------------------
const toRad = d => d * Math.PI / 180;
const polar = (cx, cy, angle, r) => ({
  x: cx + r * Math.cos(toRad(angle)),
  y: cy + r * Math.sin(toRad(angle))
});

Object.assign(window, { BRAND, AXES, PILLARS, TIERS, tierForScore, toRad, polar });
