import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';

const LibrarianFines = () => {
  const { user } = useAuthStore();
  const [fines, setFines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);

  const fetchFines = async () => {
    if (!user?.token) return;
    try {
      const res = await axios.get('http://localhost:5000/api/fines', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setFines(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to fetch fines');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFines();
  }, [user?.token]);

  const markPaid = async (fineId) => {
    setPayingId(fineId);
    try {
      await axios.put(
        `http://localhost:5000/api/fines/${fineId}/pay`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      toast.success('Fine marked as paid');
      setFines((prev) => prev.map((f) => (f._id === fineId ? { ...f, status: 'Paid', paidAt: new Date().toISOString() } : f)));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to mark fine as paid');
    } finally {
      setPayingId(null);
    }
  };

  const stats = useMemo(() => {
    const unpaid = fines.filter((f) => f.status !== 'Paid');
    const unpaidCount = unpaid.length;
    const unpaidAmount = unpaid.reduce((sum, f) => sum + Number(f.amount || 0), 0);
    return { unpaidCount, unpaidAmount };
  }, [fines]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Fines Management</h2>
        <p className="text-slate-500 mt-1">Track unpaid penalties and settle payments.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Unpaid Fines</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{stats.unpaidCount}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Outstanding Amount</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.unpaidAmount}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading fines...</div>
        ) : fines.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No fines found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">User</th>
                  <th className="text-left px-4 py-3 font-semibold">Book</th>
                  <th className="text-left px-4 py-3 font-semibold">Amount</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fines.map((f) => (
                  <tr key={f._id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{f.user?.name || 'Unknown User'}</p>
                      <p className="text-xs text-slate-500">{f.user?.userId || f.user?.customId || '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{f.book?.title || 'Unknown Book'}</td>
                    <td className="px-4 py-3 text-slate-700">{f.amount || 0}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        f.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {f.status === 'Paid' ? (
                        <span className="text-xs text-slate-400">Settled</span>
                      ) : (
                        <button
                          onClick={() => markPaid(f._id)}
                          disabled={payingId === f._id}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                        >
                          {payingId === f._id ? 'Processing...' : 'Mark Paid'}
                        </button>
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

export default LibrarianFines;
