import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { BookOpen, Menu, X, BookMarked, Users, Info, User } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const PublicLayout = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();

  const hideLayoutElementsPaths = ['/login', '/register'];
  const shouldHide = hideLayoutElementsPaths.includes(location.pathname);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Home', path: '/', icon: <BookOpen className="w-4 h-4" /> },
    { name: 'Catalog', path: '/catalog', icon: <BookMarked className="w-4 h-4" /> },
    { name: 'Departments', path: '/departments', icon: <Users className="w-4 h-4" /> },
    { name: 'About', path: '/about', icon: <Info className="w-4 h-4" /> },
  ];

  const isDarkHeader = location.pathname === '/about' && !isScrolled;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Navigation */}
      {!shouldHide && (
        <header 
          className={`fixed top-4 left-0 right-0 z-50 transition-all duration-300 w-[calc(100%-2rem)] max-w-7xl mx-auto ${
            isScrolled 
              ? 'bg-white/75 backdrop-blur-lg shadow-lg border border-white/60 py-3 rounded-2xl' 
              : isDarkHeader
                ? 'bg-slate-950/20 backdrop-blur-lg shadow-md border border-white/15 py-4 rounded-2xl'
                : 'bg-white/45 backdrop-blur-lg shadow-md border border-white/50 py-4 rounded-2xl'
          }`}
        >
          <div className="container mx-auto px-4 md:px-8 flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="bg-emerald-600 p-2 rounded-xl group-hover:bg-emerald-500 transition-colors shadow-emerald-500/30 shadow-lg">
              <BookOpen className="text-white w-6 h-6" />
            </div>
            <span className={`text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r tracking-tight ${
              isDarkHeader 
                ? 'from-white to-slate-200' 
                : 'from-slate-900 to-slate-700'
            }`}>
              IIUC Smart Library
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <div className="flex gap-6">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  to={link.path} 
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                    location.pathname === link.path 
                      ? 'text-emerald-500' 
                      : isDarkHeader
                        ? 'text-slate-200 hover:text-emerald-400'
                        : 'text-slate-600 hover:text-emerald-600'
                  }`}
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}
            </div>
            
            <div className={`w-px h-6 ${isDarkHeader ? 'bg-white/20' : 'bg-slate-200'}`}></div>

            <div className="flex gap-3 items-center">
              {isAuthenticated ? (
                <Link
                  to={`/${user?.role?.toLowerCase() || 'student'}/dashboard`}
                  className="flex items-center justify-center w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full font-bold shadow-sm hover:bg-emerald-200 transition-colors"
                  title="Go to Dashboard"
                >
                  <User className="w-5 h-5" />
                </Link>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                      isDarkHeader 
                        ? 'text-slate-200 hover:text-emerald-400' 
                        : 'text-slate-700 hover:text-emerald-600'
                    }`}
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/register" 
                    className="text-sm font-medium bg-slate-900 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/25 active:scale-95"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className={`md:hidden p-2 transition-colors ${isDarkHeader ? 'text-white' : 'text-slate-600'}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>
      )}

      {/* Mobile Nav Dropdown */}
      {!shouldHide && (
        <div 
          className={`fixed inset-0 z-40 bg-white transform transition-transform duration-300 pt-24 ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          } md:hidden`}
        >
        <div className="flex flex-col px-6 gap-4">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.path} 
              className={`flex items-center gap-3 p-4 rounded-xl text-lg font-medium ${
                location.pathname === link.path 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {link.icon}
              {link.name}
            </Link>
          ))}
          <div className="h-px bg-slate-100 my-4"></div>
          {isAuthenticated ? (
            <Link 
              to={`/${user?.role?.toLowerCase() || 'student'}/dashboard`}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-lg font-medium text-white bg-emerald-600"
            >
              <User className="w-5 h-5" /> Go to Dashboard
            </Link>
          ) : (
            <>
              <Link 
                to="/login" 
                className="w-full text-center py-4 rounded-xl text-lg font-medium text-slate-700 bg-slate-100"
              >
                Sign In
              </Link>
              <Link 
                to="/register" 
                className="w-full text-center py-4 rounded-xl text-lg font-medium text-white bg-emerald-600"
              >
                Create an Account
              </Link>
            </>
          )}
        </div>
      </div>
      )}

      {/* Main Content Area */}
      <main className="flex-grow pt-0 relative z-10 w-full overflow-hidden">
        <Outlet />
      </main>

      {/* Footer */}
      {!shouldHide && (
        <footer className="bg-slate-900 border-t border-slate-800 text-slate-300 py-12 lg:py-16 mt-auto">
          <div className="container mx-auto px-4 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">
              <div className="col-span-1 md:col-span-2">
                <Link to="/" className="flex items-center gap-2 mb-4">
                  <BookOpen className="text-emerald-500 w-6 h-6" />
                  <span className="text-xl font-bold text-white tracking-tight">
                    IIUC Smart Library
                  </span>
                </Link>
                <p className="text-sm leading-relaxed max-w-sm text-slate-400">
                  A state-of-the-art digital library experience for the International Islamic University Chittagong. Search, borrow, and manage resources intuitively.
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">Quick Links</h3>
                <ul className="space-y-3 text-sm">
                  <li><Link to="/catalog" className="hover:text-emerald-400 transition-colors">Book Catalog</Link></li>
                  <li><Link to="/departments" className="hover:text-emerald-400 transition-colors">Departments</Link></li>
                  <li><Link to="/about" className="hover:text-emerald-400 transition-colors">About Library</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">Support</h3>
                <ul className="space-y-3 text-sm">
                  <li><Link to="/contact" className="hover:text-emerald-400 transition-colors">Contact Us</Link></li>
                  <li><a href="#" className="hover:text-emerald-400 transition-colors">FAQ</a></li>
                  <li><Link to="/login" className="hover:text-emerald-400 transition-colors">Student Portal</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
              <p>© 2026 IIUC. All rights reserved.</p>
              <div className="flex gap-4 mt-4 md:mt-0">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default PublicLayout;
