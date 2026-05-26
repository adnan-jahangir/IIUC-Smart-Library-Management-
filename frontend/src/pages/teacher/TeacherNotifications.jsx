import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Bell, Loader2, BookOpen, Bookmark } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

const TeacherNotifications = () => {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [requestRes, reservationRes] = await Promise.all([
          axios.get('http://localhost:5000/api/requests/my-requests', {
            headers: { Authorization: `Bearer ${user.token}` }
          }),
          axios.get('http://localhost:5000/api/reservations/my-reservations', {
            headers: { Authorization: `Bearer ${user.token}` }
          })
        ]);

        setRequests(requestRes.data || []);
        setReservations(reservationRes.data || []);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.token) load();
  }, [user]);

  const notifications = useMemo(() => {
    const requestItems = requests.slice(0, 4).map((request) => ({
      key: request._id,
      title: request.book?.title || 'Unknown book',
      text: `Borrow request is ${request.status.toLowerCase()}.`,
      icon: BookOpen,
      tone: request.status === 'Approved' ? 'text-emerald-600 bg-emerald-50' : request.status === 'Pending' ? 'text-amber-600 bg-amber-50' : 'text-slate-600 bg-slate-100'
    }));

    const reservationItems = reservations.slice(0, 4).map((reservation) => ({
      key: `reservation-${reservation._id}`,
      title: reservation.book?.title || 'Unknown book',
      text: `Reservation is ${reservation.status.toLowerCase()} at queue position ${reservation.queuePosition}.`,
      icon: Bookmark,
      tone: reservation.status === 'Notified' ? 'text-emerald-600 bg-emerald-50' : 'text-indigo-600 bg-indigo-50'
    }));

    return [...requestItems, ...reservationItems];
  }, [requests, reservations]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Notifications</h2>
        <p className="text-slate-500 mt-1">See the latest updates from your borrows and reservations.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-500 gap-3"><Loader2 className="w-5 h-5 animate-spin" /> Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center text-slate-500">
          <Bell className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          No updates yet. New request and reservation events will appear here.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notifications.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.key} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.tone}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{item.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{item.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeacherNotifications;
