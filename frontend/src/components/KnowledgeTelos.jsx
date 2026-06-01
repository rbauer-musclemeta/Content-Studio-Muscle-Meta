import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Brain, Save, Plus, X, Loader2, CheckCircle, AlertCircle, ArrowLeft, Target, Lightbulb, BookOpen, Star } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api/kb`;

const ListEditor = ({ label, description, items, onChange, placeholder }) => {
  const [draft, setDraft] = useState('');

  const add = () => {
    const val = draft.trim();
    if (!val) return;
    onChange([...items, val]);
    setDraft('');
  };

  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {description && <p className="text-xs text-gray-500">{description}</p>}
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          className="flex-1"
        />
        <Button type="button" variant="outline" onClick={add}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {items.length > 0 && (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-center justify-between gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-sm text-gray-800">
              <span className="flex-1">{item}</span>
              <button onClick={() => remove(i)} className="text-gray-400 hover:text-red-500">
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const KnowledgeTelos = () => {
  const [form, setForm] = useState({
    mission: '',
    clinical_philosophy: '',
    expertise_domains: [],
    professional_goals: [],
    evidence_principles: [],
    content_guidelines: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetch(`${API}/telos`)
      .then(r => r.json())
      .then(data => {
        setForm({
          mission: data.mission || '',
          clinical_philosophy: data.clinical_philosophy || '',
          expertise_domains: data.expertise_domains || [],
          professional_goals: data.professional_goals || [],
          evidence_principles: data.evidence_principles || [],
          content_guidelines: data.content_guidelines || '',
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleListChange = (field) => (items) => {
    setForm(prev => ({ ...prev, [field]: items }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch(`${API}/telos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Save failed');
      setStatus({ type: 'success', message: 'Telos saved — AI answers will now reflect your identity and guidelines.' });
    } catch {
      setStatus({ type: 'error', message: 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Randy's Telos</h1>
              <p className="text-sm text-gray-500">Clinical identity, mission & AI context</p>
            </div>
          </div>
          <Link to="/admin/kb">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Knowledge Base
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-sm text-purple-800">
          <strong>What is Telos?</strong> Inspired by Daniel Miessler's PAI framework — this defines who Randy is, what he stands for,
          and how his AI should respond. This context is automatically injected into every AI knowledge base query.
        </div>

        {status && (
          <div className={`flex items-center gap-3 p-4 rounded-lg ${
            status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}>
            {status.type === 'success'
              ? <CheckCircle className="w-5 h-5 shrink-0" />
              : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span className="text-sm font-medium">{status.message}</span>
          </div>
        )}

        {/* Mission */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-purple-600" />
              <CardTitle className="text-base">Mission Statement</CardTitle>
            </div>
            <CardDescription>Randy's core purpose as a PT and health educator</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="e.g. To empower individuals to optimize their muscle health, metabolism, and physical performance through evidence-based physical therapy and science-driven protocols."
              value={form.mission}
              onChange={handleChange('mission')}
              className="min-h-24"
            />
          </CardContent>
        </Card>

        {/* Clinical Philosophy */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-600" />
              <CardTitle className="text-base">Clinical Philosophy</CardTitle>
            </div>
            <CardDescription>How Randy approaches patient care, training, and health optimization</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="e.g. I believe that the body is an integrated system — muscle health, metabolic function, sleep quality, and movement quality are deeply interconnected. Evidence-based interventions, progressive overload, and lifestyle optimization are the foundation of sustainable health."
              value={form.clinical_philosophy}
              onChange={handleChange('clinical_philosophy')}
              className="min-h-32"
            />
          </CardContent>
        </Card>

        {/* Expertise Domains */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <CardTitle className="text-base">Expertise Domains</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ListEditor
              label=""
              description="Areas of clinical expertise and specialty"
              items={form.expertise_domains}
              onChange={handleListChange('expertise_domains')}
              placeholder="e.g. Orthopedic Physical Therapy"
            />
          </CardContent>
        </Card>

        {/* Professional Goals */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-600" />
              <CardTitle className="text-base">Professional Goals</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ListEditor
              label=""
              description="Current professional and personal development targets"
              items={form.professional_goals}
              onChange={handleListChange('professional_goals')}
              placeholder="e.g. Expand Muscle-Meta course curriculum"
            />
          </CardContent>
        </Card>

        {/* Evidence Principles */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-purple-600" />
              <CardTitle className="text-base">Evidence Principles</CardTitle>
            </div>
            <CardDescription>Randy's core beliefs about evidence, research, and practice</CardDescription>
          </CardHeader>
          <CardContent>
            <ListEditor
              label=""
              description=""
              items={form.evidence_principles}
              onChange={handleListChange('evidence_principles')}
              placeholder="e.g. Prioritize RCTs and systematic reviews over anecdotal evidence"
            />
          </CardContent>
        </Card>

        {/* Content Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Content Guidelines</CardTitle>
            <CardDescription>How the AI should frame and present information in responses</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="e.g. Always caveat general advice with individual variation. Recommend consulting a PT for injury-specific concerns. Favor practical, actionable protocols over theoretical discussion."
              value={form.content_guidelines}
              onChange={handleChange('content_guidelines')}
              className="min-h-24"
            />
          </CardContent>
        </Card>

        <Button
          className="w-full bg-purple-600 hover:bg-purple-700 h-11"
          onClick={handleSave}
          disabled={saving}
        >
          {saving
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            : <><Save className="w-4 h-4 mr-2" /> Save Telos</>}
        </Button>
      </main>
    </div>
  );
};

export default KnowledgeTelos;
