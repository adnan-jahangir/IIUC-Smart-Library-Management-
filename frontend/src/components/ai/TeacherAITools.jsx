import React, { useState, useEffect } from 'react';
import { BrainCircuit, BookOpen, HelpCircle, Lightbulb, Sparkles, Loader2, RefreshCw, Eye, EyeOff, Send, Download } from 'lucide-react';
import { generateReadingList, generateSyllabusQuiz, getClassInsights } from '../../services/aiApi';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';

export default function TeacherAITools() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('reading-list');

  // Reading List State
  const [rlSubject, setRlSubject] = useState('');
  const [rlGrade, setRlGrade] = useState('University');
  const [rlWeeks, setRlWeeks] = useState(4);
  const [readingList, setReadingList] = useState(null);
  const [rlLoading, setRlLoading] = useState(false);

  // Quiz State
  const [quizTopic, setQuizTopic] = useState('');
  const [quizCount, setQuizCount] = useState(5);
  const [quiz, setQuiz] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState({});

  // Insights State
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Handlers
  const handleGenerateRL = async (e) => {
    e.preventDefault();
    if (!rlSubject) return toast.error("Subject is required");
    setRlLoading(true);
    setReadingList(null);
    try {
      const data = await generateReadingList(user.token, { subject: rlSubject, gradeLevel: rlGrade, numberOfWeeks: rlWeeks });
      setReadingList(data);
      toast.success("Reading list generated!");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to generate reading list");
    } finally {
      setRlLoading(false);
    }
  };

  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    if (!quizTopic) return toast.error("Topic is required");
    setQuizLoading(true);
    setQuiz(null);
    setRevealedAnswers({});
    try {
      const data = await generateSyllabusQuiz(user.token, { topic: quizTopic, numberOfQuestions: quizCount });
      setQuiz(data.questions);
      toast.success("Quiz generated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate quiz");
    } finally {
      setQuizLoading(false);
    }
  };

  const fetchInsights = async () => {
    setInsightsLoading(true);
    try {
      const data = await getClassInsights(user.token);
      setInsights(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load insights");
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'insights' && !insights && !insightsLoading) {
      fetchInsights();
    }
  }, [activeTab]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col mt-6 sm:mt-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-700 px-6 py-5 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrainCircuit className="w-6 h-6 text-indigo-200" />
          <div>
            <h2 className="text-lg font-bold">Teacher AI Tools</h2>
            <p className="text-indigo-200 text-xs font-medium">Automate curriculum planning with AI</p>
          </div>
        </div>
        <Sparkles className="w-8 h-8 text-indigo-300/50" />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50/50">
        <button
          onClick={() => setActiveTab('reading-list')}
          className={`flex items-center gap-2 px-6 py-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'reading-list' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Reading List Generator
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex items-center gap-2 px-6 py-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'quiz' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" /> Syllabus Quiz
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex items-center gap-2 px-6 py-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'insights' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lightbulb className="w-4 h-4" /> Student Insights
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* READING LIST TAB */}
        {activeTab === 'reading-list' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 border-r border-slate-100 pr-0 lg:pr-6">
              <form onSubmit={handleGenerateRL} className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-1 block">Subject / Topic</label>
                  <input
                    type="text"
                    value={rlSubject}
                    onChange={(e) => setRlSubject(e.target.value)}
                    placeholder="e.g. Ancient History"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-1 block">Level</label>
                  <select
                    value={rlGrade}
                    onChange={(e) => setRlGrade(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm"
                  >
                    <option value="High School">High School</option>
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Postgraduate">Postgraduate</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-1 block">Duration (Weeks)</label>
                  <select
                    value={rlWeeks}
                    onChange={(e) => setRlWeeks(parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm"
                  >
                    <option value={2}>2 Weeks</option>
                    <option value={4}>4 Weeks</option>
                    <option value={8}>8 Weeks</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={rlLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow transition-all text-sm flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  {rlLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  Generate List
                </button>
              </form>
            </div>
            <div className="lg:col-span-2">
              {rlLoading ? (
                <div className="h-full flex flex-col items-center justify-center py-10 text-indigo-600">
                  <Loader2 className="w-10 h-10 animate-spin mb-3" />
                  <p className="text-sm font-medium">Cross-referencing DB books and building plan...</p>
                </div>
              ) : readingList ? (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="text-xl font-bold text-slate-800">{readingList.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">{readingList.overview}</p>
                  
                  <div className="space-y-3 mt-4">
                    {readingList.weeks?.map((w, i) => (
                      <div key={i} className="p-4 border border-slate-200 rounded-2xl flex flex-col sm:flex-row gap-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                        <div className="min-w-[80px]">
                          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Week {w.week}</span>
                          <h4 className="font-bold text-slate-800 mt-1">{w.theme}</h4>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg inline-block mb-2">
                            📖 {w.bookTitle}
                          </p>
                          <p className="text-sm text-slate-600"><strong>Assignment:</strong> {w.readingAssignment}</p>
                          <p className="text-xs text-slate-500 mt-1 italic">{w.rationale}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 py-10">
                  <BookOpen className="w-12 h-12 mb-3 opacity-20" />
                  <p>Reading list preview will appear here.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* QUIZ TAB */}
        {activeTab === 'quiz' && (
          <div className="space-y-6">
            <form onSubmit={handleGenerateQuiz} className="flex flex-col sm:flex-row items-end gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex-1 w-full space-y-1">
                <label className="text-sm font-bold text-slate-700">Syllabus Topic</label>
                <input
                  type="text"
                  value={quizTopic}
                  onChange={(e) => setQuizTopic(e.target.value)}
                  placeholder="e.g. Newton's Laws of Motion"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>
              <div className="w-full sm:w-32 space-y-1">
                <label className="text-sm font-bold text-slate-700">Questions</label>
                <select
                  value={quizCount}
                  onChange={(e) => setQuizCount(parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm"
                >
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                </select>
              </div>
              <button
                 type="submit"
                 disabled={quizLoading}
                 className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
               >
                 {quizLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                 Generate
               </button>
             </form>
 
             {quizLoading ? (
               <div className="flex flex-col items-center justify-center py-10 text-indigo-600">
                 <Loader2 className="w-10 h-10 animate-spin mb-3" />
                 <p className="text-sm font-medium">Generating questions...</p>
               </div>
             ) : quiz ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {quiz.map((q, idx) => (
                   <div key={idx} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col">
                     <h5 className="font-bold text-slate-800 text-sm mb-3">
                       <span className="text-indigo-600 mr-2">Q{idx + 1}.</span>{q.question}
                     </h5>
                     <div className="space-y-2 mb-4 flex-1">
                       {q.options.map((opt, oIdx) => (
                         <div key={oIdx} className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-700 border border-slate-100">
                           {opt}
                         </div>
                       ))}
                     </div>
                     <div className="pt-3 border-t border-slate-100">
                       <button
                         onClick={() => setRevealedAnswers(prev => ({ ...prev, [idx]: !prev[idx] }))}
                         className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                       >
                         {revealedAnswers[idx] ? <><EyeOff className="w-3.5 h-3.5"/> Hide Answer</> : <><Eye className="w-3.5 h-3.5"/> Reveal Answer</>}
                       </button>
                       {revealedAnswers[idx] && (
                         <div className="mt-3 p-3 bg-emerald-50 text-emerald-800 rounded-lg text-sm">
                           <p className="font-bold mb-1">{q.correctAnswer}</p>
                           <p className="text-xs opacity-90 leading-relaxed">{q.explanation}</p>
                         </div>
                       )}
                     </div>
                   </div>
                 ))}
               </div>
             ) : null}
           </div>
         )}
 
         {/* INSIGHTS TAB */}
         {activeTab === 'insights' && (
           <div className="py-4">
             {insightsLoading ? (
                <div className="flex flex-col items-center justify-center py-10 text-indigo-600">
                  <Loader2 className="w-10 h-10 animate-spin mb-3" />
                  <p className="text-sm font-medium">Analyzing student borrowing patterns...</p>
                </div>
             ) : insights ? (
               <div className="max-w-3xl space-y-6">
                 <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl flex gap-4 items-start">
                   <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                     <Lightbulb className="w-6 h-6" />
                   </div>
                   <div>
                     <h3 className="font-bold text-indigo-900 mb-2">Overall Student Insights</h3>
                     <p className="text-indigo-800 text-sm sm:text-base leading-relaxed">
                       {insights.insightText}
                     </p>
                   </div>
                 </div>
 
                 <div>
                   <h4 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wide">Raw Data Breakdown</h4>
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                     {insights.rawStats?.topCategories?.map((c, i) => (
                       <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl text-center shadow-sm">
                         <p className="text-2xl font-black text-slate-800">{c.count}</p>
                         <p className="text-xs font-semibold text-slate-500 uppercase mt-1 truncate" title={c.category}>{c.category}</p>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
             ) : null}
           </div>
         )}
       </div>
     </div>
   );
 }
