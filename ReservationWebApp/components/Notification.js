import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';

const NotificationToast = ({ message, onClose }) => (
  <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 flex items-center space-x-4 animate-slide-up">
    <Bell className="w-5 h-5 text-blue-500" />
    <p className="text-gray-700">{message}</p>
    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
      <X className="w-4 h-4" />
    </button>
  </div>
);

export default function Notifications({ reservations = [] }) {
  const [notifications, setNotifications] = useState([]);
  const [lastReservationCount, setLastReservationCount] = useState(reservations.length);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    // Check for new reservations
    if (reservations.length > lastReservationCount) {
      const newReservations = reservations.slice(lastReservationCount);
      newReservations.forEach(reservation => {
        // Show browser notification
        if (hasPermission) {
          new Notification('New Reservation!', {
            body: `${reservation.name} - ${reservation.date} at ${reservation.time}`,
            icon: '/favicon.ico'
          });
        }

        // Show in-app notification
        setNotifications(prev => [...prev, {
          id: Date.now(),
          message: `New reservation: ${reservation.name} - ${reservation.date} at ${reservation.time}`
        }]);
      });
    }
    setLastReservationCount(reservations.length);
  }, [reservations]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        setHasPermission(permission === 'granted');
      });
    }
  }, []);

  // Auto-remove notifications after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (notifications.length > 0) {
        setNotifications(prev => prev.slice(1));
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [notifications]);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  return (
    <>
      {notifications.map(notification => (
        <NotificationToast
          key={notification.id}
          message={notification.message}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </>
  );
}