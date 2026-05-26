import React, { useState } from 'react';
import { Brain, Search, BookOpen, Clock, Calendar, CheckSquare, Sparkles, Send, ArrowRight, Download, BookMarked } from 'lucide-react';
import { Link } from 'react-router-dom';

const StudentAIAssistant = () => {
  const [semester, setSemester] = useState('5th');
  const [course, setCourse] = useState('CSE-3501 Compiler Design');
  const [examType, setExamType] = useState('Mid-term');
  const [focusArea, setFocusArea] = useState('Lexical Analysis & Parsing');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your IIUC Gemini AI Assistant. Choose your course parameters above to generate a study roadmap, or ask me any question.' }
  ]);
  const [userInput, setUserInput] = useState('');

  const coursesList = {
    '1st': ['CSE-1101 Structured Programming', 'MATH-1101 Calculus', 'HUM-1101 English'],
    '3rd': ['CSE-2301 Data Structures', 'CSE-2303 Digital Logic Design', 'MATH-2301 Linear Algebra'],
    '5th': ['CSE-3501 Compiler Design', 'CSE-3503 Microprocessors', 'CSE-3505 Database Systems'],
    '7th': ['CSE-4701 Artificial Intelligence', 'CSE-4703 Computer Networks', 'CSE-4705 Software Engineering']
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setGeneratedPlan(null);

    // Simulate AI Generation delay
    setTimeout(() => {
      setGeneratedPlan({
        title: `AI Roadmap: ${course} (${examType} Prep)`,
        focus: focusArea,
        duration: '10 Days Preparation Blueprint',
        timeline: [
          { days: 'Days 1-3', title: 'Foundations & Mathematical Preliminaries', details: 'Review finite automata, regular expressions, and context-free grammars. Study derivation trees.', book: 'Introduction to Automata Theory', bookId: 1 },
          { days: 'Days 4-6', title: 'Lexical Analyzer Construction & Lex Tools', details: 'Write scanner specifications, trace transition tables, compile lex scripts, and test tokenize strings.', book: 'Clean Code', bookId: 2 },
          { days: 'Days 7-8', title: 'Top-Down & Bottom-Up Parsing Algorithms', details: 'Deep dive into LL(1) parse table construction, shift-reduce conflicts, and LR parsing pipelines.', book: 'Introduction to Algorithms', bookId: 1 },
          { days: 'Days 9-10', title: 'Review Past Exams & Run Mock Prep', details: 'Solve 3 previous mid-term question papers from the IIUC Exam Archives. Focus on LL(1) parsing exercises.', book: 'Modern Software Engineering', bookId: 4 }
        ],
        aiTip: 'Pro-Tip: Compiler lexical errors are easiest to test. Practice parsing trees manually before coding!'
      });
      setIsLoading(false);
      
      // Post a message in the chat console too
      setChatMessages(prev => [
        ...prev,
        { sender: 'ai', text: `✨ I have generated a customized 10-day study plan for ${course}! Scroll down to review the interactive timeline and reference books.` }
      ]);
    }, 1500);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const userMsg = userInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setUserInput('');

    // Mock AI responding to queries in context
    setTimeout(() => {
      let reply = `I've analyzed your question: "${userMsg}". Under IIUC syllabus guidelines, you should focus on the primary course reference book. Would you like me to highlight the exact chapter?`;
      if (userMsg.toLowerCase().includes('compiler') || userMsg.toLowerCase().includes('lexical')) {
        reply = "For Compiler Design lexical analysis, refer to chapter 3 of Aho & Ullman's 'Dragon Book' (available on Rack A-2, Shelf 3). I recommend sketching the NFA state transition diagrams first.";
      }
      setChatMessages(prev => [...prev, { sender: 'ai', text: reply }]);
    }, 1000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 md:p-8 rounded-3xl text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="bg-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit">
              <Sparkles className="w-3.5 h-3.5" /> Powered by Gemini 1.5
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">Gemini AI Study Planner & Prep Guide</h1>
            <p className="text-emerald-100 max-w-2xl text-sm md:text-base font-medium">
              Create tailored study schedules, summarize complex textbooks, and cross-reference course topics with available physical books in the IIUC library.
            </p>
          </div>
          <Brain className="w-20 h-20 text-emerald-300 opacity-80 flex-shrink-0 animate-pulse hidden md:block" />
        </div>
      </div>

      {/* Input Parameters Form */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600" /> Enter Course Details
        </h2>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600">Semester</label>
            <select
              value={semester}
              onChange={(e) => {
                setSemester(e.target.value);
                // Auto-update default course for semester choice
                const list = coursesList[e.target.value] || [];
                if (list.length > 0) setCourse(list[0]);
              }}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700"
            >
              <option value="1st">1st Semester</option>
              <option value="3rd">3rd Semester</option>
              <option value="5th">5th Semester</option>
              <option value="7th">7th Semester</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600">Target Course</label>
            <select
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700"
            >
              {(coursesList[semester] || []).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600">Exam Scope</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700"
            >
              <option value="Mid-term">Mid-term Examination</option>
              <option value="Final">Semester Final Examination</option>
              <option value="Assignment / Quiz">Assignment & Class Quiz</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600">Focus Topics</label>
            <input
              type="text"
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
              placeholder="e.g. Parsing, Sorting, Integrals"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
            />
          </div>

          <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 group disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-400 border-t-emerald-600 rounded-full animate-spin"></div>
                  Synthesizing Syllabus Materials via Gemini...
                </>
              ) : (
                <>
                  Generate Prep Roadmap <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Render Roadmap Outputs */}
      {generatedPlan && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-2xl font-extrabold text-slate-800">{generatedPlan.title}</h3>
              <p className="text-slate-500 text-sm font-medium mt-1">Focus Area: <strong className="text-slate-700">{generatedPlan.focus}</strong> • {generatedPlan.duration}</p>
            </div>
            <button
              onClick={() => alert('Demo Mode: Study Plan exported successfully.')}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Download className="w-4 h-4" /> Export Roadmap
            </button>
          </div>

          {/* Timeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {generatedPlan.timeline.map((step, idx) => (
              <div key={idx} className="relative p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> {step.days}
                    </span>
                    <span className="text-slate-300 text-2xl font-black">0{idx + 1}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-base mb-2">{step.title}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4">{step.details}</p>
                </div>
                
                <div className="pt-3 border-t border-slate-200/50 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                    <BookMarked className="w-4 h-4 text-emerald-600" /> Reference: {step.book}
                  </div>
                  <Link
                    to={`/book/${step.bookId}`}
                    className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-0.5"
                  >
                    View Map <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* AI Tip Alert */}
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 text-sm font-medium flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-950">Gemini Optimization Tip</p>
              <p className="mt-0.5">{generatedPlan.aiTip}</p>
            </div>
          </div>
        </div>
      )}

      {/* Gemini Live Interactive Chat Console */}
      <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-lg border border-slate-800">
        <div className="p-5 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
              <Brain className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Gemini AI Assistant Chat Console</h3>
              <p className="text-xs text-emerald-400 font-medium">Status: Connected & Ready</p>
            </div>
          </div>
          <span className="h-2 w-2 bg-emerald-400 rounded-full animate-ping"></span>
        </div>

        {/* Chat Messages */}
        <div className="p-6 h-64 overflow-y-auto space-y-4 bg-slate-950/40">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-md p-4 rounded-2xl text-sm font-medium ${
                msg.sender === 'user' 
                  ? 'bg-emerald-600 text-white rounded-br-none' 
                  : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Chat input box */}
        <form onSubmit={handleSendMessage} className="p-4 bg-slate-950/70 border-t border-slate-800 flex gap-3">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask Gemini: 'Where is compilers book?' or 'Give me a database study tip'..."
            className="flex-grow px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-100 placeholder-slate-500 text-sm"
          />
          <button type="submit" className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all flex items-center justify-center">
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentAIAssistant;
