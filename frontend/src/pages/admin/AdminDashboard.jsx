import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/useAuthStore';
import {
  Activity,
  AlertTriangle,
  Library,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const universityId = String(user?.customId || user?.email?.split('@')[0] || 'N/A').toUpperCase();
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalBooks: 0,
    activeBorrows: 0,
    pendingRequests: 0,
    overdueBorrows: 0,
    activitySeries: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/dashboard/admin', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setDashboardStats(res.data);
      } catch (err) {
        console.error('Error fetching admin data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (user?.token) fetchData();
  }, [user]);

  const activitySeries = useMemo(() => dashboardStats.activitySeries || [], [dashboardStats]);

  const kpisDynamic = [
    {
      label: 'Active Members',
      value: dashboardStats.totalUsers.toString(),
      change: 'Live total',
      icon: Users,
      tone: 'bg-teal-50 text-teal-700',
    },
    {
      label: 'Books In Circulation',
      value: dashboardStats.totalBooks.toString(),
      change: 'Live total',
      icon: Library,
      tone: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Active Borrows',
      value: dashboardStats.activeBorrows.toString(),
      change: 'Live Status',
      icon: ShieldCheck,
      tone: 'bg-sky-50 text-sky-700',
    },
    {
      label: 'Pending Requests',
      value: dashboardStats.pendingRequests.toString(),
      change: 'Needs review',
      icon: Activity,
      tone: 'bg-emerald-50 text-emerald-700',
    },
  ];

  const queueHighlightsDynamic = [
    { title: 'Pending approvals', value: dashboardStats.pendingRequests.toString(), status: 'Needs review', severity: 'admin-badge' },
    { title: 'Overdue returns', value: dashboardStats.overdueBorrows.toString(), status: 'Escalate', severity: 'admin-badge--alert' },
    { title: 'Active borrows', value: dashboardStats.activeBorrows.toString(), status: 'In progress', severity: 'admin-badge--ok' },
  ];

  return (
    <div className="space-y-8 min-w-0">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Analytics Core</p>
          <h2 className="admin-display text-3xl font-semibold text-slate-900">Welcome back, {user?.name || 'Admin'}! 👋</h2>
          <p className="text-slate-500 text-sm mt-1">University ID: <span className="font-semibold text-slate-700">{universityId}</span></p>
          <p className="text-slate-500 mt-2 max-w-2xl">
            Monitor platform velocity, service health, and the data signals that keep the library reliable.
          </p>
        </div>
        <div className="admin-surface px-4 py-3 flex items-center gap-3">
          <Activity className="w-5 h-5 text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-slate-900">System Healthy</p>
            <p className="text-xs text-slate-500">No critical alerts in the last 24 hours</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpisDynamic.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className={`admin-surface p-6 flex items-start gap-4 admin-fade-up admin-delay-${index + 1}`}
            >
              <div className={`p-3 rounded-xl ${kpi.tone}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-slate-500 font-medium truncate">{kpi.label}</p>
                <h3 className="text-2xl font-semibold text-slate-900 mt-1">{isLoading ? '...' : kpi.value}</h3>
                <p className="text-xs text-slate-500 mt-2 truncate">{kpi.change}</p>
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 admin-surface p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Engagement tempo</h3>
              <p className="text-sm text-slate-500">Daily activity across member types</p>
            </div>
            <div className="admin-chip">
              <TrendingUp className="w-4 h-4" />
              +6.2% this week
            </div>
          </div>
          <div className="h-72 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activitySeries} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 18px rgba(15, 23, 42, 0.12)' }} />
                <Bar dataKey="active" fill="#0f766e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-surface p-6">
          <h3 className="text-lg font-semibold text-slate-900">Operational queue</h3>
          <p className="text-sm text-slate-500 mt-1">Items requiring attention this week</p>
          <div className="mt-6 space-y-4">
            {queueHighlightsDynamic.map((item) => (
              <div key={item.title} className="flex items-center justify-between">
                <div className="min-w-0 flex-1 mr-4">
                  <p className="text-sm font-semibold text-slate-900 truncate">{item.title}</p>
                  <p className="text-xs text-slate-500 truncate">{item.status}</p>
                </div>
                <span className={item.severity}>{isLoading ? '...' : item.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Policy review due</p>
                <p className="text-xs text-slate-500">Next audit scheduled in 5 days</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="admin-surface p-6">
          <h3 className="text-lg font-semibold text-slate-900">Borrow vs returns</h3>
          <p className="text-sm text-slate-500 mt-1">Daily movement of circulation inventory</p>
          <div className="h-64 mt-6 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activitySeries} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 18px rgba(15, 23, 42, 0.12)' }} />
                <Line type="monotone" dataKey="active" stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="returns" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-surface p-6">
          <h3 className="text-lg font-semibold text-slate-900">AI deskload</h3>
          <p className="text-sm text-slate-500 mt-1">Live assistant demand by intent</p>
          <div className="mt-6 space-y-4">
            {[
              { label: 'Book discovery', value: 68 },
              { label: 'Citation support', value: 52 },
              { label: 'Policy questions', value: 34 },
              { label: 'Account issues', value: 26 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{item.label}</span>
                  <span className="text-slate-500">{item.value}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-teal-500"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
