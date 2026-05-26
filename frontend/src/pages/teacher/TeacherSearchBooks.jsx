import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Search, BookOpen, BookmarkPlus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import { resolveBookCover, getBookCoverFallback } from '../../utils/bookCover';

const TeacherSearchBooks = () => {
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await axios.get(`http://localhost:5000/api/books?search=${encodeURIComponent(query)}`, {
          signal: controller.signal
        });
        setResults(response.data || []);
      } catch (error) {
        if (error.name !== 'CanceledError') {
          console.error('Teacher search error:', error);
          toast.error('Failed to search books');
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const authHeaders = user?.token ? { Authorization: `Bearer ${user.token}` } : {};

  const handleBorrow = async (bookId) => {
    setActionId(bookId);
    try {
      await axios.post('http://localhost:5000/api/requests', { bookId }, { headers: authHeaders });
      toast.success('Borrow request submitted');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Borrow request failed');
    } finally {
      setActionId(null);
    }
  };

  const handleReserve = async (bookId) => {
    setActionId(bookId);
    try {
      await axios.post('http://localhost:5000/api/reservations', { bookId }, { headers: authHeaders });
      toast.success('Reservation submitted');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Reservation failed');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Search Books</h2>
        <p className="text-slate-500 mt-1">Search by title, author, ISBN, or book ID and request it directly.</p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, author, ISBN or ID..."
            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-500 gap-3">
          <Loader2 className="w-5 h-5 animate-spin" /> Searching books...
        </div>
      ) : query.trim() && results.length === 0 ? (
        <div className="py-16 text-center text-slate-500">No books matched your search.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {results.map((book) => {
            const unavailable = Number(book.availableCopies ?? 0) <= 0;
            const busy = actionId === book._id || actionId === book.customId;

            return (
              <div key={book._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="h-56 bg-slate-100 overflow-hidden">
                  <img
                    src={resolveBookCover(book)}
                    alt={book.title}
                    title={resolveBookCover(book)}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.onerror = null; e.target.src = getBookCoverFallback(book.title); }}
                  />
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-800 line-clamp-2">{book.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{book.author}</p>
                    <p className="text-xs text-slate-400 font-mono mt-2">ID: {book.customId} • ISBN: {book.isbn}</p>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Available copies</span>
                    <span className={`font-semibold ${unavailable ? 'text-rose-600' : 'text-emerald-600'}`}>{book.availableCopies ?? 0}</span>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleBorrow(book._id)}
                      disabled={busy}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                      Borrow
                    </button>
                    <button
                      onClick={() => handleReserve(book._id)}
                      disabled={busy}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 disabled:opacity-60"
                    >
                      <BookmarkPlus className="w-4 h-4" /> Reserve
                    </button>
                  </div>

                  <Link to={`/book/${book._id}`} className="block text-center text-sm font-semibold text-indigo-600 hover:underline">
                    View details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeacherSearchBooks;
