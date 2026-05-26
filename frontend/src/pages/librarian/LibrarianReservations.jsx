import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';

const LibrarianReservations = () => {
  const { user } = useAuthStore();
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Waiting');
  const [actingId, setActingId] = useState(null);

  const fetchReservations = async () => {
    if (!user?.token) return;
    try {
      const res = await axios.get('http://localhost:5000/api/reservations', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setReservations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to fetch reservations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [user?.token]);

  const filtered = useMemo(() => {
    if (activeTab === 'All') return reservations;
    return reservations.filter((r) => r.status === activeTab);
  }, [reservations, activeTab]);

  const updateStatus = async (id, status) => {
    setActingId(id);
    try {
      await axios.put(
        `http://localhost:5000/api/reservations/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      toast.success(`Reservation marked as ${status}`);
      await fetchReservations();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update reservation');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Reservations Queue</h2>
        <p className="text-slate-500 mt-1">Manage waiting list and notify users when books become available.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-1 shadow-sm inline-flex flex-wrap gap-1">
        {['Waiting', 'Notified', 'Fulfilled', 'Canceled', 'All'].map((tab) => (
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
          <div className="p-8 text-center text-slate-500">Loading reservations...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No reservations found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">User</th>
                  <th className="text-left px-4 py-3 font-semibold">Book</th>
                  <th className="text-left px-4 py-3 font-semibold">Queue</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{r.user?.name || 'Unknown User'}</p>
                      <p className="text-xs text-slate-500">{r.user?.userId || r.user?.customId || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{r.book?.title || 'Unknown Book'}</p>
                      <p className="text-xs text-slate-500">{r.book?.customId || '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">#{r.queuePosition || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        r.status === 'Waiting'
                          ? 'bg-amber-100 text-amber-700'
                          : r.status === 'Notified'
                          ? 'bg-blue-100 text-blue-700'
                          : r.status === 'Fulfilled'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {r.status === 'Waiting' ? (
                          <button
                            onClick={() => updateStatus(r._id, 'Notified')}
                            disabled={actingId === r._id}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                          >
                            Notify
                          </button>
                        ) : null}
                        {r.status === 'Notified' ? (
                          <button
                            onClick={() => updateStatus(r._id, 'Fulfilled')}
                            disabled={actingId === r._id}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                          >
                            Fulfill
                          </button>
                        ) : null}
                        {r.status !== 'Canceled' && r.status !== 'Fulfilled' ? (
                          <button
                            onClick={() => updateStatus(r._id, 'Canceled')}
                            disabled={actingId === r._id}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                          >
                            Cancel
                          </button>
                        ) : null}
                      </div>
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

export default LibrarianReservations;
