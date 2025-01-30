import React from 'react';
import { Users, Calendar, Clock, TrendingUp } from 'lucide-react';

const ReservationAnalytics = ({ reservations = [], totalSlots = 50 }) => {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Helper function to convert date format from MM/DD/YYYY to YYYY-MM-DD
  const convertDate = (date) => {
    if (!date) return '';
    const parts = date.split('/');
    return parts.length === 3 ? `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}` : date;
  };

  // Filter reservations for today
  const todayReservationsList = reservations.filter((r) => convertDate(r.date) === today);

  // Calculate KPIs
  const stats = {
    todayReservations: todayReservationsList.length,
    todayGuests: todayReservationsList.reduce((sum, r) => sum + (Number(r.guests) || 0), 0),
    pendingCount: reservations.filter((r) => r.status === 'pending').length,
    utilizationRate: totalSlots > 0 
      ? Math.round((todayReservationsList.length / totalSlots) * 100) 
      : 0, // Prevent division by zero
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Today's Reservations */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Today's Reservations</p>
            <h3 className="text-2xl font-bold">{stats.todayReservations}</h3>
          </div>
          <Calendar className="w-8 h-8 text-blue-500" />
        </div>
      </div>

      {/* Total Guests Today */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Today's Guests</p>
            <h3 className="text-2xl font-bold">{stats.todayGuests}</h3>
          </div>
          <Users className="w-8 h-8 text-green-500" />
        </div>
      </div>

      {/* Pending Confirmations */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Pending Confirmations</p>
            <h3 className="text-2xl font-bold">{stats.pendingCount}</h3>
          </div>
          <Clock className="w-8 h-8 text-yellow-500" />
        </div>
      </div>

      {/* Reservation Utilization Rate */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Utilization Rate</p>
            <h3 className="text-2xl font-bold">{stats.utilizationRate}%</h3>
          </div>
          <TrendingUp className="w-8 h-8 text-purple-500" />
        </div>
      </div>
    </div>
  );
};

export default ReservationAnalytics;
