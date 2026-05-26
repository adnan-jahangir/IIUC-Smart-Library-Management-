import React from 'react';
import { AlertTriangle, DollarSign, TrendingDown, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

const fineSeries = [
  { name: 'Week 1', collected: 820, outstanding: 240 },
  { name: 'Week 2', collected: 910, outstanding: 210 },
  { name: 'Week 3', collected: 760, outstanding: 260 },
  { name: 'Week 4', collected: 980, outstanding: 190 },
  { name: 'Week 5', collected: 1040, outstanding: 220 },
];

const defaulters = [
  { name: 'Mahin Noor', amount: '12,400 BDT', days: '38 days' },
  { name: 'Sadia Alam', amount: '9,600 BDT', days: '32 days' },
  { name: 'Rafiul Hossain', amount: '8,200 BDT', days: '29 days' },
  { name: 'Tasnim Akter', amount: '7,450 BDT', days: '24 days' },
];

const AdminFineAnalytics = () => {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Recovery</p>
          <h2 className="admin-display text-3xl font-semibold text-slate-900">Fine analytics</h2>
          <p className="text-slate-500 mt-2">Track collection velocity and overdue exposure.</p>
        </div>
        <span className="admin-chip">
          <TrendingUp className="w-4 h-4" />
          Collection rate 84%
        </span>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="admin-surface p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Collections vs outstanding</h3>
              <p className="text-sm text-slate-500">Weekly collection performance and exposure.</p>
            </div>
            <span className="admin-badge">
              <TrendingDown className="w-4 h-4" />
              Outstanding -6%
            </span>
          </div>
          <div className="h-72 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fineSeries} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 18px rgba(15, 23, 42, 0.12)' }} />
                <Bar dataKey="collected" fill="#0f766e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="outstanding" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-surface p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Escalations</h3>
              <p className="text-sm text-slate-500">Accounts above 30 days overdue.</p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {defaulters.map((defaulter) => (
              <div key={defaulter.name} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{defaulter.name}</p>
                  <p className="text-xs text-slate-500">{defaulter.days} overdue</p>
                </div>
                <span className="text-sm font-semibold text-slate-900">{defaulter.amount}</span>
              </div>
            ))}
            <button type="button" className="admin-button-ghost w-full">
              Review escalations
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total collected', value: '4.2M BDT', note: 'Quarter to date' },
          { label: 'Outstanding balance', value: '780K BDT', note: 'Down 6% WoW' },
          { label: 'Average fine', value: '240 BDT', note: 'Across active penalties' },
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

export default AdminFineAnalytics;
