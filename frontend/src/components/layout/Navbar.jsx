import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Menu, X, User } from 'lucide-react';
import Button from '../common/Button';

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 sm:top-8 z-50 w-full flex justify-center pointer-events-none">
      <div className="w-full max-w-6xl px-4 sm:px-6 lg:px-8 pointer-events-auto">
        <div className="bg-white/20 bg-gradient-to-r from-white/30 via-white/10 to-emerald-50/10 backdrop-blur-xl border border-white/20 shadow-xl rounded-3xl overflow-hidden">
          <div className="relative flex items-center h-16 sm:h-20 px-4">

            {/* Logo (left) */}
            <Link to="/" className="flex items-center gap-3">
              <div className="bg-primary-600/95 p-3 rounded-full text-white shadow-md ring-1 ring-white/10">
                <BookOpen size={20} />
              </div>
              <div className="hidden sm:block">
                <span className="font-extrabold text-sm text-dark-900 tracking-tight block">IIUC Smart Library</span>
              </div>
            </Link>

            {/* Centered Nav links (desktop) */}
            <div className="hidden lg:flex absolute left-1/2 transform -translate-x-1/2 items-center space-x-6">
              <Link to="/" className="text-slate-600 hover:text-primary-600 font-medium transition-colors flex items-center gap-2">
                <BookOpen size={14} className="text-primary-600" /> Home
              </Link>
              <Link to="/catalog" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">Catalog</Link>
              <Link to="/departments" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">Departments</Link>
              <Link to="/about" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">About</Link>
            </div>

            {/* Right actions */}
            <div className="hidden md:flex items-center space-x-4 ml-auto">
              <a className="text-slate-600 hover:text-slate-800 font-medium">Sign In</a>
              <Button className="rounded-full bg-slate-900 hover:bg-slate-800 shadow-lg" variant="primary" size="sm">Register</Button>
              <button className="flex items-center gap-2 bg-slate-50 p-2 rounded-full">
                <User size={18} className="text-slate-600" />
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center ml-auto">
              <button
                onClick={() => setOpen(!open)}
                aria-label="Toggle menu"
                className="p-2 rounded-md bg-slate-50"
              >
                {open ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>

          </div>

          {/* Mobile menu panel */}
          {open && (
            <div className="md:hidden mt-3 pb-4 px-4">
              <div className="flex flex-col gap-3">
                <input
                  placeholder="Search books, authors..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm shadow-sm focus:outline-none"
                />
                <Link to="/" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md text-slate-700 hover:bg-slate-100">Home</Link>
                <Link to="/catalog" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md text-slate-700 hover:bg-slate-100">Catalog</Link>
                <Link to="/departments" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md text-slate-700 hover:bg-slate-100">Departments</Link>
                <Link to="/about" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md text-slate-700 hover:bg-slate-100">About</Link>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">Sign In</Button>
                  <Button variant="primary" size="sm">Register</Button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </nav>
  );
}

export default Navbar;
