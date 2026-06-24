import React, { useState } from 'react';
import { Sparkles, RefreshCw, AlertCircle, BookOpen, Check, ArrowRight, BookMarked, GraduationCap, ListFilter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { getClassRecommendations } from '../../services/aiApi';
import { resolveBookCover, getBookCoverFallback } from '../../utils/bookCover';
import toast from 'react-hot-toast';

const ClassBookRecommendations = () => {
  const { user } = useAuthStore();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [subject, setSubject] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Freshman');
  const [count, setCount] = useState(5);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchRecommendations = async (e) => {
    if (e) e.preventDefault();
    if (!user?.token) return;
    if (!subject.trim()) {
      toast.error('Please enter a class subject.');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const data = await getClassRecommendations(user.token, {
        subject: subject.trim(),
        gradeLevel,
        count: parseInt(count, 10) || 5
      });
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error('Failed to load class recommendations:', err);
      setError(err.response?.data?.message || 'Could not load AI recommendations. Please check your connection or try again later.');
      toast.error('Failed to load class recommendations.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 relative overflow-hidden">
      {/* Decorative gradient flare */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl -translate-y-6 translate-x-6 pointer-events-none"></div>

      <div className="space-y-1">
        <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" /> AI Book Recommendations for My Class
        </h3>
        <p className="text-slate-500 text-xs sm:text-sm font-medium">
          Generate list recommendations matching course curricula and syllabus levels grounded in current library inventory
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Side: Parameters Form */}
        <form onSubmit={fetchRecommendations} className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100 lg:col-span-1">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <ListFilter className="w-4 h-4 text-indigo-600" /> Syllabus Parameters
            </h4>
            <p className="text-[11px] text-slate-500 font-medium">Configure course parameters</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <BookMarked className="w-3.5 h-3.5 text-slate-450" /> Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Compiler Design, Calculus"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-800 placeholder:text-slate-400"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-slate-450" /> Student Level
            </label>
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-700"
            >
              <option value="Freshman">Freshman / 1st Year</option>
              <option value="Sophomore">Sophomore / 2nd Year</option>
              <option value="Junior">Junior / 3rd Year</option>
              <option value="Senior">Senior / 4th Year</option>
              <option value="Postgraduate">Postgraduate</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Count of books</label>
            <select
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-700"
            >
              <option value="3">3 Recommendations</option>
              <option value="5">5 Recommendations</option>
              <option value="7">7 Recommendations</option>
              <option value="10">10 Recommendations</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analyzing Catalog...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Recommend Books
              </>
            )}
          </button>
        </form>

        {/* Right Side: Results Display */}
        <div className="lg:col-span-3 min-h-[220px]">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(count)].map((_, i) => (
                <div key={i} className="flex flex-col space-y-3 p-4 rounded-2xl border border-slate-100">
                  <div className="aspect-[3/4] w-full bg-slate-200 rounded-xl animate-pulse"></div>
                  <div className="h-4 w-3/4 bg-slate-250 rounded animate-pulse"></div>
                  <div className="h-3 w-1/2 bg-slate-200 rounded animate-pulse"></div>
                  <div className="h-3 w-5/6 bg-slate-150 rounded animate-pulse"></div>
                  <div className="h-3 w-2/3 bg-slate-150 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center text-center py-12 space-y-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/20">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="max-w-md">
                <h4 className="text-slate-800 font-bold text-lg">AI Recommendation Error</h4>
                <p className="text-slate-500 text-sm mt-1 leading-relaxed">{error}</p>
              </div>
              <button
                onClick={(e) => fetchRecommendations(e)}
                className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500 shadow-sm hover:shadow transition-all text-sm flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Retry
              </button>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
              <BookOpen className="w-12 h-12 text-slate-300 mb-3" />
              <h4 className="font-bold text-slate-700 text-sm">No Recommendations Loaded</h4>
              <p className="text-slate-500 text-xs mt-1 max-w-sm">
                {hasSearched
                  ? 'No available copies of books matched your criteria. Try adjusting the subject keywords.'
                  : 'Enter a subject and click "Recommend Books" to generate classroom-suited suggestions.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  Showing {recommendations.length} recommendations for "{subject}" ({gradeLevel})
                </span>
                <button
                  onClick={(e) => fetchRecommendations(e)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-500 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Re-run Search
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {recommendations.map((book) => (
                  <div
                    key={book._id}
                    className="flex flex-col p-4 bg-slate-50/50 hover:bg-white rounded-2xl border border-slate-100 hover:border-indigo-250 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group duration-350"
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
                        <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-700 line-clamp-1 transition-colors leading-tight" title={book.title}>
                          {book.title}
                        </h4>
                        <p className="text-slate-500 text-xs truncate">by {book.author}</p>
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold tracking-wide uppercase">
                          {book.category || book.department || 'General'}
                        </span>
                      </div>

                      {/* AI Reason box */}
                      <div className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100/55 text-[11px] sm:text-xs text-indigo-850 leading-normal italic font-medium">
                        "{book.reason}"
                      </div>

                      <div className="pt-2 border-t border-slate-100 mt-auto">
                        <Link
                          to={`/teacher/search?q=${encodeURIComponent(book.title)}`}
                          className="w-full py-1.5 bg-white hover:bg-indigo-650 border border-slate-200 hover:border-indigo-650 rounded-lg text-xs font-bold text-slate-600 hover:text-white transition-all flex items-center justify-center gap-1 group/btn shadow-sm"
                        >
                          Request for Class <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassBookRecommendations;
