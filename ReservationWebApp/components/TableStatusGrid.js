import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const TableStatusGrid = ({ reservations = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  // Generate tables from 1 to 60
  const [tables, setTables] = useState(
    Array.from({ length: 60 }, (_, index) => ({
      id: index + 1,
      name: String(index + 1),
      available: true,
      reservation: null
    }))
  );

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
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-2">
            {tables.map((table) => (
              <div
                key={table.id}
                onClick={() => toggleTableStatus(table.id)}
                className={`
                  p-2 rounded-lg shadow cursor-pointer transition-all flex flex-col items-center justify-center
                  ${table.available ? 'bg-green-100 hover:bg-green-200' : 'bg-red-100 hover:bg-red-200'}
                `}
              >
                <div className="text-base font-bold">{table.name}</div>
                <div className={`text-xs ${table.available ? 'text-green-800' : 'text-red-800'}`}>
                  {table.available ? 'Free' : 'Busy'}
                </div>
                {table.reservation && (
                  <div className="text-xs text-gray-600 text-center">
                    <div className="font-medium truncate max-w-full w-16">{table.reservation.name.split(' ')[0]}</div>
                    <div>{table.reservation.guests}p</div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Click on a table to manually toggle its availability. Tables will automatically update when reservations are assigned.
          </p>
        </div>
      )}
    </div>
  );
};

export default TableStatusGrid;