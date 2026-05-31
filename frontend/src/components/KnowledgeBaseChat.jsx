import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Brain, Send, User, BookOpen, ChevronDown, ChevronUp, ArrowLeft, Loader2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api/kb`;

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'muscle-strength', label: 'Muscle & Strength' },
  { value: 'metabolic-health', label: 'Metabolic Health' },
  { value: 'sleep-recovery', label: 'Sleep & Recovery' },
  { value: 'sport-performance', label: 'Sport Performance' },
  { value: 'physical-therapy', label: 'Physical Therapy' },
  { value: 'exercise-science', label: 'Exercise Science' },
  { value: 'evidence-based', label: 'Evidence-Based Research' },
  { value: 'general', label: 'General' },
];

const SUGGESTED_QUESTIONS = [
  "What are the key principles for muscle hypertrophy?",
  "How does sleep quality affect metabolic health?",
  "What are the best recovery protocols for PT patients?",
  "Explain the science behind HIIT for longevity",
  "What does the evidence say about progressive overload?",
  "How should I structure pickleball conditioning?",
];

const SourceCard = ({ source }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium text-gray-800 truncate">{source.title}</span>
          <span className="text-xs text-gray-400 shrink-0">{source.category}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      {open && source.summary && (
        <div className="px-3 pb-2 pt-1 text-xs text-gray-600 bg-gray-50 border-t border-gray-100">
          {source.summary}
        </div>
      )}
    </div>
  );
};

const Message = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        isUser ? 'bg-blue-500' : 'bg-gradient-to-br from-emerald-500 to-teal-600'
      }`}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Brain className="w-4 h-4 text-white" />}
      </div>
      <div className={`max-w-2xl space-y-2 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-blue-500 text-white rounded-tr-sm'
            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
        }`}>
          {msg.content}
        </div>
        {msg.sources && msg.sources.length > 0 && (
          <div className="w-full space-y-1">
            <p className="text-xs text-gray-400 font-medium">Sources used:</p>
            {msg.sources.map((source, i) => (
              <SourceCard key={i} source={source} />
            ))}
          </div>
        )}
        {msg.articles_found !== undefined && (
          <p className="text-xs text-gray-400">
            {msg.articles_found} article{msg.articles_found !== 1 ? 's' : ''} referenced
          </p>
        )}
      </div>
    </div>
  );
};

const KnowledgeBaseChat = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi Randy! I'm your personal AI assistant powered by your knowledge base. Ask me anything about your research, protocols, or any topic in your library. The more articles you add, the better my answers will be.",
    }
  ]);
  const [input, setInput] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/stats`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (question) => {
    const q = (question || input).trim();
    if (!q || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);

    try {
      const res = await fetch(`${API}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          category: category === 'all' ? null : category,
          max_context_articles: 5,
        }),
      });

      if (!res.ok) throw new Error('Query failed');
      const data = await res.json();

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        articles_found: data.articles_found,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I couldn't process that question. Please check that the backend is running and try again.",
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b shrink-0">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Ask Your Knowledge Base</h1>
                {stats && (
                  <p className="text-sm text-gray-500">
                    {stats.total_articles} article{stats.total_articles !== 1 ? 's' : ''} ·{' '}
                    {stats.total_words ? `${(stats.total_words / 1000).toFixed(1)}k words` : '0 words'}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-48 h-9 text-sm">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Link to="/admin/kb">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Library
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
          {messages.map((msg, i) => (
            <Message key={i} msg={msg} />
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching knowledge base...
                </div>
              </div>
            </div>
          )}

          {/* Suggested questions when no prior AI responses */}
          {messages.length === 1 && !loading && (
            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium text-gray-500 text-center">Suggested questions</p>
              <div className="grid md:grid-cols-2 gap-2">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="text-left text-sm px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-colors text-gray-700"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t shadow-sm shrink-0">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex gap-3">
            <Input
              ref={inputRef}
              placeholder="Ask a question from your knowledge base..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              className="flex-1 h-11"
            />
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 h-11 px-5"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Answers are generated only from Randy's knowledge base articles · Press Enter to send
          </p>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBaseChat;
