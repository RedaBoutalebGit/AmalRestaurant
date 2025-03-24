// components/TableGrid.js
import React, { useState, useEffect } from 'react';

const TableGrid = ({ onTableStatusChange }) => {
  // Number of tables in the restaurant
  const totalTables = 60;
  
  // State to track which tables are occupied (simple object with table numbers as keys)
  const [occupiedTables, setOccupiedTables] = useState({});
  
  // Handle clicking on a table to mark it as free/occupied
  const handleTableClick = (tableNumber) => {
    setOccupiedTables(prev => {
      const newStatus = { ...prev };
      
      // Toggle the occupied status
      if (newStatus[tableNumber]) {
        delete newStatus[tableNumber]; // Free up the table
      } else {
        newStatus[tableNumber] = true; // Occupy the table
      }
      
      // Call the callback if provided
      if (onTableStatusChange) {
        onTableStatusChange(tableNumber, newStatus[tableNumber] ? true : false);
      }
      
      return newStatus;
    });
  };
  
  // Method to update table status from outside
  // This can be called from the parent component when a table is assigned
  useEffect(() => {
    // Add a method to the window object to allow updating table status from outside
    window.updateTableStatus = (tableNumber, isOccupied) => {
      setOccupiedTables(prev => {
        const newStatus = { ...prev };
        
        if (isOccupied) {
          newStatus[tableNumber] = true;
        } else {
          delete newStatus[tableNumber];
        }
        
        return newStatus;
      });
    };
    
    return () => {
      // Clean up
      delete window.updateTableStatus;
    };
  }, []);
  
  // Get the color for a table based on its status
  const getTableColor = (tableNumber) => {
    return occupiedTables[tableNumber]
      ? 'bg-red-500 text-white'
      : 'bg-green-100 hover:bg-green-200 text-green-800';
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
            title={occupiedTables[tableNumber] ? 'Occupied' : 'Available'}
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
          <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
          <span>Occupied</span>
        </div>
      </div>
    </div>
  );
};

export default TableGrid;