import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';

const LibrarianReports = () => {
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState(null);
  const [requests, setRequests] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [fines, setFines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.token) return;
      try {
        const [dashRes, reqRes, resRes, fineRes] = await Promise.all([
          axios.get('http://localhost:5000/api/dashboard/librarian', { headers: { Authorization: `Bearer ${user.token}` } }),
          axios.get('http://localhost:5000/api/requests', { headers: { Authorization: `Bearer ${user.token}` } }),
          axios.get('http://localhost:5000/api/reservations', { headers: { Authorization: `Bearer ${user.token}` } }),
          axios.get('http://localhost:5000/api/fines', { headers: { Authorization: `Bearer ${user.token}` } })
        ]);
        setDashboard(dashRes.data || {});
        setRequests(reqRes.data || []);
        setReservations(resRes.data || []);
        setFines(fineRes.data || []);
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to load reports');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [user?.token]);

  const metrics = useMemo(() => {
    const approved = requests.filter((r) => r.status === 'Approved').length;
    const returned = requests.filter((r) => r.status === 'Returned').length;
    const pending = requests.filter((r) => r.status === 'Pending').length;
    const waitingReservations = reservations.filter((r) => r.status === 'Waiting').length;
    const unpaidFines = fines.filter((f) => f.status !== 'Paid').reduce((sum, f) => sum + Number(f.amount || 0), 0);
    return { approved, returned, pending, waitingReservations, unpaidFines };
  }, [requests, reservations, fines]);

  const exportReport = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      dashboard,
      metrics,
      requests,
      reservations,
      fines
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `librarian-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Operations Reports</h2>
          <p className="text-slate-500 mt-1">Snapshot analytics for circulation, queue health, and fines.</p>
        </div>
        <button
          onClick={exportReport}
          disabled={isLoading}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm disabled:opacity-60"
        >
          Export JSON Report
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"><p className="text-xs text-slate-500">Issued Active</p><p className="text-2xl font-bold text-slate-800 mt-1">{isLoading ? '...' : metrics.approved}</p></div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"><p className="text-xs text-slate-500">Returned</p><p className="text-2xl font-bold text-slate-800 mt-1">{isLoading ? '...' : metrics.returned}</p></div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"><p className="text-xs text-slate-500">Pending Requests</p><p className="text-2xl font-bold text-amber-600 mt-1">{isLoading ? '...' : metrics.pending}</p></div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"><p className="text-xs text-slate-500">Waiting Reservations</p><p className="text-2xl font-bold text-blue-600 mt-1">{isLoading ? '...' : metrics.waitingReservations}</p></div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"><p className="text-xs text-slate-500">Outstanding Fines</p><p className="text-2xl font-bold text-rose-600 mt-1">{isLoading ? '...' : metrics.unpaidFines}</p></div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-3">Today At A Glance</h3>
        {isLoading ? (
          <p className="text-slate-500">Loading summary...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <p className="text-slate-700">Issued Today: <span className="font-bold">{dashboard?.issuedToday || 0}</span></p>
            <p className="text-slate-700">Returned Today: <span className="font-bold">{dashboard?.returnedToday || 0}</span></p>
            <p className="text-slate-700">Pending Queue: <span className="font-bold">{dashboard?.pendingCount || 0}</span></p>
            <p className="text-slate-700">Overdue Books: <span className="font-bold">{dashboard?.overdueCount || 0}</span></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LibrarianReports;
