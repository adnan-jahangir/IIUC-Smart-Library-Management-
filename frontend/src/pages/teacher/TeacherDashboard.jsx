import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, FileText, CheckCircle2, Clock, BrainCircuit, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../store/useAuthStore';
import LibraryChatWidget from '../../components/LibraryChatWidget';
import TeacherAITools from '../../components/ai/TeacherAITools';

const TeacherDashboard = () => {
  const { user } = useAuthStore();
  const universityId = String(user?.customId || user?.email?.split('@')[0] || 'N/A').toUpperCase();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/requests/my-requests', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setRequests(response.data || []);
      } catch (error) {
        console.error('Failed to load teacher dashboard data:', error);
        setRequests([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.token) {
      fetchDashboardData();
    }
  }, [user]);

  const dashboardStats = useMemo(() => {
    const activeRequests = requests.filter((request) => request.status === 'Approved');
    const pendingRequests = requests.filter((request) => request.status === 'Pending');
    const approvedRequests = requests.filter((request) => request.status === 'Approved' || request.status === 'Returned');
    const overdueRequests = requests.filter((request) => {
      if (request.status !== 'Approved' || !request.dueDate) return false;
      return new Date(request.dueDate) < new Date();
    });

    return {
      activeBorrows: activeRequests.length,
      pendingRequests: pendingRequests.length,
      approvedRequests: approvedRequests.length,
      overdueRequests: overdueRequests.length,
    };
  }, [requests]);

  const recentRequests = requests.slice(0, 4);

  /**
   * Converts the teacher's request list into book objects for the chat assistant.
   * Returns an array of book-like objects that the assistant can reference.
   */
  const chatBooks = requests
    .map((request) => request?.book)
    .filter(Boolean)
    .map((book) => ({
      title: book.title || 'Untitled',
      author: book.author || 'Unknown author',
      subject: book.subject || book.department || 'General',
      available: Boolean(book.available),
    }));

  const statusTone = (status) => {
    if (status === 'Approved') return 'bg-emerald-50 text-emerald-700';
    if (status === 'Pending') return 'bg-amber-50 text-amber-700';
    if (status === 'Rejected') return 'bg-rose-50 text-rose-700';
    return 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="space-y-5 sm:space-y-8 min-w-0">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.3em] text-slate-500">Faculty Portal</p>
          <h2 className="text-xl sm:text-3xl font-bold text-slate-800 tracking-tight leading-tight break-words">Welcome back, {user?.name || 'Teacher'}! 👋</h2>
          <p className="text-sm sm:text-base text-slate-500 mt-2 leading-relaxed">Track your active borrows, academic requests, and reading workload from one place.</p>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 break-words">University ID: <span className="font-semibold text-slate-700">{universityId}</span></p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm min-w-0 self-start max-w-full">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <div>
            <p className="text-sm font-semibold text-slate-800 leading-tight">Live teacher snapshot</p>
            <p className="text-xs text-slate-500 leading-tight">Updated from your current requests</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 min-w-0">
          <div className="p-3 sm:p-4 bg-indigo-50 text-indigo-600 rounded-xl shrink-0"><BookOpen className="w-6 h-6" /></div>
          <div>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">Active Borrows</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800">{isLoading ? '...' : dashboardStats.activeBorrows}</h3>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 min-w-0">
          <div className="p-3 sm:p-4 bg-emerald-50 text-emerald-600 rounded-xl shrink-0"><FileText className="w-6 h-6" /></div>
          <div>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">Pending Requests</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800">{isLoading ? '...' : dashboardStats.pendingRequests}</h3>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 min-w-0">
          <div className="p-3 sm:p-4 bg-blue-50 text-blue-600 rounded-xl shrink-0"><CheckCircle2 className="w-6 h-6" /></div>
          <div>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">Approved Requests</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800">{isLoading ? '...' : dashboardStats.approvedRequests}</h3>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 min-w-0">
          <div className="p-3 sm:p-4 bg-rose-50 text-rose-600 rounded-xl shrink-0"><AlertCircle className="w-6 h-6" /></div>
          <div>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">Overdue Items</p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800">{isLoading ? '...' : dashboardStats.overdueRequests}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm min-w-0">
          <div className="flex justify-between items-start gap-3 mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-bold text-slate-800">Recent Requests</h3>
            <Link to="/teacher/academic-requests" className="text-indigo-600 text-xs sm:text-sm font-medium inline-flex items-center gap-1 whitespace-nowrap">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {isLoading ? (
              <div className="text-sm text-slate-500 py-6 text-center">Loading request summary...</div>
            ) : recentRequests.length > 0 ? (
              recentRequests.map((request) => (
                <div key={request._id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 border border-slate-100 rounded-xl min-w-0">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-800 text-sm sm:text-base break-words">{request.book?.title || 'Unknown book'}</h4>
                    <p className="text-xs sm:text-sm text-slate-500">Requested {new Date(request.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap ${statusTone(request.status)}`}>
                    {request.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                No requests yet. Use Search Books or Academic Requests to get started.
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border text-white p-4 sm:p-6 rounded-2xl shadow-sm relative overflow-hidden min-w-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-3 sm:mb-4 min-w-0">
              <BrainCircuit className="text-indigo-400" />
              <h3 className="text-base sm:text-lg font-bold break-words">Research & Syllabus Assistant</h3>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm mb-4 sm:mb-6 flex-1 leading-relaxed">
              Let the library assistant analyze current curriculum trends and suggest current editions, course references, and research material.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
              <Link to="/teacher/search" className="w-full inline-flex items-center justify-center py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition-colors text-sm sm:text-base">
                Search Books
              </Link>
              <Link to="/teacher/ai-assistant" className="w-full inline-flex items-center justify-center py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl font-semibold transition-colors text-sm sm:text-base">
                Open AI Assistant
              </Link>
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                Use the chat assistant here for fast book guidance, synopsis help, and study roadmap prompts.
              </p>
            </div>
          </div>
          <LibraryChatWidget optionalBooks={chatBooks} />
        </div>
      </div>
      <TeacherAITools />
    </div>
  );
};

export default TeacherDashboard;
