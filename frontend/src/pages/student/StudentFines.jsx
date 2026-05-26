import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Calendar, AlertTriangle, CheckCircle, Bell } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';

const StudentFines = () => {
  const { user } = useAuthStore();
  const [fines, setFines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [calcDays, setCalcDays] = useState(10);
  const [bookType, setBookType] = useState(5);

  useEffect(() => {
    const fetchFines = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/fines/my-fines', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setFines(res.data || []);
      } catch (err) {
        console.error('Failed to load fines', err);
        toast.error('Failed to load fines');
      } finally {
        setIsLoading(false);
      }
    };
    if (user?.token) fetchFines();
  }, [user]);

  const handlePayFine = async (fine) => {
    if (!confirm(`Pay fine of ৳${fine.amount}?`)) return;
    try {
      await axios.put(`http://localhost:5000/api/fines/${fine._id}/pay`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success('Fine marked as paid');
      setFines(prev => prev.map(f => f._id === fine._id ? { ...f, status: 'Paid', paidAt: new Date().toISOString() } : f));
    } catch (err) {
      console.error('Pay fine error', err);
      toast.error('Failed to pay fine');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Fines & Ledger Overview</h2>
        <p className="text-slate-500 mt-1">Review accumulated fines, calculate projected fees, and pay online.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 border-l-4 border-l-rose-500 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium">Unpaid Fines</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">৳{fines.filter(f => f.status !== 'Paid').reduce((acc, curr) => acc + (curr.amount || 0), 0)}</h3>
          </div>
          <AlertTriangle className="w-8 h-8 text-rose-500" />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 border-l-4 border-l-emerald-500 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium">Settled Fines</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">৳{fines.filter(f => f.status === 'Paid').reduce((acc, curr) => acc + (curr.amount || 0), 0)}</h3>
          </div>
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 border-l-4 border-l-slate-500 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium">Fine Rate Rule</p>
            <h3 className="text-sm font-bold text-slate-700 mt-1">৳৫/day (General Books)<br />৳১০/day (Ref Books)</h3>
          </div>
          <Calendar className="w-8 h-8 text-slate-400" />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 overflow-hidden">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Fine Transaction History</h3>

        {isLoading ? (
          <div className="py-12 text-center text-slate-500">Loading fines...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="py-3 px-4 rounded-tl-lg">Book Title</th>
                  <th className="py-3 px-4">Incurred</th>
                  <th className="py-3 px-4 text-center">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 rounded-tr-lg text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 font-medium">
                {fines.map((fine) => (
                  <tr key={fine._id} className="hover:bg-slate-50">
                    <td className="py-4 px-4 font-bold text-slate-800">{fine.book?.title || 'Unknown'}</td>
                    <td className="py-4 px-4 text-xs text-slate-500">{new Date(fine.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 px-4 text-center font-extrabold text-slate-900">৳{fine.amount}</td>
                    <td className="py-4 px-4">
                      {fine.status === 'Paid' ? (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-black uppercase">Cleared</span>
                      ) : (
                        <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded text-xs font-black uppercase">Unpaid</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {fine.status !== 'Paid' ? (
                        <button onClick={() => handlePayFine(fine)} className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-extrabold transition-all text-xs shadow-md shadow-rose-500/10">Pay Online</button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
           <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
             <DollarSign className="w-5 h-5 text-emerald-600" /> Projected Penalty Calculator
           </h3>
           <p className="text-slate-500 text-xs">Estimate fine values dynamically for future return schedules.</p>
           <div className="space-y-4 text-xs font-semibold text-slate-700">
             <div className="space-y-1.5">
               <label>Expected Days Overdue</label>
               <input type="number" value={calcDays} onChange={(e) => setCalcDays(Math.max(0, parseInt(e.target.value) || 0))} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm font-bold" />
             </div>
             <div className="space-y-1.5">
               <label>Book Category Type</label>
               <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-bold"><input type="radio" name="calcType" checked={bookType === 5} onChange={() => setBookType(5)} className="text-emerald-600 focus:ring-emerald-500 mt-1" /> General (৳5/day)</label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold"><input type="radio" name="calcType" checked={bookType === 10} onChange={() => setBookType(10)} className="text-emerald-600 focus:ring-emerald-500 mt-1" /> Reference (৳10/day)</label>
               </div>
             </div>

             <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex justify-between items-center text-emerald-950 font-bold">
               <span>Total Estimated Penalty:</span>
               <span className="text-lg font-black text-emerald-700">৳{calcDays * bookType}</span>
             </div>
           </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
           <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Bell className="w-5 h-5 text-emerald-600" /> Automated Alert Preferences</h3>
           <p className="text-slate-500 text-xs">Configure notifications to ensure books are returned on time.</p>
           <div className="space-y-4">
             <p className="text-sm text-slate-600">Notification preferences are stored in your profile (coming soon).</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default StudentFines;
