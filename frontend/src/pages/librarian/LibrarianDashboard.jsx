import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BookCopy, AlertCircle, RefreshCcw, Download, CornerLeftUp, 
  Camera, Check, ShieldAlert, Award, FileText, Plus 
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import { Html5Qrcode } from 'html5-qrcode';

const LibrarianDashboard = () => {
  const { user } = useAuthStore();
  const universityId = String(user?.customId || user?.email?.split('@')[0] || 'N/A').toUpperCase();

  // Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [scanType, setScanType] = useState('issue'); // 'issue', 'return', 'renew', 'add'
  const [scannedCode, setScannedCode] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  
  // Camera scanning integration states
  const [cameras, setCameras] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState('');
  const [scannerInstance, setScannerInstance] = useState(null);

  // Transaction fields autofilled by scan
  const [studentId, setStudentId] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [bookIsbn, setBookIsbn] = useState('');

  // Extra fields for 'add' book cataloging mode
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookCustomId, setBookCustomId] = useState('');
  const [bookDepartment, setBookDepartment] = useState('CSE');
  const [bookTotalCopies, setBookTotalCopies] = useState(5);

  // Local state for pending requests table for interactivity
  const [pendingRequests, setPendingRequests] = useState([]);
  const [stats, setStats] = useState({
    issuedToday: 0,
    returnedToday: 0,
    pendingCount: 0,
    overdueCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    if (user?.token) fetchDashboard();
  }, [user]);

  // Handle webcam scanning activation and device mapping
  useEffect(() => {
    let activeScanner = null;
    let isActive = true;

    const initWebcam = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!isActive) return;

        if (devices && devices.length > 0) {
          setCameras(devices);
          
          const html5QrCode = new Html5Qrcode("reader-viewport");
          activeScanner = html5QrCode;
          setScannerInstance(html5QrCode);

          // Detect back camera by default if available
          const rearCam = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('environment') || 
            d.label.toLowerCase().includes('rear')
          );

          // Re-order devices list to prioritize the rear camera
          const orderedDevices = [...devices];
          if (rearCam) {
            const index = orderedDevices.indexOf(rearCam);
            if (index > -1) {
              orderedDevices.splice(index, 1);
              orderedDevices.unshift(rearCam);
            }
          }

          let started = false;

          for (const device of orderedDevices) {
            try {
              if (!isActive) return;
              await html5QrCode.start(
                device.id,
                {
                  fps: 10,
                  qrbox: (width, height) => {
                    const minEdge = Math.min(width, height);
                    const qrboxSize = Math.floor(minEdge * 0.7);
                    return { width: qrboxSize, height: qrboxSize };
                  }
                },
                (decodedText) => {
                  handleScanSuccess(decodedText, html5QrCode);
                },
                () => {} // Frame error callback (ignored)
              );
              // Successful initialization
              setActiveCameraId(device.id);
              started = true;
              setCameraError(false);
              break;
            } catch (startErr) {
              console.warn(`Failed to initialize camera ${device.label || device.id}:`, startErr.message || startErr);
            }
          }

          if (!started && isActive) {
            setCameraError(true);
            setActiveCameraId(devices[0].id);
            toast.error("Webcam is blocked or in use by another program.");
          }
        } else {
          setCameraError(true);
          toast.error("No camera devices detected.");
        }
      } catch (err) {
        console.error("Camera listing error:", err);
        if (isActive) {
          setCameraError(true);
          toast.error("Webcam access rejected or failed. Check browser permissions.");
        }
      }
    };

    if (isScanning) {
      const startTimer = setTimeout(() => {
        initWebcam();
      }, 100);

      return () => {
        isActive = false;
        clearTimeout(startTimer);
        if (activeScanner && activeScanner.isScanning) {
          activeScanner.stop().catch(e => console.error("Webcam stop error", e));
        }
        setScannerInstance(null);
      };
    }
  }, [isScanning]);

  const handleCameraChange = async (cameraId) => {
    setActiveCameraId(cameraId);
    setCameraError(false);
    
    let activeQrCode = scannerInstance;

    try {
      if (activeQrCode) {
        if (activeQrCode.isScanning) {
          await activeQrCode.stop();
        }
      } else {
        activeQrCode = new Html5Qrcode("reader-viewport");
        setScannerInstance(activeQrCode);
      }

      await activeQrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: (width, height) => {
            const minEdge = Math.min(width, height);
            const qrboxSize = Math.floor(minEdge * 0.7);
            return { width: qrboxSize, height: qrboxSize };
          }
        },
        (decodedText) => handleScanSuccess(decodedText, activeQrCode),
        () => {}
      );
      setCameraError(false);
    } catch (err) {
      console.error("Camera switch error:", err);
      setCameraError(true);
      toast.error("This camera source is blocked or currently in use.");
    }
  };

  const handleScanSuccess = async (decodedText, scanner) => {
    // Stop scanning on detection
    if (scanner && scanner.isScanning) {
      scanner.stop().catch(e => console.warn(e));
    }

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
    } catch (e) {}

    setScannedCode(decodedText);
    setScanSuccess(true);
    
    const cleaned = decodedText.trim();
    
    // Auto-detect format type: Student ID vs Book Barcode
    const isStudentId = /^[CS]\d+/i.test(cleaned) || (cleaned.length >= 6 && !isNaN(Number(cleaned.slice(1))));

    if (isStudentId && scanType !== 'add') {
      setStudentId(cleaned);
      toast.success(`Student Detected: ${cleaned}`);
    } else {
      // Lookup Book in catalog
      try {
        const res = await axios.get(`http://localhost:5000/api/books/${cleaned}`).catch(() => null);
        if (res && res.data) {
          const bookData = res.data;
          setBookTitle(bookData.title);
          setBookIsbn(bookData.isbn || bookData.customId);
          if (scanType === 'add') {
            setBookAuthor(bookData.author);
            setBookCustomId(bookData.customId);
            setBookDepartment(bookData.department || 'CSE');
            setBookTotalCopies(bookData.totalCopies || 5);
          }
          toast.success(`Book Matched: "${bookData.title}"`);
        } else {
          setBookIsbn(cleaned);
          if (scanType === 'add') {
            setBookCustomId(`BOOK-${cleaned.slice(-4).toUpperCase()}`);
          }
          toast.success(`Scanned Code: ${cleaned}`);
        }
      } catch (err) {
        setBookIsbn(cleaned);
        toast.success(`Scanned Code: ${cleaned}`);
      }
    }

    setTimeout(() => {
      setIsScanning(false);
      setScanSuccess(false);
    }, 1200);
  };

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
      toast.success(`Request ${action.toLowerCase()} successfully`);
      fetchDashboard();
    } catch (err) {
      console.error('Error updating request:', err);
      toast.error('Failed to update request. Please try again.');
    }
  };

  const startScanner = (type) => {
    setScanType(type);
    setIsScanning(true);
    setScanSuccess(false);
    setCameraError(false);
    setScannedCode('');
    // Clear forms
    setStudentId('');
    setBookTitle('');
    setBookIsbn('');
    setBookAuthor('');
    setBookCustomId('');
    setBookDepartment('CSE');
    setBookTotalCopies(5);
  };

  // Barcode simulation options as manual fallbacks for testing
  const triggerSimulation = (code, sId, bTitle, isbn, extra = {}) => {
    if (scannerInstance && scannerInstance.isScanning) {
      scannerInstance.stop().catch(e => console.warn(e));
    }
    handleScanSuccess(code, null);
    
    // Set matching items directly
    setStudentId(sId || '');
    setBookTitle(bTitle || '');
    setBookIsbn(isbn || '');
    if (scanType === 'add') {
      setBookAuthor(extra.author || '');
      setBookCustomId(extra.customId || '');
      setBookDepartment(extra.department || 'CSE');
      setBookTotalCopies(extra.totalCopies || 5);
    }
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    if (!user?.token) return;

    try {
      if (scanType === 'add') {
        const payload = {
          customId: bookCustomId,
          title: bookTitle,
          author: bookAuthor,
          department: bookDepartment,
          isbn: bookIsbn,
          totalCopies: bookTotalCopies,
          availableCopies: bookTotalCopies
        };
        await axios.post('http://localhost:5000/api/books', payload, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        toast.success(`Book "${bookTitle}" successfully cataloged!`);
        
        // Clear
        setBookTitle('');
        setBookIsbn('');
        setBookAuthor('');
        setBookCustomId('');
        setScanSuccess(false);
      } else {
        // Fetch all requests
        const res = await axios.get('http://localhost:5000/api/requests', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const allReqs = res.data || [];

        // Match borrow request
        const statusFilter = scanType === 'issue' ? 'Pending' : 'Approved';
        const matched = allReqs.find(r => 
          r.status === statusFilter &&
          (r.user?.customId?.toLowerCase() === studentId.toLowerCase() || r.user?.userId?.toLowerCase() === studentId.toLowerCase()) &&
          (r.book?.isbn?.toLowerCase() === bookIsbn.toLowerCase() || r.book?.title?.toLowerCase() === bookTitle.toLowerCase() || r.book?.customId?.toLowerCase() === bookIsbn.toLowerCase())
        );

        if (!matched) {
          toast.error(`No active ${statusFilter.toLowerCase()} request found matching Student ID and Book ISBN.`);
          return;
        }

        if (scanType === 'issue') {
          await axios.put(
            `http://localhost:5000/api/requests/${matched._id}/review`,
            { status: 'Approved' },
            { headers: { Authorization: `Bearer ${user.token}` } }
          );
          toast.success('Book issued successfully!');
        } else if (scanType === 'return') {
          const retRes = await axios.put(
            `http://localhost:5000/api/requests/${matched._id}/return`,
            {},
            { headers: { Authorization: `Bearer ${user.token}` } }
          );
          const fine = retRes?.data?.fineAmount || 0;
          toast.success(fine > 0 ? `Book returned successfully! Fine: ৳${fine}` : 'Book returned successfully!');
        } else if (scanType === 'renew') {
          await axios.put(
            `http://localhost:5000/api/requests/${matched._id}/renew`,
            {},
            { headers: { Authorization: `Bearer ${user.token}` } }
          );
          toast.success('Borrow renewed successfully!');
        }

        // Clean up
        setStudentId('');
        setBookTitle('');
        setBookIsbn('');
        setScanSuccess(false);
        fetchDashboard();
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Transaction submission failed.');
    }
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
                  <th className="py-3 px-4 rounded-tl-lg">User</th>
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Request Date</th>
                  <th className="py-3 px-4 rounded-tr-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {pendingRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50">
                    <td className="py-4 px-4">
                      <p className="font-semibold text-slate-800">{req.name || req.studentId}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          req.role === 'Teacher' ? 'bg-violet-100 text-violet-700' : 'bg-sky-100 text-sky-700'
                        }`}>
                          {req.role === 'Teacher' ? (req.designation || 'Teacher') : 'Student'}
                        </span>
                        <span className="text-xs text-slate-400">{req.studentId}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">{req.title}</td>
                    <td className="py-4 px-4 text-xs font-semibold">{new Date(req.date).toLocaleString()}</td>
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
                  {/* Camera Screen Viewport */}
                  <div className="relative w-full bg-black rounded-xl border border-slate-700 overflow-hidden flex flex-col items-center justify-center">
                    {cameraError ? (
                      <div className="w-full h-48 bg-slate-950/80 p-4 flex flex-col items-center justify-center text-center gap-2">
                        <AlertCircle className="w-8 h-8 text-amber-500 animate-pulse" />
                        <p className="text-amber-400 font-bold text-xs">Webcam Feed Offline</p>
                        <p className="text-[10px] text-slate-400 leading-normal max-w-[220px]">
                          Camera source is blocked, in-use, or invalid. Please check permissions or switch camera source.
                        </p>
                      </div>
                    ) : (
                      <div id="reader-viewport" className="w-full h-48 bg-slate-950"></div>
                    )}
                    
                    {/* Glowing scanning target overlay */}
                    {!scanSuccess && !cameraError && (
                      <div className="absolute inset-0 pointer-events-none border-2 border-emerald-500/35 m-3 rounded-lg flex flex-col justify-between p-3">
                        <div className="flex justify-between">
                          <span className="w-4 h-4 border-t-2 border-l-2 border-emerald-400"></span>
                          <span className="w-4 h-4 border-t-2 border-r-2 border-emerald-400"></span>
                        </div>
                        <div className="flex justify-between">
                          <span className="w-4 h-4 border-b-2 border-l-2 border-emerald-400"></span>
                          <span className="w-4 h-4 border-b-2 border-r-2 border-emerald-400"></span>
                        </div>
                      </div>
                    )}

                    {scanSuccess ? (
                      <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center gap-2 animate-fade-in text-center p-3 z-10">
                         <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xl font-black">✓</div>
                         <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest">BarCode Scanned</p>
                         <p className="text-white font-semibold text-xs truncate max-w-full">{scannedCode}</p>
                      </div>
                    ) : null}
                  </div>

                  {/* Camera selection dropdown if multiple cameras found */}
                  {cameras.length > 1 && (
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Change Camera Device:</label>
                      <select
                        value={activeCameraId}
                        onChange={(e) => handleCameraChange(e.target.value)}
                        className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs font-semibold focus:outline-none"
                      >
                        {cameras.map(cam => (
                          <option key={cam.id} value={cam.id}>{cam.label || `Camera ${cam.id.slice(0, 5)}`}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Simulator buttons based on mode as fallback */}
                  <div className="space-y-2">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Simulate Barcode Scan:</p>
                     <div className="grid grid-cols-2 gap-2 text-xs">
                       {scanType === 'add' ? (
                         <>
                           <button 
                             type="button"
                             onClick={() => triggerSimulation('978-0132350884', '', 'Clean Architecture', '978-0132350884', {
                               author: 'Robert C. Martin',
                               customId: 'CSE-22',
                               department: 'CSE',
                               totalCopies: 6
                             })}
                             className="px-2 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium text-left border border-slate-700 leading-tight"
                           >
                             Clean Arch (CSE)
                           </button>
                           <button 
                             type="button"
                             onClick={() => triggerSimulation('978-1118170519', '', 'Control Systems Engineering', '978-1118170519', {
                               author: 'Norman S. Nise',
                               customId: 'EEE-21',
                               department: 'EEE',
                               totalCopies: 4
                             })}
                             className="px-2 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium text-left border border-slate-700 leading-tight"
                           >
                             Controls (EEE)
                           </button>
                         </>
                       ) : scanType === 'renew' ? (
                         <>
                           <button 
                             type="button"
                             onClick={() => triggerSimulation('978-0262033848', 'C191000', 'Introduction to Algorithms', '978-0262033848')}
                             className="px-2 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium text-left border border-slate-700 leading-tight"
                           >
                             Algorithms (C191000)
                           </button>
                           <button 
                             type="button"
                             onClick={() => triggerSimulation('978-0073380575', 'C192055', 'Fundamentals of Electric Circuits', '978-0073380575')}
                             className="px-2 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium text-left border border-slate-700 leading-tight"
                           >
                             Circuits (C192055)
                           </button>
                         </>
                       ) : (
                         <>
                           <button 
                             type="button"
                             onClick={() => triggerSimulation('978-0262033848', 'C191000', 'Introduction to Algorithms', '978-0262033848')}
                             className="px-2 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium text-left border border-slate-700 leading-tight"
                           >
                             Algorithms (C191000)
                           </button>
                           <button 
                             type="button"
                             onClick={() => triggerSimulation('978-0073380575', 'C192055', 'Fundamentals of Electric Circuits', '978-0073380575')}
                             className="px-2 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-medium text-left border border-slate-700 leading-tight"
                           >
                             Circuits (C192055)
                           </button>
                         </>
                       )}
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
                  <p className="text-slate-400 text-xs font-medium mb-3">Select scan transaction mode to initialize terminal camera:</p>
                  <div className="grid grid-cols-2 gap-3">
                     <button onClick={() => startScanner('issue')} className="w-full flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 py-3 rounded-xl font-bold transition-all text-xs shadow-md shadow-amber-500/5">
                       <Download className="w-4 h-4" /> Issue Book
                     </button>
                     <button onClick={() => startScanner('return')} className="w-full flex items-center justify-center gap-1.5 bg-slate-850 hover:bg-slate-800 text-white py-3 rounded-xl font-bold border border-slate-800 transition-all text-xs">
                       <CornerLeftUp className="w-4 h-4" /> Return Book
                     </button>
                     <button onClick={() => startScanner('renew')} className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-all text-xs shadow-md shadow-blue-500/5">
                       <RefreshCcw className="w-4 h-4" /> Renew Book
                     </button>
                     <button onClick={() => startScanner('add')} className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold transition-all text-xs shadow-md shadow-emerald-500/5">
                       <Plus className="w-4 h-4" /> Add Book
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
                 {scanType === 'add' ? (
                   <>
                     <div className="space-y-1">
                       <label>Book Title</label>
                       <input 
                         type="text" 
                         value={bookTitle} 
                         onChange={(e) => setBookTitle(e.target.value)}
                         className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none" 
                         required
                       />
                     </div>
                     <div className="space-y-1">
                       <label>Author</label>
                       <input 
                         type="text" 
                         value={bookAuthor} 
                         onChange={(e) => setBookAuthor(e.target.value)}
                         className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none" 
                         required
                       />
                     </div>
                     <div className="space-y-1">
                       <label>ISBN-13</label>
                       <input 
                         type="text" 
                         value={bookIsbn} 
                         onChange={(e) => setBookIsbn(e.target.value)}
                         className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none" 
                         required
                       />
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-1">
                         <label>Custom ID</label>
                         <input 
                           type="text" 
                           value={bookCustomId} 
                           onChange={(e) => setBookCustomId(e.target.value)}
                           className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none" 
                           required
                         />
                       </div>
                       <div className="space-y-1">
                         <label>Department</label>
                         <select
                           value={bookDepartment}
                           onChange={(e) => setBookDepartment(e.target.value)}
                           className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                           required
                         >
                           <option value="CSE">CSE</option>
                           <option value="EEE">EEE</option>
                           <option value="ETE">ETE</option>
                           <option value="BBA">BBA</option>
                           <option value="Law">Law</option>
                           <option value="Gen">General</option>
                         </select>
                       </div>
                     </div>
                     <div className="space-y-1">
                       <label>Total Copies</label>
                       <input 
                         type="number" 
                         value={bookTotalCopies} 
                         onChange={(e) => setBookTotalCopies(Number(e.target.value))}
                         className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none" 
                         min="1"
                         required
                       />
                     </div>
                   </>
                 ) : (
                   <>
                     <div className="space-y-1">
                       <label>Borrower Student ID</label>
                       <input 
                         type="text" 
                         value={studentId} 
                         onChange={(e) => setStudentId(e.target.value)}
                         className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:ring-1 focus:ring-amber-500 focus:outline-none" 
                         required
                       />
                     </div>
                     <div className="space-y-1">
                       <label>Book Title</label>
                       <input 
                         type="text" 
                         value={bookTitle} 
                         onChange={(e) => setBookTitle(e.target.value)}
                         className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:ring-1 focus:ring-amber-500 focus:outline-none" 
                         required
                       />
                     </div>
                     <div className="space-y-1">
                       <label>Book ISBN / Custom ID</label>
                       <input 
                         type="text" 
                         value={bookIsbn} 
                         onChange={(e) => setBookIsbn(e.target.value)}
                         className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold focus:ring-1 focus:ring-amber-500 focus:outline-none" 
                         required
                       />
                     </div>
                   </>
                 )}
                 
                 <button type="submit" className="w-full py-2.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all uppercase">
                   {scanType === 'add' ? 'Submit Catalog Log' : scanType === 'renew' ? 'Submit Renew Log' : 'Submit Log'}
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
