/**
 * ContentStudio — AI-Powered Content Generation
 *
 * Transform research briefs into varied content formats:
 * - Newsletter articles
 * - Research spotlights
 * - Clinical handouts
 * - Social media posts
 *
 * Uses the MM™ design system and brand voice.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { BRAND } from '../../lib/brand';
import {
  Sparkles,
  FileText,
  Newspaper,
  FileCheck,
  Linkedin,
  ArrowRight,
  Loader2,
  Check,
  AlertCircle,
  RefreshCw,
  Save,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const OUTPUT_TYPES = [
  {
    id: 'newsletter',
    label: 'Newsletter Article',
    icon: Newspaper,
    description: '800-1200 words with sections and citations',
    color: BRAND.teal,
  },
  {
    id: 'research_spotlight',
    label: 'Research Spotlight',
    icon: FileText,
    description: '400-600 words focused on one study',
    color: BRAND.gold,
  },
  {
    id: 'clinical_handout',
    label: 'Clinical Handout',
    icon: FileCheck,
    description: '300-500 words, patient-friendly',
    color: BRAND.purple,
  },
  {
    id: 'linkedin_post',
    label: 'LinkedIn Post',
    icon: Linkedin,
    description: '150-250 words with hashtags',
    color: '#0077b5',
  },
];

const PERSONAS = [
  { id: 'active_ager', label: 'Active Ager', description: 'Maintaining vitality' },
  { id: 'rebuilder', label: 'Rebuilder', description: 'Recovering from setback' },
  { id: 'optimizer', label: 'Optimizer', description: 'Seeking marginal gains' },
  { id: 'preventer', label: 'Preventer', description: 'Proactive health focus' },
];

const PILLARS = [
  { id: 'exercise_mobility', label: 'Exercise & Mobility', color: BRAND.teal },
  { id: 'nutrition_metabolism', label: 'Nutrition & Metabolism', color: BRAND.gold },
  { id: 'recovery_resilience', label: 'Recovery & Resilience', color: BRAND.purple },
  { id: 'medical_clinical', label: 'Medical & Clinical', color: '#16a34a' },
];

export default function ContentStudio({ embedded = false }) {
  const [available, setAvailable] = useState(false);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [outputType, setOutputType] = useState('newsletter');
  const [persona, setPersona] = useState('active_ager');
  const [pillar, setPillar] = useState('');
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [generatedAssetId, setGeneratedAssetId] = useState(null);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(true);

  // Recent jobs
  const [recentJobs, setRecentJobs] = useState([]);

  useEffect(() => {
    checkAvailability();
    loadAssets();
    loadRecentJobs();
  }, []);

  const checkAvailability = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/content/status`);
      if (res.ok) {
        const data = await res.json();
        setAvailable(data.available);
      }
    } catch (e) {
      console.error('Content API not available:', e);
    }
  };

  const loadAssets = async () => {
    try {
      // Load research briefs as potential sources
      const res = await fetch(`${BACKEND_URL}/api/assets?asset_type=research_brief&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
      }
      // Also load other text assets
      const res2 = await fetch(`${BACKEND_URL}/api/assets?limit=50`);
      if (res2.ok) {
        const all = await res2.json();
        // Merge unique assets
        const merged = [...data];
        all.forEach(a => {
          if (!merged.find(m => m.id === a.id) && a.content) {
            merged.push(a);
          }
        });
        setAssets(merged);
      }
    } catch (e) {
      console.error('Error loading assets:', e);
    }
    setLoading(false);
  };

  const loadRecentJobs = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/content/jobs?limit=5`);
      if (res.ok) {
        setRecentJobs(await res.json());
      }
    } catch (e) {
      // Ignore
    }
  };

  const handleGenerate = async () => {
    if (!selectedAsset) return;

    setGenerating(true);
    setError(null);
    setGeneratedContent(null);
    setGeneratedAssetId(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/content/generate-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_asset_id: selectedAsset.id,
          output_type: outputType,
          persona,
          pillar: pillar || selectedAsset.pillar,
          additional_instructions: additionalInstructions || null,
          model: 'gpt-4o',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Generation failed');
      }

      const data = await res.json();
      setGeneratedContent(data.content);
      setGeneratedAssetId(data.asset_id);
      loadRecentJobs();
    } catch (e) {
      setError(e.message);
    }

    setGenerating(false);
  };

  const copyToClipboard = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: BRAND.teal }} />
      </div>
    );
  }

  return (
    <div className={embedded ? 'p-6 lg:p-8' : 'min-h-screen p-6 lg:p-8'} style={{ backgroundColor: BRAND.surface }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: BRAND.ink, fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Content Studio
            </h1>
            <p style={{ color: BRAND.inkMuted }}>
              Transform research briefs into newsletters, spotlights, and handouts
            </p>
          </div>
          {!available && (
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              <AlertCircle className="w-3 h-3 mr-1" />
              AI Unavailable
            </Badge>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Source Selection */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">1. Select Source</CardTitle>
                <CardDescription>Choose a research brief to transform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-80 overflow-y-auto">
                {assets.length === 0 ? (
                  <p className="text-sm text-center py-4" style={{ color: BRAND.inkMuted }}>
                    No assets available. Upload research briefs first.
                  </p>
                ) : (
                  assets.filter(a => a.content).map((asset) => (
                    <SourceCard
                      key={asset.id}
                      asset={asset}
                      selected={selectedAsset?.id === asset.id}
                      onSelect={() => {
                        setSelectedAsset(asset);
                        if (asset.pillar) setPillar(asset.pillar);
                      }}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Recent Jobs */}
            {recentJobs.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Recent Generations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recentJobs.slice(0, 3).map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between text-xs p-2 rounded"
                      style={{ backgroundColor: BRAND.surface }}
                    >
                      <span style={{ color: BRAND.inkSoft }}>
                        {job.output_type?.replace('_', ' ')}
                      </span>
                      <Badge
                        variant="outline"
                        className={job.status === 'completed' ? 'text-green-600' : 'text-gray-500'}
                      >
                        {job.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Middle: Configuration */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">2. Configure Output</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Output Type */}
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide mb-2 block" style={{ color: BRAND.inkMuted }}>
                    Output Format
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {OUTPUT_TYPES.map((type) => {
                      const Icon = type.icon;
                      const isSelected = outputType === type.id;
                      return (
                        <button
                          key={type.id}
                          onClick={() => setOutputType(type.id)}
                          className="p-3 rounded-lg border text-left transition-all"
                          style={{
                            borderColor: isSelected ? type.color : BRAND.border,
                            backgroundColor: isSelected ? `${type.color}10` : 'white',
                          }}
                        >
                          <Icon
                            className="w-5 h-5 mb-1"
                            style={{ color: isSelected ? type.color : BRAND.inkMuted }}
                          />
                          <p className="text-xs font-medium" style={{ color: BRAND.ink }}>
                            {type.label}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Persona */}
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide mb-2 block" style={{ color: BRAND.inkMuted }}>
                    Target Persona
                  </label>
                  <Select value={persona} onValueChange={setPersona}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERSONAS.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.label} — {p.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Pillar */}
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide mb-2 block" style={{ color: BRAND.inkMuted }}>
                    Primary Pillar
                  </label>
                  <Select value={pillar} onValueChange={setPillar}>
                    <SelectTrigger>
                      <SelectValue placeholder="Inherit from source" />
                    </SelectTrigger>
                    <SelectContent>
                      {PILLARS.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: p.color }}
                            />
                            {p.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Additional Instructions */}
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide mb-2 block" style={{ color: BRAND.inkMuted }}>
                    Additional Instructions (optional)
                  </label>
                  <Textarea
                    placeholder="E.g., 'Focus on the protein timing findings' or 'Include a meal plan table'"
                    value={additionalInstructions}
                    onChange={(e) => setAdditionalInstructions(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Generate Button */}
                <Button
                  className="w-full"
                  style={{ backgroundColor: BRAND.teal }}
                  disabled={!selectedAsset || !available || generating}
                  onClick={handleGenerate}
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate {OUTPUT_TYPES.find(t => t.id === outputType)?.label}
                    </>
                  )}
                </Button>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {error}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Preview */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">3. Preview & Save</CardTitle>
                  {generatedContent && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={copyToClipboard}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      {generatedAssetId && (
                        <Badge style={{ backgroundColor: `${BRAND.teal}20`, color: BRAND.teal }}>
                          <Check className="w-3 h-3 mr-1" />
                          Saved
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {generatedContent ? (
                  <div className="space-y-3">
                    <div
                      className="p-4 rounded-lg border max-h-[500px] overflow-y-auto"
                      style={{ borderColor: BRAND.border, backgroundColor: 'white' }}
                    >
                      <pre
                        className="text-sm whitespace-pre-wrap"
                        style={{ color: BRAND.inkSoft, fontFamily: 'inherit' }}
                      >
                        {generatedContent}
                      </pre>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={handleGenerate}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate
                      </Button>
                      {generatedAssetId && (
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => window.open(`/admin/assets`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View in Library
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Sparkles className="w-12 h-12 mb-4" style={{ color: BRAND.inkMuted }} />
                    <p style={{ color: BRAND.inkMuted }}>
                      {selectedAsset
                        ? 'Click "Generate" to create content'
                        : 'Select a source asset to begin'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function SourceCard({ asset, selected, onSelect }) {
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

  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-3 rounded-lg border transition-all"
      style={{
        borderColor: selected ? BRAND.teal : BRAND.border,
        backgroundColor: selected ? `${BRAND.teal}08` : 'white',
      }}
    >
      <div className="flex items-start gap-2">
        <div
          className="w-1.5 h-10 rounded-full flex-shrink-0"
          style={{ backgroundColor: pillarColor }}
        />
        <div className="min-w-0 flex-1">
          <p
            className="text-sm font-medium truncate"
            style={{ color: BRAND.ink }}
          >
            {asset.title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs" style={{ color: BRAND.inkMuted }}>
              {ASSET_LABELS[asset.asset_type] || asset.asset_type}
            </span>
            {asset.citations?.length > 0 && (
              <span className="text-xs" style={{ color: BRAND.inkMuted }}>
                • {asset.citations.length} citations
              </span>
            )}
          </div>
        </div>
        {selected && (
          <Check className="w-4 h-4 flex-shrink-0" style={{ color: BRAND.teal }} />
        )}
      </div>
    </button>
  );
}
