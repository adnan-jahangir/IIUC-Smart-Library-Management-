import React from 'react';
import { Download, Eye, FileText, Plus, Send, SlidersHorizontal, Timer } from 'lucide-react';

const reports = [
  { name: 'Weekly circulation digest', owner: 'Analytics', schedule: 'Every Monday', status: 'Active' },
  { name: 'Overdue escalation summary', owner: 'Compliance', schedule: 'Daily', status: 'Active' },
  { name: 'AI usage insights', owner: 'Innovation', schedule: 'Monthly', status: 'Paused' },
  { name: 'Inventory variance', owner: 'Collection', schedule: 'Every Friday', status: 'Active' },
];

const exports = [
  { name: 'April compliance report', time: '2 hours ago', format: 'PDF', size: '1.2 MB', status: 'Delivered' },
  { name: 'Borrow analytics Q1', time: 'Yesterday', format: 'CSV', size: '840 KB', status: 'Processing' },
  { name: 'AI usage summary', time: '3 days ago', format: 'PDF', size: '2.4 MB', status: 'Failed' },
  { name: 'Inventory variance', time: '4 days ago', format: 'XLSX', size: '3.1 MB', status: 'Delivered' },
];

const statusStyles = {
  Delivered: 'admin-badge--ok',
  Processing: '',
  Failed: 'admin-badge--alert',
};

const AdminReports = () => {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Reporting</p>
          <h2 className="admin-display text-3xl font-semibold text-slate-900">Reports center</h2>
          <p className="text-slate-500 mt-2">Schedule, export, and distribute operational intelligence.</p>
        </div>
        <button type="button" className="admin-button flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New report
        </button>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="admin-surface p-6 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Scheduled reports</h3>
              <p className="text-sm text-slate-500">Automated intelligence for teams and stakeholders.</p>
            </div>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="admin-table min-w-[640px]">
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Owner</th>
                  <th>Schedule</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.name}>
                    <td className="font-semibold text-slate-900">{report.name}</td>
                    <td>{report.owner}</td>
                    <td>{report.schedule}</td>
                    <td>
                      <span className={`admin-badge ${report.status === 'Active' ? 'admin-badge--ok' : ''}`}>
                        {report.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-surface p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Recent exports</h3>
                <p className="text-sm text-slate-500">Latest generated artifacts.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Filters</span>
              <button type="button" className="admin-button-ghost text-xs px-3 py-1.5">Today</button>
              <button type="button" className="admin-button-ghost text-xs px-3 py-1.5">Week</button>
              <button type="button" className="admin-button-ghost text-xs px-3 py-1.5">Month</button>
              <button type="button" className="admin-button-ghost text-xs px-3 py-1.5 flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Advanced
              </button>
            </div>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="admin-table min-w-[620px]">
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Time</th>
                  <th>Format</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {exports.map((item) => (
                  <tr key={item.name}>
                    <td className="font-semibold text-slate-900">{item.name}</td>
                    <td>{item.time}</td>
                    <td>{item.format}</td>
                    <td>{item.size}</td>
                    <td>
                      <span className={`admin-badge ${statusStyles[item.status]}`}>{item.status}</span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button type="button" className="admin-icon-btn" aria-label="Preview report">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button type="button" className="admin-icon-btn" aria-label="Download report">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6">
            <button type="button" className="admin-button-ghost w-full flex items-center justify-center gap-2">
              <Send className="w-4 h-4" />
              Share report
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminReports;
