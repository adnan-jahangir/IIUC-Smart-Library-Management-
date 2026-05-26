import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Mail, Shield, User, BadgeCheck, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { formatAcademicYear } from '../../utils/universityId';

const TeacherProfile = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auth/profile', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setProfile(response.data);
      } catch (error) {
        console.error('Failed to load profile:', error);
        setProfile(user || null);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.token) loadProfile();
  }, [user]);

  const data = profile || user || {};
  const academicYear = formatAcademicYear(data?.customId);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl">
              {String(data?.name || 'T').split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Teacher Profile</p>
              <h2 className="text-2xl font-bold text-slate-800 mt-1">{isLoading ? 'Loading profile...' : data?.name || 'Teacher Account'}</h2>
              <p className="text-slate-500 mt-1">{data?.role || 'Teacher'} • University ID: <span className="font-semibold text-slate-700">{String(data?.customId || 'N/A').toUpperCase()}</span></p>
              <p className="text-slate-500 mt-1">Academic year: <span className="font-semibold text-slate-700">{academicYear}</span></p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold">
            <BadgeCheck className="w-4 h-4" /> Active account
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-800">Account details</h3>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-center gap-3"><User className="w-4 h-4 text-slate-400" /> Name: <span className="font-semibold text-slate-800">{data?.name || '—'}</span></div>
            <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-slate-400" /> Email: <span className="font-semibold text-slate-800">{data?.email || '—'}</span></div>
            <div className="flex items-center gap-3"><Shield className="w-4 h-4 text-slate-400" /> Role: <span className="font-semibold text-slate-800">{data?.role || 'Teacher'}</span></div>
            <div className="flex items-center gap-3"><BadgeCheck className="w-4 h-4 text-slate-400" /> Academic year: <span className="font-semibold text-slate-800">{academicYear}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-800">Institution identity</h3>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-center gap-3"><BadgeCheck className="w-4 h-4 text-slate-400" /> University ID: <span className="font-semibold text-slate-800">{String(data?.customId || '—').toUpperCase()}</span></div>
            <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-slate-400" /> Primary contact: <span className="font-semibold text-slate-800">{data?.email || '—'}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;
