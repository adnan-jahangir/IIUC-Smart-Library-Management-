import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/useAuthStore';
import { BookOpen, Clock, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { resolveBookCover, getBookCoverFallback } from '../../utils/bookCover';

const StudentMyBooks = () => {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const fetchMyBooks = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/requests/my-requests', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setRequests(res.data);
      } catch (err) {
        console.error('Error fetching borrowed books:', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (user?.token) fetchMyBooks();
  }, [user]);

  const filteredRequests = requests.filter(req => {
    if (filter === 'All') return true;
    if (filter === 'Active') return req.status === 'Approved';
    if (filter === 'Pending') return req.status === 'Pending';
    if (filter === 'Returned') return req.status === 'Returned';
    return true;
  });

  const handleRenew = async (request) => {
    // open confirmation modal instead (handled by setSelectedRequest)
    setSelectedRequest(request);
    setModalOpen(true);
  };

  // Modal state and action
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [renewingId, setRenewingId] = useState(null);
  const [modalError, setModalError] = useState(null);

  const confirmRenew = async () => {
    if (!selectedRequest) return;
    setRenewingId(selectedRequest._id);
    setModalError(null);
    try {
      const res = await axios.put(`http://localhost:5000/api/requests/${selectedRequest._id}/renew`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const updated = res.data.request;
      const remaining = res.data.remainingRenewals;
      // attach remainingRenewals to updated request for UI clarity
      updated.remainingRenewals = remaining;
      setRequests(prev => prev.map(r => r._id === updated._id ? updated : r));
      toast.success('Renewal successful');
      setModalOpen(false);
      setSelectedRequest(null);
    } catch (err) {
      console.error('Renew error', err);
      const msg = err?.response?.data?.message || 'Failed to renew';
      // show server validation message inside modal
      setModalError(msg);
      toast.error(msg);
    } finally {
      setRenewingId(null);
    }
  };

  return (
    <>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Borrowed Books</h2>
          <p className="text-slate-500 mt-1">Track your active borrows and history.</p>
        </div>
        
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          {['All', 'Active', 'Pending', 'Returned'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === tab 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : filteredRequests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.map((req) => (
            <div key={req._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex p-4 gap-4">
                <div className="w-24 h-32 bg-slate-100 rounded-lg shadow-sm overflow-hidden flex-shrink-0">
                  <img 
                    src={resolveBookCover(req.book)} 
                    alt={req.book?.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.onerror = null; e.target.src = getBookCoverFallback(req.book?.title || 'Book'); }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                      req.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                      req.status === 'Returned' ? 'bg-slate-100 text-slate-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <h3 className="text-slate-800 font-bold mt-2 truncate leading-tight">{req.book?.title}</h3>
                  <p className="text-slate-500 text-xs mt-1">By {req.book?.author || 'Unknown'}</p>
                  
                  <div className="mt-4 space-y-2">
                     <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Requested: {new Date(req.createdAt).toLocaleDateString()}</span>
                     </div>
                     {req.dueDate && (
                       <div className="flex items-center gap-2 text-xs font-semibold text-rose-600">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Due: {new Date(req.dueDate).toLocaleDateString()}</span>
                       </div>
                     )}
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                 <p className="text-[10px] text-slate-400 font-mono">ID: {req.book?.customId}</p>
                 {req.status === 'Approved' ? (
                   <div className="flex items-center gap-3">
                     <p className="text-[10px] text-slate-500">Renewals: {(req.renewalCount || 0)}/2</p>
                     <button
                       onClick={() => { setSelectedRequest(req); setModalOpen(true); }}
                       disabled={(req.renewalCount || 0) >= 2 || renewingId === req._id}
                       className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
                         (req.renewalCount || 0) >= 2 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                       }`}
                     >
                       {renewingId === req._id ? <span className="animate-spin w-3 h-3 border-b-2 border-emerald-700 rounded-full" /> : null}
                       Request Renewal
                     </button>
                   </div>
                 ) : (
                   <button className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                      Request Renewal
                   </button>
                 )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
           <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-slate-300" />
           </div>
           <h3 className="text-lg font-bold text-slate-800">No books found</h3>
           <p className="text-slate-500 mt-2 max-w-xs mx-auto">
             {filter === 'All' ? "You haven't borrowed any books from the library yet." : `You have no ${filter.toLowerCase()} books.`}
           </p>
           <button 
             onClick={() => window.location.href = '/student/search'}
             className="mt-6 px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
            >
             Browse Catalog
           </button>
        </div>
      )}
    </div>
      {modalOpen && selectedRequest ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => { setModalOpen(false); setSelectedRequest(null); setModalError(null); }} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-4 transform transition-transform duration-200 ease-out scale-100">
            <h4 className="text-lg font-bold">Confirm Renewal</h4>
            <p className="text-sm text-slate-600 mt-2">You're about to renew <strong>{selectedRequest.book?.title}</strong>.</p>
            <div className="mt-4 text-sm text-slate-700">
              <p>Current due: {selectedRequest.dueDate ? new Date(selectedRequest.dueDate).toLocaleDateString() : '—'}</p>
              <p className="mt-1">Renewals used: {(selectedRequest.renewalCount || 0)} / 2</p>
              <p className="mt-1 text-xs text-slate-500">Remaining renewals: {selectedRequest.remainingRenewals ?? Math.max(0, 2 - (selectedRequest.renewalCount || 0))}</p>
            </div>
            {modalError ? (
              <div className="mt-4 p-3 bg-rose-50 text-rose-700 rounded">{modalError}</div>
            ) : null}
            <div className="mt-6 flex gap-3">
              <button onClick={() => { setModalOpen(false); setSelectedRequest(null); setModalError(null); }} className="flex-1 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition-all">Cancel</button>
              <button onClick={confirmRenew} disabled={renewingId === selectedRequest._id} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all">
                {renewingId === selectedRequest._id ? 'Renewing...' : 'Confirm Renewal'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default StudentMyBooks;

