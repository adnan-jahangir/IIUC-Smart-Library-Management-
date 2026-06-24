import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw, AlertCircle, BookOpen, Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { getStudentRecommendations } from '../../services/aiApi';
import { resolveBookCover, getBookCoverFallback } from '../../utils/bookCover';
import toast from 'react-hot-toast';

const BookRecommendations = () => {
  const { user } = useAuthStore();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecommendations = useCallback(async (isSilent = false) => {
    if (!user?.token) return;
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const data = await getStudentRecommendations(user.token, {});
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
      setError(err.response?.data?.message || 'Could not load AI recommendations. Please check your connection or try again later.');
      toast.error('Failed to load AI recommendations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handleRefresh = () => {
    fetchRecommendations(true);
  };

  if (loading) {
    return (
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1.5">
            <div className="h-6 w-48 bg-slate-200 rounded-md animate-pulse"></div>
            <div className="h-4 w-64 bg-slate-100 rounded-md animate-pulse"></div>
          </div>
          <div className="h-10 w-28 bg-slate-150 rounded-xl animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col space-y-3 p-4 rounded-2xl border border-slate-100">
              <div className="aspect-[3/4] w-full bg-slate-200 rounded-xl animate-pulse"></div>
              <div className="h-4 w-3/4 bg-slate-250 rounded animate-pulse"></div>
              <div className="h-3 w-1/2 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-3 w-5/6 bg-slate-150 rounded animate-pulse"></div>
              <div className="h-3 w-2/3 bg-slate-150 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-col items-center justify-center text-center py-6 space-y-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="max-w-md">
            <h4 className="text-slate-800 font-bold text-lg">AI Recommendation Error</h4>
            <p className="text-slate-500 text-sm mt-1 leading-relaxed">{error}</p>
          </div>
          <button
            onClick={() => fetchRecommendations()}
            className="px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-500 shadow-sm hover:shadow transition-all text-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 relative overflow-hidden">
      {/* Decorative gradient flare */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl -translate-y-6 translate-x-6 pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse" /> Recommended for You
          </h3>
          <p className="text-slate-500 text-xs sm:text-sm font-medium">
            AI-generated recommendations matching your borrowing logs and academic subjects
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:border-emerald-300 rounded-xl text-sm font-bold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm bg-white"
        >
          <RefreshCw className={`w-4 h-4 text-slate-500 group-hover:text-emerald-600 transition-colors ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh AI'}
        </button>
      </div>

      {recommendations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          <BookOpen className="w-10 h-10 mx-auto text-slate-350 mb-3" />
          No available books match your profile right now. Borrow a book to feed the recommendation engine!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
          {recommendations.map((book) => (
            <div
              key={book._id}
              className="flex flex-col p-4 bg-slate-50/50 hover:bg-white rounded-2xl border border-slate-100 hover:border-emerald-250 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group duration-350"
            >
              {/* Cover Preview container */}
              <div className="aspect-[3/4] w-full bg-slate-200 rounded-xl shadow-sm overflow-hidden flex-shrink-0 relative">
                <img
                  src={resolveBookCover(book)}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = getBookCoverFallback(book.title || 'Book');
                  }}
                />
                <span className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold shadow-sm flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> Available
                </span>
              </div>

              {/* Book Details */}
              <div className="flex-1 mt-3 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 text-sm group-hover:text-emerald-700 line-clamp-1 transition-colors leading-tight" title={book.title}>
                    {book.title}
                  </h4>
                  <p className="text-slate-500 text-xs truncate">by {book.author}</p>
                  <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold tracking-wide uppercase">
                    {book.category || book.department || 'General'}
                  </span>
                </div>

                {/* AI Reason box */}
                <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100/55 text-[11px] sm:text-xs text-emerald-800 leading-normal italic font-medium">
                  "{book.reason}"
                </div>

                <div className="pt-2 border-t border-slate-100 mt-auto">
                  <Link
                    to={`/student/search?q=${encodeURIComponent(book.title)}`}
                    className="w-full py-1.5 bg-white hover:bg-emerald-600 border border-slate-200 hover:border-emerald-600 rounded-lg text-xs font-bold text-slate-600 hover:text-white transition-all flex items-center justify-center gap-1 group/btn shadow-sm"
                  >
                    Request Borrow <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookRecommendations;
