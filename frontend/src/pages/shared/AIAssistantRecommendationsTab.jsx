import React, { useState } from 'react';
import axios from 'axios';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { resolveBookCover, getBookCoverFallback } from '../../utils/bookCover';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';

const AIAssistantRecommendationsTab = () => {
  const { user } = useAuthStore();
  const [interests, setInterests] = useState('algorithms, networking');
  const [recommendations, setRecommendations] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleRecommend = async (e) => {
    e.preventDefault();
    if (!interests.trim()) return toast.error("Please enter some interests");
    
    setIsGenerating(true);
    setRecommendations([]);
    
    try {
      // Use different endpoint based on role if desired, or a unified one.
      // Here we assume /api/ai/recommend/books is available for student and /api/ai/recommend/class-books for teachers
      const endpoint = user?.role === 'teacher' 
        ? 'http://localhost:5000/api/ai/recommend/class-books' 
        : 'http://localhost:5000/api/ai/recommend/books';

      const response = await axios.post(endpoint, {
        interests: interests.split(',').map((item) => item.trim()).filter(Boolean)
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      setRecommendations(response.data?.recommendations || []);
      toast.success('Recommendations generated');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to generate recommendations');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <form onSubmit={handleRecommend} className="bg-slate-50 rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">AI Book Recommendations</h3>
          <p className="text-slate-500 text-sm mt-1">
            Enter your interests or specific subjects (comma separated) and let the AI find the best matches from our actual library catalog.
          </p>
        </div>
        <textarea
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          placeholder="e.g. machine learning, compilers, history..."
        />
        <button 
          type="submit" 
          disabled={isGenerating} 
          className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {isGenerating ? 'Generating...' : 'Get Recommendations'}
        </button>
      </form>

      {recommendations.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Top Picks For You</h3>
              <p className="text-slate-500 text-sm mt-1">Cross-referenced with live DB records.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((book) => (
              <Link key={book._id} to={`/book/${book._id}`} className="flex gap-4 p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-colors">
                <div className="w-16 h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                  <img
                    src={resolveBookCover(book)}
                    alt={book.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.onerror = null; e.target.src = getBookCoverFallback(book.title); }}
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-slate-800 truncate">{book.title}</h4>
                  <p className="text-sm text-slate-500 mt-1 truncate">{book.author}</p>
                  <p className="text-xs text-indigo-600 font-bold mt-2">{book.matchReason || 'Highly relevant'}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistantRecommendationsTab;
