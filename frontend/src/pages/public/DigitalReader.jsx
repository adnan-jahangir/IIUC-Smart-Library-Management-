import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, ZoomIn, ZoomOut, Maximize2, ArrowLeft, Bookmark, Highlighter, ChevronLeft, ChevronRight, List, Loader2 } from 'lucide-react';

const DigitalReader = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/api/books/${id}`)
      .then(res => res.json())
      .then(data => {
        setBook({
           ...data,
           id: data.customId || data._id // Ensure we have a valid string id
        });
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching book:', err);
        setIsLoading(false);
      });
  }, [id]);

  // State
  const [currentPage, setCurrentPage] = useState(42);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [highlightColor, setHighlightColor] = useState(null); // 'yellow', 'green', or null
  const [highlights, setHighlights] = useState({}); // Stores page: { lineIndex: color }
  const [isFullscreen, setIsFullscreen] = useState(false);

  const chapters = [
    { num: 1, name: 'Chapter 1: Foundational Frameworks', pages: '1 - 25' },
    { num: 2, name: 'Chapter 2: Core Data Structures & Arrays', pages: '26 - 60' },
    { num: 3, name: 'Chapter 3: Recursive Algorithmic Analysis', pages: '61 - 95' },
    { num: 4, name: 'Chapter 4: Advanced Systems Implementations', pages: '96 - 150' }
  ];

  // Dummy reading content based on chapter
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
        <p className="text-slate-400 font-bold tracking-widest uppercase">Loading Secure Digital Reader...</p>
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

  const contentLines = chapterContents[selectedChapter] || chapterContents[1];
  const highlightKey = `${selectedChapter}-${currentPage}`;
  const activePageHighlights = highlights[highlightKey] || {};

  return (
    <div className={`min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans transition-all ${
      isFullscreen ? 'fixed inset-0 z-50' : ''
    }`}>
      
      {/* Top Navigation bar */}
      <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/book/${book.id}`)}
            className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all"
            title="Return to Details"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="hidden sm:block">
            <h1 className="font-extrabold text-sm text-white truncate max-w-xs md:max-w-md">{book.title}</h1>
            <p className="text-[10px] text-emerald-400 font-semibold">{book.author} • Institutional E-Library Reader</p>
          </div>
        </div>

        {/* Zoom & Screen Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950/40 rounded-xl p-1 border border-slate-700">
            <button 
              onClick={() => setZoomLevel(prev => Math.max(70, prev - 10))}
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-300 w-12 text-center">{zoomLevel}%</span>
            <button 
              onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))}
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Reader Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Chapter Navigation Bar */}
        <aside className="w-64 bg-slate-800/65 border-r border-slate-700 hidden md:flex flex-col p-4 space-y-4 overflow-y-auto flex-shrink-0">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <List className="w-4 h-4 text-emerald-400" /> Book Index
          </h3>
          <div className="space-y-1">
            {chapters.map(ch => (
              <button
                key={ch.num}
                onClick={() => {
                  setSelectedChapter(ch.num);
                  setCurrentPage(ch.num * 25 - 10);
                }}
                className={`w-full text-left p-3 rounded-xl transition-all text-xs font-bold flex flex-col gap-1 ${
                  selectedChapter === ch.num 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-slate-300 hover:bg-slate-700/60'
                }`}
              >
                <span>{ch.name}</span>
                <span className={`text-[10px] ${selectedChapter === ch.num ? 'text-emerald-100' : 'text-slate-500'}`}>Pages {ch.pages}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Center: Reading Canvas */}
        <main className="flex-grow bg-slate-950 p-6 md:p-12 overflow-y-auto flex justify-center">
          
          <div 
            className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl transition-all h-fit w-full max-w-3xl"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          >
            {/* Header info inside pages */}
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 tracking-wider border-b border-slate-800 pb-3 mb-6 uppercase">
              <span>Section: {book.department} Academic Reference</span>
              <span>Chapter {selectedChapter}</span>
            </div>

            {/* Book Excerpt Lines with interactive highlighting capabilities */}
            <div className="space-y-5 text-sm md:text-base text-slate-300 leading-relaxed min-h-[300px]">
              {contentLines.map((line, idx) => {
                const lineHighlight = activePageHighlights[idx];
                const highlightClass = lineHighlight === 'yellow' 
                  ? 'bg-yellow-500/30 text-yellow-200 border-l-4 border-l-yellow-500 pl-2' 
                  : lineHighlight === 'green' 
                    ? 'bg-emerald-500/30 text-emerald-200 border-l-4 border-l-emerald-500 pl-2' 
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
              <span>IIUC Smart E-Library License</span>
              <span>Page {currentPage} of 180</span>
            </div>
          </div>
        </main>
      </div>

      {/* Bottom Tool bar - Page turning and highlighters */}
      <footer className="h-16 bg-slate-800 border-t border-slate-700 flex items-center justify-between px-6 flex-shrink-0">
        
        {/* Page Switcher */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold text-slate-300">Page {currentPage}</span>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(180, prev + 1))}
            className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Highlighter Tool Box */}
        <div className="flex items-center gap-2 bg-slate-950/30 rounded-xl p-1 border border-slate-700">
          <span className="text-[10px] font-bold text-slate-500 px-2 hidden sm:block uppercase">Highlighters:</span>
          
          <button 
            onClick={() => setHighlightColor('yellow')}
            className={`w-7 h-7 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 flex items-center justify-center transition-all ${
              highlightColor === 'yellow' ? 'ring-2 ring-yellow-400 scale-105' : ''
            }`}
            title="Yellow Highlighter"
          >
            <Highlighter className="w-4 h-4" />
          </button>

          <button 
            onClick={() => setHighlightColor('green')}
            className={`w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 flex items-center justify-center transition-all ${
              highlightColor === 'green' ? 'ring-2 ring-emerald-400 scale-105' : ''
            }`}
            title="Green Highlighter"
          >
            <Highlighter className="w-4 h-4" />
          </button>

          <button 
            onClick={() => setHighlightColor(null)}
            className={`px-2 py-1 text-[10px] font-bold rounded-lg text-slate-400 hover:text-white ${
              highlightColor === null ? 'bg-slate-700 text-white' : ''
            }`}
          >
            Cursor
          </button>
        </div>

        {/* Quick Instructions info */}
        <div className="text-[10px] font-semibold text-slate-500 hidden lg:block">
          💡 Select a color above and click paragraphs to highlight text.
        </div>
      </footer>
    </div>
  );
};

export default DigitalReader;
