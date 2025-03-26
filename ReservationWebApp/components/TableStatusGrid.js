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
      section: 'Garden A'
    })),
    
    // Tables 20-28: Garden A
    ...Array.from({ length: 9 }, (_, i) => ({
      id: i + 20,
      name: String(i + 20),
      available: true,
      reservation: null,
      section: 'Garden A'
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
      section: 'Garden A'
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

  return (
    <div className="bg-white shadow rounded-lg mb-6 overflow-hidden">
      {/* Header with toggle button */}
      <div 
        className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50"
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
        <div className="px-4 pb-6">
          {/* Render tables by section */}
          {['Garden A', 'Garden B', 'Hall', 'Salon'].map(section => (
            <div key={section} className="mb-6">
              <h4 className="text-md font-semibold mb-2 text-gray-700">{section}</h4>
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-2">
                {tables
                  .filter(table => table.section === section)
                  .map(table => (
                    <div
                      key={table.id}
                      className={`
                        p-2 rounded-lg shadow cursor-pointer transition-all flex flex-col items-center justify-center
                        ${table.available ? 'bg-green-100 hover:bg-green-200' : 'bg-red-100 hover:bg-red-200'}
                      `}
                    >
                      <div 
                        className="text-base font-bold"
                        onClick={() => toggleTableStatus(table.id)}
                      >
                        {table.name}
                      </div>
                      <div 
                        className={`text-xs ${table.available ? 'text-green-800' : 'text-red-800'}`}
                        onClick={() => toggleTableStatus(table.id)}
                      >
                        {table.available ? 'Free' : 'Busy'}
                      </div>
                      {table.reservation && (
                        <div className="text-xs text-gray-600 text-center">
                          <div className="font-medium truncate max-w-full w-16">{table.reservation.name.split(' ')[0]}</div>
                          <div>{table.reservation.guests}p</div>
                          <button 
                            className="mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-sm text-xs hover:bg-blue-200"
                            onClick={() => freeTable(table.id)}
                          >
                            Checkout
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
          <p className="mt-4 text-xs text-gray-500">
            Click on a table to manually toggle its availability. Tables will automatically update when reservations are assigned.
          </p>
        </div>
      )}
    </div>
  );
};

export default TableStatusGrid;