import React from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from 'lucide-react';

const Contact = () => {
  return (
    <div className="bg-slate-50/50 min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-6 max-w-6xl">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Contact Us</h1>
          <p className="text-lg text-slate-600 leading-relaxed font-medium">
            Have questions about borrowing limits, fines, or new acquisitions? Our support team is here to help you navigate the library system.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Info Side */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <div className="space-y-8">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Campus Location</h3>
                            <p className="text-slate-500 mt-1">Kumira, Chittagong-4318, Bangladesh.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0">
                            <Mail className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Email Support</h3>
                            <p className="text-slate-500 mt-1">library.support@iiuc.ac.bd</p>
                            <p className="text-slate-500">info@iiuc.ac.bd</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
                            <Phone className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Phone Support</h3>
                            <p className="text-slate-500 mt-1">+880 31-2510222</p>
                            <p className="text-slate-500">Ext: 405 (Circulation)</p>
                        </div>
                    </div>
                    <div className="flex gap-4 pt-4 border-t border-slate-100">
                        <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Library Hours</h3>
                            <p className="text-slate-500 mt-1">Sat - Thu: 8:30 AM - 5:00 PM</p>
                            <p className="text-rose-500 text-xs font-bold">Closed on Fridays</p>
                        </div>
                    </div>
                </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="lg:col-span-2">
             <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
                
                <div className="flex items-center gap-3 mb-8">
                    <MessageSquare className="w-8 h-8 text-emerald-600" />
                    <h2 className="text-2xl font-bold text-slate-800">Send us a Message</h2>
                </div>

                <form className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Your Name</label>
                            <input type="text" placeholder="John Doe" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-800 font-medium" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">University ID/Email</label>
                            <input type="text" placeholder="C191000 or email@..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-800 font-medium" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Subject</label>
                        <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-800 font-medium">
                            <option>General Inquiry</option>
                            <option>Book Acquisition Request</option>
                            <option>Fine Conflict</option>
                            <option>Account Access Issue</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Message</label>
                        <textarea rows="5" placeholder="How can we help you?" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-800 font-medium resize-none"></textarea>
                    </div>
                    
                    <button type="button" onClick={() => alert('Demo Mode: Message recorded effectively.')} className="w-full py-4 bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 group">
                        Send Inqury <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </button>
                </form>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Contact;
