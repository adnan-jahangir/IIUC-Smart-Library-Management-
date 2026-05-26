import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/useAuthStore';

const LibrarianNotifications = () => {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.token) return;
      try {
        const [reqRes, resRes, fineRes] = await Promise.all([
          axios.get('http://localhost:5000/api/requests', { headers: { Authorization: `Bearer ${user.token}` } }),
          axios.get('http://localhost:5000/api/reservations', { headers: { Authorization: `Bearer ${user.token}` } }),
          axios.get('http://localhost:5000/api/fines', { headers: { Authorization: `Bearer ${user.token}` } })
        ]);

        const pendingRequests = (reqRes.data || [])
          .filter((r) => r.status === 'Pending')
          .slice(0, 8)
          .map((r) => ({
            id: `req-${r._id}`,
            type: 'Borrow Request',
            tone: 'amber',
            text: `${r.user?.name || 'A user'} requested ${r.book?.title || 'a book'}`,
            time: new Date(r.createdAt).toLocaleString()
          }));

        const waitingReservations = (resRes.data || [])
          .filter((r) => r.status === 'Waiting')
          .slice(0, 8)
          .map((r) => ({
            id: `res-${r._id}`,
            type: 'Reservation Queue',
            tone: 'blue',
            text: `${r.user?.name || 'A user'} is waiting for ${r.book?.title || 'a book'} (Queue #${r.queuePosition || '-'})`,
            time: new Date(r.createdAt).toLocaleString()
          }));

        const unpaidFines = (fineRes.data || [])
          .filter((f) => f.status !== 'Paid')
          .slice(0, 8)
          .map((f) => ({
            id: `fine-${f._id}`,
            type: 'Unpaid Fine',
            tone: 'rose',
            text: `${f.user?.name || 'A user'} has outstanding fine ${f.amount || 0}`,
            time: new Date(f.createdAt).toLocaleString()
          }));

        const sorted = [...pendingRequests, ...waitingReservations, ...unpaidFines].sort((a, b) =>
          new Date(b.time) - new Date(a.time)
        );
        setNotifications(sorted);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.token]);

  const summary = useMemo(() => ({
    total: notifications.length,
    urgent: notifications.filter((n) => n.tone === 'rose').length
  }), [notifications]);

  const toneClass = (tone) => {
    if (tone === 'rose') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (tone === 'amber') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Librarian Notifications</h2>
        <p className="text-slate-500 mt-1">Live operational alerts from requests, reservations, and fines.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Alerts</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{summary.total}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Urgent</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{summary.urgent}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No notifications right now.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <div key={n.id} className="p-4 sm:p-5 flex items-start justify-between gap-3 hover:bg-slate-50/70">
                <div>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${toneClass(n.tone)}`}>{n.type}</span>
                  <p className="text-slate-800 font-medium mt-2">{n.text}</p>
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap">{n.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LibrarianNotifications;
