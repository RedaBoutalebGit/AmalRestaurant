// src/components/TableAssignmentDialog.js
import React, { useState } from 'react';
import { X, Table } from 'lucide-react';

const TableAssignmentDialog = ({ reservation, onClose, onAssign }) => {
  const [tableNumber, setTableNumber] = useState(reservation.table || '');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onAssign(reservation.id, tableNumber);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-blue-600">Assign Table</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <p className="text-gray-700 mb-4">Assign table for reservation:</p>
            <div className="p-4 bg-gray-50 rounded mb-4">
              <p><strong>Guest:</strong> {reservation.name}</p>
              <p><strong>Date:</strong> {reservation.date}</p>
              <p><strong>Time:</strong> {reservation.time}</p>
              <p><strong>Guests:</strong> {reservation.guests}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Table Number
              </label>
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                placeholder="Enter table number"
                required
              />
            </div>
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Assign Table
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TableAssignmentDialog;