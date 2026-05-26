import React, { useState, useEffect } from 'react';
import { BookOpen, AlertCircle, Clock, BookMarked, BrainCircuit, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../store/useAuthStore';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { resolveBookCover, getBookCoverFallback } from '../../utils/bookCover';

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

          {/* AI Recommended Section */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-4 sm:p-6 rounded-2xl shadow-lg relative overflow-hidden min-w-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
              <div className="flex items-start gap-3 mb-4 sm:mb-6">
                <div className="p-2 bg-indigo-500/30 rounded-lg">
                  <BrainCircuit className="w-6 h-6 text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">AI Recommendations</h3>
                  <p className="text-indigo-200 text-xs sm:text-sm leading-relaxed">We will surface personalized picks here.</p>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
                  No recommendations yet. Keep borrowing to train your library profile.
                </p>
              </div>
            </div>
          </div>

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
