import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Loader2, Filter, Clock } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';

const TeacherBorrowRequests = () => {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/requests/my-requests', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setRequests(response.data || []);
      } catch (error) {
        console.error('Failed to load borrow requests:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.token) fetchRequests();
  }, [user]);

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this borrow request?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/requests/${requestId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success('Borrow request canceled successfully.');
      setRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (error) {
      console.error('Failed to cancel request:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel request.');
    }
  };

  const filtered = useMemo(() => {
    if (filter === 'All') return requests;
    return requests.filter((request) => request.status === filter);
  }, [filter, requests]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Borrow Requests</h2>
          <p className="text-slate-500 mt-1">Review your submitted borrow history and statuses.</p>
        </div>
        <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          {['All', 'Pending', 'Approved', 'Rejected', 'Returned'].map((tab) => (
            <button key={tab} onClick={() => setFilter(tab)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === tab ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-500 gap-3"><Loader2 className="w-5 h-5 animate-spin" /> Loading requests...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center text-slate-500">No requests found for this filter.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map((request) => (
            <div key={request._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-800">{request.book?.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{request.book?.author}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${request.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : request.status === 'Pending' ? 'bg-amber-100 text-amber-700' : request.status === 'Rejected' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                  {request.status}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /> Requested: {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : '—'}</div>
                <div className="font-mono text-xs text-slate-400">ID: {request.book?.customId}</div>
              </div>
              {request.status === 'Pending' && (
                <button
                  onClick={() => handleCancelRequest(request._id)}
                  className="mt-4 w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all border border-rose-100 animate-pulse hover:animate-none"
                >
                  Cancel Request
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherBorrowRequests;
