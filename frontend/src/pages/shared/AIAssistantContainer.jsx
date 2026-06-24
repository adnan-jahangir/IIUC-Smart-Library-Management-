import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { MessageSquare, FileText, Map, Sparkles, BrainCircuit } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const AIAssistantContainer = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  
  const basePath = user?.role === 'teacher' ? '/teacher/ai-assistant' : '/student/ai-assistant';

  const tabs = [
    { name: 'Chat', path: `${basePath}/chat`, icon: <MessageSquare className="w-4 h-4" /> },
    { name: 'Doc Assistant', path: `${basePath}/docs`, icon: <FileText className="w-4 h-4" /> },
    { name: 'Roadmap', path: `${basePath}/roadmap`, icon: <Map className="w-4 h-4" /> },
    { name: 'Recommendations', path: `${basePath}/recommendations`, icon: <Sparkles className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-indigo-200">
              <BrainCircuit className="w-4 h-4" /> AI Assistant
            </span>
            <h2 className="text-3xl font-bold mt-3">Your intelligent library companion</h2>
            <p className="text-slate-300 mt-2 max-w-2xl">Chat, summarize documents, generate learning roadmaps, and get personalized recommendations.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50/50">
          {tabs.map((tab) => (
            <NavLink
              key={tab.name}
              to={tab.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-6 py-4 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${
                  isActive || (location.pathname === basePath && tab.path.includes('/chat'))
                    ? 'border-indigo-600 text-indigo-700 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`
              }
            >
              {tab.icon} {tab.name}
            </NavLink>
          ))}
        </div>
        
        <div className="p-4 sm:p-6 bg-white min-h-[500px]">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AIAssistantContainer;
