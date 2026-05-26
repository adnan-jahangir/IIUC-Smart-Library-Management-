import React from 'react';
import { Calendar, Clock, TrendingUp } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

const borrowSeries = [
  { name: 'Week 1', borrows: 820, renewals: 210 },
  { name: 'Week 2', borrows: 910, renewals: 240 },
  { name: 'Week 3', borrows: 860, renewals: 220 },
  { name: 'Week 4', borrows: 980, renewals: 260 },
  { name: 'Week 5', borrows: 1020, renewals: 290 },
];

const peakHours = [
  { name: '9 AM', count: 120 },
  { name: '11 AM', count: 200 },
  { name: '1 PM', count: 260 },
  { name: '3 PM', count: 300 },
  { name: '5 PM', count: 180 },
];

const AdminBorrowAnalytics = () => {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Circulation</p>
          <h2 className="admin-display text-3xl font-semibold text-slate-900">Borrow analytics</h2>
          <p className="text-slate-500 mt-2">Weekly demand, renewals, and peak activity windows.</p>
        </div>
        <button type="button" className="admin-button-ghost flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Last 30 days
        </button>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="admin-surface p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Borrow volume</h3>
              <p className="text-sm text-slate-500">Week over week requests and renewals.</p>
            </div>
            <span className="admin-chip">
              <TrendingUp className="w-4 h-4" />
              +7.1% growth
            </span>
          </div>
          <div className="h-72 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={borrowSeries} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 18px rgba(15, 23, 42, 0.12)' }} />
                <Area type="monotone" dataKey="borrows" stroke="#0f766e" fill="#14b8a6" fillOpacity={0.25} strokeWidth={3} />
                <Area type="monotone" dataKey="renewals" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-surface p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Peak hours</h3>
              <p className="text-sm text-slate-500">Most active request windows.</p>
            </div>
          </div>
          <div className="h-56 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHours} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 18px rgba(15, 23, 42, 0.12)' }} />
                <Bar dataKey="count" fill="#0f766e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Average borrow time', value: '6.2 days', note: 'Target is 7 days' },
          { label: 'Renewal rate', value: '28%', note: 'Stable from last month' },
          { label: 'Reservation backlog', value: '96 requests', note: 'High demand titles' },
        ].map((item) => (
          <div key={item.label} className="admin-surface p-5">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="text-2xl font-semibold text-slate-900 mt-2">{item.value}</p>
            <p className="text-xs text-slate-500 mt-2">{item.note}</p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default AdminBorrowAnalytics;
