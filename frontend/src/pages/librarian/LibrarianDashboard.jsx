import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookCopy, AlertCircle, RefreshCcw, Download, CornerLeftUp, Camera, Check, ShieldAlert, Award, FileText } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const LibrarianDashboard = () => {
  const { user } = useAuthStore();
  const universityId = String(user?.customId || user?.email?.split('@')[0] || 'N/A').toUpperCase();
  // Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [scanType, setScanType] = useState('issue'); // 'issue' or 'return'
  const [scannedCode, setScannedCode] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);
  
  // Transaction fields autofilled by scan
  const [studentId, setStudentId] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [bookIsbn, setBookIsbn] = useState('');

  // Local state for pending requests table for interactivity
  const [pendingRequests, setPendingRequests] = useState([]);
  const [stats, setStats] = useState({
    issuedToday: 0,
    returnedToday: 0,
    pendingCount: 0,
    overdueCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/dashboard/librarian', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setStats({
          issuedToday: res.data.issuedToday || 0,
          returnedToday: res.data.returnedToday || 0,
          pendingCount: res.data.pendingCount || 0,
          overdueCount: res.data.overdueCount || 0,
        });
        setPendingRequests(res.data.pendingRequests || []);
      } catch (err) {
        console.error('Error fetching librarian dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.token) fetchDashboard();
  }, [user]);

  const handleRequestAction = async (id, action) => {
    try {
      await axios.put(
        `http://localhost:5000/api/requests/${id}/review`,
        { status: action },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setPendingRequests(prev =>
        prev.map(r => r.id === id ? { ...r, status: action } : r)
      );
    } catch (err) {
      console.error('Error updating request:', err);
      alert('Failed to update request. Please try again.');
    }
  };

  const startScanner = (type) => {
    setScanType(type);
    setIsScanning(true);
    setScanSuccess(false);
    setScannedCode('');
  };

  // Simulate scanning a barcode
  const simulateScan = (code, sId, bTitle, isbn) => {
    setScannedCode(code);
    setScanSuccess(true);
    
    // Autofill fields
    setStudentId(sId);
    setBookTitle(bTitle);
    setBookIsbn(isbn);

    // Audio cue fallback
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 1200; // high beep
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      setTimeout(() => oscillator.stop(), 150);
    } catch (e) {
      console.log("Audio contexts blocked or not supported");
    }

    setTimeout(() => {
      setIsScanning(false);
    }, 1800);
  };

  const handleTransactionSubmit = (e) => {
    e.preventDefault();
    alert(`Transaction Logged! Book: "${bookTitle}" ${scanType === 'issue' ? 'Issued to' : 'Returned from'} ${studentId}.`);
    // Clear forms
    setStudentId('');
    setBookTitle('');
    setBookIsbn('');
    setScanSuccess(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Welcome back, {user?.name || 'Librarian'}! 👋</h2>
          <p className="text-slate-500 mt-1">Today's library operations and activities.</p>
          <p className="text-slate-500 text-sm mt-1">University ID: <span className="font-semibold text-slate-700">{universityId}</span></p>
        </div>
        <div className="text-sm font-semibold text-slate-600">
          Last Synced: {isLoading ? 'Syncing...' : 'Just now'}
        </div>
      </div>

      {/* KPI statistics cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 border-l-4 border-l-emerald-500 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl"><Download className="w-6 h-6" /></div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Issued Today</p>
            <h3 className="text-2xl font-bold text-slate-800">{isLoading ? '...' : stats.issuedToday}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 border-l-4 border-l-blue-500 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl"><CornerLeftUp className="w-6 h-6" /></div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Returned Today</p>
            <h3 className="text-2xl font-bold text-slate-800">{isLoading ? '...' : stats.returnedToday}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 border-l-4 border-l-amber-500 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-xl"><RefreshCcw className="w-6 h-6" /></div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Pending Requests</p>
            <h3 className="text-2xl font-bold text-slate-800">{isLoading ? '...' : stats.pendingCount}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 border-l-4 border-l-rose-500 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-rose-50 text-rose-600 rounded-xl"><AlertCircle className="w-6 h-6" /></div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Overdue Books</p>
            <h3 className="text-2xl font-bold text-slate-800">{isLoading ? '...' : stats.overdueCount}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Pending requests table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">Pending Borrow Requests</h3>
            <button className="text-amber-600 text-sm font-medium">View All</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="py-3 px-4 rounded-tl-lg">Student ID</th>
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Request Date</th>
                  <th className="py-3 px-4 rounded-tr-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {pendingRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50">
                    <td className="py-4 px-4 font-semibold text-slate-800">{req.studentId}</td>
                    <td className="py-4 px-4">{req.title}</td>
                    <td className="py-4 px-4 text-xs font-semibold">{req.date}</td>
                    <td className="py-4 px-4 text-right">
                      {req.status === 'Pending' ? (
                        <div className="flex justify-end gap-2">
                           <button onClick={() => handleRequestAction(req.id, 'Approved')} className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-100 font-bold transition-all text-xs">Approve</button>
                           <button onClick={() => handleRequestAction(req.id, 'Rejected')} className="px-3 py-1 bg-rose-50 text-rose-600 rounded-md hover:bg-rose-100 font-bold transition-all text-xs">Reject</button>
                        </div>
                      ) : (
                        <span className={`px-2.5 py-1 rounded text-xs font-extrabold ${req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {req.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Quick scans and scanner interface */}
        <div className="space-y-6">
           
           {/* Interactive scan manager panel */}
           <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg p-6 text-white relative overflow-hidden">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                 <Camera className="w-5 h-5 text-amber-500 animate-pulse" /> Webcam Barcode Scanner
              </h3>
              
              {isScanning ? (
                <div className="space-y-4">
                  {/* Camera Screen Simulator */}
                  <div className="relative w-full h-44 bg-black rounded-xl border border-slate-700 overflow-hidden flex items-center justify-center">
                    {/* Laser Scanner beam animation */}
                    <div className="absolute left-0 right-0 h-1 bg-red-500 shadow-md shadow-red-500 animate-bounce top-0 bottom-0 my-auto"></div>
                    
                    {/* Scanning overlay layout */}
                    <div className="absolute inset-4 border border-dashed border-slate-500/50 rounded-lg pointer-events-none"></div>

                    {scanSuccess ? (
                      <div className="absolute inset-0 bg-emerald-950/80 flex flex-col items-center justify-center gap-2 animate-fade-in text-center p-3">
                         <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xl font-black">✓</div>
                         <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest">BarCode Scanned</p>
                         <p className="text-white font-semibold text-xs truncate max-w-full">{scannedCode}</p>
                      </div>
                    ) : (
                      <div className="text-center space-y-1 z-10">
                        <p className="text-slate-400 text-xs font-semibold animate-pulse">Scanning target viewport...</p>
                        <p className="text-[10px] text-slate-500">Align student card or book barcode inside line</p>
                      </div>
                    )}
                  </div>

                  {/* Simulator buttons */}
                  <div className="space-y-2">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Demo Barcode Simulators:</p>
                     <div className="grid grid-cols-2 gap-2 text-xs">
                       <button 
                         type="button"
                         onClick={() => simulateScan('BOOK-CSE-978026', 'C191000', 'Introduction to Algorithms', '9780262033848')}
                         className="px-2 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium text-left border border-slate-700"
                       >
                         Scan CSE Algorithms
                       </button>
                       <button 
                         type="button"
                         onClick={() => simulateScan('BOOK-EEE-978007', 'C192055', 'Fundamentals of Electric Circuits', '9780073380575')}
                         className="px-2 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium text-left border border-slate-700"
                       >
                         Scan EEE Circuits
                       </button>
                     </div>
                     <button 
                       onClick={() => setIsScanning(false)}
                       className="w-full text-center text-slate-500 text-xs font-bold hover:text-white pt-2"
                     >
                       Cancel Scanning
                     </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-slate-400 text-sm font-medium mb-4">Select scan transaction mode to initialize terminal camera:</p>
                  <div className="flex flex-col gap-3">
                     <button onClick={() => startScanner('issue')} className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 py-3 rounded-xl font-extrabold transition-colors">
                       <Download className="w-5 h-5" /> Issue Book (Scan QR)
                     </button>
                     <button onClick={() => startScanner('return')} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-extrabold border border-slate-700 transition-colors">
                       <CornerLeftUp className="w-5 h-5" /> Return Book (Scan QR)
                     </button>
                  </div>
                </div>
              )}
           </div>

           {/* Autofill Transaction Form */}
           {(studentId || bookTitle) && (
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 animate-fade-in">
               <h4 className="font-extrabold text-slate-800 border-b border-slate-100 pb-2 text-sm flex items-center gap-2">
                 <Check className="w-4 h-4 text-emerald-500" /> Log Scanned Transaction ({scanType.toUpperCase()})
               </h4>
               
               <form onSubmit={handleTransactionSubmit} className="space-y-4 text-xs font-semibold text-slate-600">
                  <div className="space-y-1">
                    <label>Borrower Student ID</label>
                    <input 
                      type="text" 
                      value={studentId} 
                      onChange={(e) => setStudentId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label>Book Title</label>
                    <input 
                      type="text" 
                      value={bookTitle} 
                      onChange={(e) => setBookTitle(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label>Book ISBN</label>
                    <input 
                      type="text" 
                      value={bookIsbn} 
                      onChange={(e) => setBookIsbn(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 font-bold cursor-not-allowed" 
                      readOnly 
                    />
                  </div>
                  
                  <button type="submit" className="w-full py-2.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all">
                    Submit Log
                  </button>
               </form>
             </div>
           )}

           {/* Fines warning */}
           <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-2 text-rose-700">
                 <AlertCircle className="w-5 h-5" />
                 <h3 className="font-bold">Overdue Escalations</h3>
              </div>
              <p className="text-sm text-rose-600 mb-4">3 students have fines exceeding ৳500.</p>
              <button className="text-sm font-semibold bg-white text-rose-600 px-4 py-2 rounded-lg border border-rose-200 hover:bg-rose-50 w-full transition-colors">
                Review Defaulters
              </button>
           </div>

        </div>
      </div>
    </div>
  );
};

export default LibrarianDashboard;
