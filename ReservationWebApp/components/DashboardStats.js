// components/DashboardStats.js

import React from 'react';
import { Users, Calendar, Clock, TrendingUp } from 'lucide-react';

const DashboardStats = ({ reservations }) => {
  // Calculate statistics
  const stats = {
    todayCount: reservations.filter(r => r.date === new Date().toISOString().split('T')[0]).length,
    totalGuests: reservations.reduce((sum, r) => sum + (parseInt(r.guests) || 0), 0),
    upcomingCount: reservations.filter(r => r.date >= new Date().toISOString().split('T')[0]).length,
    avgPartySize: Math.round(reservations.reduce((sum, r) => sum + (parseInt(r.guests) || 0), 0) / reservations.length || 0)
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Today's Reservations</p>
            <h3 className="text-2xl font-bold">{stats.todayCount}</h3>
          </div>
          <Calendar className="w-8 h-8 text-blue-500" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">Total Guests</p>
            <h3 className="text-2xl font-bold">{stats.totalGuests}</h3>
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
    </div>
  );
};

export default DashboardStats;