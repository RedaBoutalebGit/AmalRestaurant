// components/ReservationDashboard.js
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Phone, Mail, RefreshCw, Check, X, Clock as ClockIcon, Trash2, Search, Table, Edit, Pencil } from 'lucide-react';
import ReservationAnalytics from './ReservationAnalytics';
import Notifications from './Notification';
import EditReservationDialog from './EditReservationDialog';
import CheckInStatus from './CheckInStatus';

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
  const [sortOrder, setSortOrder] = useState('chronological');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPastReservations, setShowPastReservations] = useState(false);


  // Auto refresh every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      handleRefresh();
    }, 60000); // 60 seconds

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
        body: JSON.stringify({ 
          status: newStatus,
          sendEmail: newStatus === 'confirmed' // This triggers the email
        }),
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
    // console.log('Checking date:', dateString, 'Day:', date.getDay());
    return date.getDay() === 5; // 5 corresponds to Friday
  };
  const isDatePassed = (reservationDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for fair comparison
    
    // Convert reservation date from MM/DD/YYYY to Date object
    const [month, day, year] = reservationDate.split('/');
    const date = new Date(year, month - 1, day);
    return date < today;
  };

  const filteredReservations = reservations
  .filter(res => {
    const reservationDate = convertDate(res.date);
    const dateMatch = !filterDate || reservationDate === filterDate;
    const statusMatch = filterStatus === 'all' || res.status === filterStatus;
    const nameMatch = !searchTerm || res.name.toLowerCase().includes(searchTerm.toLowerCase());
    const isActive = showPastReservations || !isDatePassed(res.date); // Modified line
    return dateMatch && statusMatch && nameMatch && isActive;
  })
  .sort((a, b) => {
    switch (sortOrder) {
      case 'chronological':
        const dateA = new Date(convertDate(a.date) + ' ' + a.time);
        const dateB = new Date(convertDate(b.date) + ' ' + b.time);
        return dateA - dateB;
      case 'reverse':
        const date1 = new Date(convertDate(a.date) + ' ' + a.time);
        const date2 = new Date(convertDate(b.date) + ' ' + b.time);
        return date2 - date1;
      case 'guests':
        return b.guests - a.guests;
      default:
        return 0;
    }
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

  const handleEdit = async (updatedData) => {
    try {
      // console.log('Starting edit with data:', updatedData);
      
      const response = await fetch(`/api/reservations/${selectedReservation.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          date: updatedData.date,
          time: updatedData.time,
          name: updatedData.name,
          guests: updatedData.guests,
          phone: updatedData.phone,
          email: updatedData.email,
          notes: updatedData.notes,
          status: updatedData.status,
          // Preserve existing values
          source: selectedReservation.source,
          table: selectedReservation.table
        }),
      });
  
      const responseData = await response.json();
     //  console.log('Edit response:', responseData);
  
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update reservation');
      }
  
      await onStatusUpdate(); // Refresh the list
      setShowEditDialog(false);
    } catch (error) {
      console.error('Error in handleEdit:', error);
      alert('Failed to update reservation: ' + error.message);
    }
  };
  
  const handleTableAssign = async (reservationId, tableNumber) => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ table: tableNumber }),
      });

      if (!response.ok) throw new Error('Failed to assign table');
      await onStatusUpdate();
      setShowTableDialog(false);
      setSelectedTable('');
    } catch (error) {
      console.error('Error assigning table:', error);
      alert('Failed to assign table');
    }
  };
  const renderSortOptions = () => (
    <select
      value={sortOrder}
      onChange={(e) => setSortOrder(e.target.value)}
      className="border rounded p-2 focus:ring-2 focus:ring-blue-500"
    >
      <option value="chronological">Earliest First</option>
      <option value="reverse">Latest First</option>
      <option value="guests">Guest Count</option>
    </select>
  );
  const getEmailStatus = (reservation) => {
    switch(reservation.emailQueue) { // Column L
      case 'queued':
        return (
          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
            Email Queued
          </span>
        );
      case 'processing':
        return (
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
            Sending Email...
          </span>
        );
      case null:
        if (reservation.emailSent) { // Column M has timestamp
          return (
            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
              Email Sent
            </span>
          );
        }
        break;
      default:
        if (reservation.emailQueue?.startsWith('failed:')) {
          return (
            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
              Email Failed
            </span>
          );
        }
    }
    return null;
  };
  

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <Notifications reservations={reservations} />
      {showDeleteConfirm && <DeleteConfirmDialog reservation={selectedReservation} />}
      {showTableDialog && <TableAssignDialog reservation={selectedReservation} />}
      {showEditDialog && selectedReservation && (
        <EditReservationDialog
          reservation={selectedReservation}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedReservation(null); // Clear selected reservation
          }}
          onSave={handleEdit}
        />
      )}
  
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="border rounded p-2 focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>
          <div className="flex items-center space-x-2">
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
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by guest name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border rounded p-2 focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="border rounded p-2 focus:ring-2 focus:ring-blue-500 w-full"
            >
              <option value="chronological">Earliest First</option>
              <option value="reverse">Latest First</option>
              <option value="guests">Guest Count</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
    <label className="text-sm text-gray-600">
      <input
        type="checkbox"
        checked={showPastReservations}
        onChange={(e) => setShowPastReservations(e.target.checked)}
        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
      />
      <span className="ml-2">Show past reservations</span>
    </label>
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
              className={`rounded-lg shadow p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between hover:shadow-md transition-shadow ${
                isFriday(reservation.date) 
                  ? 'bg-yellow-50 border-l-4 border-yellow-500' 
                  : 'bg-white'
              }`}
            >
              {/* Reservation Details */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-8">
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
  
              {/* Notes Section */}
              {reservation.notes && (
                <div className="mt-4 lg:mt-0 text-sm text-gray-600 bg-gray-50 p-2 rounded w-full lg:w-auto">
                  <strong>Notes:</strong> {reservation.notes}
                </div>
              )}
  
              {/* Actions Section */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-4 mt-4 lg:mt-0">
                {/* Status Badge */}
                <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  reservation.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                  reservation.status === 'waitlist' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {reservation.status}
                </span>
                {getEmailStatus(reservation)}
                </div>
  
                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  {/* Edit Button */}
                  <button
                    onClick={() => {
                      setSelectedReservation(reservation);
                      setShowEditDialog(true);
                    }}
                    className="p-2 bg-orange-50 text-orange-600 rounded-full hover:bg-orange-100"
                    title="Edit Reservation"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
  
                  {/* Table Assignment */}
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
  
                  {/* Current Table Display */}
                  {reservation.table && (
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">
                      Table {reservation.table}
                    </span>
                  )}
  
                  {/* Status Update Buttons */}
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

                  {/*CheckInStatus */}
                    <CheckInStatus 
                      reservation={reservation} 
                      onStatusChange={(id, status) => {
                        // Update the local state to reflect the change
                        setReservations(prevReservations => 
                          prevReservations.map(r => 
                            r.id === id ? {...r, checkedIn: status} : r
                          )
                        );
                      }}
                    />
  
                  {/* Delete Button */}
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
  
                  {/* Loading Indicator */}
                  {(updatingId === reservation.id || deletingId === reservation.id) && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReservationDashboard;