import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, BookOpen, GraduationCap, Library, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

const DEPARTMENTS = ['CSE', 'EEE', 'ETE', 'CCE', 'CIVIL', 'Pharmacy', 'BBA', 'ELL', 'Law'];

const FeatureCard = ({ icon, title, description, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
  >
    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{description}</p>
  </motion.div>
);

const Home = () => {
  const [bookOfTheWeek, setBookOfTheWeek] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/books')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          // You could pick a random book or the first one. Let's pick the first one for now.
          setBookOfTheWeek(data[0]);
        }
      })
      .catch(err => console.error('Failed to fetch book of the week:', err));
  }, []);

  return (
    <div className="w-full flex-col flex overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative px-6 py-20 lg:py-32 xl:min-h-[90vh] flex items-center justify-center overflow-hidden w-full">
        {/* Background Image and Overlay */}
        <div className="absolute inset-0 w-full h-full -z-20 overflow-hidden">
          <div 
            className="absolute inset-0 w-full h-full scale-105"
            style={{ 
              backgroundImage: "url('/campus-bg.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(2px)'
            }}
          ></div>
          {/* Overlay for text readability */}
          <div className="absolute inset-0 bg-slate-50/40"></div>
        </div>
        
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 -z-10"></div>
        
        <div className="container mx-auto max-w-7xl relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center h-full">
            
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-600 mb-6 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Welcome to the digital era of IIUC
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-6 tracking-tight">
                Your Gateway to <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                  Infinite Knowledge
                </span>
              </h1>
              <p className="text-lg lg:text-xl text-slate-600 mb-8 leading-relaxed max-w-lg">
                Access thousands of books, journals, and academic resources instantly. A smart, intuitive platform tailored for students and faculty.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/catalog" className="flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:translate-y-0">
                  <Search className="w-5 h-5" />
                  Explore Catalog
                </Link>
                <Link text="Learn More" to="/about" className="flex justify-center items-center px-8 py-4 rounded-xl font-semibold bg-white border-2 border-slate-200 text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 transition-colors">
                  Learn More
                </Link>
              </div>

              {/* Quick specific stats */}
              <div className="mt-12 flex items-center gap-8 border-t border-slate-200/60 pt-8">
                <div>
                  <div className="text-3xl font-black text-slate-800">25k+</div>
                  <div className="text-sm font-medium text-slate-500">Total Resources</div>
                </div>
                <div className="w-px h-8 bg-slate-200"></div>
                <div>
                  <div className="text-3xl font-black text-slate-800">12k+</div>
                  <div className="text-sm font-medium text-slate-500">Active Students</div>
                </div>
                <div className="w-px h-8 bg-slate-200"></div>
                <div>
                  <div className="text-3xl font-black text-slate-800">4</div>
                  <div className="text-sm font-medium text-slate-500">Librarians Ready</div>
                </div>
              </div>
            </motion.div>

            {/* Right Side Visual */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="relative hidden lg:block"
            >
              {/* Main App Mockup Card */}
              <div className="relative bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 z-20 overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                    <BookOpen className="text-emerald-600 w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">Book of the Week</div>
                    <div className="text-sm text-slate-500">Highly recommended</div>
                  </div>
                </div>
                
                {bookOfTheWeek ? (
                  <Link to={`/catalog/book/${bookOfTheWeek.customId}`} className="flex gap-6 group">
                    <div className="w-32 h-44 bg-slate-200 rounded-xl overflow-hidden shadow-inner flex-shrink-0 relative">
                      <img src={bookOfTheWeek.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={bookOfTheWeek.title} />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                    </div>
                    <div className="flex flex-col justify-center space-y-2 flex-1 py-2">
                      <h4 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-emerald-600 transition-colors line-clamp-2">{bookOfTheWeek.title}</h4>
                      <p className="text-sm font-medium text-slate-500 line-clamp-1">{bookOfTheWeek.author}</p>
                      <p className="text-xs text-slate-400 mt-1">{bookOfTheWeek.department} Department</p>
                      <div className="mt-4 inline-flex px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg w-fit transition-colors group-hover:bg-emerald-100">
                        {bookOfTheWeek.availableCopies > 0 ? 'Available Now' : 'Currently Issued'}
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="flex gap-6 animate-pulse">
                    <div className="w-32 h-44 bg-slate-200 rounded-xl overflow-hidden shadow-inner flex-shrink-0"></div>
                    <div className="flex flex-col justify-center space-y-3 flex-1">
                      <div className="h-5 bg-slate-200 rounded w-full"></div>
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                      <div className="mt-4 h-6 bg-slate-100 rounded-lg w-24"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Floating Element 1 */}
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-10 -right-10 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 z-30 flex items-center gap-3 backdrop-blur-md bg-white/90"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">Student Portal</div>
                  <div className="text-xs text-slate-500">Manage reservations</div>
                </div>
              </motion.div>

              {/* Floating Element 2 */}
              <motion.div 
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-8 -left-12 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 z-30 flex items-center gap-3 backdrop-blur-md bg-slate-900"
              >
                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Smart Fines</div>
                  <div className="text-xs text-slate-400">Automated tracking</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white relative">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Empowering your academic journey</h2>
            <p className="text-slate-600 text-lg">Our smart library management system is built with modern features to make borrowing and tracking seamless.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Search />}
              title="Smart Search & Filtering"
              description="Quickly find resources across departments. Search by title, author, ISBN, or subject with instantaneous results."
              delay={0.1}
            />
            <FeatureCard 
              icon={<Zap />}
              title="Real-Time Availability"
              description="No more guessing. See exactly how many copies are available in the library right now before you make the trip."
              delay={0.2}
            />
            <FeatureCard 
              icon={<Library />}
              title="Role-Based Dashboards"
              description="Students, teachers, and librarians get custom interfaces tailored perfectly to their specific needs and tasks."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Departments Section */}
      <section className="py-24 bg-slate-50 border-y border-slate-200/60">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Browse by Department</h2>
              <p className="text-slate-600">Explore resources categorized by IIUC faculties.</p>
            </div>
            <Link to="/departments" className="hidden sm:flex items-center gap-2 text-emerald-600 font-medium hover:text-emerald-700">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {DEPARTMENTS.map((cat, idx) => (
              <Link 
                key={cat} 
                to={`/catalog?dept=${cat}`}
                className="bg-white hover:bg-emerald-600 hover:text-white group border border-slate-200 rounded-2xl p-6 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className="w-12 h-12 mx-auto bg-emerald-50 text-emerald-600 group-hover:bg-white/20 group-hover:text-white rounded-xl flex items-center justify-center mb-4 transition-colors">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-slate-800 group-hover:text-white transition-colors">{cat}</h3>
              </Link>
            ))}
          </div>
          <Link to="/departments" className="sm:hidden mt-8 flex items-center justify-center gap-2 text-emerald-600 font-medium w-full py-3 bg-emerald-50 rounded-xl">
              View All Departments <ArrowRight className="w-4 h-4" />
            </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative">
        <div className="container mx-auto max-w-5xl">
          <div className="bg-slate-900 rounded-3xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="relative z-10 px-8 py-16 md:p-20 text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to start exploring?</h2>
              <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto">
                Join the IIUC Smart Library platform today. Log in with your university credentials to request books, track fines, and use our AI assistant.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/login" className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-8 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-500/25">
                  Sign In to Portal
                </Link>
                <Link to="/register" className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-medium transition-colors border border-white/10 text-center">
                  Request Account Creation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
