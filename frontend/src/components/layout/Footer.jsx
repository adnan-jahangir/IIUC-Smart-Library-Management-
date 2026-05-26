import { BookOpen } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-dark-900 text-white py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 flex-col md:grid-cols-4 gap-8">
          
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="text-primary-500" size={24} />
              <span className="font-bold text-xl tracking-tight">IIUC Library</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              A modern, intelligent, and real-time library platform built for the International Islamic University Chittagong.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-white">Quick Links</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-primary-400 transition-colors">Browse Catalog</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">AI Assistant</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">Departments</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">Featured Books</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-white">Support</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-primary-400 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">Borrowing Policy</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">Contact Librarian</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-white">Contact</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Kumira, Chittagong, Bangladesh</li>
              <li>support@library.iiuc.ac.bd</li>
              <li>+880 1234 567890</li>
            </ul>
          </div>

        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-800 text-sm text-slate-500 text-center flex justify-between items-center">
          <p>&copy; {new Date().getFullYear()} IIUC Smart Library. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
