import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';

const getOverdueDays = (dueDate) => {
  if (!dueDate) return 0;
  const now = new Date();
  const due = new Date(dueDate);
  const diff = Math.floor((now - due) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
};

const LibrarianOverdueList = () => {
  const { user } = useAuthStore();
  const [overdues, setOverdues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [returningId, setReturningId] = useState(null);

  const fetchOverdues = async () => {
    if (!user?.token) return;
    try {
      const res = await axios.get('http://localhost:5000/api/requests', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const rows = (res.data || []).filter((r) => {
        if (r.status !== 'Approved' || !r.dueDate) return false;
        return new Date(r.dueDate) < new Date();
      });
      setOverdues(rows);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to fetch overdue list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdues();
  }, [user?.token]);

  const totals = useMemo(() => {
    const count = overdues.length;
    const estimatedFine = overdues.reduce((sum, r) => sum + getOverdueDays(r.dueDate) * 10, 0);
    return { count, estimatedFine };
  }, [overdues]);

  const markReturned = async (id) => {
    setReturningId(id);
    try {
      const res = await axios.put(
        `http://localhost:5000/api/requests/${id}/return`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      toast.success(`Returned. Fine: ${res?.data?.fineAmount || 0}`);
      setOverdues((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Return action failed');
    } finally {
      setReturningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Overdue & Fine Watchlist</h2>
        <p className="text-slate-500 mt-1">Monitor overdue borrows and settle them quickly.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Overdue Books</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{totals.count}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Estimated Fine Pool</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{totals.estimatedFine}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading overdue list...</div>
        ) : overdues.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No overdue books at the moment.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Borrower</th>
                  <th className="text-left px-4 py-3 font-semibold">Book</th>
                  <th className="text-left px-4 py-3 font-semibold">Due Date</th>
                  <th className="text-left px-4 py-3 font-semibold">Overdue Days</th>
                  <th className="text-left px-4 py-3 font-semibold">Est. Fine</th>
                  <th className="text-right px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdues.map((r) => {
                  const overdueDays = getOverdueDays(r.dueDate);
                  return (
                    <tr key={r._id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{r.user?.name || 'Unknown User'}</p>
                        <p className="text-xs text-slate-500">{r.user?.customId || r.user?.userId || '-'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{r.book?.title || 'Unknown Book'}</p>
                        <p className="text-xs text-slate-500">{r.book?.customId || '-'}</p>
                      </td>
                      <td className="px-4 py-3 text-rose-600 font-semibold">{new Date(r.dueDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-slate-700">{overdueDays}</td>
                      <td className="px-4 py-3 text-slate-700">{overdueDays * 10}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => markReturned(r._id)}
                          disabled={returningId === r._id}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
                        >
                          {returningId === r._id ? 'Processing...' : 'Mark Returned'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LibrarianOverdueList;
