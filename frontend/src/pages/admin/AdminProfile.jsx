import React from 'react';
import { BadgeCheck, Mail, Phone, Shield } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { formatAcademicYear } from '../../utils/universityId';

const AdminProfile = () => {
  const { user } = useAuthStore();
  const academicYear = formatAcademicYear(user?.customId);
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Identity</p>
          <h2 className="admin-display text-3xl font-semibold text-slate-900">Admin profile</h2>
          <p className="text-slate-500 mt-2">Maintain account details and escalation preferences.</p>
        </div>
        <button type="button" className="admin-button">
          Update profile
        </button>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="admin-surface p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl font-semibold">
              {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD'}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">{user?.name || 'System Admin'}</h3>
              <p className="text-sm text-slate-500">ID: {user?.customId || 'A1000'}</p>
              <p className="text-sm text-slate-500 mt-1">Academic year: {academicYear}</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Mail className="w-4 h-4" />
              {user?.email || 'admin@iiuc.edu'}
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Phone className="w-4 h-4" />
              +880 1700 000 000
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <span className="admin-badge admin-badge--ok">
              <BadgeCheck className="w-4 h-4" />
              Verified
            </span>
            <span className="admin-badge">
              <Shield className="w-4 h-4" />
              Security Tier L5
            </span>
          </div>
        </div>

        <div className="admin-surface p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-900">Profile details</h3>
          <p className="text-sm text-slate-500 mt-1">Update your contact and escalation data.</p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Full name</label>
              <input className="admin-input mt-2" defaultValue="System Admin" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Title</label>
              <input className="admin-input mt-2" defaultValue="Head of Library Operations" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input className="admin-input mt-2" defaultValue="admin@iiuc.edu" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Phone</label>
              <input className="admin-input mt-2" defaultValue="+880 1700 000 000" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Escalation notes</label>
              <textarea
                className="admin-input mt-2"
                rows="4"
                defaultValue="Reach out for compliance escalations and system outages."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="admin-surface p-6">
        <h3 className="text-lg font-semibold text-slate-900">Active sessions</h3>
        <p className="text-sm text-slate-500 mt-1">Devices currently authenticated to this account.</p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { device: 'Chrome on Windows', location: 'Chittagong, BD', time: 'Active now' },
            { device: 'Edge on Windows', location: 'Dhaka, BD', time: '2 days ago' },
            { device: 'iPhone 15', location: 'Chittagong, BD', time: '5 days ago' },
          ].map((session) => (
            <div key={session.device} className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">{session.device}</p>
              <p className="text-xs text-slate-500 mt-1">{session.location}</p>
              <p className="text-xs text-slate-400 mt-2">{session.time}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminProfile;
