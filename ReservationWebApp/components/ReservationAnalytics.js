import React from 'react';
import { Users, Calendar, Clock, TrendingUp } from 'lucide-react';

const ReservationAnalytics = ({ reservations = [], totalSlots = 50, selectedDate }) => {
  // Use the selected date or fallback to today
  const filterDate = selectedDate || new Date().toISOString().split('T')[0];

  // Helper function to convert date format from MM/DD/YYYY to YYYY-MM-DD
  const convertDate = (date) => {
    if (!date) return '';
    const parts = date.split('/');
    return parts.length === 3 ? `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}` : date;
  };

  // Filter reservations for the selected date
  const selectedDateReservationsList = reservations.filter((r) => convertDate(r.date) === filterDate);

  // Calculate KPIs
  const stats = {
    selectedDateReservations: selectedDateReservationsList.length,
    selectedDateGuests: selectedDateReservationsList.reduce((sum, r) => sum + (Number(r.guests) || 0), 0),
    pendingCount: reservations.filter((r) => r.status === 'pending').length,
    utilizationRate: totalSlots > 0 
      ? Math.round((selectedDateReservationsList.length / totalSlots) * 100) 
      : 0, // Prevent division by zero
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Selected Date's Reservations */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">
              {filterDate === new Date().toISOString().split('T')[0] 
                ? "Today's Reservations" 
                : "Selected Day Reservations"}
            </p>
            <h3 className="text-2xl font-bold">{stats.selectedDateReservations}</h3>
          </div>
          <Calendar className="w-8 h-8 text-orange-500" />
        </div>
      </div>

      {/* Selected Date Guests */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">
              {filterDate === new Date().toISOString().split('T')[0] 
                ? "Today's Guests" 
                : "Selected Day Guests"}
            </p>
            <h3 className="text-2xl font-bold">{stats.selectedDateGuests}</h3>
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