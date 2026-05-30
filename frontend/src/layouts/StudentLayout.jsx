import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { BookOpen, User, Bell, Search, Library, Clock, AlertTriangle, Settings, MessageSquare, Menu, X, ArrowLeft } from 'lucide-react';

const StudentLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (!isMobileMenuOpen) {
      document.body.style.overflow = '';
      return undefined;
    }

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { name: 'Dashboard', path: '/student/dashboard', icon: <Library className="w-5 h-5" /> },
    { name: 'Search Books', path: '/student/search', icon: <Search className="w-5 h-5" /> },
    { name: 'My Borrowed', path: '/student/my-books', icon: <BookOpen className="w-5 h-5" /> },
    { name: 'Reservations', path: '/student/reservations', icon: <Clock className="w-5 h-5" /> },
    { name: 'Fines', path: '/student/fines', icon: <AlertTriangle className="w-5 h-5" /> },
  ];

  const sidebarContent = (
    <>
      <div className="p-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-xl text-white">
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-slate-800">IIUC Library</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Student Portal</p>
        {navLinks.map((link) => {
          const isActive = location.pathname.includes(link.path);
          return (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                isActive 
                  ? 'bg-emerald-50 text-emerald-700 shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-600'
              }`}
            >
              <div className={isActive ? 'text-emerald-600' : 'text-slate-400'}>
                {link.icon}
              </div>
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 mt-auto">
        <Link to="/student/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
          <User className="w-5 h-5 text-slate-400" />
          <span className="font-medium">My Profile</span>
        </Link>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors mt-1">
          <ArrowLeft className="w-5 h-5 text-rose-500" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 flex">
      {/* Desktop Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col fixed h-full z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 bg-slate-900/50 z-40 lg:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />
      <aside className={`w-72 bg-white border-r border-slate-200 flex flex-col fixed h-full z-50 transition-transform duration-300 lg:hidden ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        {sidebarContent}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-10 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="px-4 py-4 space-y-4 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <button className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg" onClick={() => setIsMobileMenuOpen(true)}>
                  <Menu className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-bold text-slate-800 hidden sm:block">
                  {navLinks.find(l => location.pathname.includes(l.path))?.name || 'Dashboard'}
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <button className="p-2 text-slate-400 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 rounded-full transition-colors relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
                </button>
                <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'S'}
                  </div>
                  <div className="hidden sm:block text-sm">
                    <p className="font-semibold text-slate-800">{user?.name || 'Student'}</p>
                    <p className="text-slate-500 text-xs">ID: {user?.customId || 'C1000'}</p>
                  </div>
                </div>
              </div>
            </div>

            <nav className="flex gap-2 overflow-x-auto pb-1">
              {navLinks.map((link) => {
                const isActive = location.pathname.includes(link.path);
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="p-4 sm:p-6 md:p-8 flex-1 w-full max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default StudentLayout;
