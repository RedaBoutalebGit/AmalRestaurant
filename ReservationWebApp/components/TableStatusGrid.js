import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';

const TableStatusGrid = ({ reservations = [] }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Tables organized by section
  const [tables, setTables] = useState([
    // Tables 1-10: Garden A
    ...Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: String(i + 1),
      available: true,
      reservation: null,
      section: 'Garden A (1-10)'
    })),
    
    // Tables 20-28: Garden A
    ...Array.from({ length: 9 }, (_, i) => ({
      id: i + 20,
      name: String(i + 20),
      available: true,
      reservation: null,
      section: 'Garden A (20-28)'
    })),
    
    // Tables 30-39: Garden B
    ...Array.from({ length: 10 }, (_, i) => ({
      id: i + 30,
      name: String(i + 30),
      available: true,
      reservation: null,
      section: 'Garden B'
    })),
    
    // Tables 40-43: Hall
    ...Array.from({ length: 4 }, (_, i) => ({
      id: i + 40,
      name: String(i + 40),
      available: true,
      reservation: null,
      section: 'Hall'
    })),
    
    // Tables 50-57: Salon
    ...Array.from({ length: 8 }, (_, i) => ({
      id: i + 50,
      name: String(i + 50),
      available: true,
      reservation: null,
      section: 'Salon'
    })),
    
    // Tables 60-67: Garden A
    ...Array.from({ length: 8 }, (_, i) => ({
      id: i + 60,
      name: String(i + 60),
      available: true,
      reservation: null,
      section: 'Garden A (60-67)'
    }))
  ]);

  // Toggle the expanded state of the section
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Toggle the availability of a table manually
  const toggleTableStatus = (tableId) => {
    setTables(tables.map(table => {
      if (table.id === tableId) {
        return {
          ...table,
          available: !table.available,
          // Clear reservation if making available
          reservation: !table.available ? null : table.reservation
        };
      }
      return table;
    }));
  };

  // Free up a table and update the reservation status
  const freeTable = async (tableId) => {
    // Find the table and its reservation
    const table = tables.find(t => t.id === tableId);
    if (!table || !table.reservation) return;
    
    // Free the table locally
    setTables(tables.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          available: true,
          reservation: null
        };
      }
      return t;
    }));
    
    // Get the reservation ID
    const reservationId = table.reservation.id;
    
    // Update the reservation in the database to remove table assignment
    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          table: '' // Remove table assignment
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update reservation');
      }
      
    } catch (error) {
      console.error('Error freeing table:', error);
      // Revert the local state change if API call fails
      setTables(tables); // This will reset to the previous state
    }
  };

  // Update tables based on reservations
  useEffect(() => {
    // Create a copy of the current tables
    const updatedTables = [...tables];
    
    // First reset all tables that don't have a current reservation
    updatedTables.forEach(table => {
      if (table.reservation && !reservations.find(r => r.id === table.reservation.id)) {
        table.available = true;
        table.reservation = null;
      }
    });
    
    // Then update tables based on current reservations
    reservations.forEach(reservation => {
      // If reservation has a table assigned
      if (reservation.table) {
        const tableId = parseInt(reservation.table);
        const tableIndex = updatedTables.findIndex(t => t.id === tableId);
        
        if (tableIndex !== -1) {
          updatedTables[tableIndex] = {
            ...updatedTables[tableIndex],
            available: false,
            reservation: {
              id: reservation.id,
              name: reservation.name,
              time: reservation.time,
              guests: reservation.guests
            }
          };
        }
      }
    });
    
    setTables(updatedTables);
  }, [reservations]);

  // Render a table button with visible reservation info
  const renderTable = (table) => (
    <div
      key={table.id}
      className={`relative w-20 h-20 flex flex-col items-center justify-center rounded-lg cursor-pointer text-sm font-medium overflow-hidden
        ${table.available 
          ? 'bg-green-100 hover:bg-green-200 text-green-800' 
          : 'bg-red-100 hover:bg-red-200 text-red-800'
        }`}
      onClick={() => toggleTableStatus(table.id)}
    >
      {/* Table number always visible */}
      <div className="text-lg font-bold">{table.name}</div>
      
      {/* Reservation details shown directly on busy tables */}
      {!table.available && table.reservation && (
        <div className="text-xs leading-tight text-center mt-2 px-1 w-full overflow-hidden text-ellipsis">
          <div className="font-medium truncate">{table.reservation.name}</div>
          <div className="flex items-center justify-center space-x-1 mt-1">
            <Users size={12} />
            <span>{table.reservation.guests}</span>
          </div>
        </div>
      )}
      
      {/* Checkout button */}
      {!table.available && table.reservation && (
        <div 
          className="absolute bottom-0 right-0 w-8 h-8 rounded-tl-lg bg-blue-500 flex items-center justify-center text-white"
          onClick={(e) => {
            e.stopPropagation();
            freeTable(table.id);
          }}
        >
          <span className="text-sm">✓</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white shadow rounded-lg mb-6 overflow-hidden">
      {/* Header with toggle button */}
      <div 
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
        onClick={toggleExpanded}
      >
        <h3 className="text-lg font-medium text-gray-800">Table Status</h3>
        <button className="text-gray-500 hover:text-gray-700">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
      </div>
      
      {/* Collapsible content */}
      {isExpanded && (
        <div className="p-4">
          {/* Top row - Garden A (60-67), Garden A (1-10), Garden B (30-39) */}
          <div className="flex flex-col space-y-8">
            <div className="flex flex-row space-x-6">
              {/* Garden A (60-67) */}
              <div className="flex-1 bg-gray-100 rounded-lg p-4">
                <div className="text-md font-semibold mb-3 text-center">Garden A (60-67)</div>
                <div className="flex flex-wrap gap-3 justify-center">
                  {tables
                    .filter(t => t.section === 'Garden A (60-67)')
                    .map(renderTable)}
                </div>
              </div>
              
              {/* Garden A (1-10) */}
              <div className="flex-1 bg-gray-100 rounded-lg p-4">
                <div className="text-md font-semibold mb-3 text-center">Garden A (1-10)</div>
                <div className="flex flex-wrap gap-3 justify-center">
                  {tables
                    .filter(t => t.section === 'Garden A (1-10)')
                    .map(renderTable)}
                </div>
              </div>
              
              {/* Garden A (20-28) */}
              <div className="flex-1 bg-gray-100 rounded-lg p-4">
                <div className="text-md font-semibold mb-3 text-center">Garden A (20-28)</div>
                <div className="flex flex-wrap gap-3 justify-center">
                  {tables
                    .filter(t => t.section === 'Garden A (20-28)')
                    .map(renderTable)}
                </div>
              </div>
            </div>
            
            {/* Bottom row - Garden B (30-39), Hall (40-43), Salon (50-57) */}
            <div className="flex flex-row space-x-6">
              {/* Garden B (30-39) */}
              <div className="flex-1 bg-gray-100 rounded-lg p-4">
                <div className="text-md font-semibold mb-3 text-center">Garden B (30-39)</div>
                <div className="flex flex-wrap gap-3 justify-center">
                  {tables
                    .filter(t => t.section === 'Garden B')
                    .map(renderTable)}
                </div>
              </div>
              
              {/* Hall (40-43) */}
              <div className="flex-1 bg-gray-100 rounded-lg p-4">
                <div className="text-md font-semibold mb-3 text-center">Hall (40-43)</div>
                <div className="flex flex-wrap gap-3 justify-center">
                  {tables
                    .filter(t => t.section === 'Hall')
                    .map(renderTable)}
                </div>
              </div>
              
              {/* Salon (50-57) */}
              <div className="flex-1 bg-gray-100 rounded-lg p-4">
                <div className="text-md font-semibold mb-3 text-center">Salon (50-57)</div>
                <div className="flex flex-wrap gap-3 justify-center">
                  {tables
                    .filter(t => t.section === 'Salon')
                    .map(renderTable)}
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-6 text-sm justify-center">
            <div className="flex items-center">
              <div className="w-5 h-5 bg-green-100 rounded-md mr-2"></div>
              <span className="text-gray-700">Free</span>
            </div>
            <div className="flex items-center">
              <div className="w-5 h-5 bg-red-100 rounded-md mr-2"></div>
              <span className="text-gray-700">Busy</span>
            </div>
            <div className="flex items-center">
              <div className="relative w-5 h-5 mr-2">
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-tl-md"></div>
              </div>
              <span className="text-gray-700">Checkout</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableStatusGrid;