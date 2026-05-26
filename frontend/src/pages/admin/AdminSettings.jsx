import React from 'react';
import { Bell, Cog, Shield } from 'lucide-react';

const AdminSettings = () => {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Configuration</p>
          <h2 className="admin-display text-3xl font-semibold text-slate-900">System settings</h2>
          <p className="text-slate-500 mt-2">Control platform preferences, security, and alerts.</p>
        </div>
        <button type="button" className="admin-button">
          Save changes
        </button>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="admin-surface p-6 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Cog className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Platform preferences</h3>
              <p className="text-sm text-slate-500">Baseline settings for the library system.</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Library name</label>
              <input className="admin-input mt-2" defaultValue="IIUC Smart Library" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Default timezone</label>
              <select className="admin-input mt-2">
                <option>Asia/Dhaka</option>
                <option>UTC</option>
                <option>Asia/Kolkata</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Backup frequency</label>
              <select className="admin-input mt-2">
                <option>Every 12 hours</option>
                <option>Daily</option>
                <option>Weekly</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Default borrow limit</label>
              <input className="admin-input mt-2" defaultValue="5" />
            </div>
          </div>
        </div>

        <div className="admin-surface p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Security</h3>
              <p className="text-sm text-slate-500">Policy enforcement toggles.</p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {[
              { label: 'Require MFA for staff', defaultChecked: true },
              { label: 'Auto lock after 10 minutes', defaultChecked: true },
              { label: 'Allow off-campus login', defaultChecked: false },
            ].map((item) => (
              <label key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-slate-700">{item.label}</span>
                <input type="checkbox" defaultChecked={item.defaultChecked} className="h-4 w-4 accent-teal-600" />
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="admin-surface p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Notification routing</h3>
            <p className="text-sm text-slate-500">Define how alerts are delivered.</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Overdue alerts', hint: 'Send to librarians and admins' },
            { label: 'AI usage spikes', hint: 'Notify innovation team' },
            { label: 'Security events', hint: 'Escalate to admin on-call' },
            { label: 'Weekly summaries', hint: 'Email leadership team' },
          ].map((item) => (
            <label key={item.label} className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
              <input type="checkbox" defaultChecked className="mt-1 h-4 w-4 accent-teal-600" />
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                <p className="text-xs text-slate-500">{item.hint}</p>
              </div>
            </label>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminSettings;
