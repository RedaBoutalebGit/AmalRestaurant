// components/ReservationDashboard.js
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Phone, Mail, RefreshCw, Check, X, Clock as ClockIcon, Trash2, Search, Table } from 'lucide-react';
import ReservationAnalytics from './ReservationAnalytics';
import Notifications from './Notification';

const ReservationDashboard = ({ reservations = [], onStatusUpdate }) => {
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [selectedTable, setSelectedTable] = useState('');

  // Auto refresh every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      handleRefresh();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onStatusUpdate();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleStatusUpdate = async (reservationId, newStatus) => {
    setUpdatingId(reservationId);
    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');
      await onStatusUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update reservation status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete reservation');
      setShowDeleteConfirm(false);
      await onStatusUpdate();
    } catch (error) {
      console.error('Error deleting reservation:', error);
      alert('Failed to delete reservation');
    } finally {
      setDeletingId(null);
    }
  };

  const convertDate = (date) => {
    const [month, day, year] = date.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };
  const isFriday = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    // Add logging to debug
    console.log('Checking date:', dateString, 'Day:', date.getDay());
    return date.getDay() === 5; // 5 corresponds to Friday
  };

  const filteredReservations = reservations.filter(res => {
    const reservationDate = convertDate(res.date);
    const dateMatch = !filterDate || reservationDate === filterDate;
    // Add logging to debug status filtering
  console.log('Status comparison:', {
    filterStatus,
    reservationStatus: res.status,
    match: filterStatus === 'all' || res.status.toLowerCase() === filterStatus.toLowerCase()
  });
    const statusMatch = filterStatus === 'all' || res.status === filterStatus;
    const nameMatch = !searchTerm || res.name.toLowerCase().includes(searchTerm.toLowerCase());
    return dateMatch && statusMatch && nameMatch;
  });

  const DeleteConfirmDialog = ({ reservation }) => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-red-600">Delete Reservation</h3>
          <button 
            onClick={() => setShowDeleteConfirm(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mb-6">
          <p className="text-gray-700">Are you sure you want to delete this reservation?</p>
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <p><strong>Guest:</strong> {reservation.name}</p>
            <p><strong>Date:</strong> {reservation.date}</p>
            <p><strong>Time:</strong> {reservation.time}</p>
          </div>
          <p className="mt-4 text-red-500 text-sm">This action cannot be undone.</p>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => handleDelete(reservation.id)}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Reservation
          </button>
        </div>
      </div>
    </div>
  );

  // Table Assignment Dialog Component
  const TableAssignDialog = ({ reservation }) => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-blue-600">Assign Table</h3>
          <button 
            onClick={() => setShowTableDialog(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mb-6">
          <p className="text-gray-700">Assign a table for {reservation.name}'s party of {reservation.guests}</p>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Table Number</label>
            <input
              type="number"
              min="1"
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter table number"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => setShowTableDialog(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => handleTableAssign(reservation.id, selectedTable)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
          >
            <Table className="w-4 h-4 mr-2" />
            Assign Table
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <Notifications reservations={reservations} />
      {showDeleteConfirm && <DeleteConfirmDialog reservation={selectedReservation} />}
      {showTableDialog && <TableAssignDialog reservation={selectedReservation} />}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Reservations Dashboard</h2>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`flex items-center px-4 py-2 bg-[#fce3c5] text-orange-600 rounded-lg hover:bg-[#ffcb8c] transition-all ${
            isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <RefreshCw className={`w-5 h-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Analytics Section */}
      <ReservationAnalytics reservations={reservations} />

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Filters</h3>
        <div className="flex gap-4">
          <div className="flex items-center space-x-2 flex-1">
            <Calendar className="w-5 h-5 text-gray-500" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="border rounded p-2 focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>
          <div className="flex items-center space-x-2 flex-1">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded p-2 focus:ring-2 focus:ring-blue-500 w-full"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option> 
              <option value="pending">Pending</option>      
              <option value="waitlist">Waitlist</option>    
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex items-center space-x-2 flex-1">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by guest name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border rounded p-2 focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>
        </div>
      </div>
      {/* Reservations List */}
          <div className="space-y-4">
            {filteredReservations.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500 text-lg">No reservations found</p>
              </div>
            ) : (
              filteredReservations.map((reservation, index) => (
                <div
                  key={index}
                  className={`rounded-lg shadow p-6 flex items-center justify-between hover:shadow-md transition-shadow ${
                    isFriday(reservation.date) 
                      ? 'bg-yellow-50 border-l-4 border-yellow-500' 
                      : 'bg-white'
                  }`}
                >
              {/* Rest of the reservation card content */}
              <div className="flex items-center space-x-8">
              <div className="flex flex-col items-start space-y-1">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-700">{reservation.date}</span>
                  </div>
                  {isFriday(reservation.date) && (
                    <span className="text-xs font-medium px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                      Couscous Day
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700">{reservation.time}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700">{reservation.guests} guests</span>
                </div>
                <div>
                  <div className="font-medium text-gray-800">{reservation.name}</div>
                  {reservation.phone && (
                    <div className="text-sm text-gray-500 flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>{reservation.phone}</span>
                    </div>
                  )}
                  {reservation.email && (
                    <div className="text-sm text-gray-500 flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>{reservation.email}</span>
                    </div>
                  )}
                </div>
              </div>
              {reservation.notes && (
                <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  Notes: <strong>{reservation.notes}</strong>
                </div>
              )}
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  reservation.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                  reservation.status === 'waitlist' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {reservation.status}
                </span>

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedReservation(reservation);
                      setSelectedTable(reservation.table || '');
                      setShowTableDialog(true);
                    }}
                    className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"
                    title="Assign Table"
                  >
                    <Table className="w-4 h-4" />
                  </button>
                  {reservation.table && (
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">
                      Table {reservation.table}
                    </span>
                  )}
                  {reservation.status !== 'confirmed' && (
                    <button
                      onClick={() => handleStatusUpdate(reservation.id, 'confirmed')}
                      disabled={updatingId === reservation.id}
                      className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100 disabled:opacity-50"
                      title="Confirm Reservation"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  
                  {reservation.status !== 'waitlist' && (
                    <button
                      onClick={() => handleStatusUpdate(reservation.id, 'waitlist')}
                      disabled={updatingId === reservation.id}
                      className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 disabled:opacity-50"
                      title="Move to Waitlist"
                    >
                      <ClockIcon className="w-4 h-4" />
                    </button>
                  )}
                  
                  {reservation.status !== 'cancelled' && (
                    <button
                      onClick={() => handleStatusUpdate(reservation.id, 'cancelled')}
                      disabled={updatingId === reservation.id}
                      className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 disabled:opacity-50"
                      title="Cancel Reservation"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setSelectedReservation(reservation);
                      setShowDeleteConfirm(true);
                    }}
                    disabled={deletingId === reservation.id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete Reservation"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {(updatingId === reservation.id || deletingId === reservation.id) && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReservationDashboard;