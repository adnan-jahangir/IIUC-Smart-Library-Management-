import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';

const LibrarianIssueBooks = () => {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [issuingId, setIssuingId] = useState(null);

  const fetchPending = async () => {
    if (!user?.token) return;
    try {
      const res = await axios.get('http://localhost:5000/api/requests', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const pending = (res.data || []).filter((r) => r.status === 'Pending');
      setRequests(pending);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load pending requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, [user?.token]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return requests;
    return requests.filter((r) =>
      [r.book?.title, r.book?.customId, r.user?.name, r.user?.customId]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [requests, search]);

  const issueBook = async (requestId) => {
    setIssuingId(requestId);
    try {
      await axios.put(
        `http://localhost:5000/api/requests/${requestId}/review`,
        { status: 'Approved' },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      toast.success('Book issued successfully');
      setRequests((prev) => prev.filter((r) => r._id !== requestId));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Issue failed');
    } finally {
      setIssuingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Issue Books</h2>
        <p className="text-slate-500 mt-1">Approve pending requests and issue books from queue.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by student, custom ID, or book title..."
          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading pending issues...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No pending requests to issue.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((r) => (
              <div key={r._id} className="p-4 sm:p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-slate-800">{r.book?.title || 'Unknown Book'}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {r.book?.customId || '-'} | {r.user?.name || 'Unknown User'} ({r.user?.customId || r.user?.userId || '-'})
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Requested: {new Date(r.createdAt).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => issueBook(r._id)}
                  disabled={issuingId === r._id}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm disabled:opacity-60"
                >
                  {issuingId === r._id ? 'Issuing...' : 'Approve & Issue'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LibrarianIssueBooks;
