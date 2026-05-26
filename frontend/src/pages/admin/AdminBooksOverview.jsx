import React from 'react';
import { AlertTriangle, BookOpen, Layers, RefreshCcw } from 'lucide-react';

const categories = [
  { name: 'Computer Science', total: 4200, available: 3400 },
  { name: 'Business & Economics', total: 3200, available: 2400 },
  { name: 'Engineering', total: 2800, available: 2100 },
  { name: 'Humanities', total: 2400, available: 1900 },
  { name: 'Reference', total: 1200, available: 1100 },
];

const AdminBooksOverview = () => {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Collection Health</p>
          <h2 className="admin-display text-3xl font-semibold text-slate-900">Books overview</h2>
          <p className="text-slate-500 mt-2">Inventory depth, shelf availability, and circulation pressure.</p>
        </div>
        <button type="button" className="admin-button flex items-center gap-2">
          <RefreshCcw className="w-4 h-4" />
          Sync inventory
        </button>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total titles', value: '25,800', note: '8,240 new this year' },
          { label: 'Available copies', value: '18,430', note: '71% on shelf now' },
          { label: 'On loan', value: '7,370', note: 'Peak demand in CS' },
        ].map((item) => (
          <div key={item.label} className="admin-surface p-5">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="text-2xl font-semibold text-slate-900 mt-2">{item.value}</p>
            <p className="text-xs text-slate-500 mt-2">{item.note}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="admin-surface p-6 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Category availability</h3>
              <p className="text-sm text-slate-500">Shelf readiness across top departments.</p>
            </div>
          </div>
          <div className="mt-6 space-y-5">
            {categories.map((category) => {
              const ratio = Math.round((category.available / category.total) * 100);
              return (
                <div key={category.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{category.name}</span>
                    <span className="text-slate-500">{ratio}% available</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-teal-500"
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="admin-surface p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Risk signals</h3>
              <p className="text-sm text-slate-500">Collections requiring attention.</p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {[
              { label: 'Damaged reports', value: '42' },
              { label: 'Overdue > 30 days', value: '18' },
              { label: 'High demand titles', value: '96' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{item.label}</span>
                <span className="text-sm font-semibold text-slate-900">{item.value}</span>
              </div>
            ))}
            <button type="button" className="admin-button-ghost w-full">
              Review alerts
            </button>
          </div>
        </div>
      </section>

      <section className="admin-surface p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Department breakdown</h3>
            <p className="text-sm text-slate-500">Top categories by total holdings.</p>
          </div>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="admin-table min-w-[640px]">
            <thead>
              <tr>
                <th>Department</th>
                <th>Total titles</th>
                <th>Available</th>
                <th>On loan</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.name}>
                  <td className="font-semibold text-slate-900">{category.name}</td>
                  <td>{category.total.toLocaleString()}</td>
                  <td>{category.available.toLocaleString()}</td>
                  <td>{(category.total - category.available).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminBooksOverview;
