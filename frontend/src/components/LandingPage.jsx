import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  TrendingUp, Zap, Activity, Brain, Repeat2,
  ArrowRight, CheckCircle, Star, Users, BookOpen,
  ChevronDown, Mail, Shield, Moon, Target
} from 'lucide-react';

// ── GMMBB Axis data ──────────────────────────────────────────────────────────
const GMMBB_AXES = [
  {
    letter: 'G',
    name: 'Growth',
    tagline: 'Build strength that lasts',
    description:
      'Unlock anabolic potential through evidence-based progressive overload, protein timing, and hormonal optimisation. Sustainable muscle growth is the foundation of long-term metabolic health.',
    icon: TrendingUp,
    color: 'emerald',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    badgeBg: 'bg-emerald-100 text-emerald-700',
    topics: ['Progressive Overload', 'Protein Synthesis', 'Hormonal Balance'],
  },
  {
    letter: 'M',
    name: 'Metabolism',
    tagline: 'Power every cell in your body',
    description:
      'Optimise insulin sensitivity, mitochondrial density, and metabolic flexibility so your body effortlessly switches between fuel sources — burning fat for energy without sacrificing performance.',
    icon: Zap,
    color: 'amber',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    badgeBg: 'bg-amber-100 text-amber-700',
    topics: ['Insulin Sensitivity', 'Mitochondrial Health', 'Fat Oxidation'],
  },
  {
    letter: 'M',
    name: 'Mobility',
    tagline: 'Move better, perform longer',
    description:
      'Joint longevity and movement quality underpin everything. Systematic mobility work reduces injury risk, improves force transfer, and keeps you active for decades.',
    icon: Activity,
    color: 'blue',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    badgeBg: 'bg-blue-100 text-blue-700',
    topics: ['Joint Health', 'Movement Quality', 'Injury Prevention'],
  },
  {
    letter: 'B',
    name: 'Brain',
    tagline: 'Sharpen cognition & resilience',
    description:
      'Exercise, sleep, and nutrition directly sculpt neuroplasticity, focus, and stress resilience. Train your brain alongside your body for compounding returns in both domains.',
    icon: Brain,
    color: 'violet',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    badgeBg: 'bg-violet-100 text-violet-700',
    topics: ['Neuroplasticity', 'Cognitive Function', 'Stress Resilience'],
  },
  {
    letter: 'B',
    name: 'Behavior',
    tagline: 'Make healthy the default',
    description:
      'Science-backed habit architecture and behaviour-change frameworks that turn optimal health choices into automatic defaults — not willpower battles.',
    icon: Repeat2,
    color: 'rose',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    badgeBg: 'bg-rose-100 text-rose-700',
    topics: ['Habit Formation', 'Behaviour Change', 'Lifestyle Design'],
  },
];

// ── Course data ───────────────────────────────────────────────────────────────
const COURSES = [
  {
    id: 'pickleball-3p-system',
    title: 'The Science Behind the 3P System',
    subtitle: 'Preparation · Prevention · Performance',
    instructor: 'Randy Bauer, PT',
    price: 197,
    originalPrice: 297,
    rating: 4.9,
    students: 2847,
    duration: '4 modules',
    featured: true,
    axes: ['Mobility', 'Growth', 'Behavior'],
    outcomes: [
      '70% documented injury reduction',
      '25–40% performance improvement',
      'Complete movement-assessment mastery',
    ],
    route: '/courses/pickleball-3p-system',
    accentBg: 'from-blue-600 to-indigo-700',
    icon: Target,
  },
  {
    id: 'sleep-optimization',
    title: 'The 4-Week Sleep Optimization Blueprint',
    subtitle: 'Reclaiming Your Rest & Vitality',
    instructor: 'Randy Bauer, PT',
    price: 97,
    originalPrice: 147,
    rating: 4.9,
    students: 1247,
    duration: '4 weeks · 16 lessons',
    featured: false,
    axes: ['Brain', 'Metabolism', 'Behavior'],
    outcomes: [
      'Fall asleep within 15 min consistently',
      'Boost morning energy to 7+/10',
      'Master data-driven sleep optimisation',
    ],
    route: '/courses/sleep-optimization',
    accentBg: 'from-violet-600 to-purple-700',
    icon: Moon,
  },
];

// ── Newsletter teasers ────────────────────────────────────────────────────────
const NEWSLETTERS = [
  {
    issue: '#43',
    title: "Unlocking Longevity: The Metabolic Magic of HIIT",
    topics: ['Insulin Sensitivity', 'Mitochondrial Health', 'Time-Efficient Training'],
    route: '/hiit-longevity',
    featured: true,
    color: 'text-amber-600',
    bg: 'bg-amber-100',
  },
  {
    issue: '#42',
    title: "Unlock Your Muscle's Metabolic Potential",
    topics: ['Metabolic Nutrition', 'Exercise Protocols', 'Recovery & Sleep'],
    route: '/muscle-metabolic-health',
    featured: false,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
  },
];

// ── Social proof stats ────────────────────────────────────────────────────────
const STATS = [
  { value: '4,000+', label: 'Community Members' },
  { value: '43', label: 'Newsletter Issues' },
  { value: '4.9★', label: 'Average Rating' },
  { value: '95%', label: 'Satisfaction Rate' },
];

// ─────────────────────────────────────────────────────────────────────────────

const LandingPage = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-gray-900 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900 leading-tight">
              Muscle-Meta<br />
              <span className="text-sm font-medium text-gray-500">Matrix Platform</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#axis" className="hover:text-gray-900 transition-colors">GMMBB Axis</a>
            <Link to="/courses" className="hover:text-gray-900 transition-colors">Courses</Link>
            <a href="#newsletter" className="hover:text-gray-900 transition-colors">Newsletter</a>
            <Link to="/admin" className="text-red-500 hover:text-red-700 transition-colors text-xs">Admin</Link>
          </div>
          <Link to="/courses">
            <Button size="sm" className="bg-gray-900 hover:bg-gray-700 text-white rounded-lg px-5">
              Explore Courses
            </Button>
          </Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white">
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
          <Badge className="mb-6 bg-white/10 text-white border border-white/20 text-sm px-4 py-1.5 rounded-full">
            Evidence-Based · Randy Bauer, PT
          </Badge>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6">
            Unlock Your Full
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-amber-400 to-violet-400 bg-clip-text text-transparent">
              Health Potential
            </span>
          </h1>

          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed mb-10">
            The <strong className="text-white">GMMBB Axis</strong> is our five-pillar framework for
            optimising <strong className="text-white">G</strong>rowth,
            &nbsp;<strong className="text-white">M</strong>etabolism,
            &nbsp;<strong className="text-white">M</strong>obility,
            &nbsp;<strong className="text-white">B</strong>rain, and
            &nbsp;<strong className="text-white">B</strong>ehavior — the five levers that determine
            your long-term vitality.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a href="#axis">
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-8 py-4 text-base rounded-xl">
                Explore the GMMBB Axis
                <ChevronDown className="ml-2 w-4 h-4" />
              </Button>
            </a>
            <Link to="/courses">
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10 font-semibold px-8 py-4 text-base rounded-xl"
              >
                View Courses
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-gray-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GMMBB AXIS ──────────────────────────────────────────────────── */}
      <section id="axis" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gray-200 text-gray-700 text-sm px-4 py-1.5 rounded-full">
              The Framework
            </Badge>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              The GMMBB Axis
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Five interconnected pillars — each scientifically validated, each essential.
              Neglect one and the others plateau. Optimise all five and your health compounds.
            </p>
          </div>

          {/* Axis cards */}
          <div className="grid md:grid-cols-5 gap-4 mb-12">
            {GMMBB_AXES.map((axis) => {
              const Icon = axis.icon;
              return (
                <Card
                  key={axis.name}
                  className={`${axis.bg} ${axis.border} border-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
                >
                  <CardHeader className="pb-3 text-center">
                    <div className={`w-14 h-14 ${axis.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
                      <Icon className={`w-7 h-7 ${axis.iconColor}`} />
                    </div>
                    <div className="text-4xl font-black text-gray-900 leading-none mb-1">
                      {axis.letter}
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-900">{axis.name}</CardTitle>
                    <p className="text-xs text-gray-500 font-medium">{axis.tagline}</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 leading-relaxed mb-4 text-center">
                      {axis.description}
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {axis.topics.map((topic) => (
                        <span
                          key={topic}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium text-center ${axis.badgeBg}`}
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* How the axes connect */}
          <Card className="bg-gradient-to-r from-slate-900 to-gray-900 text-white border-0">
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-4">Why all five axes matter</h3>
                  <p className="text-gray-300 leading-relaxed mb-6">
                    The GMMBB Axis treats your body as a complex adaptive system.
                    Improving sleep (Brain) boosts Growth hormone. Better Mobility means
                    safer training loads — which fuels Metabolism. Sustainable Behavior change
                    makes all other improvements permanent. The axes multiply, not just add.
                  </p>
                  <Link to="/courses">
                    <Button className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-6 py-3 rounded-lg">
                      Start Your Journey
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { axes: 'Growth × Metabolism', insight: 'More muscle tissue = higher resting metabolic rate' },
                    { axes: 'Mobility × Brain', insight: 'Movement diversity triggers neuroplasticity & learning' },
                    { axes: 'Brain × Behavior', insight: 'Better sleep = stronger willpower & habit formation' },
                    { axes: 'Metabolism × Growth', insight: 'Metabolic flexibility maximises muscle protein synthesis' },
                  ].map((item) => (
                    <div key={item.axes} className="bg-white/10 rounded-xl p-4 flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-white mb-0.5">{item.axes}</div>
                        <div className="text-xs text-gray-400">{item.insight}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── COURSES ─────────────────────────────────────────────────────── */}
      <section id="courses" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gray-100 text-gray-700 text-sm px-4 py-1.5 rounded-full">
              Courses
            </Badge>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Programmes Built on the Axis
            </h2>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Each course targets multiple GMMBB axes simultaneously for compounding results.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {COURSES.map((course) => {
              const Icon = course.icon;
              return (
                <Card
                  key={course.id}
                  className={`relative overflow-hidden border-2 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 ${course.featured ? 'border-blue-300' : 'border-gray-200'}`}
                >
                  {course.featured && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                        Featured
                      </Badge>
                    </div>
                  )}

                  {/* Gradient header */}
                  <div className={`bg-gradient-to-br ${course.accentBg} p-8 text-white`}>
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-1">{course.title}</h3>
                    <p className="text-white/80 text-sm mb-4">{course.subtitle}</p>
                    <div className="flex flex-wrap gap-2">
                      {course.axes.map((axis) => (
                        <span key={axis} className="text-xs bg-white/20 px-3 py-1 rounded-full font-medium">
                          {axis} Axis
                        </span>
                      ))}
                    </div>
                  </div>

                  <CardContent className="p-6">
                    {/* Meta row */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-5">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        {course.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {course.students.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {course.duration}
                      </span>
                    </div>

                    {/* Outcomes */}
                    <ul className="space-y-2 mb-6">
                      {course.outcomes.map((o) => (
                        <li key={o} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          {o}
                        </li>
                      ))}
                    </ul>

                    {/* Pricing + CTA */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-extrabold text-gray-900">${course.price}</span>
                        <span className="text-sm text-gray-400 line-through ml-2">${course.originalPrice}</span>
                      </div>
                      <Link to={course.route}>
                        <Button className="bg-gray-900 hover:bg-gray-700 text-white font-semibold px-6 py-2.5 rounded-lg">
                          Enroll Now
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                      </Link>
                    </div>

                    <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      30-day money-back guarantee · by {course.instructor}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <Link to="/courses">
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 rounded-xl">
                View Full Course Catalogue
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ──────────────────────────────────────────────────── */}
      <section id="newsletter" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gray-200 text-gray-700 text-sm px-4 py-1.5 rounded-full">
              Newsletter
            </Badge>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              MetaboFit Weekly
            </h2>
            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              In-depth, science-backed breakdowns on each GMMBB axis — delivered free every week.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {NEWSLETTERS.map((nl) => (
              <Card
                key={nl.issue}
                className={`border hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${nl.featured ? 'border-amber-300' : 'border-gray-200'}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`w-10 h-10 ${nl.bg} ${nl.color} rounded-xl flex items-center justify-center font-bold text-sm`}>
                      {nl.issue}
                    </span>
                    {nl.featured && (
                      <Badge className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5">Latest Issue</Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-900 leading-snug">
                    {nl.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2 mb-5">
                    {nl.topics.map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                        {t}
                      </Badge>
                    ))}
                  </div>
                  <Link to={nl.route}>
                    <Button
                      variant="outline"
                      className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                    >
                      Read Issue
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Subscribe CTA */}
          <Card className="bg-gradient-to-br from-slate-900 to-gray-900 text-white border-0">
            <CardContent className="p-8 md:p-12 text-center">
              <Mail className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-2xl md:text-3xl font-bold mb-3">
                Get the GMMBB Axis in Your Inbox
              </h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Join 4,000+ readers receiving science-backed insights every week.
                No fluff. No spam. Just actionable strategies across all five axes.
              </p>

              {subscribed ? (
                <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold text-lg">
                  <CheckCircle className="w-6 h-6" />
                  You're subscribed! Check your inbox.
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400 transition-colors text-sm"
                  />
                  <Button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-6 py-3 rounded-lg whitespace-nowrap"
                  >
                    Subscribe Free
                  </Button>
                </form>
              )}

              <p className="text-xs text-gray-600 mt-4">
                No credit card required. Unsubscribe anytime.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── PROOF / WHY US ──────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              {
                icon: Shield,
                title: 'Evidence-Based',
                body: 'Every protocol grounded in peer-reviewed research. No broscience.',
                iconBg: 'bg-blue-100',
                iconColor: 'text-blue-600',
              },
              {
                icon: Users,
                title: 'Expert-Led',
                body: 'Randy Bauer, PT brings two decades of clinical and performance experience.',
                iconBg: 'bg-emerald-100',
                iconColor: 'text-emerald-600',
              },
              {
                icon: TrendingUp,
                title: 'Measurable Results',
                body: 'Programmes come with objective tracking tools so you see real progress.',
                iconBg: 'bg-amber-100',
                iconColor: 'text-amber-600',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex flex-col items-center">
                  <div className={`w-16 h-16 ${item.iconBg} rounded-2xl flex items-center justify-center mb-5`}>
                    <Icon className={`w-8 h-8 ${item.iconColor}`} />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h4>
                  <p className="text-gray-600 leading-relaxed text-sm max-w-xs">{item.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="bg-gray-950 text-gray-400 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-white font-bold text-sm">Muscle-Meta Matrix</div>
                <div className="text-xs text-gray-600">The GMMBB Axis Platform</div>
              </div>
            </div>

            <nav className="flex flex-wrap justify-center gap-6 text-sm">
              <a href="#axis" className="hover:text-white transition-colors">GMMBB Axis</a>
              <Link to="/" className="hover:text-white transition-colors">Newsletter Hub</Link>
              <Link to="/courses" className="hover:text-white transition-colors">Courses</Link>
              <a href="#newsletter" className="hover:text-white transition-colors">Subscribe</a>
              <Link to="/admin" className="text-red-500 hover:text-red-400 transition-colors text-xs">Admin</Link>
            </nav>

            <p className="text-xs text-gray-700">
              © {new Date().getFullYear()} Muscle-Meta Matrix · Randy Bauer, PT
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
