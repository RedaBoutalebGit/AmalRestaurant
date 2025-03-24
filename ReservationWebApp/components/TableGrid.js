// components/TableGrid.js
import React, { useState, useEffect } from 'react';

const TableGrid = ({ reservations, onTableStatusChange }) => {
  // Number of tables in the restaurant
  const totalTables = 60;
  
  // State to track which tables are occupied
  const [occupiedTables, setOccupiedTables] = useState({});
  
  // Initialize table status from reservations that have tables assigned
  useEffect(() => {
    if (reservations && reservations.length > 0) {
      const tableStatus = {};
      reservations.forEach(reservation => {
        if (reservation.table && reservation.checkedIn === 'yes') {
          tableStatus[reservation.table] = {
            occupied: true,
            reservation: reservation
          };
        }
      });
      setOccupiedTables(tableStatus);
    }
  }, [reservations]);
  
  // Handle clicking on a table to mark it as free/occupied
  const handleTableClick = (tableNumber) => {
    setOccupiedTables(prev => {
      const newStatus = { ...prev };
      
      // If table has a reservation, we don't allow manual toggling
      if (newStatus[tableNumber]?.reservation) {
        return prev;
      }
      
      // Toggle the occupied status
      if (newStatus[tableNumber]) {
        delete newStatus[tableNumber]; // Free up the table
      } else {
        newStatus[tableNumber] = { occupied: true }; // Occupy the table without reservation
      }
      
      // Call the callback if provided
      if (onTableStatusChange) {
        onTableStatusChange(tableNumber, newStatus[tableNumber] ? true : false);
      }
      
      return newStatus;
    });
  };
  
  // Get the color for a table based on its status
  const getTableColor = (tableNumber) => {
    if (occupiedTables[tableNumber]) {
      // If table has a reservation, it's a different color than manually occupied tables
      return occupiedTables[tableNumber].reservation 
        ? 'bg-blue-500 text-white' 
        : 'bg-red-500 text-white';
    }
    return 'bg-green-100 hover:bg-green-200 text-green-800';
  };
  
  // Get the tooltip text for a table
  const getTableTooltip = (tableNumber) => {
    if (occupiedTables[tableNumber]?.reservation) {
      const res = occupiedTables[tableNumber].reservation;
      return `${res.name} - ${res.guests} guests`;
    }
    return occupiedTables[tableNumber] ? 'Occupied (manually set)' : 'Available';
  };
  
  // Create an array of table numbers from 1 to totalTables
  const tableNumbers = Array.from({ length: totalTables }, (_, i) => i + 1);
  
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Table Status</h2>
      
      <div className="flex flex-wrap gap-2">
        {tableNumbers.map(tableNumber => (
          <button
            key={tableNumber}
            onClick={() => handleTableClick(tableNumber.toString())}
            className={`w-12 h-12 rounded-md flex items-center justify-center font-medium cursor-pointer transition-colors ${getTableColor(tableNumber.toString())}`}
            title={getTableTooltip(tableNumber.toString())}
          >
            {tableNumber}
          </button>
        ))}
      </div>
      
      <div className="flex items-center justify-end mt-4 space-x-4 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-100 rounded mr-2"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
          <span>Reservation</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
          <span>Occupied (Manual)</span>
        </div>
      </div>
    </div>
  );
};

export default TableGrid;