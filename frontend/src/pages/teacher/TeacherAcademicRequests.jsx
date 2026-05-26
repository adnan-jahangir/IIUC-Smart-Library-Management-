import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { BrainCircuit, BookOpen, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const TeacherAcademicRequests = () => {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/requests/my-requests', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setRequests(response.data || []);
      } catch (error) {
        console.error('Academic requests load failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.token) load();
  }, [user]);

  const academicStats = useMemo(() => ({
    pending: requests.filter((request) => request.status === 'Pending').length,
    approved: requests.filter((request) => request.status === 'Approved').length,
    returned: requests.filter((request) => request.status === 'Returned').length,
  }), [requests]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Academic Requests</p>
            <h2 className="text-3xl font-bold mt-2">Plan course reading from one place</h2>
            <p className="text-slate-300 mt-2 max-w-2xl">Track the books you have requested for lectures, syllabus support, and research preparation.</p>
          </div>
          <Link to="/teacher/search" className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 px-4 py-3 rounded-xl font-semibold hover:bg-slate-100">
            <BookOpen className="w-4 h-4" /> Search Books
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Pending', value: academicStats.pending, tone: 'bg-amber-50 text-amber-700' },
          { label: 'Approved', value: academicStats.approved, tone: 'bg-emerald-50 text-emerald-700' },
          { label: 'Returned', value: academicStats.returned, tone: 'bg-slate-100 text-slate-700' },
        ].map((item) => (
          <div key={item.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-sm font-medium">{item.label}</p>
            <div className={`mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${item.tone}`}>{item.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Recent academic request activity</h3>
            <p className="text-slate-500 text-sm mt-1">This uses your live borrow history, since academic requests are processed through the same flow.</p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600"><BrainCircuit className="w-5 h-5" /></div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12 text-slate-500 gap-3"><Loader2 className="w-5 h-5 animate-spin" /> Loading...</div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center text-slate-500">No requests yet. Search a book and submit a request to populate this section.</div>
        ) : (
          <div className="space-y-4">
            {requests.slice(0, 6).map((request) => (
              <div key={request._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/60">
                <div>
                  <h4 className="font-semibold text-slate-800">{request.book?.title}</h4>
                  <p className="text-sm text-slate-500 mt-1">Requested {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : '—'}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${request.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : request.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                  {request.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAcademicRequests;
