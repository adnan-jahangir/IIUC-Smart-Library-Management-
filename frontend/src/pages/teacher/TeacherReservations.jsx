import React, { useState, useEffect } from 'react';
import { Bookmark, Clock, UserCheck, AlertTriangle, Bell, Trash2, ArrowRight, MessageSquare, ShieldCheck, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';

const TeacherReservations = () => {
  const { user } = useAuthStore();
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/reservations/my-reservations', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setReservations(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load reservations');
      setIsLoading(false);
    }
  };

  const handleCancelReservation = async (id) => {
    if (confirm("Are you sure you want to cancel this reservation?")) {
      try {
        await axios.put(
          `http://localhost:5000/api/reservations/my-reservations/${id}/cancel`,
          {},
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        toast.success("Reservation canceled");
        setReservations(prev => prev.filter(res => res._id !== id));
      } catch (error) {
        toast.error("Failed to cancel reservation");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Reserved Books</h2>
          <p className="text-slate-500 mt-1">Track your waiting list progress and collection schedules.</p>
        </div>
        
        {/* Real-time SMS toggle */}
        <button
          onClick={() => setSmsNotifications(!smsNotifications)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
            smsNotifications
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
              : 'bg-white text-slate-500 border-slate-200'
          }`}
        >
          <Bell className={`w-4 h-4 ${smsNotifications ? 'animate-swing' : ''}`} />
          {smsNotifications ? 'Real-time Alerts: ON' : 'Real-time Alerts: OFF'}
        </button>
      </div>

      {reservations.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto">
          <Bookmark className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">No Active Reservations</h3>
          <p className="text-slate-500 text-sm mb-6">You have not queued for any out-of-stock books yet.</p>
          <a href="/catalog" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
            Browse Book Catalog <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {reservations.map((res) => {
            // Determine progress bar width and color
            const isReady = res.status === 'Notified' || res.status === 'Fulfilled';
            const stepNum = isReady ? 3 : 2;
            const pickupCode = res._id ? `PICKUP-${res._id.slice(-6).toUpperCase()}` : 'PICKUP-XXXXXX';
            const progressPercent = stepNum === 3 ? 100 : 50;

            return (
              <div key={res._id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                
                {/* Book Metadata header */}
                <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="flex gap-4 items-start">
                    <div className="w-12 h-16 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0 border border-slate-100">
                      <div className="w-full h-full bg-emerald-600/10 flex items-center justify-center text-emerald-700 font-extrabold text-xs">
                        Book
                      </div>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-base">{res.book?.title}</h3>
                      <p className="text-slate-500 text-xs font-semibold">by {res.book?.author} • ISBN: {res.book?.isbn}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase ${
                      isReady 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isReady ? 'Ready for Pickup' : `Queue Position #${res.queuePosition}`}
                    </span>
                    <button
                      onClick={() => handleCancelReservation(res._id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="Cancel Reservation"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* VISUAL QUEUE PROGRESS TRACKER */}
                <div className="p-6 md:p-8 space-y-8">
                  {/* Milestones circles layout */}
                  <div className="relative">
                    {/* Background Progress Line */}
                    <div className="absolute top-4 left-0 right-0 h-1.5 bg-slate-100 rounded-full z-0"></div>
                    <div 
                      className="absolute top-4 left-0 h-1.5 bg-emerald-500 rounded-full transition-all duration-500 z-0"
                      style={{ width: `${progressPercent}%` }}
                    ></div>

                    <div className="relative grid grid-cols-3 z-10 text-center">
                      
                      {/* Step 1: Requested */}
                      <div className="flex flex-col items-center">
                        <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md font-bold text-sm">
                          1
                        </div>
                        <span className="text-xs font-extrabold text-slate-800 mt-2">Request Filed</span>
                        <span className="text-[10px] text-slate-400 font-medium">Logged: {(new Date(res.requestDate).toLocaleDateString())}</span>
                      </div>

                      {/* Step 2: Queueing */}
                      <div className="flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                          stepNum >= 2 
                            ? 'bg-emerald-500 text-white shadow-md' 
                            : 'bg-white border-2 border-slate-200 text-slate-400'
                        }`}>
                          2
                        </div>
                        <span className={`text-xs font-extrabold mt-2 ${stepNum >= 2 ? 'text-slate-800' : 'text-slate-400'}`}>
                          Queue Waiting
                        </span>
                        <span className="text-[10px] text-amber-600 font-bold">
                          {isReady ? 'Completed' : `Pos #${res.queuePosition}`}
                        </span>
                      </div>

                      {/* Step 3: Procured */}
                      <div className="flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                          stepNum >= 3 
                            ? 'bg-emerald-500 text-white shadow-md' 
                            : 'bg-white border-2 border-slate-200 text-slate-400'
                        }`}>
                          3
                        </div>
                        <span className={`text-xs font-extrabold mt-2 ${stepNum >= 3 ? 'text-slate-800' : 'text-slate-400'}`}>
                          Ready at Counter
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">Shelf: {"Library Front Desk"}</span>
                      </div>

                    </div>
                  </div>

                  {/* Estimation / Direction Info Card */}
                  <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm font-medium">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-5 h-5 text-slate-400" />
                      {isReady ? (
                        <span>Please collect the book from the front desk before <strong className="text-rose-600">48 hours</strong> or it goes to next in line.</span>
                      ) : (
                        <span>Expected dispatch to library desk in: <strong className="text-slate-800">{3} days</strong>.</span>
                      )}
                    </div>
                    {isReady && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg text-xs font-bold">
                         <ShieldCheck className="w-4 h-4" /> Code: {pickupCode}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeacherReservations;
