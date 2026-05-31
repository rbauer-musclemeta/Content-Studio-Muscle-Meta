import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Brain, Save, X, Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const API = `${process.env.REACT_APP_BACKEND_URL}/api/kb`;

const CATEGORIES = [
  { value: 'muscle-strength', label: 'Muscle & Strength' },
  { value: 'metabolic-health', label: 'Metabolic Health' },
  { value: 'sleep-recovery', label: 'Sleep & Recovery' },
  { value: 'sport-performance', label: 'Sport Performance' },
  { value: 'physical-therapy', label: 'Physical Therapy' },
  { value: 'exercise-science', label: 'Exercise Science' },
  { value: 'evidence-based', label: 'Evidence-Based Research' },
  { value: 'general', label: 'General' },
];

const KnowledgeBaseEditor = ({ uploadMode = false }) => {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isUpload = uploadMode || location.pathname.includes('/upload');
  const isEditing = Boolean(articleId);

  const [form, setForm] = useState({
    title: '',
    content: '',
    summary: '',
    category: 'general',
    tags: '',
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message }
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isEditing) {
      fetch(`${API}/articles/${articleId}`)
        .then(r => r.json())
        .then(data => {
          setForm({
            title: data.title || '',
            content: data.content || '',
            summary: data.summary || '',
            category: data.category || 'general',
            tags: (data.tags || []).join(', '),
          });
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [articleId, isEditing]);

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleCategoryChange = (value) => {
    setForm(prev => ({ ...prev, category: value }));
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setStatus({ type: 'error', message: 'Title and content are required.' });
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        summary: form.summary.trim() || undefined,
        category: form.category,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        source_type: 'manual',
      };

      const url = isEditing ? `${API}/articles/${articleId}` : `${API}/articles`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Save failed');

      setStatus({ type: 'success', message: isEditing ? 'Article updated!' : 'Article created!' });
      setTimeout(() => navigate('/admin/kb'), 1200);
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    const allowed = ['.pdf', '.txt', '.docx', '.doc'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) {
      setStatus({ type: 'error', message: 'Only PDF, TXT, and DOCX files are supported.' });
      return;
    }
    setUploadFile(file);
    setStatus(null);
  };

  const handleUpload = async () => {
    if (!uploadFile) return;
    setUploading(true);
    setStatus(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('category', form.category);
      formData.append('tags', form.tags);
      if (form.title.trim()) formData.append('title', form.title.trim());

      const res = await fetch(`${API}/articles/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Upload failed');
      }

      setStatus({ type: 'success', message: `Document "${uploadFile.name}" ingested successfully!` });
      setTimeout(() => navigate('/admin/kb'), 1500);
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Upload failed. Please try again.' });
    } finally {
      setUploading(false);
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
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {isUpload ? 'Upload Document' : isEditing ? 'Edit Article' : 'New Article'}
              </h1>
              <p className="text-sm text-gray-500">Randy's Knowledge Base</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isUpload && (
              <Link to={location.pathname.includes('/upload') ? '/admin/kb/upload' : '/admin/kb/create'}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {}}
                >
                  {isUpload ? <FileText className="w-4 h-4 mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
                  {isUpload ? 'Write Instead' : 'Upload Instead'}
                </Button>
              </Link>
            )}
            <Link to="/admin/kb">
              <Button variant="ghost" size="sm">
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
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

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Article Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title {!isUpload && <span className="text-red-500">*</span>}</Label>
              <Input
                id="title"
                placeholder={isUpload ? 'Optional — auto-detected from filename' : 'e.g. Progressive Overload Principles for Hypertrophy'}
                value={form.title}
                onChange={handleChange('title')}
                className="mt-1"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Category <span className="text-red-500">*</span></Label>
                <Select value={form.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="e.g. hypertrophy, progressive overload, RPE"
                  value={form.tags}
                  onChange={handleChange('tags')}
                  className="mt-1"
                />
                <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content area — either upload or text editor */}
        {isUpload ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Document Upload</CardTitle>
              <CardDescription>Supports PDF, TXT, and DOCX files. Text is extracted and indexed automatically.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
                  dragOver ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:border-emerald-300'
                }`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFileSelect(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                {uploadFile ? (
                  <div>
                    <p className="font-semibold text-emerald-700">{uploadFile.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {(uploadFile.size / 1024).toFixed(1)} KB — click to change
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-gray-700">Drop your file here or click to browse</p>
                    <p className="text-sm text-gray-400 mt-1">PDF, TXT, DOCX up to 10 MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.docx,.doc"
                className="hidden"
                onChange={e => handleFileSelect(e.target.files[0])}
              />
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={!uploadFile || uploading}
                onClick={handleUpload}
              >
                {uploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" /> Ingest Document</>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Content <span className="text-red-500">*</span></CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Paste or write your knowledge here. Can be research notes, protocol details, article excerpts, clinical observations, or any content you want Randy's AI to reference."
                  value={form.content}
                  onChange={handleChange('content')}
                  className="min-h-72 font-mono text-sm leading-relaxed"
                />
                <p className="text-xs text-gray-400 mt-2">
                  {form.content ? `${form.content.split(/\s+/).filter(Boolean).length} words` : 'No content yet'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Summary</CardTitle>
                <CardDescription>Optional — auto-generated from content if left blank</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Brief description of what this article covers..."
                  value={form.summary}
                  onChange={handleChange('summary')}
                  className="min-h-20"
                />
              </CardContent>
            </Card>

            <div className="flex items-center gap-3">
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 flex-1 sm:flex-none"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> {isEditing ? 'Update Article' : 'Save Article'}</>
                )}
              </Button>
              <Link to="/admin/kb">
                <Button variant="outline">Cancel</Button>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default KnowledgeBaseEditor;
