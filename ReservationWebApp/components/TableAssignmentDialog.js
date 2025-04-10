// components/TableAssignmentDialog.js
import React, { useState, useEffect, useRef } from 'react';
import { X, Table, Clock, Info } from 'lucide-react';

const TableAssignmentDialog = ({ reservation, onClose, onAssign }) => {
  const [tableNumber, setTableNumber] = useState(reservation.table || '');
  const [serviceTime, setServiceTime] = useState('');
  const [notes, setNotes] = useState(reservation.notes || '');
  const inputRef = useRef(null);
  
  // Define service times
  const serviceTimes = [
    { id: 'first', name: '1st Service', time: '12:00 - 14:00' },
    { id: 'second', name: '2nd Service', time: '14:00 - 15:30' }
  ];
  
  // Determine initial service based on reservation time
  useEffect(() => {
    if (reservation.time) {
      // Check if the time includes AM/PM format or is in 24-hour format
      const timeStr = reservation.time.toLowerCase();
      let hour = 0;
      
      if (timeStr.includes('am') || timeStr.includes('pm')) {
        // Handle 12-hour format (e.g., "2:30 PM")
        const isPM = timeStr.includes('pm');
        const timeParts = timeStr.replace(/(am|pm)/i, '').trim().split(':');
        hour = parseInt(timeParts[0]);
        
        // Convert to 24-hour format
        if (isPM && hour < 12) hour += 12;
        if (!isPM && hour === 12) hour = 0;
      } else {
        // Handle 24-hour format (e.g., "14:30")
        hour = parseInt(reservation.time.split(':')[0]);
      }
      
      // Set service based on hour
      if (hour >= 12 && hour < 14) {
        setServiceTime('first');
      } else if (hour >= 14 && hour < 15.5) {
        setServiceTime('second');
      } else {
        // Default to first service if time doesn't match
        setServiceTime('first');
      }
    } else {
      setServiceTime('first'); // Default
    }
  }, [reservation.time]);
  
  // Focus the input field when the dialog opens
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate table number
    if (!tableNumber || tableNumber === '') {
      alert('Please enter a valid table number');
      return;
    }
    
    // Include service time in notes if it's not already in the reservation time
    let updatedNotes = notes;
    const serviceInfo = serviceTimes.find(s => s.id === serviceTime);
    
    if (serviceInfo) {
      const serviceNote = `Table ${tableNumber} assigned for ${serviceInfo.name} (${serviceInfo.time})`;
      
      // Only add the service note if it's not already there
      if (!updatedNotes.includes(serviceInfo.name)) {
        updatedNotes = updatedNotes ? `${updatedNotes}\n${serviceNote}` : serviceNote;
      }
    }
    
    // Call the onAssign function with table number, updated notes, and service
    onAssign(reservation.id, tableNumber, updatedNotes, serviceTime);
  };

  // Handle input changes
  const handleInputChange = (e) => {
    setTableNumber(e.target.value);
  };
  
  // Handle notes changes
  const handleNotesChange = (e) => {
    setNotes(e.target.value);
  };

  // Handle key press events
  const handleKeyPress = (e) => {
    // If Escape key is pressed, close the dialog
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4"
        onKeyDown={handleKeyPress}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-blue-600">Assign Table</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
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
            
            <div className="mb-4">
              <label htmlFor="table-number" className="block text-sm font-medium text-gray-700 mb-2">
                Table Number
              </label>
              <input
                id="table-number"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={tableNumber}
                onChange={handleInputChange}
                ref={inputRef}
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter table number"
                required
                autoFocus
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Time
              </label>
              <div className="grid grid-cols-2 gap-4">
                {serviceTimes.map((service) => (
                  <div 
                    key={service.id}
                    className={`border rounded-lg p-3 cursor-pointer flex flex-col items-center transition-colors ${
                      serviceTime === service.id 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setServiceTime(service.id)}
                  >
                    <div className="flex items-center mb-1">
                      <Clock className="w-4 h-4 mr-2" />
                      <span className="font-medium">{service.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{service.time}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={handleNotesChange}
                rows={3}
                className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Add any special notes or requests"
              />
              <div className="mt-1 flex items-center text-xs text-gray-500">
                <Info className="w-3 h-3 mr-1" />
                <span>Table assignment will be automatically added to notes</span>
              </div>
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
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
            >
              <Table className="w-4 h-4 mr-2" />
              Assign Table
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TableAssignmentDialog;