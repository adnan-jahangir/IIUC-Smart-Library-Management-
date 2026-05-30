import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  History, 
  BookmarkPlus, 
  CreditCard, 
  Bell, 
  Brain, 
  Settings,
  LogOut,
  Menu,
  X 
} from 'lucide-react';

const SIDEBAR_ITEMS = {
  student: [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/student/dashboard' },
    { icon: <BookOpen size={20} />, label: 'Search Books', path: '/catalog' },
    { icon: <History size={20} />, label: 'Borrowed Books', path: '/student/borrows' },
    { icon: <BookmarkPlus size={20} />, label: 'Reservations', path: '/student/reservations' },
    { icon: <CreditCard size={20} />, label: 'Fines', path: '/student/fines' },
    { icon: <Bell size={20} />, label: 'Notifications', path: '/student/notifications' },
    { icon: <Settings size={20} />, label: 'Profile Settings', path: '/student/profile' },
  ]
};

const DashboardLayout = ({ role = 'student' }) => {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const location = useLocation();
  const menuItems = SIDEBAR_ITEMS[role] || SIDEBAR_ITEMS.student;

  useEffect(() => {
    if (!sidebarOpen) {
      document.body.style.overflow = '';
      return undefined;
    }

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-[1px] z-40 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside id="dashboard-sidebar" className={`fixed inset-y-0 left-0 bg-dark-900 text-slate-300 w-72 sm:w-80 z-50 transform transition-transform duration-300 ease-in-out will-change-transform ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          
          <div className="h-20 flex items-center justify-between px-6 bg-dark-800 border-b border-slate-700">
            <Link to="/" className="flex items-center gap-2 text-white">
              <div className="bg-primary-600 p-1.5 rounded-md">
                <BookOpen size={20} />
              </div>
              <span className="font-bold tracking-tight">IIUC Library</span>
            </Link>
            <button className="text-slate-400" onClick={() => setSidebarOpen(false)}>
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 px-4 py-8 space-y-1 overflow-y-auto">
            <div className="text-xs uppercase font-bold text-slate-500 mb-4 px-2">Menu</div>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                    isActive 
                      ? 'bg-primary-600/10 text-primary-400 font-medium' 
                      : 'hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className={isActive ? 'text-primary-500' : 'text-slate-400 group-hover:text-primary-400'}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="p-4 border-t border-slate-700">
            <button className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors text-slate-400">
              <LogOut size={20} />
              Logout
            </button>
          </div>

        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <button 
            className="text-slate-600"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            aria-expanded={sidebarOpen}
            aria-controls="dashboard-sidebar"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <div className="ml-auto flex items-center gap-4">
            <button className="text-slate-400 hover:text-primary-600 relative">
              <Bell size={24} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border-2 border-primary-200">
              U
            </div>
          </div>
        </header>
        
        <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </div>
      </main>

    </div>
  );
};

export default DashboardLayout;
