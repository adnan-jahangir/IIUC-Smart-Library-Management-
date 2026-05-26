import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';

const LibrarianReturnBooks = () => {
  const { user } = useAuthStore();
  const [issued, setIssued] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [returningId, setReturningId] = useState(null);

  const fetchIssued = async () => {
    if (!user?.token) return;
    try {
      const res = await axios.get('http://localhost:5000/api/requests', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setIssued((res.data || []).filter((r) => r.status === 'Approved'));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load issued books');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIssued();
  }, [user?.token]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return issued;
    return issued.filter((r) =>
      [r.book?.title, r.book?.customId, r.user?.name, r.user?.customId]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [issued, search]);

  const returnBook = async (requestId) => {
    setReturningId(requestId);
    try {
      const res = await axios.put(
        `http://localhost:5000/api/requests/${requestId}/return`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      const fine = res?.data?.fineAmount || 0;
      toast.success(fine > 0 ? `Returned with fine: ${fine}` : 'Book returned successfully');
      setIssued((prev) => prev.filter((r) => r._id !== requestId));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Return failed');
    } finally {
      setReturningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Return Books</h2>
        <p className="text-slate-500 mt-1">Process active borrows and mark them as returned.</p>
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
          <div className="p-8 text-center text-slate-500">Loading active borrows...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No active borrowed books found.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((r) => (
              <div key={r._id} className="p-4 sm:p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-slate-800">{r.book?.title || 'Unknown Book'}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {r.book?.customId || '-'} | {r.user?.name || 'Unknown User'} ({r.user?.customId || r.user?.userId || '-'})
                  </p>
                  <p className="text-xs text-rose-600 mt-1">
                    Due: {r.dueDate ? new Date(r.dueDate).toLocaleDateString() : 'No due date'}
                  </p>
                </div>
                <button
                  onClick={() => returnBook(r._id)}
                  disabled={returningId === r._id}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm disabled:opacity-60"
                >
                  {returningId === r._id ? 'Returning...' : 'Mark Returned'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LibrarianReturnBooks;
