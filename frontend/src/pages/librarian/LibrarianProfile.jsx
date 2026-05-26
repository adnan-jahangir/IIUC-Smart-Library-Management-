import React from 'react';
import { Camera, Mail, Shield, Smartphone, Briefcase, MapPin } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { formatAcademicYear } from '../../utils/universityId';

const LibrarianProfile = () => {
  const { user } = useAuthStore();
  const academicYear = formatAcademicYear(user?.customId);
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Cover Photo */}
        <div className="h-48 bg-gradient-to-r from-amber-500 to-amber-700 w-full relative">
          <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-white font-medium text-sm flex items-center gap-2 cursor-pointer hover:bg-black/30 transition-colors">
            <Camera className="w-4 h-4" /> Edit Cover
          </div>
        </div>

        {/* Profile Details Container */}
        <div className="px-8 pb-8 relative">
          {/* Avatar floating */}
          <div className="absolute -top-16 border-4 border-white bg-amber-100 rounded-2xl w-32 h-32 flex items-center justify-center shadow-lg overflow-hidden group cursor-pointer">
            <span className="text-4xl font-bold text-amber-700">
              {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'L'}
            </span>
            <div className="inset-0 absolute bg-black/40 hidden group-hover:flex items-center justify-center transition-all">
               <Camera className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="pt-20 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">{user?.name || 'Librarian Account'}</h1>
              <p className="text-slate-500 font-medium font-mono text-xs mt-1 uppercase tracking-wider">ID: {user?.customId}</p>
              <p className="text-slate-500 font-medium text-xs mt-1">Academic year: {academicYear}</p>
            </div>
            <button className="px-5 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors shadow-md hidden sm:block">
              Save Changes
            </button>
          </div>

          <div className="flex flex-wrap gap-6 mt-6">
            <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
               <Shield className="w-4 h-4 text-amber-600" /> System Level 2
            </div>
            <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
               <Briefcase className="w-4 h-4 text-emerald-600" /> Operational Since 2024
            </div>
            <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
               <MapPin className="w-4 h-4 text-blue-500" /> Main Branch Library
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Left col settings */}
         <div className="md:col-span-1 space-y-6">
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
             <h3 className="text-lg font-bold text-slate-800 mb-4">Security</h3>
             <div className="space-y-4">
               <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Last Password Change</label>
                  <p className="text-slate-800 font-medium mt-1">3 months ago</p>
               </div>
               <button className="w-full py-2.5 bg-slate-50 text-slate-700 font-medium rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                  Update Password
               </button>
             </div>
           </div>
         </div>

         {/* Right col forms */}
         <div className="md:col-span-2">
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
             <h3 className="text-lg font-bold text-slate-800 mb-6">Personal Information</h3>
             
             <form className="space-y-5">
               <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                     <label className="text-sm font-semibold text-slate-600">Full Name</label>
                     <input type="text" defaultValue="Librarian Account" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-slate-800 font-medium" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-sm font-semibold text-slate-600">Employee ID</label>
                     <input type="text" defaultValue="LIB-99120" readOnly className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed" />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Email Address</label>
                  <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="w-5 h-5 text-slate-400" />
                     </div>
                     <input type="email" defaultValue="library@iiuc.ac.bd" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-slate-800 font-medium" />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Phone Number</label>
                  <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Smartphone className="w-5 h-5 text-slate-400" />
                     </div>
                     <input type="tel" defaultValue="+880 1234 567890" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-slate-800 font-medium" />
                  </div>
               </div>

               <button className="w-full sm:hidden py-3 bg-slate-900 text-white rounded-xl font-medium mt-4 shadow-md">
                 Save Changes
               </button>
             </form>
           </div>
         </div>
      </div>
    </div>
  );
};

export default LibrarianProfile;
