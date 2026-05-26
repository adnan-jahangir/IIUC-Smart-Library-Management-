import React from 'react';
import { BrainCircuit, Gauge, ShieldCheck, TrendingUp } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';

const aiSeries = [
  { name: 'Mon', queries: 820 },
  { name: 'Tue', queries: 910 },
  { name: 'Wed', queries: 1120 },
  { name: 'Thu', queries: 980 },
  { name: 'Fri', queries: 1210 },
  { name: 'Sat', queries: 760 },
  { name: 'Sun', queries: 640 },
];

const intents = [
  { label: 'Book discovery', value: 64 },
  { label: 'Citation support', value: 46 },
  { label: 'Policy guidance', value: 38 },
  { label: 'Account support', value: 29 },
];

const AdminAIUsage = () => {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">AI Operations</p>
          <h2 className="admin-display text-3xl font-semibold text-slate-900">AI usage</h2>
          <p className="text-slate-500 mt-2">Monitor assistant load, response confidence, and intent mix.</p>
        </div>
        <span className="admin-chip">
          <TrendingUp className="w-4 h-4" />
          +14% weekly volume
        </span>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="admin-surface p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Query volume</h3>
              <p className="text-sm text-slate-500">Daily AI requests across all channels.</p>
            </div>
            <span className="admin-badge">
              <BrainCircuit className="w-4 h-4" />
              6,420 total
            </span>
          </div>
          <div className="h-72 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aiSeries} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 18px rgba(15, 23, 42, 0.12)' }} />
                <Area type="monotone" dataKey="queries" stroke="#0f766e" fill="#14b8a6" fillOpacity={0.28} strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-surface p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Quality signals</h3>
              <p className="text-sm text-slate-500">Response health and compliance.</p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {[
              { label: 'Answer confidence', value: '92%' },
              { label: 'Escalation rate', value: '6.4%' },
              { label: 'Average response', value: '1.6s' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{item.label}</span>
                <span className="text-sm font-semibold text-slate-900">{item.value}</span>
              </div>
            ))}
            <button type="button" className="admin-button-ghost w-full">
              View AI logs
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="admin-surface p-6">
          <h3 className="text-lg font-semibold text-slate-900">Intent mix</h3>
          <p className="text-sm text-slate-500 mt-1">Top request types by share of volume.</p>
          <div className="mt-6 space-y-4">
            {intents.map((intent) => (
              <div key={intent.label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{intent.label}</span>
                  <span className="text-slate-500">{intent.value}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-teal-500"
                    style={{ width: `${intent.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-surface p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Compliance checks</h3>
              <p className="text-sm text-slate-500">Safety and policy alignment.</p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {[
              { label: 'Policy adherence', value: '98%' },
              { label: 'Sensitive requests', value: '14 flagged' },
              { label: 'Resolved escalations', value: '21 this week' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{item.label}</span>
                <span className="text-sm font-semibold text-slate-900">{item.value}</span>
              </div>
            ))}
            <div className="rounded-2xl border border-dashed border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">Next model review in 12 days</p>
              <p className="text-xs text-slate-500">Calibration for academic requests and policy queries.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminAIUsage;
