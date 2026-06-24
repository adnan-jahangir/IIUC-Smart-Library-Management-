import React, { useState, useEffect } from 'react';
import { AlertCircle, RotateCcw, BookX } from 'lucide-react';
import { getFineSummary } from '../../services/aiApi';
import { useAuthStore } from '../../store/useAuthStore';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function FineSummaryCard() {
  const { token } = useAuthStore();
  const [summary, setSummary] = useState({ totalFine: 0, overdueCount: 0, overdueBooks: [] });
  const [loading, setLoading] = useState(true);
  const [renewingId, setRenewingId] = useState(null);

  const fetchSummary = async () => {
    try {
      const data = await getFineSummary(token);
      setSummary(data);
    } catch (err) {
      console.error('Failed to fetch fine summary', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchSummary();
  }, [token]);

  const handleRenew = async (borrowId) => {
    setRenewingId(borrowId);
    try {
      // Use existing renew endpoint
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.put(`${API_URL}/api/requests/${borrowId}/renew`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Book renewed successfully!');
      // Refresh summary
      await fetchSummary();
    } catch (err) {
      console.error('Failed to renew book', err);
      toast.error(err.response?.data?.message || 'Failed to renew book. Max renewals reached?');
    } finally {
      setRenewingId(null);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-white p-6 rounded-2xl h-48 border border-gray-100"></div>;
  }

  if (summary.overdueCount === 0 && summary.totalFine === 0) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800 flex items-center gap-4">
        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-300">All Clear!</h3>
          <p className="text-emerald-600 dark:text-emerald-400 text-sm">You have no overdue books or outstanding fines.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-rose-100 dark:border-rose-900/30 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-rose-100 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-900/10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/50 rounded-full flex items-center justify-center text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Action Required</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{summary.overdueCount} Overdue Books</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-rose-500 dark:text-rose-400 font-semibold uppercase tracking-wide">Total Owed</p>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-500">৳{summary.totalFine}</p>
        </div>
      </div>
      
      <div className="p-4 bg-white dark:bg-gray-800 max-h-64 overflow-y-auto">
        <div className="space-y-3">
          {summary.overdueBooks.map(book => (
            <div key={book.borrowId} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-start gap-3">
                <BookX className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{book.bookTitle}</h4>
                  <p className="text-xs text-rose-500 font-medium">{book.daysOverdue} days overdue (৳{book.fine})</p>
                </div>
              </div>
              <button 
                onClick={() => handleRenew(book.borrowId)}
                disabled={renewingId === book.borrowId}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 hover:text-indigo-600 transition-colors disabled:opacity-50"
              >
                {renewingId === book.borrowId ? (
                  <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                Renew
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Just adding CheckCircle to fix the missing import locally
const CheckCircle = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);
