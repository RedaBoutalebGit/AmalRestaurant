// components/DashboardStats.js

import React from 'react';
import { Users, Calendar, Clock, TrendingUp } from 'lucide-react';

const DashboardStats = ({ reservations, selectedDate }) => {
  // Use the provided selectedDate or default to today
  const filterDate = selectedDate ? selectedDate : new Date().toISOString().split('T')[0];

  // Calculate statistics
  const stats = {
    // Filter reservations for the selected date instead of today
    todayCount: reservations.filter(r => r.date === filterDate).length,
    totalGuests: reservations.reduce((sum, r) => sum + (parseInt(r.guests) || 0), 0),
    // Filter upcoming by considering reservations on or after the selected date
    upcomingCount: reservations.filter(r => r.date >= filterDate).length,
    avgPartySize: Math.round(reservations.reduce((sum, r) => sum + (parseInt(r.guests) || 0), 0) / reservations.length || 0),
    // New check-in stats
  todayArrivedCount: reservations.filter(r => 
    r.date === new Date().toISOString().split('T')[0] && 
    r.checkInStatus === 'arrived'
  ).length,
  
  todayArrivedPercent: Math.round(
    (reservations.filter(r => 
      r.date === new Date().toISOString().split('T')[0] && 
      r.checkInStatus === 'arrived'
    ).length / 
    (reservations.filter(r => 
      r.date === new Date().toISOString().split('T')[0]
    ).length || 1)) * 100
  ),
  
  todayExpectedCount: reservations.filter(r => 
    r.date === new Date().toISOString().split('T')[0] && 
    r.checkInStatus !== 'arrived'
  ).length
  };

  // Calculate guests for the selected date
  const selectedDateGuests = reservations
    .filter(r => r.date === filterDate)
    .reduce((sum, r) => sum + (parseInt(r.guests) || 0), 0);

    

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">
              {selectedDate === new Date().toISOString().split('T')[0] 
                ? "Today's Reservations" 
                : "Selected Day Reservations"}
            </p>
            <h3 className="text-2xl font-bold">{stats.todayCount}</h3>
          </div>
          <Calendar className="w-8 h-8 text-blue-500" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">
              {selectedDate === new Date().toISOString().split('T')[0] 
                ? "Today's Guests" 
                : "Selected Day Guests"}
            </p>
            <h3 className="text-2xl font-bold">{selectedDateGuests}</h3>
          </div>
          <Users className="w-8 h-8 text-green-500" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Upcoming Reservations</p>
            <h3 className="text-2xl font-bold">{stats.upcomingCount}</h3>
          </div>
          <Clock className="w-8 h-8 text-purple-500" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Average Party Size</p>
            <h3 className="text-2xl font-bold">{stats.avgPartySize}</h3>
          </div>
          <TrendingUp className="w-8 h-8 text-orange-500" />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-gray-500 text-sm">Check-ins Today</p>
      <h3 className="text-2xl font-bold">{stats.todayArrivedCount}/{stats.todayCount}</h3>
      <p className="text-xs text-gray-500">{stats.todayArrivedPercent}% arrival rate</p>
    </div>
    <UserCheck className="w-8 h-8 text-blue-500" />
  </div>
  </div>
    </div>
    
  );
};

export default DashboardStats;