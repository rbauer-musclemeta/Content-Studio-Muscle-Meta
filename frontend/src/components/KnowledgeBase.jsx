import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  BookOpen, Plus, Search, Brain, FileText, Trash2, Edit,
  Upload, Tag, BarChart3, MessageSquare, ChevronRight, X,
  Target, CheckCircle, Clock, ShieldCheck, AlertTriangle,
  Lightbulb, ChevronDown, ChevronUp, Sparkles, ArrowRight
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api/kb`;

const CATEGORY_LABELS = {
  'muscle-strength':   { label: 'Muscle & Strength',        color: 'bg-red-100 text-red-700' },
  'metabolic-health':  { label: 'Metabolic Health',          color: 'bg-orange-100 text-orange-700' },
  'sleep-recovery':    { label: 'Sleep & Recovery',          color: 'bg-indigo-100 text-indigo-700' },
  'sport-performance': { label: 'Sport Performance',         color: 'bg-green-100 text-green-700' },
  'physical-therapy':  { label: 'Physical Therapy',          color: 'bg-blue-100 text-blue-700' },
  'exercise-science':  { label: 'Exercise Science',          color: 'bg-purple-100 text-purple-700' },
  'evidence-based':    { label: 'Evidence-Based',            color: 'bg-teal-100 text-teal-700' },
  'general':           { label: 'General',                   color: 'bg-gray-100 text-gray-700' },
};

const STATUS_META = {
  draft:          { label: 'Draft',          color: 'bg-gray-100 text-gray-600',     icon: FileText,    next: 'pending_review', nextLabel: 'Submit for Review' },
  pending_review: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700', icon: Clock,       next: 'verified',       nextLabel: 'Mark Verified' },
  verified:       { label: 'Verified',       color: 'bg-blue-100 text-blue-700',     icon: ShieldCheck, next: 'approved',       nextLabel: 'Approve' },
  approved:       { label: 'Approved',       color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, next: null,           nextLabel: null },
};

const STATUS_TRANSITIONS = {
  draft: 'pending_review',
  pending_review: 'verified',
  verified: 'approved',
};

const CategoryBadge = ({ category }) => {
  const meta = CATEGORY_LABELS[category] || CATEGORY_LABELS.general;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${meta.color}`}>
      {meta.label}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.draft;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${meta.color}`}>
      <Icon className="w-3 h-3" />{meta.label}
    </span>
  );
};

const KnowledgeBase = () => {
  const [articles, setArticles] = useState([]);
  const [pending, setPending] = useState([]);
  const [stats, setStats] = useState({ total_articles: 0, total_words: 0, by_category: {} });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeStatus, setActiveStatus] = useState('all');
  const [deleting, setDeleting] = useState(null);
  const [transitioning, setTransitioning] = useState(null);
  const [extracting, setExtracting] = useState(null);
  const [showPending, setShowPending] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (activeCategory !== 'all') params.set('category', activeCategory);
      if (activeStatus !== 'all') params.set('status', activeStatus);

      const [articlesRes, statsRes, pendingRes] = await Promise.all([
        fetch(`${API}/articles?${params}`),
        fetch(`${API}/stats`),
        fetch(`${API}/pending`),
      ]);

      setArticles(articlesRes.ok ? await articlesRes.json() : []);
      setStats(statsRes.ok ? await statsRes.json() : {});
      setPending(pendingRes.ok ? await pendingRes.json() : []);
    } catch (err) {
      console.error('Error loading KB data:', err);
    } finally {
      setLoading(false);
    }
  }, [search, activeCategory, activeStatus]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(loadData, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [loadData, search]);

  const handleDelete = async (articleId) => {
    if (!window.confirm('Delete this article? This cannot be undone.')) return;
    setDeleting(articleId);
    try {
      const res = await fetch(`${API}/articles/${articleId}`, { method: 'DELETE' });
      if (res.ok) {
        setArticles(prev => prev.filter(a => a.id !== articleId));
        setPending(prev => prev.filter(a => a.id !== articleId));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(null);
    }
  };

  const handleStatusTransition = async (articleId, currentStatus) => {
    const nextStatus = STATUS_TRANSITIONS[currentStatus];
    if (!nextStatus) return;
    setTransitioning(articleId);
    try {
      const res = await fetch(`${API}/articles/${articleId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setArticles(prev => prev.map(a => a.id === articleId ? updated : a));
        setPending(prev => prev.filter(a => a.id !== articleId));
        if (nextStatus === 'verified') {
          setPending(prev => prev.filter(a => a.id !== articleId));
        }
      }
    } catch (err) {
      console.error('Status transition failed:', err);
    } finally {
      setTransitioning(null);
    }
  };

  const handleExtractWisdom = async (articleId) => {
    setExtracting(articleId);
    try {
      const res = await fetch(`${API}/articles/${articleId}/extract-wisdom`, { method: 'POST' });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error('Extract wisdom failed:', err);
    } finally {
      setExtracting(null);
    }
  };

  const handleApproveInsights = async (articleId) => {
    try {
      await fetch(`${API}/articles/${articleId}/approve-insights`, { method: 'POST' });
      await loadData();
    } catch (err) {
      console.error('Approve insights failed:', err);
    }
  };

  const categoryTabs = ['all', ...Object.keys(CATEGORY_LABELS)];
  const statusTabs = ['all', 'draft', 'pending_review', 'verified', 'approved'];

  // Filter articles client-side for status (backend doesn't filter on status in list yet)
  const displayedArticles = activeStatus === 'all'
    ? articles
    : articles.filter(a => (a.status || 'draft') === activeStatus);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Randy's Knowledge Base</h1>
                <p className="text-gray-600">Personal AI-powered research library</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Link to="/admin/kb/ask">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <MessageSquare className="w-4 h-4 mr-2" /> Ask AI
                </Button>
              </Link>
              <Link to="/admin/kb/telos">
                <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                  <Target className="w-4 h-4 mr-2" /> My Telos
                </Button>
              </Link>
              <Link to="/admin/kb/upload">
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" /> Upload
                </Button>
              </Link>
              <Link to="/admin/kb/create">
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" /> New Article
                </Button>
              </Link>
              <Link to="/admin" className="text-gray-500 hover:text-gray-800 text-sm ml-2">
                ← Admin
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Articles</p>
                <p className="text-xl font-bold text-gray-900">{stats.total_articles || 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Words</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.total_words ? `${(stats.total_words / 1000).toFixed(1)}k` : '0'}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Pending Review</p>
                <p className={`text-xl font-bold ${pending.length > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>
                  {pending.length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">AI-Ready</p>
                <p className="text-xl font-bold text-gray-900">
                  {articles.filter(a => ['verified', 'approved'].includes(a.status || 'draft')).length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Approval Queue */}
        {pending.length > 0 && (
          <div className="border border-yellow-200 bg-yellow-50 rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-yellow-100 transition-colors"
              onClick={() => setShowPending(p => !p)}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-yellow-800">
                  {pending.length} Article{pending.length !== 1 ? 's' : ''} Awaiting Your Review
                </span>
              </div>
              {showPending ? <ChevronUp className="w-4 h-4 text-yellow-600" /> : <ChevronDown className="w-4 h-4 text-yellow-600" />}
            </button>
            {showPending && (
              <div className="border-t border-yellow-200 divide-y divide-yellow-100">
                {pending.map(article => (
                  <div key={article.id} className="flex items-center justify-between px-5 py-3 bg-white gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{article.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <CategoryBadge category={article.category} />
                        <span className="text-xs text-gray-400">{article.word_count?.toLocaleString()} words</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link to={`/admin/kb/edit/${article.id}`}>
                        <Button variant="outline" size="sm">Review</Button>
                      </Link>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleStatusTransition(article.id, 'pending_review')}
                        disabled={transitioning === article.id}
                      >
                        <ShieldCheck className="w-4 h-4 mr-1" /> Verify
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-10 pr-10 h-11"
            placeholder="Search articles by title, content, or tags..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setSearch('')}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap gap-2">
          {statusTabs.map(s => {
            const meta = s !== 'all' ? STATUS_META[s] : null;
            return (
              <button
                key={s}
                onClick={() => setActiveStatus(s)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeStatus === s
                    ? 'bg-gray-800 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                {s === 'all' ? 'All Statuses' : meta?.label}
              </button>
            );
          })}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categoryTabs.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-300'
              }`}
            >
              {cat === 'all' ? 'All Categories' : CATEGORY_LABELS[cat]?.label || cat}
              {cat !== 'all' && stats.by_category?.[cat] ? (
                <span className={`ml-1.5 text-xs ${activeCategory === cat ? 'text-emerald-100' : 'text-gray-400'}`}>
                  {stats.by_category[cat]}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Articles List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
          </div>
        ) : displayedArticles.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {search || activeCategory !== 'all' || activeStatus !== 'all'
                  ? 'No matching articles'
                  : 'Knowledge base is empty'}
              </h3>
              <p className="text-gray-500 mb-6">
                {search || activeCategory !== 'all' || activeStatus !== 'all'
                  ? 'Try adjusting your filters.'
                  : 'Start building your personal knowledge library.'}
              </p>
              {!search && activeCategory === 'all' && activeStatus === 'all' && (
                <div className="flex items-center justify-center gap-3">
                  <Link to="/admin/kb/create">
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="w-4 h-4 mr-2" /> Write an Article
                    </Button>
                  </Link>
                  <Link to="/admin/kb/upload">
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" /> Upload a Document
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {displayedArticles.map(article => {
              const status = article.status || 'draft';
              const statusMeta = STATUS_META[status];
              const nextStatus = STATUS_TRANSITIONS[status];
              const isAiReady = status === 'verified' || status === 'approved';

              return (
                <Card key={article.id} className={`hover:shadow-md transition-shadow ${isAiReady ? 'border-l-4 border-l-emerald-400' : ''}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <StatusBadge status={status} />
                          <CategoryBadge category={article.category} />
                          {article.source_type === 'upload' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                              <Upload className="w-3 h-3 mr-1" /> Uploaded
                            </span>
                          )}
                          {article.insights_approved && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                              <Sparkles className="w-3 h-3 mr-1" /> Insights Extracted
                            </span>
                          )}
                          {article.extracted_insights && !article.insights_approved && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                              <Lightbulb className="w-3 h-3 mr-1" /> Insights Pending Approval
                            </span>
                          )}
                          {article.tags?.slice(0, 2).map(tag => (
                            <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                              <Tag className="w-3 h-3 mr-1" />{tag}
                            </span>
                          ))}
                        </div>

                        <h3 className="text-base font-semibold text-gray-900 mb-1 truncate">{article.title}</h3>
                        {article.summary && (
                          <p className="text-sm text-gray-600 line-clamp-2">{article.summary}</p>
                        )}

                        {/* Extracted Insights awaiting approval */}
                        {article.extracted_insights && !article.insights_approved && (
                          <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-orange-700 mb-1">AI Extracted Insights — Awaiting Your Approval</p>
                            <ul className="text-xs text-gray-700 space-y-1">
                              {article.extracted_insights.slice(0, 3).map((insight, i) => (
                                <li key={i} className="flex gap-1.5">
                                  <span className="text-orange-400 shrink-0">•</span>{insight}
                                </li>
                              ))}
                              {article.extracted_insights.length > 3 && (
                                <li className="text-gray-400">+{article.extracted_insights.length - 3} more...</li>
                              )}
                            </ul>
                            <Button
                              size="sm"
                              className="mt-2 bg-orange-600 hover:bg-orange-700 h-7 text-xs"
                              onClick={() => handleApproveInsights(article.id)}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" /> Approve Insights
                            </Button>
                          </div>
                        )}

                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span>{article.word_count?.toLocaleString()} words</span>
                          <span>·</span>
                          <span>{new Date(article.created_at).toLocaleDateString()}</span>
                          {article.relationships?.length > 0 && (
                            <>
                              <span>·</span>
                              <span>{article.relationships.length} linked</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0 items-end">
                        {/* Workflow action */}
                        {nextStatus && (
                          <Button
                            size="sm"
                            variant="outline"
                            className={`text-xs ${
                              nextStatus === 'verified' ? 'border-blue-300 text-blue-700 hover:bg-blue-50'
                              : nextStatus === 'approved' ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                              : 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'
                            }`}
                            onClick={() => handleStatusTransition(article.id, status)}
                            disabled={transitioning === article.id}
                          >
                            <ArrowRight className="w-3 h-3 mr-1" />
                            {statusMeta.nextLabel}
                          </Button>
                        )}

                        <div className="flex items-center gap-1.5">
                          {/* Extract wisdom */}
                          <Button
                            variant="outline"
                            size="sm"
                            title="Extract AI insights"
                            onClick={() => handleExtractWisdom(article.id)}
                            disabled={extracting === article.id}
                            className="text-purple-600 hover:text-purple-800 border-purple-200"
                          >
                            <Sparkles className="w-4 h-4" />
                          </Button>
                          <Link to={`/admin/kb/edit/${article.id}`}>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(article.id)}
                            disabled={deleting === article.id}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default KnowledgeBase;
