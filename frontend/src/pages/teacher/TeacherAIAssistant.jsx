import React, { useState } from 'react';
import axios from 'axios';
import { BrainCircuit, Sparkles, Loader2, BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { resolveBookCover, getBookCoverFallback } from '../../utils/bookCover';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';

const TeacherAIAssistant = () => {
  const { user } = useAuthStore();
  const [interests, setInterests] = useState('compiler, algorithms');
  const [text, setText] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [summary, setSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const headers = { Authorization: `Bearer ${user.token}` };

  const handleRecommend = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setRecommendations([]);
    try {
      const response = await axios.post('http://localhost:5000/api/ai/recommend', {
        interests: interests.split(',').map((item) => item.trim()).filter(Boolean)
      }, { headers });
      setRecommendations(response.data?.recommendations || []);
      toast.success('Recommendations generated');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to generate recommendations');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSummarize = async (e) => {
    e.preventDefault();
    setIsSummarizing(true);
    setSummary('');
    try {
      const response = await axios.post('http://localhost:5000/api/ai/summarize', { text }, { headers });
      setSummary(response.data?.summary || 'No summary returned');
      toast.success('Summary generated');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to summarize text');
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 text-white rounded-3xl p-6 md:p-8 shadow-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-indigo-200"><Sparkles className="w-4 h-4" /> Teacher AI Assistant</span>
            <h2 className="text-3xl font-bold mt-3">Generate reading recommendations and summaries</h2>
            <p className="text-slate-300 mt-2 max-w-2xl">Use live book data for recommendations and quick text summaries for your course planning.</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
            <BrainCircuit className="w-8 h-8 text-indigo-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleRecommend} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Book recommendations</h3>
            <p className="text-slate-500 text-sm mt-1">Comma-separated keywords like algorithms, networking, compiler.</p>
          </div>
          <textarea
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button type="submit" disabled={isGenerating} className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60 inline-flex items-center justify-center gap-2">
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Generate recommendations
          </button>
        </form>

        <form onSubmit={handleSummarize} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Text summarizer</h3>
            <p className="text-slate-500 text-sm mt-1">Paste a syllabus note, chapter excerpt, or abstract.</p>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Paste text to summarize..."
          />
          <button type="submit" disabled={isSummarizing || !text.trim()} className="w-full py-3 rounded-2xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-60 inline-flex items-center justify-center gap-2">
            {isSummarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Summarize text
          </button>
        </form>
      </div>

      {summary ? (
        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 text-emerald-900">
          <h3 className="font-bold text-lg">Summary</h3>
          <p className="mt-2 text-sm leading-relaxed">{summary}</p>
        </div>
      ) : null}

      {recommendations.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Recommended books</h3>
              <p className="text-slate-500 text-sm mt-1">Generated from the live catalog.</p>
            </div>
            <Link to="/teacher/search" className="text-indigo-600 text-sm font-semibold inline-flex items-center gap-1">Search more <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((book) => (
              <Link key={book._id} to={`/book/${book._id}`} className="flex gap-4 p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-colors">
                <div className="w-16 h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                  <img
                    src={resolveBookCover(book)}
                    alt={book.title}
                    title={resolveBookCover(book)}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.onerror = null; e.target.src = getBookCoverFallback(book.title); }}
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-slate-800 truncate">{book.title}</h4>
                  <p className="text-sm text-slate-500 mt-1">{book.author}</p>
                  <p className="text-xs text-slate-400 font-mono mt-2">ID: {book.customId}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default TeacherAIAssistant;
