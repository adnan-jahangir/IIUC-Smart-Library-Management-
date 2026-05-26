import React from 'react';
import { Lock, Plus, ShieldCheck, Users } from 'lucide-react';

const roles = [
  {
    name: 'Admin',
    summary: 'Full governance and escalation authority.',
    permissions: ['All system access', 'Policy overrides', 'Audit trails'],
  },
  {
    name: 'Librarian',
    summary: 'Day to day circulation and catalog operations.',
    permissions: ['Manage catalog', 'Issue or return', 'Send notices'],
  },
  {
    name: 'Teacher',
    summary: 'Academic requests, course reserves, and analytics.',
    permissions: ['Academic requests', 'Reserve titles', 'View analytics'],
  },
  {
    name: 'Student',
    summary: 'Borrowing, reservations, and AI assistance.',
    permissions: ['Borrow books', 'Request holds', 'Use AI assistant'],
  },
];

const AdminManageRoles = () => {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Access Control</p>
          <h2 className="admin-display text-3xl font-semibold text-slate-900">Role and access</h2>
          <p className="text-slate-500 mt-2">Define who can see, edit, and approve across the platform.</p>
        </div>
        <button type="button" className="admin-button flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create role
        </button>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {roles.map((role) => (
          <div key={role.name} className="admin-surface p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{role.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{role.summary}</p>
              </div>
              <span className="admin-chip">
                <ShieldCheck className="w-4 h-4" />
                Active
              </span>
            </div>
            <div className="mt-5 space-y-2">
              {role.permissions.map((permission) => (
                <div key={permission} className="flex items-center gap-2 text-sm text-slate-700">
                  <div className="w-2 h-2 rounded-full bg-teal-500" />
                  {permission}
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-3">
              <button type="button" className="admin-button-ghost">
                Edit role
              </button>
              <button type="button" className="admin-button-ghost">
                View audit
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="admin-surface p-6 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Access policy review</h3>
              <p className="text-sm text-slate-500">Scheduled assessments and changes in progress.</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Quarterly review', value: 'June 20', detail: '8 policies queued' },
              { label: 'Role exceptions', value: '3 requests', detail: 'Awaiting approval' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                <p className="text-lg font-semibold text-slate-900 mt-2">{item.value}</p>
                <p className="text-xs text-slate-500 mt-1">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-surface p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Security controls</h3>
              <p className="text-sm text-slate-500">Access thresholds are active.</p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            {[
              { label: 'MFA coverage', value: '97%' },
              { label: 'Privileged roles', value: '6' },
              { label: 'Open exceptions', value: '2' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{item.label}</span>
                <span className="text-sm font-semibold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminManageRoles;
