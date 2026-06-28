import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Loader2, Clock, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import { resolveBookCover, getBookCoverFallback } from '../../utils/bookCover';

const TeacherMyBooks = () => {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [renewingId, setRenewingId] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/requests/my-requests', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setRequests(response.data || []);
      } catch (error) {
        console.error('Failed to load teacher books:', error);
        toast.error('Failed to load your books');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.token) fetchRequests();
  }, [user]);

  const activeCount = useMemo(() => requests.filter((request) => request.status === 'Approved').length, [requests]);
  const pendingCount = useMemo(() => requests.filter((request) => request.status === 'Pending').length, [requests]);

  const confirmRenew = async () => {
    if (!selectedRequest) return;
    setRenewingId(selectedRequest._id);
    try {
      const response = await axios.put(`http://localhost:5000/api/requests/${selectedRequest._id}/renew`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setRequests((prev) => prev.map((request) => request._id === response.data.request._id ? response.data.request : request));
      toast.success('Renewal successful');
      setModalOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Renewal failed');
    } finally {
      setRenewingId(null);
    }
  };

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

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">My Borrowed Books</h2>
            <p className="text-slate-500 mt-1">Track approved borrows, pending requests, and renewals.</p>
          </div>
          <div className="flex gap-3 text-sm">
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">Active: <span className="font-semibold text-emerald-600">{isLoading ? '...' : activeCount}</span></div>
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">Pending: <span className="font-semibold text-amber-600">{isLoading ? '...' : pendingCount}</span></div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16 text-slate-500 gap-3"><Loader2 className="w-5 h-5 animate-spin" /> Loading books...</div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No borrowed books yet</h3>
            <p className="text-slate-500 mt-2">Search the catalog and submit a borrow request to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {requests.map((request) => (
              <div key={request._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex p-4 gap-4">
                  <div className="w-24 h-32 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={resolveBookCover(request.book)}
                      alt={request.book?.title}
                      title={resolveBookCover(request.book)}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.onerror = null; e.target.src = getBookCoverFallback(request.book?.title || 'Book'); }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${request.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : request.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                      {request.status}
                    </span>
                    <h3 className="text-slate-800 font-bold mt-2 truncate">{request.book?.title}</h3>
                    <p className="text-slate-500 text-xs mt-1">By {request.book?.author || 'Unknown'}</p>
                    <div className="mt-4 space-y-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Requested: {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : '—'}</div>
                      <div className="flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5" /> Due: {request.dueDate ? new Date(request.dueDate).toLocaleDateString() : '—'}</div>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-[10px] text-slate-400 font-mono">ID: {request.book?.customId}</p>
                  {request.status === 'Approved' ? (
                    <button
                      onClick={() => { setSelectedRequest(request); setModalOpen(true); }}
                      className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Renew
                    </button>
                  ) : request.status === 'Pending' ? (
                    <button
                      onClick={() => handleCancelRequest(request._id)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors"
                    >
                      Cancel Request
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">No actions</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && selectedRequest ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setModalOpen(false); setSelectedRequest(null); }} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h4 className="text-lg font-bold">Confirm Renewal</h4>
            <p className="text-sm text-slate-600 mt-2">Renew <strong>{selectedRequest.book?.title}</strong>?</p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => { setModalOpen(false); setSelectedRequest(null); }} className="flex-1 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-600">Cancel</button>
              <button onClick={confirmRenew} disabled={renewingId === selectedRequest._id} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs">
                {renewingId === selectedRequest._id ? 'Renewing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default TeacherMyBooks;
