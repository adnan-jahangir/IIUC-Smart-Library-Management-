import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/useAuthStore';
import { BookOpen, Clock, CheckCircle2, XCircle, ArrowRightCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const StudentBorrowRequests = () => {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/requests/my-requests', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setRequests(res.data);
      } catch (error) {
        console.error('Failed to fetch requests:', error);
        toast.error('Failed to load borrow requests.');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.token) {
      fetchRequests();
    }
  }, [user]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <Clock className="w-5 h-5 text-amber-500" />;
      case 'Approved': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'Rejected': return <XCircle className="w-5 h-5 text-rose-500" />;
      case 'Returned': return <ArrowRightCircle className="w-5 h-5 text-blue-500" />;
      default: return <Clock className="w-5 h-5 text-slate-500" />;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Returned': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">My Borrow Requests</h2>
        <p className="text-slate-500 mt-1">Track the status of your requested books here.</p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center min-h-[300px]">
          <BookOpen className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-800">No requests found</h3>
          <p className="text-slate-500 mt-1">You haven't requested any books yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((request) => (
            <div key={request._id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${getStatusStyle(request.status)} flex items-center gap-1.5`}>
                  {getStatusIcon(request.status)}
                  {request.status}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  {new Date(request.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1 line-clamp-2">
                  {request.book?.title || 'Unknown Book'}
                </h3>
                <p className="text-slate-500 text-sm font-medium">
                  {request.book?.author || 'Unknown Author'}
                </p>
                <p className="text-slate-400 text-xs mt-2 font-mono">
                  ID: {request.book?.customId}
                </p>
              </div>

              {request.status === 'Rejected' && request.rejectionReason && (
                <div className="mt-4 p-3 bg-rose-50 rounded-xl text-sm text-rose-700 border border-rose-100">
                  <span className="font-bold block mb-0.5">Reason:</span>
                  {request.rejectionReason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentBorrowRequests;
