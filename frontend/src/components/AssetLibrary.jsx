/**
 * AssetLibrary — MM™ Content Asset Management
 *
 * Upload, browse, and preview varied content assets (md, html, pdf, video, audio).
 * Auto-extracts pillar/category/persona/citations on upload via the MM™ parser.
 * Tracks content lineage (brief → newsletter → spotlight/handout).
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Upload, FileText, FileCode, FileType, Video, Music, File as FileIcon,
  Search, Trash2, X, ExternalLink, Quote, Layers, Sparkles, Link2, RefreshCw,
  TrendingUp, AlertCircle, CheckCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BRAND } from '../lib/brand';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PILLAR_MAP = {
  exercise_mobility: { name: 'Exercise & Mobility', color: BRAND.teal },
  nutrition_metabolism: { name: 'Nutrition & Metabolism', color: BRAND.gold },
  recovery_resilience: { name: 'Recovery & Resilience', color: BRAND.purple },
  medical_clinical: { name: 'Medical & Clinical', color: BRAND.green },
};

const ASSET_TYPE_LABELS = {
  research_brief: 'Research Brief',
  newsletter: 'Newsletter',
  research_spotlight: 'Research Spotlight',
  clinical_handout: 'Clinical Handout',
  video: 'Video',
  audio: 'Audio',
  other: 'Other',
};

const FILE_ICONS = {
  md: FileText,
  html: FileCode,
  pdf: FileType,
  video: Video,
  audio: Music,
};

function fileIcon(fileType) {
  const Icon = FILE_ICONS[fileType] || FileIcon;
  return Icon;
}

export default function AssetLibrary() {
  const [assets, setAssets] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterPillar, setFilterPillar] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewAsset, setPreviewAsset] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => { loadData(); }, [filterPillar, filterType]);

  const loadData = async () => {
    try {
      const params = new URLSearchParams();
      if (filterPillar !== 'all') params.set('pillar', filterPillar);
      if (filterType !== 'all') params.set('asset_type', filterType);
      if (search) params.set('search', search);

      const [assetsRes, statsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/assets?${params}`),
        fetch(`${BACKEND_URL}/api/assets/stats`),
      ]);
      setAssets(assetsRes.ok ? await assetsRes.json() : []);
      setStats(statsRes.ok ? await statsRes.json() : {});
      setLoading(false);
    } catch (e) {
      console.error('Error loading assets:', e);
      setLoading(false);
    }
  };

  const handleFiles = async (files) => {
    setUploading(true);
    for (const file of files) {
      const form = new FormData();
      form.append('file', file);
      form.append('auto_parse', 'true');
      try {
        await fetch(`${BACKEND_URL}/api/assets/upload`, { method: 'POST', body: form });
      } catch (e) {
        console.error('Upload failed:', file.name, e);
      }
    }
    setUploading(false);
    loadData();
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) handleFiles(Array.from(e.dataTransfer.files));
  };

  const deleteAsset = async (id) => {
    if (!window.confirm('Delete this asset?')) return;
    await fetch(`${BACKEND_URL}/api/assets/${id}`, { method: 'DELETE' });
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BRAND.surface }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: BRAND.teal }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.surface }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b" style={{ borderColor: BRAND.border }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: BRAND.gold }}>
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: BRAND.ink, fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Asset Library
              </h1>
              <p style={{ color: BRAND.inkMuted }}>Briefs, newsletters, spotlights, handouts, media</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/admin/research" className="hover:underline" style={{ color: BRAND.teal }}>Research Library</Link>
            <Link to="/admin" className="hover:underline" style={{ color: BRAND.inkSoft }}>&larr; Admin</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <StatsCard icon={<Layers className="w-6 h-6" />} label="Total Assets" value={stats.total_assets || 0} color={BRAND.gold} />
          <StatsCard icon={<Quote className="w-6 h-6" />} label="Citations" value={stats.total_citations || 0} color={BRAND.purple} />
          <StatsCard icon={<FileText className="w-6 h-6" />} label="Briefs" value={stats.by_type?.research_brief || 0} color={BRAND.teal} />
          <StatsCard icon={<Video className="w-6 h-6" />} label="Media" value={(stats.by_type?.video || 0) + (stats.by_type?.audio || 0)} color={BRAND.green} />
          <StatsCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Avg AEO Score"
            value={stats.aeo_avg_score != null ? stats.aeo_avg_score : '—'}
            subvalue={stats.aeo_analyzed > 0 ? `${stats.aeo_analyzed} analyzed` : null}
            color={stats.aeo_avg_score >= 60 ? '#16a34a' : stats.aeo_avg_score >= 40 ? '#f59e0b' : BRAND.inkMuted}
          />
        </div>

        {/* Upload zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className="mb-8 rounded-xl border-2 border-dashed cursor-pointer transition-all"
          style={{
            borderColor: dragOver ? BRAND.teal : BRAND.border,
            backgroundColor: dragOver ? BRAND.tealMuted : BRAND.white,
            padding: '40px 24px',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept=".md,.html,.htm,.pdf,.mp4,.mov,.webm,.mp3,.wav,.m4a,.txt"
            onChange={(e) => e.target.files?.length && handleFiles(Array.from(e.target.files))}
          />
          <div className="text-center">
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: BRAND.teal }} />
                <p style={{ color: BRAND.inkSoft }}>Uploading & parsing…</p>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 mx-auto mb-3" style={{ color: BRAND.teal }} />
                <p className="font-medium mb-1" style={{ color: BRAND.ink }}>
                  Drop files here or click to upload
                </p>
                <p className="text-sm" style={{ color: BRAND.inkMuted }}>
                  Markdown, HTML, PDF, video, audio — pillar, category & citations auto-extracted
                </p>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <Select value={filterPillar} onValueChange={setFilterPillar}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Pillar" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pillars</SelectItem>
              {Object.entries(PILLAR_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(ASSET_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: BRAND.inkMuted }} />
            <Input
              placeholder="Search title, findings, tags…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadData()}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={loadData}>Search</Button>
        </div>

        {/* Asset grid */}
        {assets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Layers className="w-12 h-12 mx-auto mb-4" style={{ color: BRAND.inkMuted }} />
              <p style={{ color: BRAND.inkMuted }}>No assets yet — upload your research briefs, newsletters, and handouts above.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onPreview={() => setPreviewAsset(asset)}
                onDelete={() => deleteAsset(asset.id)}
              />
            ))}
          </div>
        )}
      </main>

      {previewAsset && (
        <PreviewModal asset={previewAsset} onClose={() => setPreviewAsset(null)} onChanged={loadData} />
      )}
    </div>
  );
}

function StatsCard({ icon, label, value, subvalue, color }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
            <span style={{ color }}>{icon}</span>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: BRAND.ink }}>{value}</p>
            <p className="text-sm" style={{ color: BRAND.inkMuted }}>{label}</p>
            {subvalue && <p className="text-xs" style={{ color: BRAND.inkMuted }}>{subvalue}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AssetCard({ asset, onPreview, onDelete }) {
  const Icon = fileIcon(asset.file_type);
  const pillar = PILLAR_MAP[asset.pillar];

  return (
    <Card className="hover:shadow-md transition-shadow flex flex-col">
      <CardContent className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: BRAND.surface }}>
              <Icon className="w-5 h-5" style={{ color: pillar?.color || BRAND.inkMuted }} />
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: BRAND.inkMuted }}>
                {ASSET_TYPE_LABELS[asset.asset_type] || asset.asset_type}
              </span>
            </div>
          </div>
          <button onClick={onDelete} className="opacity-50 hover:opacity-100">
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>

        <h3 className="font-semibold mb-2 line-clamp-2 cursor-pointer" style={{ color: BRAND.ink }} onClick={onPreview}>
          {asset.title}
        </h3>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {pillar && (
            <Badge style={{ backgroundColor: `${pillar.color}20`, color: pillar.color, border: `1px solid ${pillar.color}` }}>
              {pillar.name}
            </Badge>
          )}
          {asset.category_code && <Badge variant="outline">{asset.category_code}</Badge>}
          {asset.persona && <Badge variant="outline">{asset.persona}</Badge>}
        </div>

        <div className="flex items-center gap-3 text-xs mt-auto pt-3" style={{ color: BRAND.inkMuted }}>
          <span className="uppercase">{asset.file_type}</span>
          {asset.citations?.length > 0 && (
            <span className="flex items-center gap-1"><Quote className="w-3 h-3" /> {asset.citations.length}</span>
          )}
          {asset.source_asset_id && (
            <span className="flex items-center gap-1"><Link2 className="w-3 h-3" /> derived</span>
          )}
          {asset.aeo_score != null && (
            <AeoScoreBadge score={asset.aeo_score} size="sm" />
          )}
          <button className="ml-auto hover:underline" style={{ color: BRAND.teal }} onClick={onPreview}>
            View →
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function PreviewModal({ asset, onClose, onChanged }) {
  const [full, setFull] = useState(asset);
  const [reparsing, setReparsing] = useState(false);
  const [aeoAnalysis, setAeoAnalysis] = useState(null);
  const [analyzingAeo, setAnalyzingAeo] = useState(false);
  const [showAeo, setShowAeo] = useState(false);

  useEffect(() => {
    // Fetch full asset (with content)
    fetch(`${BACKEND_URL}/api/assets/${asset.id}`)
      .then((r) => r.ok ? r.json() : asset)
      .then((data) => {
        setFull(data);
        if (data.aeo_analysis) setAeoAnalysis(data.aeo_analysis);
      })
      .catch(() => setFull(asset));
  }, [asset]);

  const reparse = async () => {
    setReparsing(true);
    const res = await fetch(`${BACKEND_URL}/api/assets/${asset.id}/reparse`, { method: 'POST' });
    if (res.ok) {
      setFull(await res.json());
      onChanged?.();
    }
    setReparsing(false);
  };

  const analyzeAeo = async () => {
    setAnalyzingAeo(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/assets/${asset.id}/aeo-analyze`, { method: 'POST' });
      if (res.ok) {
        const analysis = await res.json();
        setAeoAnalysis(analysis);
        setFull((prev) => ({ ...prev, aeo_score: analysis.overall_score, aeo_analysis: analysis }));
        setShowAeo(true);
        onChanged?.();
      }
    } catch (e) {
      console.error('AEO analysis failed:', e);
    }
    setAnalyzingAeo(false);
  };

  const rawUrl = `${BACKEND_URL}/api/assets/${asset.id}/raw`;
  const pillar = PILLAR_MAP[full.pillar];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[92vh] overflow-y-auto">
        <CardHeader className="sticky top-0 bg-white z-10 border-b" style={{ borderColor: BRAND.border }}>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: BRAND.ink }}>
                {full.title}
              </CardTitle>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge variant="outline">{ASSET_TYPE_LABELS[full.asset_type] || full.asset_type}</Badge>
                {pillar && <Badge style={{ backgroundColor: `${pillar.color}20`, color: pillar.color }}>{pillar.name}</Badge>}
                {full.category_code && <Badge variant="outline">{full.category_code}</Badge>}
                {full.persona && <Badge variant="outline">{full.persona}</Badge>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={analyzeAeo} disabled={analyzingAeo}>
                <TrendingUp className={`w-4 h-4 mr-1 ${analyzingAeo ? 'animate-pulse' : ''}`} />
                {analyzingAeo ? 'Analyzing…' : full.aeo_score != null ? 'Re-analyze AEO' : 'Analyze AEO'}
              </Button>
              <Button variant="outline" size="sm" onClick={reparse} disabled={reparsing}>
                <RefreshCw className={`w-4 h-4 mr-1 ${reparsing ? 'animate-spin' : ''}`} /> Re-parse
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}><X className="w-5 h-5" /></Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-5">
          {/* AEO Score Panel */}
          {(aeoAnalysis || full.aeo_score != null) && (
            <div className="rounded-lg border p-4" style={{ borderColor: BRAND.border, backgroundColor: BRAND.surface }}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: BRAND.ink }}>
                  <TrendingUp className="w-4 h-4" style={{ color: BRAND.teal }} />
                  AEO Readiness Score
                </h4>
                <button onClick={() => setShowAeo(!showAeo)} className="text-xs hover:underline" style={{ color: BRAND.teal }}>
                  {showAeo ? 'Hide details' : 'Show details'}
                </button>
              </div>

              <div className="flex items-center gap-4">
                <AeoScoreBadge score={aeoAnalysis?.overall_score ?? full.aeo_score} size="lg" />
                <div className="flex-1">
                  <div className="grid grid-cols-4 gap-2">
                    <ScoreBar label="Headings" score={aeoAnalysis?.heading_score?.score} />
                    <ScoreBar label="Title" score={aeoAnalysis?.title_score?.score} />
                    <ScoreBar label="Structure" score={aeoAnalysis?.structure_score?.score} />
                    <ScoreBar label="Authority" score={aeoAnalysis?.authority_score?.score} />
                  </div>
                </div>
              </div>

              {showAeo && aeoAnalysis && (
                <div className="mt-4 space-y-4">
                  {/* Recommendations */}
                  {aeoAnalysis.recommendations?.length > 0 && (
                    <div>
                      <h5 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: BRAND.inkMuted }}>
                        Recommendations
                      </h5>
                      <div className="space-y-2">
                        {aeoAnalysis.recommendations.map((rec, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm" style={{ color: BRAND.inkSoft }}>
                            {rec.priority === 'high' ? (
                              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-orange-500" />
                            ) : (
                              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: BRAND.teal }} />
                            )}
                            <div>
                              <span className="font-medium capitalize">{rec.category}:</span> {rec.action}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Platform fit */}
                  {aeoAnalysis.platform_fit && (
                    <div>
                      <h5 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: BRAND.inkMuted }}>
                        Platform Fit
                      </h5>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(aeoAnalysis.platform_fit).map(([platform, data]) => (
                          <div key={platform} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: BRAND.white }}>
                            <span className="text-xs capitalize" style={{ color: BRAND.inkSoft }}>
                              {platform.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs font-semibold" style={{ color: scoreColor(data.score) }}>
                              {data.score}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* GMMBB axes */}
          {full.gmmbb_axes?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: BRAND.inkMuted }}>GMMBB Axes</h4>
              <div className="flex flex-wrap gap-2">
                {full.gmmbb_axes.map((a, i) => (
                  <span key={i} className="text-sm px-2 py-1 rounded" style={{ backgroundColor: BRAND.surface, color: BRAND.inkSoft }}>
                    {a.axis}{a.weight ? ` · ${a.weight}%` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key findings */}
          {full.key_findings?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: BRAND.inkMuted }}>Key Findings</h4>
              <ul className="space-y-1.5">
                {full.key_findings.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: BRAND.inkSoft }}>
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: BRAND.teal }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Citations */}
          {full.citations?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: BRAND.inkMuted }}>
                Citations ({full.citations.length})
              </h4>
              <div className="space-y-2">
                {full.citations.map((c, i) => (
                  <div key={i} className="p-3 rounded-lg border flex items-start justify-between gap-3" style={{ borderColor: BRAND.border }}>
                    <p className="text-sm flex-1" style={{ color: BRAND.inkSoft }}>{c.title}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {c.pmid && (
                        <a href={`https://pubmed.ncbi.nlm.nih.gov/${c.pmid}/`} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-mono px-2 py-1 rounded hover:underline"
                          style={{ backgroundColor: BRAND.tealMuted, color: BRAND.teal }}>
                          PMID {c.pmid}
                        </a>
                      )}
                      {c.doi && (
                        <a href={`https://doi.org/${c.doi}`} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-mono px-2 py-1 rounded hover:underline"
                          style={{ backgroundColor: BRAND.goldMuted, color: BRAND.goldDark }}>
                          DOI
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide" style={{ color: BRAND.inkMuted }}>Preview</h4>
              <a href={rawUrl} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 hover:underline" style={{ color: BRAND.teal }}>
                Open raw <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <ContentPreview asset={full} rawUrl={rawUrl} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function scoreColor(score) {
  if (score == null) return BRAND.inkMuted;
  if (score >= 80) return '#16a34a';
  if (score >= 60) return BRAND.teal;
  if (score >= 40) return '#f59e0b';
  return '#dc2626';
}

function AeoScoreBadge({ score, size = 'sm' }) {
  if (score == null) return null;
  const color = scoreColor(score);
  const sizeClasses = size === 'lg' ? 'w-16 h-16 text-xl' : 'w-8 h-8 text-xs';

  return (
    <div
      className={`${sizeClasses} rounded-full flex items-center justify-center font-bold flex-shrink-0`}
      style={{ backgroundColor: `${color}20`, color, border: `2px solid ${color}` }}
      title={`AEO Score: ${score}/100`}
    >
      {score}
    </div>
  );
}

function ScoreBar({ label, score }) {
  if (score == null) return null;
  const color = scoreColor(score);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs" style={{ color: BRAND.inkMuted }}>{label}</span>
        <span className="text-xs font-semibold" style={{ color }}>{score}</span>
      </div>
      <div className="h-1.5 rounded-full" style={{ backgroundColor: BRAND.border }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function ContentPreview({ asset, rawUrl }) {
  if (asset.external_url) {
    return (
      <a href={asset.external_url} target="_blank" rel="noopener noreferrer"
        className="block p-4 rounded-lg border text-sm hover:underline" style={{ borderColor: BRAND.border, color: BRAND.teal }}>
        {asset.external_url}
      </a>
    );
  }

  if (asset.file_type === 'html') {
    return (
      <iframe
        title={asset.title}
        srcDoc={asset.content}
        className="w-full rounded-lg border"
        style={{ borderColor: BRAND.border, height: '480px' }}
        sandbox=""
      />
    );
  }

  if (asset.file_type === 'md' || asset.file_type === 'text') {
    return (
      <pre className="p-4 rounded-lg border text-xs overflow-auto whitespace-pre-wrap"
        style={{ borderColor: BRAND.border, backgroundColor: BRAND.surface, color: BRAND.inkSoft, maxHeight: '480px' }}>
        {asset.content?.slice(0, 8000)}
        {asset.content?.length > 8000 ? '\n\n… (truncated — open raw to view full)' : ''}
      </pre>
    );
  }

  if (asset.file_type === 'video') {
    return <video src={rawUrl} controls className="w-full rounded-lg border" style={{ borderColor: BRAND.border, maxHeight: '480px' }} />;
  }

  if (asset.file_type === 'audio') {
    return <audio src={rawUrl} controls className="w-full" />;
  }

  if (asset.file_type === 'pdf') {
    return <iframe title={asset.title} src={rawUrl} className="w-full rounded-lg border" style={{ borderColor: BRAND.border, height: '600px' }} />;
  }

  return <p className="text-sm" style={{ color: BRAND.inkMuted }}>No inline preview available for this file type.</p>;
}
