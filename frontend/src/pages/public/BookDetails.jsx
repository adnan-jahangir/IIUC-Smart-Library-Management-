import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BookOpen, ArrowLeft, Layers, MapPin, CheckCircle, Info, Bookmark, HelpCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import axios from 'axios';
import { resolveBookCover, getBookCoverFallback } from '../../utils/bookCover';

const BookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const [book, setBook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [borrowRequested, setBorrowRequested] = useState(false);
  const [reservationRequested, setReservationRequested] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:5000/api/books/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Book not found');
        return res.json();
      })
      .then(data => {
        setBook({
           ...data,
            // Preserve 0 availability from DB; do not fall back to legacy `copies` when value is 0
            available: data.availableCopies ?? data.copies ?? 0,
            total: data.totalCopies ?? data.copies ?? 0,
           id: data.customId || data._id, // for links to digital reader
           image: data.image,
           fallback: `https://via.placeholder.com/300x400/1a1a2e/ffffff?text=${encodeURIComponent(data.title)}`
        });
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching book:', err);
        setIsLoading(false);
      });
  }, [id]);

  const [activeRack, setActiveRack] = useState(null);

  const handleBorrowRequest = async () => {
    if (!isAuthenticated) {
      toast.error('You must be signed in to borrow a book.');
      navigate('/login');
      return;
    }

    if ((user?.role || '').toLowerCase() !== 'student' && (user?.role || '').toLowerCase() !== 'teacher') {
      toast.error('Only students and teachers can request to borrow books.');
      return;
    }

    setBorrowRequested(true);
    try {
      const requestBookId = book._id || book.id;
      const response = await axios.post(
        'http://localhost:5000/api/requests',
        { bookId: requestBookId },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      toast.success(response.data.message || 'Borrow request submitted successfully!');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to submit borrow request.');
      setBorrowRequested(false);
    }
  };

  const handleReservationRequest = async () => {
    if (!isAuthenticated) {
      toast.error('You must be signed in to reserve a book.');
      navigate('/login');
      return;
    }

    if ((user?.role || '').toLowerCase() !== 'student' && (user?.role || '').toLowerCase() !== 'teacher') {
      toast.error('Only students and teachers can reserve books.');
      return;
    }

    setReservationRequested(true);
    try {
      const response = await axios.post(
        'http://localhost:5000/api/reservations',
        { bookId: book.id },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      toast.success(response.data.message || 'Book reserved successfully!');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to reserve book.');
      setReservationRequested(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
        <p className="text-slate-500 font-bold">Locating Book in Database...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <HelpCircle className="w-16 h-16 text-slate-300" />
        <h2 className="text-2xl font-bold text-slate-800">Book Not Found</h2>
        <Link to="/catalog" className="text-emerald-600 hover:underline font-bold">Return to Catalog</Link>
      </div>
    );
  }

  // Determine shelf based on department
  const rackCode = book.department === 'CSE' ? 'Rack A-2' : book.department === 'EEE' ? 'Rack B-1' : 'Rack C-4';
  const shelfLevel = book.department === 'CSE' ? 'Shelf 3' : book.department === 'EEE' ? 'Shelf 1' : 'Shelf 2';
  const floorName = book.department === 'CSE' || book.department === 'EEE' ? '2nd Floor' : '1st Floor';

  return (
    <div className="min-h-screen bg-slate-50/50 pt-28 pb-10">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Link */}
        <Link to="/catalog" className="inline-flex items-center gap-2 text-slate-600 hover:text-emerald-600 font-medium mb-8 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Back to Catalog
        </Link>

        {/* Book Details Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Cover & Actions */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
            <div className="w-52 h-72 rounded-2xl overflow-hidden shadow-lg border border-slate-100 mb-6 bg-slate-100 relative">
              <img 
                src={resolveBookCover(book)} 
                alt={book.title} 
                onError={(e) => { e.target.onerror = null; e.target.src = getBookCoverFallback(book.title); }}
                className="w-full h-full object-cover" 
              />
            </div>
            
            <div className="w-full space-y-3">
              {book.available > 0 ? (
                <button
                  onClick={handleBorrowRequest}
                  disabled={borrowRequested}
                  className={`w-full py-3.5 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                    borrowRequested
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/10'
                  }`}
                >
                  <Bookmark className="w-5 h-5" />
                  {borrowRequested ? 'Requested Pending' : 'Request to Borrow'}
                </button>
              ) : (
                <button
                  onClick={handleReservationRequest}
                  disabled={reservationRequested}
                  className={`w-full py-3.5 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                    reservationRequested
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-amber-500 hover:bg-amber-400 text-white shadow-amber-500/10'
                  }`}
                >
                  <Bookmark className="w-5 h-5" />
                  {reservationRequested ? 'Reservation Pending' : 'Reserve Book'}
                </button>
              )}

              <Link
                to={`/digital-reader/${book.id}`}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-center block transition-all"
              >
                Read Digital Version (PDF)
              </Link>
            </div>
          </div>

          {/* Metadata info */}
          <div className="md:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <span className="px-3.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full tracking-wider uppercase">
                {book.department} Section
              </span>
              <h1 className="text-3xl font-extrabold text-slate-900 mt-3 leading-tight">{book.title}</h1>
              <p className="text-lg text-slate-500 font-medium mt-1">by {book.author}</p>
            </div>

            <hr className="border-slate-100" />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase">ISBN-13</span>
                <p className="text-slate-800 font-bold">{book.isbn}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase">Location</span>
                <p className="text-slate-800 font-bold">{floorName}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase">Rack & Shelf</span>
                <p className="text-emerald-600 font-extrabold">{rackCode} ({shelfLevel})</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase">Availability</span>
                <p className={`font-bold ${book.available > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {book.available} of {book.total} copies
                </p>
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Layers className="w-5 h-5 text-slate-400" /> Book Description & Course Syllabus Relevance
              </h3>
              <p className="text-slate-600 leading-relaxed">
                This textbooks is a highly recommended reference manual for IIUC undergraduate curriculum courses in the {book.department} department. It covers fundamental methodologies, practical coding assignments, and theoretical foundations essential for mid-term and final examinations.
              </p>
            </div>
          </div>
        </div>

        {/* INTERACTIVE SHELF LOCATOR SVG FLOOR PLAN MAP */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-emerald-600 animate-bounce" /> Interactive Shelf Locator Map
              </h2>
              <p className="text-slate-500 text-sm mt-1">Live digital floor plan of the {floorName}. Pulsing area shows the exact shelf location.</p>
            </div>
            
            <div className="px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-sm font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Selected Book Location: <span className="underline">{rackCode}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            
            {/* SVG Interactive Map */}
            <div className="lg:col-span-2 bg-slate-900 p-6 rounded-2xl relative border border-slate-800 overflow-hidden flex justify-center items-center h-80 sm:h-96">
              <div className="absolute top-4 left-4 text-xs font-bold text-slate-500 tracking-widest uppercase">
                {floorName} - General Layout
              </div>
              <div className="absolute bottom-4 left-4 text-xs text-slate-600 flex items-center gap-3">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span> Target Shelf</div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-slate-700 rounded"></span> Other Racks</div>
              </div>

              <svg viewBox="0 0 800 400" className="w-full h-full max-w-xl text-white">
                <rect x="20" y="20" width="760" height="360" rx="10" fill="none" stroke="#334155" strokeWidth="3" strokeDasharray="5,5" />
                <path d="M 700 20 L 750 20" stroke="#f43f5e" strokeWidth="4" />
                <text x="690" y="45" fill="#f43f5e" fontSize="12" fontWeight="bold">Main Entry</text>

                <rect x="60" y="60" width="120" height="80" rx="5" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                <text x="85" y="105" fill="#94a3b8" fontSize="12">Reading Tables</text>

                <rect x="60" y="260" width="120" height="80" rx="5" fill="#1e293b" stroke="#475569" strokeWidth="2" />
                <text x="80" y="305" fill="#94a3b8" fontSize="12">Librarian Counter</text>

                <g 
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setActiveRack('Rack A')}
                  onMouseLeave={() => setActiveRack(null)}
                >
                  <rect 
                    x="280" y="60" width="100" height="110" rx="8" 
                    fill={rackCode.startsWith('Rack A') ? '#022c22' : '#1e293b'} 
                    stroke={rackCode.startsWith('Rack A') ? '#10b981' : '#475569'} 
                    strokeWidth={rackCode.startsWith('Rack A') ? '3' : '1.5'} 
                    className={rackCode.startsWith('Rack A') ? 'animate-pulse' : ''}
                  />
                  <text x="300" y="120" fill={rackCode.startsWith('Rack A') ? '#34d399' : '#64748b'} fontSize="14" fontWeight="bold">RACK A</text>
                  <text x="290" y="140" fill="#94a3b8" fontSize="10">(CSE & IT)</text>
                </g>

                <g 
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setActiveRack('Rack B')}
                  onMouseLeave={() => setActiveRack(null)}
                >
                  <rect 
                    x="420" y="60" width="100" height="110" rx="8" 
                    fill={rackCode.startsWith('Rack B') ? '#172554' : '#1e293b'} 
                    stroke={rackCode.startsWith('Rack B') ? '#3b82f6' : '#475569'} 
                    strokeWidth={rackCode.startsWith('Rack B') ? '3' : '1.5'} 
                    className={rackCode.startsWith('Rack B') ? 'animate-pulse' : ''}
                  />
                  <text x="440" y="120" fill={rackCode.startsWith('Rack B') ? '#60a5fa' : '#64748b'} fontSize="14" fontWeight="bold">RACK B</text>
                  <text x="435" y="140" fill="#94a3b8" fontSize="10">(EEE & CTE)</text>
                </g>

                <g 
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setActiveRack('Rack C')}
                  onMouseLeave={() => setActiveRack(null)}
                >
                  <rect 
                    x="560" y="60" width="100" height="110" rx="8" 
                    fill={rackCode.startsWith('Rack C') ? '#701a75' : '#1e293b'} 
                    stroke={rackCode.startsWith('Rack C') ? '#d946ef' : '#475569'} 
                    strokeWidth={rackCode.startsWith('Rack C') ? '3' : '1.5'} 
                    className={rackCode.startsWith('Rack C') ? 'animate-pulse' : ''}
                  />
                  <text x="580" y="120" fill={rackCode.startsWith('Rack C') ? '#f472b6' : '#64748b'} fontSize="14" fontWeight="bold">RACK C</text>
                  <text x="568" y="140" fill="#94a3b8" fontSize="10">(Pharm & Gen)</text>
                </g>

                <g 
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setActiveRack('Rack D')}
                  onMouseLeave={() => setActiveRack(null)}
                >
                  <rect x="280" y="220" width="100" height="110" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                  <text x="300" y="280" fill="#64748b" fontSize="14" fontWeight="bold">RACK D</text>
                  <text x="290" y="300" fill="#94a3b8" fontSize="10">(BBA & Law)</text>
                </g>

                <g 
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setActiveRack('Rack E')}
                  onMouseLeave={() => setActiveRack(null)}
                >
                  <rect x="420" y="220" width="100" height="110" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                  <text x="440" y="280" fill="#64748b" fontSize="14" fontWeight="bold">RACK E</text>
                  <text x="430" y="300" fill="#94a3b8" fontSize="10">(Arts & ELL)</text>
                </g>

                <g 
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setActiveRack('Rack F')}
                  onMouseLeave={() => setActiveRack(null)}
                >
                  <rect x="560" y="220" width="100" height="110" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                  <text x="580" y="280" fill="#64748b" fontSize="14" fontWeight="bold">RACK F</text>
                  <text x="565" y="300" fill="#94a3b8" fontSize="10">(Journals & Thesis)</text>
                </g>
              </svg>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" /> Walkthrough Directions
                </h4>
                <ul className="space-y-3 text-sm text-slate-600 font-medium">
                  <li className="flex gap-2">
                    <span className="text-emerald-500 font-bold">1.</span>
                    <span>Enter through the <strong>Main Library Entry Door</strong> on the {floorName}.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-500 font-bold">2.</span>
                    <span>Pass by the Librarian Desk and walk straight towards the central corridors.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-500 font-bold">3.</span>
                    <span>Locate <strong>{rackCode}</strong> (indicated on the pulsing screen block).</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-500 font-bold">4.</span>
                    <span>The book is stacked on <strong>{shelfLevel}</strong> (counting from bottom to top).</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl text-center text-xs font-semibold text-slate-400">
                {activeRack ? (
                  <span>Viewing details for: <strong className="text-white">{activeRack}</strong></span>
                ) : (
                  <span>Hover over any Rack on the map for category scopes.</span>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default BookDetails;
