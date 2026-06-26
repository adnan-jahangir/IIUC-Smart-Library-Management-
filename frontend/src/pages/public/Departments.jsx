import React from 'react';
import { Users, UserCheck, BookOpen, GraduationCap, LibraryBig, Milestone } from 'lucide-react';

const stats = [
  { label: 'Total Students', value: '13,000+', icon: <Users className="w-6 h-6 text-emerald-600" /> },
  { label: 'Faculty Members', value: '500+', icon: <UserCheck className="w-6 h-6 text-indigo-600" /> },
  { label: 'Full-time Teachers', value: '365+', icon: <GraduationCap className="w-6 h-6 text-amber-600" /> },
  { label: 'Faculties', value: '6', icon: <LibraryBig className="w-6 h-6 text-rose-600" /> },
];

const faculties = [
  {
    name: 'Faculty of Science and Engineering',
    departments: [
      { name: 'Computer Science and Engineering (CSE)', students: '2,500', teachers: '60' },
      { name: 'Computer and Communication Engineering (CCE)', students: '800', teachers: '25' },
      { name: 'Electrical and Electronic Engineering (EEE)', students: '1,800', teachers: '45' },
      { name: 'Electronic and Telecommunication Engineering (ETE)', students: '600', teachers: '20' },
      { name: 'Civil Engineering (CE)', students: '1,000', teachers: '30' },
      { name: 'Pharmacy', students: '1,200', teachers: '35' }
    ]
  },
  {
    name: 'Faculty of Shariah and Islamic Studies',
    departments: [
      { name: 'Quranic Sciences and Islamic Studies (QSIS)', students: '500', teachers: '18' },
      { name: 'Dawah & Islamic Studies (DIS)', students: '400', teachers: '15' },
      { name: 'Science of Hadith and Islamic Studies (SHIS)', students: '300', teachers: '12' }
    ]
  },
  {
    name: 'Faculty of Arts and Humanities',
    departments: [
      { name: 'English Language and Literature (ELL)', students: '800', teachers: '25' },
      { name: 'Arabic Language and Literature (ALL)', students: '400', teachers: '15' },
      { name: 'Library and Information Science (LIS)', students: '200', teachers: '10' }
    ]
  },
  {
    name: 'Faculty of Business Studies',
    departments: [
      { name: 'Business Administration (BBA/MBA)', students: '2,200', teachers: '55' }
    ]
  },
  {
    name: 'Faculty of Law',
    departments: [
      { name: 'Law (LLB/LLM)', students: '900', teachers: '30' }
    ]
  },
  {
    name: 'Faculty of Social Science',
    departments: [
      { name: 'Economics & Banking (EB)', students: '1,200', teachers: '25' }
    ]
  }
];

const Departments = () => {
  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-12 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
          Academic Excellence at IIUC
        </h1>
        <p className="text-lg text-slate-600 max-w-3xl mx-auto">
          International Islamic University Chittagong (IIUC) offers a diverse range of undergraduate and postgraduate programs across 6 vibrant faculties, supported by dedicated educators and modern facilities.
        </p>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto mb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                {stat.icon}
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</h3>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Faculties & Departments */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="w-8 h-8 text-indigo-600" />
          <h2 className="text-3xl font-bold text-slate-900">Faculties & Departments</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {faculties.map((faculty, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:-translate-y-1 transition-transform duration-300">
              <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">
                {faculty.name}
              </h3>
              <ul className="space-y-4">
                {faculty.departments.map((dept, deptIdx) => (
                  <li key={deptIdx} className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <Milestone className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-slate-800 font-bold block mb-1">{dept.name}</span>
                      <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-indigo-400" /> {dept.students} Students
                        </span>
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> {dept.teachers} Teachers
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Departments;
