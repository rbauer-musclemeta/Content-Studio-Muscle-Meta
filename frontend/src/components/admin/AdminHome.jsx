/**
 * AdminHome — Unified Dashboard Landing Page
 *
 * Aggregates stats from all admin modules:
 * - Product metrics (courses, revenue, students)
 * - Research Library (citations, artifacts)
 * - Asset Library (assets, AEO scores)
 *
 * Shows recent activity and quick actions.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { BRAND } from '../../lib/brand';
import {
  BookOpen,
  Users,
  DollarSign,
  Layers,
  Quote,
  TrendingUp,
  FileText,
  Sparkles,
  ArrowRight,
  Plus,
  Upload,
  Search,
  Clock,
  AlertCircle,
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function AdminHome() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    courses: 0,
    students: 0,
    revenue: 0,
    assets: 0,
    citations: 0,
    aeoAvg: null,
    aeoAnalyzed: 0,
    researchArtifacts: 0,
    recentAssets: [],
  });

  useEffect(() => {
    loadAllStats();
  }, []);

  const loadAllStats = async () => {
    try {
      const [coursesRes, transactionsRes, assetsRes, researchRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/admin/courses`).catch(() => ({ ok: false })),
        fetch(`${BACKEND_URL}/api/payments/transactions`).catch(() => ({ ok: false })),
        fetch(`${BACKEND_URL}/api/assets/stats`).catch(() => ({ ok: false })),
        fetch(`${BACKEND_URL}/api/research/stats`).catch(() => ({ ok: false })),
      ]);

      const courses = coursesRes.ok ? await coursesRes.json() : [];
      const transactions = transactionsRes.ok ? await transactionsRes.json() : [];
      const assetStats = assetsRes.ok ? await assetsRes.json() : {};
      const researchStats = researchRes.ok ? await researchRes.json() : {};

      const paidTransactions = transactions.filter((t) => t.payment_status === 'paid');
      const totalRevenue = paidTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

      // Fetch recent assets
      const recentRes = await fetch(`${BACKEND_URL}/api/assets?limit=5`).catch(() => ({ ok: false }));
      const recentAssets = recentRes.ok ? await recentRes.json() : [];

      setStats({
        courses: courses.length,
        students: paidTransactions.length,
        revenue: totalRevenue,
        assets: assetStats.total_assets || 0,
        citations: assetStats.total_citations || 0,
        aeoAvg: assetStats.aeo_avg_score,
        aeoAnalyzed: assetStats.aeo_analyzed || 0,
        researchArtifacts: researchStats.total_artifacts || 0,
        recentAssets,
      });

      setLoading(false);
    } catch (e) {
      console.error('Error loading stats:', e);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="animate-spin rounded-full h-10 w-10 border-b-2"
          style={{ borderColor: BRAND.teal }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome header */}
      <div>
        <h1
          className="text-2xl lg:text-3xl font-bold mb-1"
          style={{ color: BRAND.ink, fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Welcome back, Randy
        </h1>
        <p style={{ color: BRAND.inkMuted }}>
          Here's an overview of your MM™ content platform.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          icon={<BookOpen className="w-5 h-5" />}
          label="Courses"
          value={stats.courses}
          color={BRAND.teal}
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Students"
          value={stats.students}
          color="#16a34a"
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Revenue"
          value={`$${stats.revenue.toFixed(0)}`}
          color={BRAND.purple}
        />
        <StatCard
          icon={<Layers className="w-5 h-5" />}
          label="Assets"
          value={stats.assets}
          color={BRAND.gold}
          link="/admin/assets"
        />
      </div>

      {/* Content metrics */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Research & Citations */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Quote className="w-4 h-4" style={{ color: BRAND.purple }} />
              Research & Citations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: BRAND.inkMuted }}>Total Citations</span>
                <span className="text-xl font-bold" style={{ color: BRAND.ink }}>{stats.citations}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: BRAND.inkMuted }}>Research Artifacts</span>
                <span className="text-xl font-bold" style={{ color: BRAND.ink }}>{stats.researchArtifacts}</span>
              </div>
              <Link to="/admin/research">
                <Button variant="outline" size="sm" className="w-full mt-2">
                  <Search className="w-4 h-4 mr-2" />
                  Open Research Library
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* AEO Health */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: BRAND.teal }} />
              AEO Readiness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: BRAND.inkMuted }}>Average Score</span>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xl font-bold"
                    style={{ color: stats.aeoAvg >= 60 ? '#16a34a' : stats.aeoAvg >= 40 ? '#f59e0b' : BRAND.inkMuted }}
                  >
                    {stats.aeoAvg != null ? stats.aeoAvg : '—'}
                  </span>
                  {stats.aeoAvg != null && <span style={{ color: BRAND.inkMuted }}>/100</span>}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: BRAND.inkMuted }}>Assets Analyzed</span>
                <span style={{ color: BRAND.ink }}>
                  {stats.aeoAnalyzed} / {stats.assets}
                </span>
              </div>
              {stats.assets > 0 && stats.aeoAnalyzed < stats.assets && (
                <div
                  className="flex items-center gap-2 text-xs p-2 rounded"
                  style={{ backgroundColor: `${BRAND.gold}15`, color: BRAND.goldDark }}
                >
                  <AlertCircle className="w-4 h-4" />
                  {stats.assets - stats.aeoAnalyzed} assets not yet analyzed
                </div>
              )}
              <Link to="/admin/assets">
                <Button variant="outline" size="sm" className="w-full mt-2">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Analyze Assets
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4" style={{ color: BRAND.gold }} />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link to="/admin/assets">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Asset
                </Button>
              </Link>
              <Link to="/admin/research">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  New Research Prompt
                </Button>
              </Link>
              <Button variant="outline" size="sm" className="w-full justify-start" disabled>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Newsletter
                <Badge variant="outline" className="ml-auto text-xs">Soon</Badge>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Assets */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Assets</CardTitle>
            <Link to="/admin/assets" className="text-sm hover:underline" style={{ color: BRAND.teal }}>
              View all <ArrowRight className="w-4 h-4 inline ml-1" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {stats.recentAssets.length === 0 ? (
            <div className="text-center py-8">
              <Layers className="w-10 h-10 mx-auto mb-3" style={{ color: BRAND.inkMuted }} />
              <p style={{ color: BRAND.inkMuted }}>No assets yet.</p>
              <Link to="/admin/assets">
                <Button className="mt-3" style={{ backgroundColor: BRAND.teal }}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload your first asset
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentAssets.map((asset) => (
                <AssetRow key={asset.id} asset={asset} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pillar Coverage (placeholder) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Content Coverage by Pillar</CardTitle>
          <CardDescription>Distribution of assets across the 4P × 12C framework</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <PillarBar
              pillar="Exercise & Mobility"
              color={BRAND.teal}
              count={3}
              total={stats.assets || 1}
            />
            <PillarBar
              pillar="Nutrition & Metabolism"
              color={BRAND.gold}
              count={5}
              total={stats.assets || 1}
            />
            <PillarBar
              pillar="Recovery & Resilience"
              color={BRAND.purple}
              count={2}
              total={stats.assets || 1}
            />
            <PillarBar
              pillar="Medical & Clinical"
              color="#16a34a"
              count={4}
              total={stats.assets || 1}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, color, link }) {
  const content = (
    <Card className={link ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}>
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${color}20` }}
          >
            <span style={{ color }}>{icon}</span>
          </div>
          <div>
            <p className="text-xl lg:text-2xl font-bold" style={{ color: BRAND.ink }}>{value}</p>
            <p className="text-sm" style={{ color: BRAND.inkMuted }}>{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return link ? <Link to={link}>{content}</Link> : content;
}

function AssetRow({ asset }) {
  const PILLAR_COLORS = {
    exercise_mobility: BRAND.teal,
    nutrition_metabolism: BRAND.gold,
    recovery_resilience: BRAND.purple,
    medical_clinical: '#16a34a',
  };

  const ASSET_LABELS = {
    research_brief: 'Brief',
    newsletter: 'Newsletter',
    research_spotlight: 'Spotlight',
    clinical_handout: 'Handout',
  };

  const pillarColor = PILLAR_COLORS[asset.pillar] || BRAND.inkMuted;
  const typeLabel = ASSET_LABELS[asset.asset_type] || asset.asset_type;

  return (
    <Link
      to="/admin/assets"
      className="flex items-center justify-between p-3 rounded-lg border hover:border-gray-300 transition-colors"
      style={{ borderColor: BRAND.border }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-2 h-10 rounded-full flex-shrink-0"
          style={{ backgroundColor: pillarColor }}
        />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: BRAND.ink }}>
            {asset.title}
          </p>
          <div className="flex items-center gap-2 text-xs" style={{ color: BRAND.inkMuted }}>
            <span>{typeLabel}</span>
            {asset.citations?.length > 0 && (
              <>
                <span>•</span>
                <span>{asset.citations.length} citations</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {asset.aeo_score != null && (
          <Badge
            variant="outline"
            style={{
              borderColor: asset.aeo_score >= 60 ? '#16a34a' : asset.aeo_score >= 40 ? '#f59e0b' : BRAND.border,
              color: asset.aeo_score >= 60 ? '#16a34a' : asset.aeo_score >= 40 ? '#f59e0b' : BRAND.inkMuted,
            }}
          >
            AEO {asset.aeo_score}
          </Badge>
        )}
        <Clock className="w-4 h-4" style={{ color: BRAND.inkMuted }} />
      </div>
    </Link>
  );
}

function PillarBar({ pillar, color, count, total }) {
  const pct = Math.round((count / total) * 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium truncate" style={{ color: BRAND.inkSoft }}>
          {pillar}
        </span>
        <span className="text-xs" style={{ color: BRAND.inkMuted }}>{count}</span>
      </div>
      <div className="h-2 rounded-full" style={{ backgroundColor: BRAND.border }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
