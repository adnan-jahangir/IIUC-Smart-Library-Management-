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
      'Computer Science and Engineering (CSE)',
      'Computer and Communication Engineering (CCE)',
      'Electrical and Electronic Engineering (EEE)',
      'Electronic and Telecommunication Engineering (ETE)',
      'Civil Engineering (CE)',
      'Pharmacy'
    ]
  },
  {
    name: 'Faculty of Shariah and Islamic Studies',
    departments: [
      'Quranic Sciences and Islamic Studies (QSIS)',
      'Dawah & Islamic Studies (DIS)',
      'Science of Hadith and Islamic Studies (SHIS)'
    ]
  },
  {
    name: 'Faculty of Arts and Humanities',
    departments: [
      'English Language and Literature (ELL)',
      'Arabic Language and Literature (ALL)',
      'Library and Information Science (LIS)'
    ]
  },
  {
    name: 'Faculty of Business Studies',
    departments: [
      'Business Administration (BBA/MBA)'
    ]
  },
  {
    name: 'Faculty of Law',
    departments: [
      'Law (LLB/LLM)'
    ]
  },
  {
    name: 'Faculty of Social Science',
    departments: [
      'Economics & Banking (EB)'
    ]
  }
];

const Departments = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
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
                  <li key={deptIdx} className="flex items-start gap-3">
                    <Milestone className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-slate-600 font-medium">{dept}</span>
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
