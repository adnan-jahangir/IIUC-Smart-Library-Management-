import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Mail, Lock, ArrowRight, GraduationCap, UserRoundCheck, Briefcase, User, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const selectRole = (selectedRole) => {
    setRole(selectedRole);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      const domain = role === 'student' ? '@ugrad.iiuc.ac.bd' : '@iiuc.ac.bd';
      const fullEmail = email.includes('@') ? email : `${email.toLowerCase()}${domain}`;

      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fullEmail, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Real API data: data.role will be 'Student', 'Teacher', or 'Librarian'
        const normalizedRole = data.role.toLowerCase();
        
        const realUser = {
          role: normalizedRole,
          email: data.email,
          name: data.name,
          id: data._id,
          customId: data.customId,
          token: data.token
        };
        
        login(realUser);
        navigate(`/${normalizedRole}/dashboard`);
      } else {
        setErrorMsg(data.message || 'Login failed. Invalid credentials.');
      }
    } catch (err) {
      setErrorMsg('Network error. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Visual backgrounds */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
         <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-3xl"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-[1000px] bg-white rounded-3xl shadow-xl flex flex-col md:flex-row overflow-hidden border border-slate-100 my-4 sm:my-8">
        
        {/* Left Side Graphic */}
        <div className="hidden md:flex md:w-1/2 bg-slate-900 flex-col justify-between p-8 sm:p-12 relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-slate-900 z-0"></div>
           <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=3000&auto=format&fit=crop')] opacity-20 bg-cover bg-center mix-blend-overlay"></div>
           
           <div className="relative z-10 mb-12">
             <Link to="/" className="inline-flex items-center gap-3 text-white">
               <div className="bg-emerald-500 p-2 rounded-xl"><BookOpen className="w-6 h-6" /></div>
               <span className="text-2xl font-bold tracking-tight">IIUC Library</span>
             </Link>
           </div>
           
           <div className="relative z-10">
             <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Welcome back to your academic hub.</h2>
             <p className="text-slate-300 text-lg mb-8">Role-based Digital Library Portal for Students, Teachers, and Librarians.</p>
             
             {/* Quick role cards */}
             <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => selectRole('student')}
                    className={`group p-4 rounded-2xl text-left text-white transition-all duration-300 border ${role === 'student' ? 'bg-white/20 border-white/45 shadow-lg shadow-black/20' : 'bg-white/5 border-white/15 hover:bg-white/10 hover:border-white/30'} `}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-300/30">
                        <GraduationCap className="w-5 h-5 text-emerald-200" />
                      </span>
                      {role === 'student' && <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />}
                    </div>
                    <div className="text-sm font-bold text-white">Student</div>
                    <div className="text-xs text-slate-300 mt-1">Quick sign-in</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => selectRole('teacher')}
                    className={`group p-4 rounded-2xl text-left text-white transition-all duration-300 border ${role === 'teacher' ? 'bg-white/20 border-white/45 shadow-lg shadow-black/20' : 'bg-white/5 border-white/15 hover:bg-white/10 hover:border-white/30'} `}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-300/30">
                        <UserRoundCheck className="w-5 h-5 text-indigo-200" />
                      </span>
                      {role === 'teacher' && <span className="w-2.5 h-2.5 rounded-full bg-indigo-300" />}
                    </div>
                    <div className="text-sm font-bold text-white">Teacher</div>
                    <div className="text-xs text-slate-300 mt-1">Quick sign-in</div>
                  </button>
                </div>
             </div>
           </div>
        </div>

        {/* Right Side Form */}
        <div className="w-full md:w-1/2 p-5 sm:p-8 md:p-12 overflow-y-auto">
            <div className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] sm:text-sm font-medium text-slate-500">
              <Link to="/" className="hover:text-emerald-600 transition-colors">Home</Link>
              <Link to="/catalog" className="hover:text-emerald-600 transition-colors">Catalog</Link>
              <Link to="/departments" className="hover:text-emerald-600 transition-colors">Departments</Link>
              <Link to="/about" className="hover:text-emerald-600 transition-colors">About</Link>
              <Link to="/register" className="hover:text-emerald-600 transition-colors">Register</Link>
            </div>

           <div className="mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Sign In</h2>
              <p className="text-sm sm:text-base text-slate-500">Enter your university email account and password to access the portal.</p>
              {errorMsg && <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm font-semibold">{errorMsg}</div>}
           </div>

           <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-3">
                 <label className="text-xs sm:text-sm font-semibold text-slate-700">Select Login Role</label>
                 <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-2 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('student')}
                        className={`rounded-xl px-3 py-3 text-left transition-all border ${role === 'student' ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/40'}`}
                      >
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4" />
                          <span className="text-xs sm:text-sm font-semibold">Student</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRole('teacher')}
                        className={`rounded-xl px-3 py-3 text-left transition-all border ${role === 'teacher' ? 'bg-indigo-50 border-indigo-300 text-indigo-800 shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/40'}`}
                      >
                        <div className="flex items-center gap-2">
                          <UserRoundCheck className="w-4 h-4" />
                          <span className="text-xs sm:text-sm font-semibold">Teacher</span>
                        </div>
                      </button>
                    </div>
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-sm font-semibold text-slate-700">
                    {role === 'student' ? 'University ID / Email' : 'Email Prefix / Full Email'}
                 </label>
                 <div className="relative flex">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                       {role === 'student' ? <User className="w-5 h-5 text-slate-400" /> : <Mail className="w-5 h-5 text-slate-400" />}
                    </div>
                    <input 
                      required 
                      type="text" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder={role === 'student' ? 'C233114' : 'sabbir@iiuc.ac.bd'} 
                      className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm sm:text-base text-slate-800 font-medium ${
                        email.includes('@') ? 'rounded-xl border-r' : 'rounded-l-xl border-r-0'
                      } ${role === 'student' && !email.includes('@') ? 'uppercase' : ''}`} 
                    />
                    {!email.includes('@') && (
                      <div className="px-3 sm:px-4 py-3.5 bg-slate-100 border border-slate-200 rounded-r-xl text-slate-500 font-medium text-xs sm:text-sm flex items-center shrink-0">
                        {role === 'student' ? '@ugrad.iiuc.ac.bd' : '@iiuc.ac.bd'}
                      </div>
                    )}
                 </div>
              </div>

              <div className="space-y-2">
                 <div className="flex justify-between items-center">
                   <label className="text-xs sm:text-sm font-semibold text-slate-700">Password</label>
                   <button type="button" onClick={() => alert('Please contact library support to reset your password.')} className="text-xs sm:text-sm font-semibold text-emerald-600 hover:text-emerald-700">Forgot password?</button>
                 </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       <Lock className="w-5 h-5 text-slate-400" />
                    </div>
                    <input 
                      required 
                      type={showPassword ? 'text' : 'password'} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="Enter your account password" 
                      className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm sm:text-base text-slate-800 font-medium" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-emerald-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                 </div>
              </div>

              <div className="flex items-center gap-2">
                 <input type="checkbox" id="remember" className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" />
                 <label htmlFor="remember" className="text-xs sm:text-sm text-slate-600 font-medium">Remember my credentials</label>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-sm sm:text-base text-white hover:bg-emerald-600 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-500/30 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing In...' : 'Sign In'} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <Link to="/" className="w-full flex items-center justify-center gap-2 bg-slate-100 text-sm sm:text-base text-slate-700 hover:bg-slate-200 py-3 rounded-xl font-bold transition-colors">
                Continue as Guest
              </Link>
           </form>

            <div className="mt-8 text-center text-xs sm:text-sm font-medium text-slate-500">
              Don't have an account? <Link to="/register" className="text-emerald-600 hover:underline">Request access</Link>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
