import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const TableStatusGrid = ({ reservations = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
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
      
      // No need to update local state again as it's already updated above
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

  // Render a table button
  const renderTable = (table) => (
    <div
      key={table.id}
      className={`w-7 h-7 flex items-center justify-center rounded-full cursor-pointer text-xs font-medium
        ${table.available 
          ? 'bg-green-100 hover:bg-green-200 text-green-800' 
          : 'bg-red-100 hover:bg-red-200 text-red-800'
        }`}
      onClick={() => toggleTableStatus(table.id)}
      title={table.reservation ? `${table.reservation.name} - ${table.reservation.guests}p` : `Table ${table.name}`}
    >
      {table.name}
      {table.reservation && (
        <div 
          className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-blue-500" 
          onClick={(e) => {
            e.stopPropagation();
            freeTable(table.id);
          }}
          title="Checkout"
        />
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
        <div className="px-3 pb-3">
          {/* Restaurant layout */}
          <div className="grid grid-cols-3 gap-2">
            {/* Top row */}
            <div className="bg-gray-100 rounded-md p-2 mb-2">
              <div className="text-sm font-medium mb-1">Garden A (60-67)</div>
              <div className="flex flex-wrap gap-1 justify-center">
                {tables
                  .filter(t => t.section === 'Garden A (60-67)')
                  .map(renderTable)}
              </div>
            </div>
            
            <div className="col-span-1"></div>
            
            <div className="bg-gray-100 rounded-md p-2 mb-2">
              <div className="text-sm font-medium mb-1">Garden B (30-39)</div>
              <div className="flex flex-wrap gap-1 justify-center">
                {tables
                  .filter(t => t.section === 'Garden B')
                  .map(renderTable)}
              </div>
            </div>

            {/* Middle row */}
            <div className="bg-gray-100 rounded-md p-2 mb-2">
              <div className="text-sm font-medium mb-1">Garden A (1-10)</div>
              <div className="flex flex-wrap gap-1 justify-center">
                {tables
                  .filter(t => t.section === 'Garden A (1-10)')
                  .map(renderTable)}
              </div>
            </div>
            
            <div className="col-span-1"></div>
            
            <div className="bg-gray-100 rounded-md p-2 mb-2">
              <div className="text-sm font-medium mb-1">Garden A (20-28)</div>
              <div className="flex flex-wrap gap-1 justify-center">
                {tables
                  .filter(t => t.section === 'Garden A (20-28)')
                  .map(renderTable)}
              </div>
            </div>

            {/* Bottom row */}
            <div className="bg-gray-100 rounded-md p-2">
              <div className="text-sm font-medium mb-1">Hall (40-43)</div>
              <div className="flex flex-wrap gap-1 justify-center">
                {tables
                  .filter(t => t.section === 'Hall')
                  .map(renderTable)}
              </div>
            </div>
            
            <div className="col-span-1"></div>
            
            <div className="bg-gray-100 rounded-md p-2">
              <div className="text-sm font-medium mb-1">Salon (50-57)</div>
              <div className="flex flex-wrap gap-1 justify-center">
                {tables
                  .filter(t => t.section === 'Salon')
                  .map(renderTable)}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-2 flex flex-wrap gap-3 text-xs justify-center">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-100 rounded-full mr-1"></div>
              <span className="text-gray-600">Free</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-100 rounded-full mr-1"></div>
              <span className="text-gray-600">Busy</span>
            </div>
            <div className="flex items-center">
              <div className="relative w-3 h-3 mr-1">
                <div className="absolute bottom-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <span className="text-gray-600">Checkout</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableStatusGrid;