import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';

const LibrarianBorrowRequests = () => {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Pending');
  const [actingId, setActingId] = useState(null);

  const fetchRequests = async () => {
    if (!user?.token) return;
    try {
      const res = await axios.get('http://localhost:5000/api/requests', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to fetch requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user?.token]);

  const filtered = useMemo(() => {
    if (activeTab === 'All') return requests;
    return requests.filter((r) => r.status === activeTab);
  }, [requests, activeTab]);

  const reviewRequest = async (id, status) => {
    setActingId(id);
    try {
      await axios.put(
        `http://localhost:5000/api/requests/${id}/review`,
        { status },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      toast.success(`Request ${status.toLowerCase()}`);
      await fetchRequests();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Action failed');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Borrow Requests</h2>
          <p className="text-slate-500 mt-1">Review and process student/teacher borrow queue.</p>
        </div>
        <div className="text-sm text-slate-500 font-medium">
          Total: <span className="text-slate-800 font-bold">{requests.length}</span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-1 shadow-sm inline-flex flex-wrap gap-1">
        {['Pending', 'Approved', 'Rejected', 'Returned', 'All'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab ? 'bg-amber-500 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading requests...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No requests found in this bucket.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">User</th>
                  <th className="text-left px-4 py-3 font-semibold">Book</th>
                  <th className="text-left px-4 py-3 font-semibold">Requested</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{r.user?.name || 'Unknown User'}</p>
                      <p className="text-xs text-slate-500">{r.user?.customId || r.user?.userId || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{r.book?.title || 'Unknown Book'}</p>
                      <p className="text-xs text-slate-500">{r.book?.customId || '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        r.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : r.status === 'Pending'
                          ? 'bg-amber-100 text-amber-700'
                          : r.status === 'Returned'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            disabled={actingId === r._id}
                            onClick={() => reviewRequest(r._id, 'Approved')}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            disabled={actingId === r._id}
                            onClick={() => reviewRequest(r._id, 'Rejected')}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No action</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LibrarianBorrowRequests;
