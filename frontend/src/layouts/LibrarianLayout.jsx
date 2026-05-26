import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { BookOpen, User, Bell, ArrowLeft, BookmarkCheck, Users, CornerDownLeft, CopyPlus, ClipboardList, CalendarDays, Receipt, FileText, Menu, X } from 'lucide-react';

const LibrarianLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/librarian/dashboard', icon: <ClipboardList className="w-5 h-5" /> },
    { name: 'Issue Books', path: '/librarian/issue-books', icon: <CopyPlus className="w-5 h-5" /> },
    { name: 'Return Books', path: '/librarian/return-books', icon: <CornerDownLeft className="w-5 h-5" /> },
    { name: 'Manage Inventory', path: '/librarian/manage-books', icon: <BookmarkCheck className="w-5 h-5" /> },
    { name: 'Borrow Requests', path: '/librarian/borrow-requests', icon: <Users className="w-5 h-5" /> },
    { name: 'Reservations', path: '/librarian/reservations', icon: <CalendarDays className="w-5 h-5" /> },
    { name: 'Overdue List', path: '/librarian/overdue-list', icon: <Bell className="w-5 h-5" /> },
    { name: 'Fines', path: '/librarian/fines', icon: <Receipt className="w-5 h-5" /> },
    { name: 'Notifications', path: '/librarian/notifications', icon: <Bell className="w-5 h-5" /> },
    { name: 'Reports', path: '/librarian/reports', icon: <FileText className="w-5 h-5" /> },
  ];

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

  const sidebarContent = (
    <>
      <div className="p-6">
        <Link to="/" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="bg-amber-500 p-2 rounded-xl text-slate-900">
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-white">Librarian Panel</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4">Operations</p>
        {navLinks.map((link) => {
          const isActive = location.pathname.includes(link.path);
          return (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                isActive ? 'bg-amber-500 text-slate-900 shadow-sm' : 'hover:bg-slate-800 hover:text-amber-400'
              }`}
            >
              <div className={isActive ? 'text-slate-900' : 'text-slate-400'}>{link.icon}</div>
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 mt-auto">
        <Link to="/librarian/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
          <User className="w-5 h-5" />
          <span className="font-medium">My Profile</span>
        </Link>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 hover:text-rose-400 transition-colors mt-1">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Logout / Home</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 flex">
      {/* Desktop Sidebar */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 hidden lg:flex flex-col fixed h-full z-20 text-slate-300">
        {sidebarContent}
      </aside>

      <div
        className={`fixed inset-0 bg-slate-900/50 z-40 lg:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />
      <aside className={`w-72 bg-slate-900 border-r border-slate-800 flex flex-col fixed h-full z-50 lg:hidden transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-6 pt-6 pb-5 flex items-center justify-between border-b border-slate-800">
          <Link to="/" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="bg-amber-500 p-2 rounded-xl text-slate-900">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-white">Librarian Panel</span>
          </Link>
          <button className="p-2 text-slate-300 hover:bg-slate-800 rounded-lg" onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu">
            <X className="w-6 h-6" />
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-10 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="px-6 py-4 space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <button className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg" onClick={() => setIsMobileMenuOpen(true)} aria-label="Open menu">
                  <Menu className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-bold text-slate-800 hidden sm:block">Operations Desk</h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'L'}
                  </div>
                  <div className="hidden sm:block text-sm">
                    <p className="font-semibold text-slate-800">{user?.name || 'Librarian'}</p>
                    <p className="text-slate-500 text-xs text-left">ID: {user?.customId || 'L1000'}</p>
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
                        ? 'bg-amber-500 text-slate-900 shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
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
        <div className="p-6 md:p-8 flex-1 w-full max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default LibrarianLayout;
