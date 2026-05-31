import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  BookOpen, Plus, Search, Brain, FileText, Trash2, Edit,
  Upload, Tag, BarChart3, MessageSquare, ChevronRight, X
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api/kb`;

const CATEGORY_LABELS = {
  'muscle-strength': { label: 'Muscle & Strength', color: 'bg-red-100 text-red-700' },
  'metabolic-health': { label: 'Metabolic Health', color: 'bg-orange-100 text-orange-700' },
  'sleep-recovery': { label: 'Sleep & Recovery', color: 'bg-indigo-100 text-indigo-700' },
  'sport-performance': { label: 'Sport Performance', color: 'bg-green-100 text-green-700' },
  'physical-therapy': { label: 'Physical Therapy', color: 'bg-blue-100 text-blue-700' },
  'exercise-science': { label: 'Exercise Science', color: 'bg-purple-100 text-purple-700' },
  'evidence-based': { label: 'Evidence-Based', color: 'bg-teal-100 text-teal-700' },
  'general': { label: 'General', color: 'bg-gray-100 text-gray-700' },
};

const CategoryBadge = ({ category }) => {
  const meta = CATEGORY_LABELS[category] || CATEGORY_LABELS.general;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${meta.color}`}>
      {meta.label}
    </span>
  );
};

const KnowledgeBase = () => {
  const [articles, setArticles] = useState([]);
  const [stats, setStats] = useState({ total_articles: 0, total_words: 0, by_category: {} });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [deleting, setDeleting] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (activeCategory !== 'all') params.set('category', activeCategory);

      const [articlesRes, statsRes] = await Promise.all([
        fetch(`${API}/articles?${params}`),
        fetch(`${API}/stats`)
      ]);

      const articlesData = articlesRes.ok ? await articlesRes.json() : [];
      const statsData = statsRes.ok ? await statsRes.json() : {};

      setArticles(articlesData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading KB data:', err);
    } finally {
      setLoading(false);
    }
  }, [search, activeCategory]);

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
        setStats(prev => ({ ...prev, total_articles: prev.total_articles - 1 }));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(null);
    }
  };

  const categoryTabs = ['all', ...Object.keys(CATEGORY_LABELS)];

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
            <div className="flex items-center space-x-3">
              <Link to="/admin/kb/ask">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Ask AI
                </Button>
              </Link>
              <Link to="/admin/kb/upload">
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Doc
                </Button>
              </Link>
              <Link to="/admin/kb/create">
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  New Article
                </Button>
              </Link>
              <Link to="/admin" className="text-gray-500 hover:text-gray-800 text-sm">
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
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Categories</p>
                <p className="text-xl font-bold text-gray-900">
                  {Object.keys(stats.by_category || {}).length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">AI Ready</p>
                <p className="text-xl font-bold text-emerald-600">
                  {stats.total_articles > 0 ? 'Yes' : 'No'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

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
              {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]?.label || cat}
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
        ) : articles.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {search || activeCategory !== 'all' ? 'No matching articles' : 'Knowledge base is empty'}
              </h3>
              <p className="text-gray-500 mb-6">
                {search || activeCategory !== 'all'
                  ? 'Try a different search term or category.'
                  : 'Start building your personal knowledge library.'}
              </p>
              {!search && activeCategory === 'all' && (
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
            {articles.map(article => (
              <Card key={article.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <CategoryBadge category={article.category} />
                        {article.source_type === 'upload' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                            <Upload className="w-3 h-3 mr-1" /> Uploaded
                          </span>
                        )}
                        {article.tags?.slice(0, 3).map(tag => (
                          <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                            <Tag className="w-3 h-3 mr-1" />{tag}
                          </span>
                        ))}
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 mb-1 truncate">{article.title}</h3>
                      {article.summary && (
                        <p className="text-sm text-gray-600 line-clamp-2">{article.summary}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>{article.word_count?.toLocaleString()} words</span>
                        <span>·</span>
                        <span>{new Date(article.created_at).toLocaleDateString()}</span>
                        {article.source_reference && (
                          <>
                            <span>·</span>
                            <span className="truncate max-w-xs">{article.source_reference}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
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
                      <Link to={`/admin/kb/ask?article=${article.id}`}>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default KnowledgeBase;
