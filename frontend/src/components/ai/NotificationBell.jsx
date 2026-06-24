import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, BookOpen, AlertTriangle } from 'lucide-react';
import { getNotifications, markNotificationAsRead } from '../../services/aiApi';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const { token, user } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifs = async () => {
    if (!token) return;
    try {
      const data = await getNotifications(token);
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifs();
    // Poll every 60s
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, [token]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    try {
      await markNotificationAsRead(token, id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await handleMarkAsRead({ stopPropagation: () => {} }, notif._id);
    }
    setIsOpen(false);
    
    // Navigate based on type
    if (user?.role === 'Student') {
      if (notif.type === 'overdue' || notif.type === 'fine') {
        navigate('/student/fines');
      } else {
        navigate('/student/dashboard'); // default to dashboard to see current borrows
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors dark:text-gray-400 dark:hover:bg-gray-800"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-rose-500 border-2 border-white rounded-full dark:border-gray-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
            <h3 className="font-bold text-gray-800 dark:text-gray-100">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                {unreadCount} New
              </span>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {notifications.map(notif => (
                  <div 
                    key={notif._id} 
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${!notif.isRead ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-0.5 p-2 rounded-full h-fit ${notif.type === 'overdue' || notif.type === 'fine' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {notif.type === 'overdue' || notif.type === 'fine' ? <AlertTriangle className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${!notif.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <button 
                          onClick={(e) => handleMarkAsRead(e, notif._id)}
                          className="text-gray-400 hover:text-indigo-600 transition-colors self-center p-1"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-3 text-center border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <button 
              onClick={() => { setIsOpen(false); navigate('/student/notifications'); }} 
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              View All History
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
