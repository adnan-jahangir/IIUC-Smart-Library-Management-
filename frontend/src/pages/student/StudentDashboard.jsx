import React, { useState, useEffect } from 'react';
import { BookOpen, AlertCircle, Clock, BookMarked, BrainCircuit, CheckCircle2, Sparkles, RefreshCw, Bot, User, ChevronRight, MessageSquare, Loader2, Calendar, ArrowRight, Download, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../store/useAuthStore';
import BookRecommendations from '../../components/ai/BookRecommendations';
import FineSummaryCard from '../../components/ai/FineSummaryCard';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { resolveBookCover, getBookCoverFallback } from '../../utils/bookCover';
import { motion, AnimatePresence } from 'framer-motion';
import { sendMessageToAI } from '../../services/libraryAI';

const DashboardAIAssistant = ({ user, currentBooks, chatBooks }) => {
  // Chat Tab State
  const [chatMessages, setChatMessages] = useState([
    { id: 'initial', role: 'assistant', content: 'Hello! I am your AI Assistant. Choose your course parameters above to generate a study roadmap, or ask me any question.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);

  // Roadmap Tab State
  const [semester, setSemester] = useState('5th');
  const [course, setCourse] = useState('CSE-3501 Compiler Design');
  const [examType, setExamType] = useState('Mid-term');
  const [focusArea, setFocusArea] = useState('Lexical Analysis & Parsing');
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [isRoadmapLoading, setIsRoadmapLoading] = useState(false);

  const coursesList = {
    '1st': ['CSE-1101 Structured Programming', 'MATH-1101 Calculus', 'HUM-1101 English'],
    '3rd': ['CSE-2301 Data Structures', 'CSE-2303 Digital Logic Design', 'MATH-2301 Linear Algebra'],
    '5th': ['CSE-3501 Compiler Design', 'CSE-3503 Microprocessors', 'CSE-3505 Database Systems'],
    '7th': ['CSE-4701 Artificial Intelligence', 'CSE-4703 Computer Networks', 'CSE-4705 Software Engineering']
  };

  const handleSendChatMessage = async (e) => {
    if (e) e.preventDefault();
    const messageText = chatInput;
    if (!messageText.trim()) return;

    setChatInput('');
    setChatError(null);

    const newUserMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };

    setChatMessages((prev) => [...prev, newUserMessage]);
    setIsChatLoading(true);

    try {
      const history = chatMessages.map(m => ({ role: m.role, content: m.content }));
      const result = await sendMessageToAI(history, messageText, chatBooks, user.token);
      
      const newAIMessage = {
        id: `${Date.now()}-ai`,
        role: 'assistant',
        content: result.reply,
        timestamp: new Date().toISOString()
      };

      setChatMessages((prev) => [...prev, newAIMessage]);
    } catch (err) {
      console.error('AI chat error:', err);
      setChatError(err.message || 'Something went wrong.');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleGenerateRoadmap = async (e) => {
    if (e) e.preventDefault();
    setIsRoadmapLoading(true);
    setGeneratedPlan(null);

    const prompt = `Create a short study roadmap for semester ${semester}, course: ${course || 'unspecified'}, exam type: ${examType}, focus: ${focusArea}. Respond with a JSON object between ###ROADMAP_START and ###ROADMAP_END matching the schema: {"title":"...","focus":"...","duration":"...","timeline":[{"days":"...","title":"...","details":"...","book":"...","bookId":null}],"aiTip":"..."}`;

    try {
      const result = await sendMessageToAI([], prompt, chatBooks, user.token);
      if (result?.generatedPlan) {
        setGeneratedPlan(result.generatedPlan);
      } else if (result?.reply) {
        // try manual JSON parse
        const startMarker = '###ROADMAP_START';
        const endMarker = '###ROADMAP_END';
        const start = result.reply.indexOf(startMarker);
        const end = result.reply.indexOf(endMarker, start + startMarker.length);
        if (start !== -1 && end !== -1) {
          const jsonText = result.reply.substring(start + startMarker.length, end).trim();
          setGeneratedPlan(JSON.parse(jsonText));
        } else {
          // fallback search for JSON fences
          const fenceMatch = result.reply.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
          const candidate = fenceMatch ? fenceMatch[1].trim() : result.reply.trim();
          const braceMatch = candidate.match(/({[\s\S]*})/m);
          const jsonText = braceMatch ? braceMatch[1] : candidate;
          setGeneratedPlan(JSON.parse(jsonText));
        }
      }
      
      // Post a message in the chat console too
      setChatMessages(prev => [
        ...prev,
        { id: `${Date.now()}-ai`, role: 'assistant', content: `✨ I have generated a customized study plan for ${course}! Scroll up to review the interactive timeline and reference books.` }
      ]);
    } catch (err) {
      console.error('Roadmap generate failed:', err);
      setGeneratedPlan({
        title: 'Error generating roadmap',
        focus: focusArea,
        duration: '-',
        timeline: [{ days: '-', title: 'Failed to generate', details: 'The AI model could not structure a roadmap. Please try again with a different course name.', book: null, bookId: null }],
        aiTip: 'Try using standard university course names like "Data Structures" or "Computer Networks".'
      });
    } finally {
      setIsRoadmapLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 md:p-8 rounded-3xl text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="bg-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit">
              <Sparkles className="w-3.5 h-3.5" /> Powered by Gemini AI
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">AI Study Planner & Prep Guide</h1>
            <p className="text-emerald-100 max-w-2xl text-sm md:text-base font-medium">
              Create tailored study schedules, summarize complex textbooks, and cross-reference course topics with available library books.
            </p>
          </div>
          <Brain className="w-16 h-16 sm:w-20 sm:h-20 text-emerald-300 opacity-80 flex-shrink-0 animate-pulse hidden sm:block" />
        </div>
      </div>

      {/* Input Parameters Form */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600" /> Enter Course Details
        </h2>

        <form onSubmit={handleGenerateRoadmap} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
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
              disabled={isRoadmapLoading}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 group disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              {isRoadmapLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-400 border-t-emerald-600 rounded-full animate-spin"></div>
                  Synthesizing Syllabus Materials via AI...
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
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-800">{generatedPlan.title}</h3>
              <p className="text-slate-500 text-sm font-medium mt-1">Focus Area: <strong className="text-slate-700">{generatedPlan.focus}</strong> • {generatedPlan.duration}</p>
            </div>
            <button
              onClick={() => alert('Roadmap Export coming soon.')}
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
                
                {step.book && (
                  <div className="pt-3 border-t border-slate-200/50 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                      <BookMarked className="w-4 h-4 text-emerald-600" /> Reference: {step.book}
                    </div>
                    {step.bookId && (
                      <Link
                        to={`/student/search?q=${encodeURIComponent(step.book)}`}
                        className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-0.5"
                      >
                        Search Library <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* AI Tip Alert */}
          {generatedPlan.aiTip && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 text-sm font-medium flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-950">AI Optimization Tip</p>
                <p className="mt-0.5">{generatedPlan.aiTip}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Assistant chat removed from dashboard */}
    </div>
  );
};

const StatCard = ({ icon, title, value, subtitle, colorClass, bgColorClass }) => (
  <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow min-w-0">
    <div className="flex justify-between items-start gap-3">
      <div>
        <p className="text-slate-500 text-xs sm:text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 break-words">{value}</h3>
      </div>
      <div className={`p-2.5 sm:p-3 rounded-xl ${bgColorClass} ${colorClass}`}>
        {icon}
      </div>
    </div>
    <p className="text-slate-500 text-xs sm:text-sm mt-3 sm:mt-4 font-medium leading-relaxed">{subtitle}</p>
  </div>
);

/**
 * Converts the dashboard's borrowed book records into book objects for the chat assistant.
 * Returns an array of book-like objects that the assistant can reference.
 */
function buildChatBooksFromCurrentBooks(currentBooks) {
  return currentBooks
    .map((request) => request?.book)
    .filter(Boolean)
    .map((book) => ({
      title: book.title || 'Untitled',
      author: book.author || 'Unknown author',
      subject: book.subject || book.category || 'General',
      available: Boolean(book.available),
    }));
}

const StudentDashboard = () => {
  const { user } = useAuthStore();
  const universityId = String(user?.customId || user?.email?.split('@')[0] || 'N/A').toUpperCase();
  const [dashboardStats, setDashboardStats] = useState({
    activeCount: 0,
    dueSoonCount: 0,
    totalFines: 0,
    reservationCount: 0,
    currentBooks: [],
    borrowTrends: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/dashboard/student', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setDashboardStats(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (user?.token) fetchDashboardData();
  }, [user]);

  const currentBooks = dashboardStats.currentBooks || [];
  const chatBooks = buildChatBooksFromCurrentBooks(currentBooks);

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Greetings */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight leading-tight">
          Welcome back, {user?.name || 'Student'}! 👋
        </h2>
        <p className="text-slate-500 mt-1 text-sm sm:text-base">Here is the overview of your library account.</p>
        <p className="text-slate-500 text-xs sm:text-sm mt-1 break-words">University ID: <span className="font-semibold text-slate-700">{universityId}</span></p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <StatCard 
          icon={<BookOpen className="w-6 h-6" />}
          title="Active Borrows"
          value={dashboardStats.activeCount.toString()}
          subtitle="Out of 3 allowed limit"
          colorClass="text-emerald-600"
          bgColorClass="bg-emerald-50"
        />
        <StatCard 
          icon={<AlertCircle className="w-6 h-6" />}
          title="Due Soon"
          value={dashboardStats.dueSoonCount.toString()}
          subtitle="Due within 3 days"
          colorClass="text-amber-600"
          bgColorClass="bg-amber-50"
        />
        <StatCard 
          icon={<Clock className="w-6 h-6" />}
          title="Fines Pending"
          value={`৳ ${dashboardStats.totalFines}`}
          subtitle="Calculated from overdue returns"
          colorClass="text-rose-600"
          bgColorClass="bg-rose-50"
        />
        <StatCard 
          icon={<BookMarked className="w-6 h-6" />}
          title="Reservations"
          value={dashboardStats.reservationCount.toString()}
          subtitle="Active queue entries"
          colorClass="text-blue-600"
          bgColorClass="bg-blue-50"
        />
      </div>

      <FineSummaryCard />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Main Chart / AI Section */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 min-w-0">
          
          {/* Borrowing Trends Chart */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4 sm:mb-6">Your Borrowing Trends</h3>
            <div className="h-56 sm:h-72 w-full overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardStats.borrowTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBorrows" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="borrows" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorBorrows)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <BookRecommendations />

        </div>

        {/* Right Sidebar Data */}
        <div className="space-y-4 sm:space-y-6 min-w-0">
          
          {/* Current Borrowed List preview */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm min-w-0">
            <div className="flex justify-between items-center gap-3 mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-bold text-slate-800">Current Books</h3>
              <Link to="/student/my-books" className="text-emerald-600 text-xs sm:text-sm font-medium hover:underline whitespace-nowrap">View All</Link>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              {currentBooks.length > 0 ? currentBooks.map((req) => (
                <div key={req._id} className="flex gap-3 sm:gap-4 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors min-w-0">
                  <div className="w-10 h-14 sm:w-12 sm:h-16 bg-slate-200 rounded shadow-sm overflow-hidden flex-shrink-0">
                    <img src={resolveBookCover(req.book)} alt="Book" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = getBookCoverFallback(req.book?.title || 'Book'); }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-slate-800 font-semibold text-sm sm:text-base truncate">{req.book?.title}</h4>
                    <p className={`text-[11px] sm:text-xs font-medium mt-1 mb-2 ${req.status === 'Pending' ? 'text-amber-600' : 'text-emerald-600'}`}>
                      Status: {req.status}
                    </p>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${req.status === 'Pending' ? 'bg-amber-500 w-[50%]' : 'bg-emerald-500 w-[100%]'}`}></div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-sm text-slate-500 text-center py-4">No active books.</div>
              )}
            </div>
            
            <button className="w-full mt-4 py-2.5 sm:py-2 bg-emerald-50 text-emerald-600 text-sm sm:text-base font-semibold rounded-lg hover:bg-emerald-100 transition-colors">
              Renew Books
            </button>
          </div>

          {/* Quick Notifications */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4 sm:mb-6">Recent Alerts</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex gap-3">
                <div className="mt-0.5 text-rose-500"><AlertCircle className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Fine Added</p>
                  <p className="text-xs text-slate-500 break-words">Outstanding fines: ৳ {dashboardStats.totalFines}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="mt-0.5 text-emerald-500"><CheckCircle2 className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Reservation Ready</p>
                  <p className="text-xs text-slate-500 break-words">Active reservations: {dashboardStats.reservationCount}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
