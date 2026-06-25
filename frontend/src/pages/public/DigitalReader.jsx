import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  BookOpen, ZoomIn, ZoomOut, Maximize2, ArrowLeft, Bookmark, Highlighter, 
  ChevronLeft, ChevronRight, List, Loader2, Sparkles, AlertCircle, 
  FileText, CheckCircle2, LogIn, Lock 
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { getBookInsight } from '../../services/aiApi';
import { resolveBookCover, getBookCoverFallback } from '../../utils/bookCover';

const DigitalReader = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const token = user?.token;

  const [book, setBook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [insight, setInsight] = useState(null);
  const [isInsightLoading, setIsInsightLoading] = useState(true);
  const [insightError, setInsightError] = useState(false);

  // Excerpt state
  const [currentPage, setCurrentPage] = useState(42);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [highlightColor, setHighlightColor] = useState(null); // 'yellow', 'green', or null
  const [highlights, setHighlights] = useState({}); // Stores page: { lineIndex: color }
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fallback structures if AI call fails or user is guest
  const defaultSynopsis = `This textbook serves as a vital academic resource for undergraduate and postgraduate studies. It covers fundamental methodologies, practical applications, and theoretical frameworks required to master the curriculum concepts.`;

  const defaultChapters = [
    { num: 1, name: 'Chapter 1: Foundational Frameworks', description: 'Covers basic theoretical structures, computational models, and algorithmic foundations.' },
    { num: 2, name: 'Chapter 2: Core Data Structures & Arrays', description: 'Explores linear and non-linear memory structures like arrays, lists, and trees.' },
    { num: 3, name: 'Chapter 3: Recursive Algorithmic Analysis', description: 'Focuses on dividing problems dynamically and calculating recurrence time complexities.' },
    { num: 4, name: 'Chapter 4: Advanced Systems Implementations', description: 'Details system engineering concerns including compiling sequences, syntax trees, and optimization.' }
  ];

  const defaultTakeaways = [
    "Master foundational core principles and theoretical models.",
    "Analyze time and space complexity using standard mathematical notations.",
    "Implement efficient data organization strategies in real-world scenarios.",
    "Design recursive and divide-and-conquer solutions to complex computing problems."
  ];

  // Fetch book and insights
  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setIsInsightLoading(true);
    setInsightError(false);

    // Fetch Book Metadata
    fetch(`http://localhost:5000/api/books/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Book not found');
        return res.json();
      })
      .then(data => {
        setBook({
          ...data,
          id: data.customId || data._id
        });
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching book:', err);
        setIsLoading(false);
      });

    // Fetch AI insights if user is logged in
    if (token) {
      getBookInsight(token, id)
        .then(res => {
          if (res && res.insight) {
            setInsight(res.insight);
          } else {
            setInsightError(true);
          }
          setIsInsightLoading(false);
        })
        .catch(err => {
          console.error('Error fetching book insight:', err);
          setInsightError(true);
          setIsInsightLoading(false);
        });
    } else {
      setIsInsightLoading(false);
    }
  }, [id, token]);

  // Dummy reading content based on chapter index modulo 4
  const chapterContents = {
    1: [
      "In the design of modern academic systems, algorithms form the primary baseline framework.",
      "An algorithm can be defined as any well-defined computational procedure that takes some value as input and produces some value as output.",
      "Thus, we can view algorithms as tools for solving well-specified computational problems.",
      "Input parameters must be mapped through stable algorithmic logic to guarantee accuracy.",
      "We will explore sorting algorithms, matrix operations, and dynamic programming in depth."
    ],
    2: [
      "Data structures organize and store data to enable efficient access and modifications.",
      "Linked lists, stacks, and queues form the fundamental building blocks of memory arrays.",
      "Pointers play a critical role in linked lists, chaining disparate memory blocks dynamically.",
      "In contrast, binary search trees provide logarithmic lookups, inserts, and delete times.",
      "Review the time complexity metrics of heap trees and graph grids before examinations."
    ],
    3: [
      "Recursion solves problems by calling self-functions repeatedly on subdivided inputs.",
      "Every recursive algorithm must satisfy a base-case threshold to terminate execution.",
      "Failure to specify terminal checks leads to infinite iterations and stack overflow crashes.",
      "Divide-and-conquer strategy divides problems into sub-problems, solves, and combines results.",
      "Classic examples include Merge Sort, Quick Sort, and binary tree height calculations."
    ],
    4: [
      "Compiler architectures utilize tokenizers and lexical analysers to compile code.",
      "During parsing stages, syntax trees map hierarchical relations of programming languages.",
      "LL(1) parsing tables verify language strings, feeding syntax rules systematically.",
      "Shift-reduce conflicts in bottom-up parsing are resolved using precedence rules.",
      "This section details compiler code generation steps and resource optimizer configurations."
    ]
  };

  const handleLineClick = (idx) => {
    if (!highlightColor) return;
    
    const key = `${selectedChapter}-${currentPage}`;
    setHighlights(prev => {
      const pageHighlights = prev[key] || {};
      if (pageHighlights[idx] === highlightColor) {
        // Toggle off if clicked again with same color
        const newPageH = { ...pageHighlights };
        delete newPageH[idx];
        return { ...prev, [key]: newPageH };
      } else {
        return {
          ...prev,
          [key]: { ...pageHighlights, [idx]: highlightColor }
        };
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <p className="text-slate-400 font-bold tracking-widest uppercase">Loading Book Overview & Reader Dashboard...</p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4">
        <p className="text-rose-500 font-bold">Failed to load book data.</p>
        <button onClick={() => navigate('/catalog')} className="text-emerald-400 hover:underline font-bold">Return to Catalog</button>
      </div>
    );
  }

  // Map chosen chapter to available dummy content (1-4)
  const mappedChapterIndex = ((selectedChapter - 1) % 4) + 1;
  const contentLines = chapterContents[mappedChapterIndex] || chapterContents[1];
  const highlightKey = `${selectedChapter}-${currentPage}`;
  const activePageHighlights = highlights[highlightKey] || {};

  // Resolve chapters list to render on left side
  const activeChapters = insight?.chapters || defaultChapters;
  const activeSynopsis = insight?.synopsis || defaultSynopsis;
  const activeTakeaways = insight?.keyTakeaways || defaultTakeaways;

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-all ${
      isFullscreen ? 'fixed inset-0 z-50' : ''
    }`}>
      
      {/* Top Header Navigation */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 flex-shrink-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/book/${book.id}`)}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all border border-slate-800"
            title="Return to Details"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[10px] text-emerald-500 font-extrabold tracking-widest uppercase">Overview & Interactive Reader</span>
            <h1 className="font-extrabold text-sm text-white truncate max-w-xs md:max-w-md">{book.title}</h1>
          </div>
        </div>

        {/* Zoom & Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950/80 rounded-xl p-1 border border-slate-800">
            <button 
              onClick={() => setZoomLevel(prev => Math.max(70, prev - 10))}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-300 w-12 text-center">{zoomLevel}%</span>
            <button 
              onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all border border-slate-800"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace split */}
      <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
        
        {/* LEFT SECTION: About the Book & AI Syllabus Dashboard */}
        <aside className="w-full lg:w-[480px] bg-slate-900 border-r border-slate-800 flex flex-col overflow-y-auto flex-shrink-0 relative">
          
          {/* Cover Header and Meta */}
          <div className="p-6 border-b border-slate-850 bg-gradient-to-b from-slate-850 to-slate-900 flex gap-4">
            <div className="w-20 h-28 rounded-lg overflow-hidden shadow-lg border border-slate-800 bg-slate-950 flex-shrink-0">
              <img 
                src={resolveBookCover(book)} 
                alt={book.title} 
                onError={(e) => { e.target.onerror = null; e.target.src = getBookCoverFallback(book.title); }}
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="flex flex-col justify-center">
              <span className="px-2 py-0.5 w-fit bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/20 uppercase tracking-wider mb-1.5">
                {book.department} Course Book
              </span>
              <h2 className="text-base font-extrabold text-white leading-snug line-clamp-2">{book.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">by {book.author}</p>
            </div>
          </div>

          {/* AI Info Bar */}
          <div className="px-6 py-3 bg-gradient-to-r from-emerald-950/20 to-slate-900 border-b border-slate-850 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">Gemini AI Book Insight</span>
            </div>
            {isInsightLoading ? (
              <span className="text-[10px] text-slate-500 flex items-center gap-1 font-semibold">
                <Loader2 className="w-3 h-3 animate-spin text-emerald-400" /> Generating...
              </span>
            ) : isAuthenticated ? (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-1.5 py-0.5 rounded border border-emerald-500/30 uppercase tracking-wider">
                Live
              </span>
            ) : (
              <span className="text-[10px] bg-amber-500/10 text-amber-400 font-extrabold px-1.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Locked
              </span>
            )}
          </div>

          {/* Guest lock overlay / content wrapper */}
          <div className="relative flex-grow flex flex-col p-6 space-y-6">
            
            {/* If guest: Show locked banner blur overlay */}
            {!isAuthenticated && (
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[3px] z-20 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mb-4 border border-emerald-500/30 shadow-lg shadow-emerald-500/5">
                  <Lock className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Unlock AI Academic Insights</h3>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-5">
                  Sign in to generate full book outlines, chapter synopses, and takeaways tailored to your IIUC course syllabus.
                </p>
                <Link 
                  to="/login"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/10 transition-all"
                >
                  <LogIn className="w-4 h-4" /> Sign In to System
                </Link>
              </div>
            )}

            {/* If authenticated but AI request failed: Show warn banner */}
            {isAuthenticated && insightError && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex gap-3 text-rose-200">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-bold">Insight Generation Offline</p>
                  <p className="mt-0.5 text-rose-300">We couldn't connect to the AI model. Displaying standard reference outline instead.</p>
                </div>
              </div>
            )}

            {/* Synopsis Card */}
            <div className={`space-y-2.5 ${!isAuthenticated ? 'opacity-30 pointer-events-none' : ''}`}>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" /> Synopsis & Focus
              </h3>
              {isInsightLoading && isAuthenticated ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-3.5 bg-slate-800 rounded w-full"></div>
                  <div className="h-3.5 bg-slate-800 rounded w-5/6"></div>
                  <div className="h-3.5 bg-slate-800 rounded w-11/12"></div>
                </div>
              ) : (
                <p className="text-slate-300 text-xs leading-relaxed font-medium">
                  {activeSynopsis}
                </p>
              )}
            </div>

            {/* Chapters Outline */}
            <div className={`space-y-3 flex-grow ${!isAuthenticated ? 'opacity-30 pointer-events-none' : ''}`}>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <List className="w-4 h-4 text-emerald-500" /> Chapters & Syllabus Guide
              </h3>
              
              {isInsightLoading && isAuthenticated ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-slate-800 rounded-xl"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {activeChapters.map((ch, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedChapter(ch.num || idx + 1)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 ${
                        selectedChapter === (ch.num || idx + 1)
                          ? 'bg-emerald-950/45 border-emerald-600/60 shadow-lg text-emerald-100'
                          : 'bg-slate-850/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700/60'
                      }`}
                    >
                      <span className="text-xs font-bold leading-none flex items-center justify-between w-full">
                        <span>{ch.name || `Chapter ${idx + 1}`}</span>
                        {selectedChapter === (ch.num || idx + 1) && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-widest border border-emerald-500/30">
                            Active Preview
                          </span>
                        )}
                      </span>
                      {ch.description && (
                        <p className={`text-[10px] leading-relaxed ${
                          selectedChapter === (ch.num || idx + 1) ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          {ch.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Key Takeaways */}
            <div className={`space-y-3 ${!isAuthenticated ? 'opacity-30 pointer-events-none' : ''}`}>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Key Takeaways & Exam Focus
              </h3>
              
              {isInsightLoading && isAuthenticated ? (
                <div className="space-y-2 animate-pulse">
                  <div className="h-3 bg-slate-800 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-800 rounded w-2/3"></div>
                </div>
              ) : (
                <ul className="space-y-2">
                  {activeTakeaways.map((takeaway, idx) => (
                    <li key={idx} className="flex gap-2.5 items-start text-xs text-slate-350">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
                      <span className="leading-relaxed">{takeaway}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>
        </aside>

        {/* RIGHT SECTION: Excerpt Reading Canvas */}
        <main className="flex-grow bg-slate-950 p-6 md:p-12 overflow-y-auto flex flex-col justify-between relative">
          
          <div className="flex-grow flex justify-center items-start">
            <div 
              className="bg-slate-900 border border-slate-850 rounded-3xl p-8 md:p-12 shadow-2xl transition-all w-full max-w-3xl my-auto"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
            >
              {/* Header info inside pages */}
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 tracking-wider border-b border-slate-800 pb-3 mb-6 uppercase">
                <span>Section: {book.department} Academic Reference Excerpt</span>
                <span>Preview Chapter {selectedChapter}</span>
              </div>

              {/* Book Excerpt Lines with interactive highlighting capabilities */}
              <div className="space-y-5 text-sm md:text-base text-slate-300 leading-relaxed min-h-[260px]">
                {contentLines.map((line, idx) => {
                  const lineHighlight = activePageHighlights[idx];
                  const highlightClass = lineHighlight === 'yellow' 
                    ? 'bg-yellow-500/30 text-yellow-250 border-l-4 border-l-yellow-500 pl-2' 
                    : lineHighlight === 'green' 
                      ? 'bg-emerald-500/30 text-emerald-250 border-l-4 border-l-emerald-500 pl-2' 
                      : 'hover:bg-slate-800/40 px-1 rounded cursor-pointer';

                  return (
                    <p 
                      key={idx}
                      onClick={() => handleLineClick(idx)} 
                      className={`transition-all py-1 ${highlightClass}`}
                    >
                      {line}
                    </p>
                  );
                })}
              </div>

              {/* Page Footer */}
              <div className="flex justify-between items-center text-xs font-bold text-slate-500 border-t border-slate-800 pt-6 mt-8">
                <span>IIUC Smart E-Library Reader Licence</span>
                <span>Page {currentPage} of 180</span>
              </div>
            </div>
          </div>

          {/* Quick instructions indicator */}
          <div className="text-center text-[10px] font-semibold text-slate-500 mt-6 hidden lg:block">
            💡 Pro-Tip: Choose a color highlight tool below and click any sentence above to bookmark critical formulas or definitions.
          </div>
        </main>
      </div>

      {/* Bottom Workspace Action Bar */}
      <footer className="h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-6 flex-shrink-0 z-10">
        
        {/* Page Switcher */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white border border-slate-850"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold text-slate-300">Page {currentPage}</span>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(180, prev + 1))}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white border border-slate-850"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Highlighter Tool Box */}
        <div className="flex items-center gap-2 bg-slate-950/50 rounded-xl p-1 border border-slate-800">
          <span className="text-[10px] font-bold text-slate-500 px-2 hidden sm:block uppercase">Highlighters:</span>
          
          <button 
            onClick={() => setHighlightColor('yellow')}
            className={`w-7 h-7 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 flex items-center justify-center transition-all ${
              highlightColor === 'yellow' ? 'ring-2 ring-yellow-400 scale-105 bg-yellow-500/30' : ''
            }`}
            title="Yellow Highlighter"
          >
            <Highlighter className="w-4 h-4" />
          </button>

          <button 
            onClick={() => setHighlightColor('green')}
            className={`w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 flex items-center justify-center transition-all ${
              highlightColor === 'green' ? 'ring-2 ring-emerald-400 scale-105 bg-emerald-500/30' : ''
            }`}
            title="Green Highlighter"
          >
            <Highlighter className="w-4 h-4" />
          </button>

          <button 
            onClick={() => setHighlightColor(null)}
            className={`px-3 py-1 text-[10px] font-extrabold rounded-lg text-slate-400 hover:text-white transition-all uppercase ${
              highlightColor === null ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/40'
            }`}
          >
            Select Mode
          </button>
        </div>

        {/* Quick Back CTA */}
        <button 
          onClick={() => navigate(`/book/${book.id}`)}
          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Book Details
        </button>
      </footer>
    </div>
  );
};

export default DigitalReader;
