/**
 * ResearchAdmin — Research Library Management
 *
 * Admin interface for managing research prompts, artifacts, and citations.
 * Supports PMID/DOI tracking and extracted findings.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import {
  BookOpen, FileText, Plus, Edit, Trash2, Search, Copy, Check,
  ExternalLink, ChevronDown, ChevronRight, Save, X, Beaker,
  Quote, BarChart3, Link2, BookMarked, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BRAND, PILLARS } from '../lib/brand';
import { cn } from '../lib/utils';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PILLAR_MAP = {
  exercise_mobility: { name: 'Exercise & Mobility', color: BRAND.teal },
  nutrition_metabolism: { name: 'Nutrition & Metabolism', color: BRAND.gold },
  recovery_resilience: { name: 'Recovery & Resilience', color: BRAND.purple },
  medical_clinical: { name: 'Medical & Clinical', color: BRAND.green },
};

const CATEGORY_MAP = {
  strength_sarcopenia: 'Strength & Sarcopenia',
  balance_fall_risk: 'Balance & Fall Risk',
  functional_capacity: 'Functional Capacity',
  metabolic_flexibility: 'Metabolic Flexibility',
  protein_anabolic: 'Protein & Anabolic Signaling',
  gut_health: 'Gut Health',
  sleep_circadian: 'Sleep & Circadian',
  stress_hpa: 'Stress & HPA Axis',
  mitochondrial_health: 'Mitochondrial Health',
  bone_health: 'Bone Health',
  catabolic_risk: 'Catabolic Risk',
  comorbidity_management: 'Comorbidity Management',
};

export default function ResearchAdmin({ embedded = false }) {
  const [activeTab, setActiveTab] = useState('prompts');
  const [stats, setStats] = useState({});
  const [prompts, setPrompts] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPillar, setSelectedPillar] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showArtifactModal, setShowArtifactModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [editingArtifact, setEditingArtifact] = useState(null);

  useEffect(() => {
    loadData();
  }, [selectedPillar]);

  const loadData = async () => {
    try {
      const pillarParam = selectedPillar !== 'all' ? `?pillar=${selectedPillar}` : '';

      const [statsRes, promptsRes, artifactsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/research/stats`),
        fetch(`${BACKEND_URL}/api/research/prompts${pillarParam}`),
        fetch(`${BACKEND_URL}/api/research/artifacts${pillarParam}`),
      ]);

      setStats(statsRes.ok ? await statsRes.json() : {});
      setPrompts(promptsRes.ok ? await promptsRes.json() : []);
      setArtifacts(artifactsRes.ok ? await artifactsRes.json() : []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading research data:', error);
      setLoading(false);
    }
  };

  const seedData = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/research/seed`, { method: 'POST' });
      loadData();
    } catch (error) {
      console.error('Error seeding data:', error);
    }
  };

  if (loading) {
    return (
      <div className={embedded ? 'flex items-center justify-center h-64' : 'min-h-screen flex items-center justify-center'} style={{ backgroundColor: BRAND.surface }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: BRAND.teal }}></div>
      </div>
    );
  }

  return (
    <div className={embedded ? '' : 'min-h-screen'} style={{ backgroundColor: BRAND.surface }}>
      {/* Header — only show in standalone mode */}
      {!embedded && (
        <header className="bg-white shadow-sm border-b" style={{ borderColor: BRAND.border }}>
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: BRAND.teal }}
                >
                  <Beaker className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1
                    className="text-2xl font-bold"
                    style={{ color: BRAND.ink, fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    Research Library
                  </h1>
                  <p style={{ color: BRAND.inkMuted }}>Prompts, artifacts, and citations</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Link to="/admin/assets" className="hover:underline" style={{ color: BRAND.teal }}>
                  Asset Library
                </Link>
                <Link to="/admin" className="hover:underline" style={{ color: BRAND.inkSoft }}>
                  &larr; Admin Dashboard
                </Link>
                <Badge style={{ backgroundColor: BRAND.tealMuted, color: BRAND.teal }}>
                  Research Mode
                </Badge>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={embedded ? 'p-6 lg:p-8' : 'max-w-7xl mx-auto px-6 py-8'}>
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            icon={<FileText className="w-6 h-6" />}
            label="Prompt Templates"
            value={stats.total_prompts || 0}
            color={BRAND.teal}
          />
          <StatsCard
            icon={<BookMarked className="w-6 h-6" />}
            label="Research Artifacts"
            value={stats.total_artifacts || 0}
            color={BRAND.gold}
          />
          <StatsCard
            icon={<Quote className="w-6 h-6" />}
            label="Total Citations"
            value={stats.total_citations || 0}
            color={BRAND.purple}
          />
          <StatsCard
            icon={<BarChart3 className="w-6 h-6" />}
            label="Pillars Covered"
            value={Object.keys(stats.by_pillar || {}).length}
            color={BRAND.green}
          />
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Select value={selectedPillar} onValueChange={setSelectedPillar}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by pillar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pillars</SelectItem>
                {Object.entries(PILLAR_MAP).map(([key, { name }]) => (
                  <SelectItem key={key} value={key}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: BRAND.inkMuted }} />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={seedData}>
              <Sparkles className="w-4 h-4 mr-2" />
              Seed Sample Data
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="prompts" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Prompt Templates ({prompts.length})
            </TabsTrigger>
            <TabsTrigger value="artifacts" className="flex items-center gap-2">
              <BookMarked className="w-4 h-4" />
              Research Artifacts ({artifacts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="prompts">
            <PromptsTab
              prompts={prompts}
              searchQuery={searchQuery}
              onEdit={(p) => { setEditingPrompt(p); setShowPromptModal(true); }}
              onCreate={() => { setEditingPrompt(null); setShowPromptModal(true); }}
              onRefresh={loadData}
            />
          </TabsContent>

          <TabsContent value="artifacts">
            <ArtifactsTab
              artifacts={artifacts}
              searchQuery={searchQuery}
              onEdit={(a) => { setEditingArtifact(a); setShowArtifactModal(true); }}
              onCreate={() => { setEditingArtifact(null); setShowArtifactModal(true); }}
              onRefresh={loadData}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      {showPromptModal && (
        <PromptModal
          prompt={editingPrompt}
          onClose={() => setShowPromptModal(false)}
          onSave={() => { setShowPromptModal(false); loadData(); }}
        />
      )}

      {showArtifactModal && (
        <ArtifactModal
          artifact={editingArtifact}
          onClose={() => setShowArtifactModal(false)}
          onSave={() => { setShowArtifactModal(false); loadData(); }}
        />
      )}
    </div>
  );
}

function StatsCard({ icon, label, value, color }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <span style={{ color }}>{icon}</span>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: BRAND.ink }}>{value}</p>
            <p className="text-sm" style={{ color: BRAND.inkMuted }}>{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PromptsTab({ prompts, searchQuery, onEdit, onCreate, onRefresh }) {
  const [copiedId, setCopiedId] = useState(null);

  const filtered = prompts.filter(p =>
    !searchQuery ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.prompt_template.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderPrompt = async (promptId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/research/prompts/${promptId}/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      await navigator.clipboard.writeText(data.rendered);
      setCopiedId(promptId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Error copying prompt:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p style={{ color: BRAND.inkSoft }}>
          Reusable prompts for Perplexity, PubMed, or Google Scholar research
        </p>
        <Button onClick={onCreate} style={{ backgroundColor: BRAND.teal }}>
          <Plus className="w-4 h-4 mr-2" />
          New Prompt
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: BRAND.inkMuted }} />
            <p style={{ color: BRAND.inkMuted }}>No prompt templates yet</p>
            <Button variant="outline" className="mt-4" onClick={onCreate}>
              Create your first prompt
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((prompt) => (
            <Card key={prompt.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg" style={{ color: BRAND.ink }}>
                        {prompt.name}
                      </h3>
                      <PillarBadge pillar={prompt.pillar} />
                      {prompt.category && (
                        <Badge variant="outline">{CATEGORY_MAP[prompt.category]}</Badge>
                      )}
                    </div>

                    <p
                      className="text-sm mb-3 line-clamp-2"
                      style={{ color: BRAND.inkSoft }}
                    >
                      {prompt.prompt_template}
                    </p>

                    <div className="flex items-center gap-4 text-sm" style={{ color: BRAND.inkMuted }}>
                      <span>Platform: {prompt.target_platform}</span>
                      {prompt.variables?.length > 0 && (
                        <span>Variables: {prompt.variables.join(', ')}</span>
                      )}
                      <span>Used {prompt.usage_count || 0} times</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => renderPrompt(prompt.id)}
                    >
                      {copiedId === prompt.id ? (
                        <><Check className="w-4 h-4 mr-1" /> Copied!</>
                      ) : (
                        <><Copy className="w-4 h-4 mr-1" /> Copy</>
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onEdit(prompt)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ArtifactsTab({ artifacts, searchQuery, onEdit, onCreate, onRefresh }) {
  const [expandedId, setExpandedId] = useState(null);

  const filtered = artifacts.filter(a =>
    !searchQuery ||
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const deleteArtifact = async (id) => {
    if (!window.confirm('Delete this artifact and all its citations?')) return;
    try {
      await fetch(`${BACKEND_URL}/api/research/artifacts/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (error) {
      console.error('Error deleting artifact:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p style={{ color: BRAND.inkSoft }}>
          Research findings with citations, PMIDs, and extracted key points
        </p>
        <Button onClick={onCreate} style={{ backgroundColor: BRAND.teal }}>
          <Plus className="w-4 h-4 mr-2" />
          New Artifact
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookMarked className="w-12 h-12 mx-auto mb-4" style={{ color: BRAND.inkMuted }} />
            <p style={{ color: BRAND.inkMuted }}>No research artifacts yet</p>
            <Button variant="outline" className="mt-4" onClick={onCreate}>
              Create your first artifact
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((artifact) => (
            <Card key={artifact.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(expandedId === artifact.id ? null : artifact.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {expandedId === artifact.id ?
                          <ChevronDown className="w-5 h-5" style={{ color: BRAND.inkMuted }} /> :
                          <ChevronRight className="w-5 h-5" style={{ color: BRAND.inkMuted }} />
                        }
                        <h3 className="font-semibold text-lg" style={{ color: BRAND.ink }}>
                          {artifact.title}
                        </h3>
                        <PillarBadge pillar={artifact.pillar} />
                        <Badge variant="outline">{CATEGORY_MAP[artifact.category]}</Badge>
                        <StatusBadge status={artifact.status} />
                      </div>

                      <p className="text-sm ml-7" style={{ color: BRAND.inkSoft }}>
                        {artifact.summary}
                      </p>

                      <div className="flex items-center gap-4 text-sm mt-3 ml-7" style={{ color: BRAND.inkMuted }}>
                        <span>{artifact.citations?.length || 0} citations</span>
                        {artifact.tags?.length > 0 && (
                          <span>Tags: {artifact.tags.slice(0, 3).join(', ')}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => onEdit(artifact)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteArtifact(artifact.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded content */}
                {expandedId === artifact.id && (
                  <div className="border-t px-6 py-4" style={{ borderColor: BRAND.border, backgroundColor: BRAND.surface }}>
                    {/* Consolidated findings */}
                    {artifact.consolidated_findings?.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2" style={{ color: BRAND.ink }}>Key Findings</h4>
                        <ul className="space-y-1">
                          {artifact.consolidated_findings.map((finding, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: BRAND.inkSoft }}>
                              <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: BRAND.teal }} />
                              {finding}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Citations */}
                    {artifact.citations?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3" style={{ color: BRAND.ink }}>Citations</h4>
                        <div className="space-y-3">
                          {artifact.citations.map((citation, i) => (
                            <CitationCard key={citation.id || i} citation={citation} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Clinical implications */}
                    {artifact.clinical_implications?.length > 0 && (
                      <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: BRAND.tealMuted }}>
                        <h4 className="font-semibold mb-2" style={{ color: BRAND.teal }}>Clinical Implications</h4>
                        <ul className="space-y-1">
                          {artifact.clinical_implications.map((imp, i) => (
                            <li key={i} className="text-sm" style={{ color: BRAND.inkSoft }}>{imp}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CitationCard({ citation }) {
  return (
    <div className="p-4 rounded-lg bg-white border" style={{ borderColor: BRAND.border }}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h5 className="font-medium" style={{ color: BRAND.ink }}>{citation.title}</h5>
          <p className="text-sm" style={{ color: BRAND.inkMuted }}>
            {citation.authors?.slice(0, 3).join(', ')}{citation.authors?.length > 3 ? ' et al.' : ''}
            {citation.journal && ` — ${citation.journal}`}
            {citation.year && ` (${citation.year})`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {citation.pmid && (
            <a
              href={`https://pubmed.ncbi.nlm.nih.gov/${citation.pmid}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono px-2 py-1 rounded hover:underline"
              style={{ backgroundColor: BRAND.tealMuted, color: BRAND.teal }}
            >
              PMID: {citation.pmid}
            </a>
          )}
          {citation.doi && (
            <a
              href={`https://doi.org/${citation.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono px-2 py-1 rounded hover:underline"
              style={{ backgroundColor: BRAND.goldMuted, color: BRAND.goldDark }}
            >
              DOI
            </a>
          )}
          {citation.evidence_level && (
            <Badge variant="outline">Level {citation.evidence_level}</Badge>
          )}
        </div>
      </div>

      {/* Key findings */}
      {citation.key_findings?.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: BRAND.inkMuted }}>
            Key Findings
          </p>
          <ul className="text-sm space-y-1">
            {citation.key_findings.map((finding, i) => (
              <li key={i} className="flex items-start gap-2" style={{ color: BRAND.inkSoft }}>
                <span className="text-green-500 mt-0.5">+</span>
                {finding}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Statistics */}
      {citation.statistics?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {citation.statistics.map((stat, i) => (
            <span
              key={i}
              className="text-xs px-2 py-1 rounded"
              style={{ backgroundColor: BRAND.purpleMuted, color: BRAND.purple }}
            >
              {stat.metric}: <strong>{stat.value}</strong>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function PillarBadge({ pillar }) {
  const p = PILLAR_MAP[pillar] || { name: pillar, color: BRAND.ink };
  return (
    <Badge style={{ backgroundColor: `${p.color}20`, color: p.color, border: `1px solid ${p.color}` }}>
      {p.name}
    </Badge>
  );
}

function StatusBadge({ status }) {
  const styles = {
    draft: { bg: BRAND.surface, color: BRAND.inkMuted },
    reviewed: { bg: BRAND.tealMuted, color: BRAND.teal },
    published: { bg: BRAND.greenMuted, color: BRAND.green },
  };
  const s = styles[status] || styles.draft;
  return <Badge style={{ backgroundColor: s.bg, color: s.color }}>{status}</Badge>;
}

// ============================================================================
// MODALS
// ============================================================================

function PromptModal({ prompt, onClose, onSave }) {
  const [form, setForm] = useState({
    name: prompt?.name || '',
    pillar: prompt?.pillar || 'nutrition_metabolism',
    category: prompt?.category || '',
    prompt_template: prompt?.prompt_template || '',
    variables: prompt?.variables?.join(', ') || '',
    target_platform: prompt?.target_platform || 'perplexity',
    expected_output: prompt?.expected_output || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        variables: form.variables ? form.variables.split(',').map(v => v.trim()).filter(Boolean) : [],
        default_values: {},
      };

      const url = prompt?.id
        ? `${BACKEND_URL}/api/research/prompts/${prompt.id}`
        : `${BACKEND_URL}/api/research/prompts`;
      const method = prompt?.id ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      onSave();
    } catch (error) {
      console.error('Error saving prompt:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              {prompt ? 'Edit Prompt Template' : 'New Prompt Template'}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block" style={{ color: BRAND.ink }}>Name</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Sarcopenia Intervention Meta-Analysis"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: BRAND.ink }}>Pillar</label>
              <Select value={form.pillar} onValueChange={(v) => setForm({ ...form, pillar: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PILLAR_MAP).map(([key, { name }]) => (
                    <SelectItem key={key} value={key}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: BRAND.ink }}>Category (optional)</label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (pillar-wide)</SelectItem>
                  {Object.entries(CATEGORY_MAP).map(([key, name]) => (
                    <SelectItem key={key} value={key}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block" style={{ color: BRAND.ink }}>
              Prompt Template
            </label>
            <p className="text-xs mb-2" style={{ color: BRAND.inkMuted }}>
              Use {"{{variable}}"} syntax for placeholders
            </p>
            <Textarea
              value={form.prompt_template}
              onChange={(e) => setForm({ ...form, prompt_template: e.target.value })}
              placeholder="Provide current research on {{topic}} in {{population}}. Include PMIDs..."
              rows={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: BRAND.ink }}>
                Variables (comma-separated)
              </label>
              <Input
                value={form.variables}
                onChange={(e) => setForm({ ...form, variables: e.target.value })}
                placeholder="topic, population, year_range"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: BRAND.ink }}>Target Platform</label>
              <Select value={form.target_platform} onValueChange={(v) => setForm({ ...form, target_platform: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="perplexity">Perplexity</SelectItem>
                  <SelectItem value="pubmed">PubMed</SelectItem>
                  <SelectItem value="google_scholar">Google Scholar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} style={{ backgroundColor: BRAND.teal }}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Prompt'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ArtifactModal({ artifact, onClose, onSave }) {
  const [form, setForm] = useState({
    title: artifact?.title || '',
    pillar: artifact?.pillar || 'nutrition_metabolism',
    category: artifact?.category || 'protein_anabolic',
    summary: artifact?.summary || '',
    research_question: artifact?.research_question || '',
    perplexity_query: artifact?.perplexity_query || '',
    tags: artifact?.tags?.join(', ') || '',
    consolidated_findings: artifact?.consolidated_findings?.join('\n') || '',
    clinical_implications: artifact?.clinical_implications?.join('\n') || '',
    status: artifact?.status || 'draft',
  });
  const [citations, setCitations] = useState(artifact?.citations || []);
  const [saving, setSaving] = useState(false);
  const [showCitationForm, setShowCitationForm] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        consolidated_findings: form.consolidated_findings ? form.consolidated_findings.split('\n').filter(Boolean) : [],
        clinical_implications: form.clinical_implications ? form.clinical_implications.split('\n').filter(Boolean) : [],
        citations: citations.map(c => ({
          pmid: c.pmid || null,
          doi: c.doi || null,
          url: c.url || null,
          title: c.title,
          authors: c.authors || [],
          journal: c.journal || null,
          year: c.year || null,
          key_findings: c.key_findings || [],
          statistics: c.statistics || [],
          quotes: c.quotes || [],
          study_type: c.study_type || null,
          evidence_level: c.evidence_level || null,
        })),
      };

      const url = artifact?.id
        ? `${BACKEND_URL}/api/research/artifacts/${artifact.id}`
        : `${BACKEND_URL}/api/research/artifacts`;
      const method = artifact?.id ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      onSave();
    } catch (error) {
      console.error('Error saving artifact:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              {artifact ? 'Edit Research Artifact' : 'New Research Artifact'}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block" style={{ color: BRAND.ink }}>Title</label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g., Leucine Threshold in Older Adults"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: BRAND.ink }}>Pillar</label>
              <Select value={form.pillar} onValueChange={(v) => setForm({ ...form, pillar: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PILLAR_MAP).map(([key, { name }]) => (
                    <SelectItem key={key} value={key}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: BRAND.ink }}>Category</label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_MAP).map(([key, name]) => (
                    <SelectItem key={key} value={key}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: BRAND.ink }}>Status</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block" style={{ color: BRAND.ink }}>Summary</label>
            <Textarea
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="High-level summary of the research..."
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block" style={{ color: BRAND.ink }}>Tags (comma-separated)</label>
            <Input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="leucine, mTOR, protein synthesis"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block" style={{ color: BRAND.ink }}>
              Consolidated Findings (one per line)
            </label>
            <Textarea
              value={form.consolidated_findings}
              onChange={(e) => setForm({ ...form, consolidated_findings: e.target.value })}
              placeholder="Older adults require 2.5-3g leucine per meal..."
              rows={4}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block" style={{ color: BRAND.ink }}>
              Clinical Implications (one per line)
            </label>
            <Textarea
              value={form.clinical_implications}
              onChange={(e) => setForm({ ...form, clinical_implications: e.target.value })}
              placeholder="Target 30-40g protein per meal for adults 50+..."
              rows={3}
            />
          </div>

          <Separator />

          {/* Citations section */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium" style={{ color: BRAND.ink }}>
                Citations ({citations.length})
              </label>
              <Button variant="outline" size="sm" onClick={() => setShowCitationForm(true)}>
                <Plus className="w-4 h-4 mr-1" /> Add Citation
              </Button>
            </div>

            {citations.map((citation, i) => (
              <div key={i} className="p-3 mb-2 rounded border" style={{ borderColor: BRAND.border }}>
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium" style={{ color: BRAND.ink }}>{citation.title}</p>
                    <p className="text-sm" style={{ color: BRAND.inkMuted }}>
                      {citation.pmid && `PMID: ${citation.pmid}`}
                      {citation.pmid && citation.doi && ' | '}
                      {citation.doi && `DOI: ${citation.doi}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCitations(citations.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} style={{ backgroundColor: BRAND.teal }}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Artifact'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Citation Form Modal */}
      {showCitationForm && (
        <CitationFormModal
          onClose={() => setShowCitationForm(false)}
          onAdd={(citation) => {
            setCitations([...citations, citation]);
            setShowCitationForm(false);
          }}
        />
      )}
    </div>
  );
}

function CitationFormModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    title: '',
    pmid: '',
    doi: '',
    authors: '',
    journal: '',
    year: '',
    key_findings: '',
    statistics: '',
    study_type: '',
    evidence_level: '',
  });

  const handleAdd = () => {
    const citation = {
      title: form.title,
      pmid: form.pmid || null,
      doi: form.doi || null,
      authors: form.authors ? form.authors.split(',').map(a => a.trim()) : [],
      journal: form.journal || null,
      year: form.year ? parseInt(form.year) : null,
      key_findings: form.key_findings ? form.key_findings.split('\n').filter(Boolean) : [],
      statistics: form.statistics ? form.statistics.split('\n').filter(Boolean).map(s => {
        const parts = s.split(':');
        return { metric: parts[0]?.trim(), value: parts[1]?.trim() || '', context: '' };
      }) : [],
      study_type: form.study_type || null,
      evidence_level: form.evidence_level || null,
    };
    onAdd(citation);
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Add Citation</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Article title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="PMID (e.g., 31121843)"
              value={form.pmid}
              onChange={(e) => setForm({ ...form, pmid: e.target.value })}
            />
            <Input
              placeholder="DOI (e.g., 10.1093/...)"
              value={form.doi}
              onChange={(e) => setForm({ ...form, doi: e.target.value })}
            />
          </div>
          <Input
            placeholder="Authors (comma-separated)"
            value={form.authors}
            onChange={(e) => setForm({ ...form, authors: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Journal"
              value={form.journal}
              onChange={(e) => setForm({ ...form, journal: e.target.value })}
            />
            <Input
              placeholder="Year"
              type="number"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select value={form.study_type} onValueChange={(v) => setForm({ ...form, study_type: v })}>
              <SelectTrigger><SelectValue placeholder="Study type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="RCT">RCT</SelectItem>
                <SelectItem value="meta-analysis">Meta-Analysis</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="cohort">Cohort</SelectItem>
                <SelectItem value="case-control">Case-Control</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.evidence_level} onValueChange={(v) => setForm({ ...form, evidence_level: v })}>
              <SelectTrigger><SelectValue placeholder="Evidence level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="I">Level I</SelectItem>
                <SelectItem value="II">Level II</SelectItem>
                <SelectItem value="III">Level III</SelectItem>
                <SelectItem value="IV">Level IV</SelectItem>
                <SelectItem value="V">Level V</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder="Key findings (one per line)"
            value={form.key_findings}
            onChange={(e) => setForm({ ...form, key_findings: e.target.value })}
            rows={3}
          />
          <Textarea
            placeholder="Statistics (format: Metric: Value, one per line)"
            value={form.statistics}
            onChange={(e) => setForm({ ...form, statistics: e.target.value })}
            rows={2}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleAdd} style={{ backgroundColor: BRAND.teal }}>
              Add Citation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
