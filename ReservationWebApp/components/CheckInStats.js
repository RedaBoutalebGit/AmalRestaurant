// components/CheckInStats.js
import React from 'react';
import { UserCheck, UserX, Users } from 'lucide-react';

const CheckInStats = ({ reservations }) => {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Helper function to convert date format from MM/DD/YYYY to YYYY-MM-DD
  const convertDate = (date) => {
    if (!date) return '';
    const parts = date.split('/');
    return parts.length === 3 ? `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}` : date;
  };

  // Filter reservations for today
  const todayReservations = reservations.filter((r) => convertDate(r.date) === today);
  
  // Calculate statistics
  const totalToday = todayReservations.length;
  const arrivedCount = todayReservations.filter(r => r.checkedIn === 'yes').length;
  const notArrivedCount = totalToday - arrivedCount;
  
  // Calculate percentages
  const arrivedPercentage = totalToday > 0 ? Math.round((arrivedCount / totalToday) * 100) : 0;
  const notArrivedPercentage = totalToday > 0 ? 100 - arrivedPercentage : 0;

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Today's Check-In Stats</h3>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="flex items-center justify-center mb-2">
            <Users className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-sm text-gray-500">Total Reservations</p>
          <p className="text-xl font-bold">{totalToday}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="flex items-center justify-center mb-2">
            <UserCheck className="w-6 h-6 text-green-500" />
          </div>
          <p className="text-sm text-gray-500">Arrived</p>
          <p className="text-xl font-bold">{arrivedCount}</p>
          <p className="text-sm text-green-600">{arrivedPercentage}%</p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <div className="flex items-center justify-center mb-2">
            <UserX className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-sm text-gray-500">Not Arrived</p>
          <p className="text-xl font-bold">{notArrivedCount}</p>
          <p className="text-sm text-red-600">{notArrivedPercentage}%</p>
        </div>
      </div>
      
      {/* Visual progress bar */}
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-green-600 h-2.5 rounded-full" 
            style={{ width: `${arrivedPercentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">Arrived: {arrivedPercentage}%</span>
          <span className="text-xs text-gray-500">Not Arrived: {notArrivedPercentage}%</span>
        </div>
      </div>
    </div>
  );
};

export default CheckInStats;