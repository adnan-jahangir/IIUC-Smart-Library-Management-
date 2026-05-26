import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { resolveBookCover, getBookCoverFallback } from '../../utils/bookCover';

const StudentSearchBooks = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const res = await axios.get(`http://localhost:5000/api/books?search=${encodeURIComponent(query)}`, {
          signal: controller.signal
        });
        setResults(res.data || []);
      } catch (err) {
        if (err.name !== 'CanceledError') console.error('Book search error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const t = setTimeout(fetchResults, 300);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [query]);

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Search Books</h2>
        <p className="text-slate-500 mt-1">Find books by title, author, ISBN or ID.</p>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="sr-only">Search</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, author, ISBN or ID..."
              className="w-full px-4 py-3 pl-11 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>
        </div>
      </div>

      <div>
        {isLoading ? (
          <div className="py-12 text-center text-slate-500">Searching...</div>
        ) : query.trim() && results.length === 0 ? (
          <div className="py-12 text-center text-slate-500">No books matched your search.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((b) => (
              <Link key={b._id} to={`/book/${b._id}`} className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-200 hover:shadow transition-shadow">
                <div className="w-20 h-28 bg-slate-100 rounded overflow-hidden flex-shrink-0">
                  <img src={resolveBookCover(b)} alt={b.title} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = getBookCoverFallback(b.title); }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 truncate">{b.title}</h3>
                  <p className="text-xs text-slate-500">{b.author}</p>
                  <p className="text-xs text-slate-400 font-mono mt-2">ID: {b.customId} • ISBN: {b.isbn}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSearchBooks;
