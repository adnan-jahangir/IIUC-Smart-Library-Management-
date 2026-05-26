import React from 'react';
import { Filter, MoreHorizontal, Search, UserPlus, Users } from 'lucide-react';

const users = [
  {
    name: 'Amina Rahman',
    email: 'amina.rahman@iiuc.edu',
    role: 'Student',
    status: 'Active',
    lastActive: '10 minutes ago',
  },
  {
    name: 'Farhan Islam',
    email: 'farhan.islam@iiuc.edu',
    role: 'Teacher',
    status: 'Active',
    lastActive: '40 minutes ago',
  },
  {
    name: 'Nusrat Kabir',
    email: 'nusrat.kabir@iiuc.edu',
    role: 'Librarian',
    status: 'Pending',
    lastActive: '2 hours ago',
  },
  {
    name: 'Sajid Hasan',
    email: 'sajid.hasan@iiuc.edu',
    role: 'Student',
    status: 'Suspended',
    lastActive: '5 days ago',
  },
  {
    name: 'Tahsin Karim',
    email: 'tahsin.karim@iiuc.edu',
    role: 'Teacher',
    status: 'Active',
    lastActive: 'Yesterday',
  },
];

const statusStyles = {
  Active: 'admin-badge--ok',
  Pending: '',
  Suspended: 'admin-badge--alert',
};

const AdminManageUsers = () => {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">People Ops</p>
          <h2 className="admin-display text-3xl font-semibold text-slate-900">User management</h2>
          <p className="text-slate-500 mt-2">Control access levels, invitations, and account status.</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className="admin-button-ghost flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button type="button" className="admin-button flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Invite user
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total members', value: '12,450', note: '+210 this month' },
          { label: 'Pending approvals', value: '32', note: '6 require review' },
          { label: 'Suspended accounts', value: '14', note: 'Auto-review in 2 days' },
        ].map((item) => (
          <div key={item.label} className="admin-surface p-5">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="text-2xl font-semibold text-slate-900 mt-2">{item.value}</p>
            <p className="text-xs text-slate-500 mt-2">{item.note}</p>
          </div>
        ))}
      </section>

      <section className="admin-surface p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Member directory</h3>
              <p className="text-sm text-slate-500">Latest activity and access status.</p>
            </div>
          </div>
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="admin-input admin-input-icon" placeholder="Search by name or email" />
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="admin-table min-w-[700px]">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.email}>
                  <td>
                    <div>
                      <p className="font-semibold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="text-sm text-slate-600">{user.role}</td>
                  <td>
                    <span className={`admin-badge ${statusStyles[user.status]}`}>{user.status}</span>
                  </td>
                  <td className="text-sm text-slate-600">{user.lastActive}</td>
                  <td className="text-right">
                    <button type="button" className="admin-icon-btn">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminManageUsers;
