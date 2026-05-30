import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, MapPin, Search, Loader2 } from 'lucide-react';
import { resolveBookCover, getBookCoverFallback } from '../../utils/bookCover';

const DEPARTMENTS = ['CSE', 'EEE', 'ETE', 'CCE', 'CIVIL', 'Pharmacy', 'BBA', 'ELL', 'Law'];

const BookCard = ({ book }) => (
  <div className="bg-white group rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
    <div className="h-56 bg-slate-100 relative overflow-hidden">
      <img 
        src={resolveBookCover(book)} 
        alt={book.title} 
        onError={(e) => { e.target.onerror = null; e.target.src = getBookCoverFallback(book.title); }}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
      />
      <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur text-xs font-bold text-slate-800 rounded-lg shadow-sm">
         {book.department}
      </div>
      {book.available === 0 && (
         <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-rose-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-md">Out of Stock</span>
         </div>
      )}
    </div>
    <div className="p-5 flex flex-col flex-1">
      <h3 className="font-bold text-lg text-slate-800 line-clamp-1 mb-1" title={book.title}>{book.title}</h3>
      <p className="text-slate-500 text-sm font-medium mb-4">{book.author}</p>
      
      <div className="mt-auto flex items-center justify-between">
         <div className="flex flex-col">
           <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Available</span>
           <span className={`text-sm font-bold ${book.available > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
             {book.available} / {book.total}
           </span>
         </div>
         <Link to={`/book/${book.customId || book.id}`} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
           book.available > 0 ? 'bg-slate-900 text-white hover:bg-emerald-600 shadow-md' : 'bg-slate-100 text-slate-400 pointer-events-none'
         }`}>
           Details
         </Link>
      </div>
    </div>
  </div>
);

const Catalog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  
  // Real Backend Data State
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/books')
      .then(res => res.json())
      .then(data => {
        const updatedBooks = data.map(book => {
          // normalize department/category fields for consistent display and filtering
          const dept = book.department ?? book.departmentName ?? book.category ?? 'General';
          const category = book.category ?? book.subject ?? dept;
          return {
            ...book,
            // Use nullish checks so 0 available is preserved and does not fall back to legacy `copies`
            available: book.availableCopies ?? book.copies ?? 0,
            total: book.totalCopies ?? book.copies ?? 0,
            id: book.customId || book._id,
            image: book.image,
            department: dept,
            category,
            fallback: `https://via.placeholder.com/300x400/1a1a2e/ffffff?text=${encodeURIComponent(book.title)}`
          };
        });
        setBooks(updatedBooks);
        setIsLoading(false);
        setFetchError(null);
      })
      .catch(err => {
        console.error('Error fetching books:', err);
        setIsLoading(false);
        setFetchError(err.message || 'Failed to fetch books from the backend.');
      });
  }, []);

  // Filter logic
  const filteredBooks = books.filter(book => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = book.title?.toLowerCase().includes(q) || book.author?.toLowerCase().includes(q) || (book.category || '').toLowerCase().includes(q);
    const matchesDept = selectedDept === 'All' || (book.department === selectedDept) || (book.category === selectedDept);
    return matchesSearch && matchesDept;
  });

  return (
    <div className="min-h-screen bg-slate-50/50 pt-28 pb-20">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10 border-b border-slate-200 pb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">Library Catalog</h1>
            <p className="text-slate-500 text-lg max-w-2xl">Search and explore our massive collection of academic resources, journals, and reference materials.</p>
          </div>
          
          <div className="w-full md:w-auto relative max-w-md flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input 
              type="text" 
              placeholder="Search title, author, or ISBN..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800 font-medium transition-all"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-8">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4">Department</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => setSelectedDept('All')}
                  className={`w-full text-left px-4 py-2.5 rounded-xl font-medium transition-colors ${selectedDept === 'All' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  All Departments
                </button>
                {DEPARTMENTS.map(dept => (
                  <button 
                    key={dept}
                    onClick={() => setSelectedDept(dept)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl font-medium transition-colors ${selectedDept === dept ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl text-white shadow-lg mx-auto max-w-sm lg:hidden hidden">
               <h3 className="font-bold flex items-center gap-2 mb-2"><BookOpen className="w-4 h-4 text-emerald-400" /> Need Help?</h3>
               <p className="text-sm text-slate-300">If you cannot find a specific book, teachers can request new inventory via the portal.</p>
            </div>
          </aside>

          {/* Book Elements */}
          <div className="flex-1">
             <div className="mb-4 flex justify-between items-center text-sm font-semibold text-slate-500">
               <span>Showing {filteredBooks.length} results</span>
               <select className="bg-transparent font-semibold focus:outline-none cursor-pointer">
                 <option>Sort by: Popular</option>
                 <option>Sort by: Newest</option>
                 <option>Sort by: A-Z</option>
               </select>
             </div>

             {isLoading ? (
                 <div className="flex justify-center items-center py-20 text-emerald-600">
                    <Loader2 className="w-10 h-10 animate-spin" />
                 </div>
             ) : fetchError ? (
                <div className="text-center py-12 bg-rose-50 border border-rose-100 rounded-2xl">
                  <h3 className="text-lg font-bold text-rose-600 mb-2">Could not load catalog</h3>
                  <p className="text-sm text-rose-500 mb-4">{fetchError}</p>
                  <p className="text-sm text-slate-500">Make sure the backend is running and reachable at <strong>http://localhost:5000</strong>.</p>
                </div>
             ) : filteredBooks.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                   {filteredBooks.map(book => (
                     <BookCard key={book._id || book.customId} book={book} />
                   ))}
                 </div>
             ) : (
                 <div className="text-center py-20 bg-white border border-dashed border-slate-300 rounded-3xl">
                    <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                      <Search className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No books found</h3>
                    <p className="text-slate-500 max-w-md mx-auto">We couldn't find anything matching "{searchTerm}". Try adjusting your filters or search query.</p>
                    <button 
                      onClick={() => {setSearchTerm(''); setSelectedDept('All')}}
                      className="mt-6 px-6 py-2 bg-emerald-50 text-emerald-600 font-bold rounded-xl hover:bg-emerald-100 transition-colors"
                    >
                      Clear Filters
                    </button>
                 </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Catalog;
