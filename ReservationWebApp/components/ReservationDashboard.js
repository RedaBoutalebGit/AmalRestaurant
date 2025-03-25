// components/ReservationDashboard.js
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Phone, Mail, RefreshCw, Check, X, 
  Clock as ClockIcon, Trash2, Search, Table, Edit, Pencil, 
  CheckCircle, UserCheck, Filter, ChevronDown, ChevronUp,
  UserX, CalendarClock, SlidersHorizontal } from 'lucide-react';
import ReservationAnalytics from './ReservationAnalytics';
import Notifications from './Notification';
import EditReservationDialog from './EditReservationDialog';

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
  const [filterCheckIn, setFilterCheckIn] = useState('all'); // 'all', 'arrived', 'expected'
  const [showFilters, setShowFilters] = useState(false);

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

  const convertCheckInStatus = (sheetStatus) => {
    // Convert "yes" from sheet to "arrived" for the app
    if (sheetStatus === "yes") return "arrived";
    // All other values (including "no" and undefined) return null
    return null;
  };

  const convertDate = (date) => {
    const [month, day, year] = date.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };
  
  const isFriday = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
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
    const appCheckInStatus = convertCheckInStatus(res.checkInStatus);
    const reservationDate = convertDate(res.date);
    const dateMatch = !filterDate || reservationDate === filterDate;
    const statusMatch = filterStatus === 'all' || res.status === filterStatus;
    const nameMatch = !searchTerm || res.name.toLowerCase().includes(searchTerm.toLowerCase());
    const isActive = showPastReservations || !isDatePassed(res.date);
    const checkInMatch = 
      filterCheckIn === 'all' || 
      (filterCheckIn === 'arrived' && (appCheckInStatus === 'arrived' || res.checkInStatus === 'yes')) || 
      (filterCheckIn === 'expected' && appCheckInStatus !== 'arrived' && res.checkInStatus !== 'yes');
    
    return dateMatch && statusMatch && nameMatch && isActive && checkInMatch; 
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

  const handleCheckIn = async (reservationId, isCheckedIn) => {
    try {
      // We'll still use 'arrived' in our app logic
      const newStatus = isCheckedIn ? 'arrived' : null;
      const checkInTime = isCheckedIn ? new Date().toLocaleTimeString() : null;
      
      console.log(`Updating check-in status for ${reservationId} to ${newStatus}, time: ${checkInTime}`);
      
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          checkInStatus: newStatus,
          checkInTime: checkInTime 
        }),
      });
    
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update check-in status');
      }
      
      // After a successful API call, update the local reservation data as well
      // This is important so your UI updates immediately
      const updatedReservations = reservations.map(res => {
        if (res.id === reservationId) {
          return {
            ...res,
            checkInStatus: isCheckedIn ? 'yes' : 'no', // Use the sheet values here
            checkInTime: checkInTime
          };
        }
        return res;
      });
      
      await onStatusUpdate();
    } catch (error) {
      console.error('Error updating check-in status:', error);
      alert('Failed to update check-in status: ' + error.message);
    }
  };
  

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

  const getEmailStatus = (reservation) => {
    switch(reservation.emailQueue) {
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
        break;
      default:
    }
    return null;
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen transition-all">
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
  
      {  /* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Reservations Dashboard</h2>
            <p className="text-gray-600 mt-1">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {filteredReservations.length > 0 
                ? `${reservations.length} total reservations` 
                : "No reservations found"
              }
            </span>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`flex items-center px-4 py-2 bg-[#fce3c5] text-orange-600 rounded-lg hover:bg-[#ffcb8c] transition-all shadow-sm ${
                isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>
  
      {/* Analytics Section */}
      <ReservationAnalytics reservations={reservations} selectedDate={filterDate} />
  
      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow mb-6 transition-all duration-200">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h3 className="text-lg font-semibold text-gray-700">Filters</h3>
            {(filterDate || filterStatus !== 'all' || searchTerm || filterCheckIn !== 'all' || showPastReservations) && (
              <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                Active
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {(filterDate || filterStatus !== 'all' || searchTerm || filterCheckIn !== 'all' || showPastReservations) && (
              <button 
                onClick={() => {
                  setFilterDate("");
                  setFilterStatus('all');
                  setSearchTerm('');
                  setFilterCheckIn('all');
                  setShowPastReservations(false);
                }}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                Clear All
              </button>
            )}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="text-gray-500 hover:text-gray-700 flex items-center text-sm bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-md transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
              {showFilters ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </button>
          </div>
        </div>

        {/* Note: the showFilters state now controls ALL filters - no longer depends on screen size */}
        <div className={`${showFilters ? 'block' : 'hidden'} transition-all duration-300 ease-in-out`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-medium text-gray-600 mb-1">Date</label>
              <div className="flex items-center space-x-2 bg-gray-50 border rounded-md p-2 focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-400 transition-all">
                <Calendar className="w-5 h-5 text-gray-500" />
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 focus:outline-none w-full"
                />
                {filterDate && (
                  <button 
                    onClick={() => setFilterDate("")} 
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Clear date filter"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-medium text-gray-600 mb-1">Status</label>
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="appearance-none bg-gray-50 border rounded-md p-2 pr-8 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 w-full transition-all"
                >
                  <option value="all">All Status</option>
                  <option value="confirmed">Confirmed</option> 
                  <option value="pending">Pending</option>      
                  <option value="waitlist">Waitlist</option>    
                  <option value="cancelled">Cancelled</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-medium text-gray-600 mb-1">Search</label>
              <div className="flex items-center space-x-2 bg-gray-50 border rounded-md p-2 focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-400 transition-all">
                <Search className="w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by guest name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 focus:outline-none w-full"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm("")} 
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex flex-col space-y-1">
              <label className="text-xs font-medium text-gray-600 mb-1">Sort Order</label>
              <div className="relative">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="appearance-none bg-gray-50 border rounded-md p-2 pr-8 focus:ring-2 focus:ring-blue-200 focus:border-blue-400 w-full transition-all"
                >
                  <option value="chronological">Earliest First</option>
                  <option value="reverse">Latest First</option>
                  <option value="guests">Guest Count</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <label className="flex items-center text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={showPastReservations}
                onChange={(e) => setShowPastReservations(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-2"
              />
              <CalendarClock className="w-4 h-4 mr-2 text-gray-500" />
              Show past reservations
            </label>
          </div>
        </div>

        {/* Check-in Filter Icons - always visible */}
        <div className="mt-4 flex justify-center md:justify-start">
          <div className="bg-white rounded-lg shadow-sm border p-1 inline-flex">
            <button
              onClick={() => setFilterCheckIn('all')}
              className={`px-4 py-2 rounded-md flex items-center ${
                filterCheckIn === 'all' 
                  ? 'bg-gray-100 text-gray-800 font-medium' 
                  : 'text-gray-500 hover:bg-gray-50'
              } transition-colors`}
              title="Show all customers"
            >
              <Filter className="w-4 h-4 mr-2" />
              All
            </button>
            <button
              onClick={() => setFilterCheckIn('arrived')}
              className={`px-4 py-2 rounded-md flex items-center ${
                filterCheckIn === 'arrived' 
                  ? 'bg-green-100 text-green-800 font-medium' 
                  : 'text-gray-500 hover:bg-gray-50'
              } transition-colors`}
              title="Show arrived customers"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Arrived
            </button>
            <button
              onClick={() => setFilterCheckIn('expected')}
              className={`px-4 py-2 rounded-md flex items-center ${
                filterCheckIn === 'expected' 
                  ? 'bg-blue-100 text-blue-800 font-medium' 
                  : 'text-gray-500 hover:bg-gray-50'
              } transition-colors`}
              title="Show expected customers"
            >
              <UserX className="w-4 h-4 mr-2" />
              Expected
            </button>
          </div>
        </div>
        
        {/* Results count */}
        {filteredReservations.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredReservations.length} reservation{filteredReservations.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
  
      {/* Reservations List */}
      <div className="space-y-4">
        {filteredReservations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="flex flex-col items-center justify-center">
              <Calendar className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg font-medium">No reservations found</p>
              <p className="text-gray-400 mt-2">Try adjusting your filters to see more results</p>
              {(filterDate || filterStatus !== 'all' || searchTerm || filterCheckIn !== 'all') && (
                <button 
                  onClick={() => {
                    setFilterDate("");
                    setFilterStatus('all');
                    setSearchTerm('');
                    setFilterCheckIn('all');
                  }}
                  className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredReservations.map((reservation, index) => (
            <div
              key={index}
              className={`rounded-lg shadow hover:shadow-md transition-all duration-200 overflow-hidden ${
                isFriday(reservation.date) 
                  ? 'bg-yellow-50 border-l-4 border-yellow-500' 
                  : reservation.checkInStatus === 'arrived' || reservation.checkInStatus === 'yes'
                    ? 'bg-green-50 border-l-4 border-green-500'
                    : 'bg-white'
              }`}
            >
              <div className="p-4 md:p-6">
                {/* Reservation Header with Status */}
                <div className="flex flex-wrap justify-between items-start mb-4 gap-2">
                  <div className="flex items-center">
                    <div className="font-bold text-lg text-gray-800 mr-3">{reservation.name}</div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      reservation.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                      reservation.status === 'waitlist' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {reservation.status}
                    </span>
                    {getEmailStatus(reservation)}
                  </div>
                  
                  {/* Reservation Date/Time in a Card-like element */}
                  <div className="flex items-center bg-white shadow-sm rounded-lg p-2 border border-gray-100">
                    <div className="flex items-center mr-4">
                      <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-gray-700">{reservation.date}</span>
                      {isFriday(reservation.date) && (
                        <span className="ml-2 text-xs font-medium px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">
                          Couscous Day
                        </span>
                      )}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-gray-700">{reservation.time}</span>
                    </div>
                  </div>
                </div>
                
                {/* Reservation Details in Cards Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Guest Information Card */}
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                    <h4 className="text-xs uppercase text-gray-500 font-semibold mb-2">Guest Details</h4>
                    <div className="flex items-center mb-2">
                      <Users className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-gray-700">{reservation.guests} guests</span>
                    </div>
                    {reservation.phone && (
                      <div className="flex items-center mb-2">
                        <Phone className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-gray-700">{reservation.phone}</span>
                      </div>
                    )}
                    {reservation.email && (
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-gray-700 truncate">{reservation.email}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Check-in Status Card */}
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                    <h4 className="text-xs uppercase text-gray-500 font-semibold mb-2">Check-in Status</h4>
                    <div className="flex items-center">
                      {reservation.checkInStatus === 'yes' ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="w-5 h-5 mr-2" />
                          <div>
                            <div className="font-medium">Arrived</div>
                            <div className="text-xs text-gray-500">
                              {reservation.checkInTime || 'Time not recorded'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center text-blue-600">
                          <Clock className="w-5 h-5 mr-2" />
                          <div>
                            <div className="font-medium">Expected</div>
                            <div className="text-xs text-gray-500">Not yet arrived</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Table Assignment Card */}
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                    <h4 className="text-xs uppercase text-gray-500 font-semibold mb-2">Table Assignment</h4>
                    {reservation.table ? (
                      <div className="flex items-center">
                        <Table className="w-5 h-5 text-blue-600 mr-2" />
                        <div className="font-medium">Table {reservation.table}</div>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-500">
                        <Table className="w-5 h-5 mr-2" />
                        <div>No table assigned</div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Notes Section - Styled with better visibility */}
                {reservation.notes && (
                  <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="font-medium text-gray-700 mb-1">Notes:</div>
                    <div>{reservation.notes}</div>
                  </div>
                )}
                
                {/* Action Buttons - Grouped with better visibility and tooltips */}
                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-4">
                  {/* Primary Actions */}
                  <div className="flex items-center gap-2 mr-auto">
                    {/* Status Update Buttons */}
                    {reservation.status !== 'confirmed' && (
                      <button
                        onClick={() => handleStatusUpdate(reservation.id, 'confirmed')}
                        className="flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                        title="Confirm this reservation"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Confirm
                      </button>
                    )}
                    
                    {reservation.status !== 'cancelled' && (
                      <button
                        onClick={() => handleStatusUpdate(reservation.id, 'cancelled')}
                        className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                        title="Cancel this reservation"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleCheckIn(reservation.id, reservation.checkInStatus !== 'yes')}
                      className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                        reservation.checkInStatus === 'yes' 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      }`}
                      title={reservation.checkInStatus === 'yes' ? "Mark as not arrived" : "Mark as arrived"}
                    >
                      {reservation.checkInStatus === 'yes' 
                        ? <><Check className="w-4 h-4 mr-1" /> Checked In</> 
                        : <><UserCheck className="w-4 h-4 mr-1" /> Check In</>}
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedReservation(reservation);
                        setSelectedTable(reservation.table || '');
                        setShowTableDialog(true);
                      }}
                      className="flex items-center px-3 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                      title="Assign or change table"
                    >
                      <Table className="w-4 h-4 mr-1" />
                      {reservation.table ? `Change Table` : `Assign Table`}
                    </button>
                  </div>
                  
                  {/* Secondary Actions */}
                  <div className="flex items-center gap-2 border-l pl-3 border-gray-200">
                    <button
                      onClick={() => {
                        setSelectedReservation(reservation);
                        setShowEditDialog(true);
                      }}
                      className="flex items-center p-2 bg-orange-50 text-orange-600 rounded-md hover:bg-orange-100 transition-colors"
                      title="Edit reservation details"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="sr-only md:not-sr-only md:ml-1">Edit</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedReservation(reservation);
                        setShowDeleteConfirm(true);
                      }}
                      disabled={deletingId === reservation.id}
                      className="flex items-center p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete reservation"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="sr-only md:not-sr-only md:ml-1">Delete</span>
                    </button>
                    
                    {/* Loading Indicator */}
                    {(updatingId === reservation.id || deletingId === reservation.id) && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    )}
                  </div>
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