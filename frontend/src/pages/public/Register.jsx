import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Mail, Lock, User, ArrowRight, GraduationCap, UserRoundCheck, Hash, Phone, Briefcase, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const Register = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    universityId: '',
    role: 'Student',
    designation: 'Lecturer',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const requiresDepartmentPrefix = formData.role === 'Student';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const selectRole = (selectedRole) => {
    setFormData((prev) => ({ ...prev, role: selectedRole }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const domain = formData.role === 'Student' ? '@ugrad.iiuc.ac.bd' : '@iiuc.ac.bd';
      const constructedEmail = `${formData.universityId.toLowerCase()}${domain}`;
      const payload = { ...formData, email: constructedEmail };

      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Automatically log them in after registration
        const normalizedRole = data.role.toLowerCase();
        login({
          role: normalizedRole,
          email: data.email,
          name: data.name,
          id: data._id,
          customId: String(data.customId || '').toUpperCase(),
          token: data.token
        });
        navigate(`/${normalizedRole}/dashboard`);
      } else {
        setErrorMsg(data.message || 'Registration failed.');
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

      <div className="w-full max-w-[1000px] bg-white rounded-3xl shadow-xl flex flex-col md:flex-row overflow-hidden border border-slate-100 mt-8 sm:mt-20 mb-8 sm:mb-10 md:my-0">
        
        {/* Left Side Graphic */}
        <div className="hidden md:flex md:w-1/2 bg-slate-900 flex-col justify-between p-12 relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-slate-900 z-0"></div>
           <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=3000&auto=format&fit=crop')] opacity-20 bg-cover bg-center mix-blend-overlay"></div>
           
           <div className="relative z-10">
             <Link to="/" className="inline-flex items-center gap-3 text-white">
               <div className="bg-emerald-500 p-2 rounded-xl"><BookOpen className="w-6 h-6" /></div>
               <span className="text-2xl font-bold tracking-tight">IIUC Library</span>
             </Link>
           </div>
           
           <div className="relative z-10 max-w-sm">
             <h2 className="text-3xl font-bold text-white mb-4">Join the digital academic network.</h2>
             <p className="text-slate-300 text-lg">Create your student or teacher account to unlock full access to the intelligent catalog.</p>
           </div>
        </div>

        {/* Right Side Form */}
          <div className="w-full md:w-1/2 p-5 sm:p-8 md:p-12 overflow-y-auto max-h-screen md:max-h-none">
            <div className="mb-8 sm:mb-10 text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">Create Account</h2>
              <p className="text-sm sm:text-base text-slate-500">Fill in your IIUC details to register.</p>
              {errorMsg && <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm font-semibold">{errorMsg}</div>}
           </div>

           <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-semibold text-slate-700">Full Name</label>
                    <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User className="w-5 h-5 text-slate-400" />
                       </div>
                       <input name="name" value={formData.name} onChange={handleChange} required type="text" placeholder="Abu Reza Nadvi" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm sm:text-base text-slate-800 font-medium" />
                    </div>
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-semibold text-slate-700">Phone (Optional)</label>
                    <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Phone className="w-5 h-5 text-slate-400" />
                       </div>
                       <input name="phone" value={formData.phone} onChange={handleChange} type="tel" placeholder="01712345678" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm sm:text-base text-slate-800 font-medium" />
                    </div>
                 </div>
              </div>



                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-semibold text-slate-700">
                      {formData.role === 'Student' ? 'University ID' : 'Email Prefix'}
                    </label>
                    <div className="relative flex">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                        {formData.role === 'Student' ? <Hash className="w-5 h-5 text-slate-400" /> : <Mail className="w-5 h-5 text-slate-400" />}
                      </div>
                      <input 
                         name="universityId" 
                         value={formData.universityId} 
                         onChange={handleChange} 
                         required 
                         type="text"
                         placeholder={formData.role === 'Student' ? (requiresDepartmentPrefix ? 'e.g. C230123' : '260123') : 'sabbir'} 
                         className={`w-full pl-11 pr-2 py-3 bg-slate-50 border border-slate-200 border-r-0 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm sm:text-base text-slate-800 font-medium ${formData.role === 'Student' ? 'uppercase' : ''}`} 
                      />
                      <div className="px-3 sm:px-4 py-3 bg-slate-100 border border-slate-200 rounded-r-xl text-slate-500 font-medium text-xs sm:text-sm flex items-center shrink-0">
                        {formData.role === 'Student' ? '@ugrad.iiuc.ac.bd' : '@iiuc.ac.bd'}
                      </div>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-500">
                      {formData.role === 'Student'
                        ? (requiresDepartmentPrefix ? 'Students should include the department code prefix.' : 'Teachers and librarians can enter the ID without a prefix.')
                        : 'Enter your email prefix (e.g., sabbir for sabbir@iiuc.ac.bd).'}
                    </p>
                  </div>
              
              <div className="space-y-3">
                 <label className="text-xs sm:text-sm font-semibold text-slate-700">Role</label>
                 <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-2 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => selectRole('Student')}
                        className={`rounded-xl px-3 py-3 text-left transition-all border ${formData.role === 'Student' ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/40'}`}
                      >
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4" />
                          <span className="text-xs sm:text-sm font-semibold">Student</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => selectRole('Teacher')}
                        className={`rounded-xl px-3 py-3 text-left transition-all border ${formData.role === 'Teacher' ? 'bg-indigo-50 border-indigo-300 text-indigo-800 shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/40'}`}
                      >
                        <div className="flex items-center gap-2">
                          <UserRoundCheck className="w-4 h-4" />
                          <span className="text-xs sm:text-sm font-semibold">Teacher</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => selectRole('Librarian')}
                        className={`rounded-xl px-3 py-3 text-left transition-all border ${formData.role === 'Librarian' ? 'bg-purple-50 border-purple-300 text-purple-800 shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:border-purple-200 hover:bg-purple-50/40'}`}
                      >
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span className="text-xs sm:text-sm font-semibold">Librarian</span>
                        </div>
                      </button>
                    </div>
                 </div>
              </div>

               {formData.role === 'Teacher' && (
                 <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-xs sm:text-sm font-semibold text-slate-700">Designation (Priority)</label>
                    <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Briefcase className="w-5 h-5 text-slate-400" />
                       </div>
                       <select name="designation" value={formData.designation} onChange={handleChange} className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm sm:text-base text-slate-800 font-medium appearance-none">
                         <option value="Adjunct Lecturer">Adjunct Lecturer</option>
                         <option value="Lecturer">Lecturer</option>
                         <option value="Assistant Professor">Assistant Professor</option>
                         <option value="Associate Professor">Associate Professor</option>
                         <option value="Professor">Professor</option>
                       </select>
                       <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                         <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                       </div>
                    </div>
                 </div>
               )}

              <div className="space-y-2">
                 <label className="text-xs sm:text-sm font-semibold text-slate-700">Create Password</label>
                 <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       <Lock className="w-5 h-5 text-slate-400" />
                    </div>
                    <input 
                      name="password" 
                      value={formData.password} 
                      onChange={handleChange} 
                      required 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="••••••••" 
                      className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm sm:text-base text-slate-800 font-medium" 
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

                <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 bg-slate-900 text-sm sm:text-base text-white hover:bg-emerald-600 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-500/30 group mt-2 disabled:opacity-70 disabled:cursor-not-allowed">
                {isLoading ? 'Registering...' : 'Register Account'} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
           </form>

              <div className="mt-8 text-center text-xs sm:text-sm font-medium text-slate-500">
              Already have an account? <Link to="/login" className="text-emerald-600 hover:underline">Sign In here</Link>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Register;
