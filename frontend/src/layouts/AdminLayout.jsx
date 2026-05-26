import React, { useMemo, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Cpu,
  FileText,
  LineChart,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  User,
  Users,
  Wallet,
  X,
  ArrowLeft,
} from 'lucide-react';

const AdminLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navSections = useMemo(
    () => [
      {
        title: 'Core Intelligence',
        items: [
          { name: 'Analytics Core', path: '/admin/dashboard', icon: <BarChart3 className="w-5 h-5" /> },
          { name: 'Books Overview', path: '/admin/books-overview', icon: <BookOpen className="w-5 h-5" /> },
          { name: 'Borrow Analytics', path: '/admin/borrow-analytics', icon: <LineChart className="w-5 h-5" /> },
          { name: 'Fine Analytics', path: '/admin/fine-analytics', icon: <Wallet className="w-5 h-5" /> },
        ],
      },
      {
        title: 'People & Access',
        items: [
          { name: 'User Management', path: '/admin/manage-users', icon: <Users className="w-5 h-5" /> },
          { name: 'Role & Access', path: '/admin/manage-roles', icon: <ShieldAlert className="w-5 h-5" /> },
        ],
      },
      {
        title: 'Automation',
        items: [
          { name: 'AI Usage', path: '/admin/ai-usage', icon: <Cpu className="w-5 h-5" /> },
          { name: 'Reports', path: '/admin/reports', icon: <FileText className="w-5 h-5" /> },
        ],
      },
      {
        title: 'System',
        items: [
          { name: 'System Settings', path: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
        ],
      },
    ],
    [],
  );

  const currentTitle = useMemo(() => {
    const allItems = navSections.flatMap((section) => section.items);
    const activeItem = allItems.find((item) => location.pathname.startsWith(item.path));
    return activeItem?.name ?? 'Admin Console';
  }, [location.pathname, navSections]);

  React.useEffect(() => {
    if (!isMobileMenuOpen) {
      document.body.style.overflow = '';
      return undefined;
    }

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="admin-shell relative min-h-screen">
      <div className="admin-bg" aria-hidden="true" />
      <div className="admin-grid" aria-hidden="true" />
      <div className="relative z-10 flex min-h-screen">
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-slate-900/60 z-30 lg:hidden transition-opacity duration-300 opacity-100"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <aside
          className={`admin-sidebar fixed inset-y-0 left-0 w-80 z-40 transform transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:flex flex-col ${
            isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          }`}
        >
          <div className="px-6 pt-6 pb-5">
            <Link to="/" className="flex items-center gap-3">
              <div className="bg-teal-500/20 text-teal-200 p-2 rounded-xl">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">IIUC Library</p>
                <p className="text-lg font-semibold text-white">Control Vault</p>
              </div>
            </Link>
          </div>

          <div className="mx-6 mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">System Status</p>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-white">Stable</p>
                <p className="text-xs text-slate-400">Last sync 4 minutes ago</p>
              </div>
              <span className="admin-chip">
                <Activity className="w-4 h-4" />
                Online
              </span>
            </div>
          </div>

          <nav className="flex-1 px-4 pb-6 overflow-y-auto">
            {navSections.map((section) => (
              <div key={section.title} className="mb-6">
                <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-[0.22em] mb-3">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        className={`admin-nav-item ${isActive ? 'admin-nav-item-active' : ''}`}
                      >
                        <span className={`admin-nav-icon ${isActive ? 'text-teal-200' : 'text-slate-400'}`}>
                          {item.icon}
                        </span>
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="px-4 pb-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs">
                  {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{user?.name || 'System Admin'}</p>
                  <p className="text-xs text-slate-400">ID: {user?.customId || 'A1000'}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Link
                  to="/admin/profile"
                  className="admin-nav-item admin-nav-item-compact"
                >
                  <User className="w-5 h-5 text-slate-300" />
                  <span className="font-medium">Admin Profile</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="admin-nav-item admin-nav-item-compact text-rose-200"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-medium">Logout / Home</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 lg:ml-80 flex flex-col min-h-screen">
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/70 backdrop-blur">
            <div className="px-4 py-4 sm:px-6 lg:px-8 flex flex-col gap-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="admin-icon-btn lg:hidden"
                    onClick={() => setIsMobileMenuOpen(true)}
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                  <div>
                    <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Admin Console</p>
                    <h1 className="admin-display text-2xl font-semibold text-slate-900">{currentTitle}</h1>
                  </div>
                  <span className="admin-chip hidden md:inline-flex">
                    <Activity className="w-4 h-4" />
                    System Healthy
                  </span>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input className="admin-input admin-input-icon" placeholder="Search users, reports, settings" />
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" className="admin-button flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      New report
                    </button>
                    <button type="button" className="admin-icon-btn">
                      <Bell className="w-5 h-5" />
                    </button>
                    <div className="admin-surface px-3 py-2 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-semibold">
                        SA
                      </div>
                      <div className="hidden sm:block text-sm">
                        <p className="font-semibold text-slate-900">System Admin</p>
                        <p className="text-slate-500 text-xs">Security Tier L5</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <nav className="flex gap-2 overflow-x-auto pb-1">
                {navSections.flatMap((section) => section.items).map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-teal-500 text-slate-900 shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700'
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </header>

          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
