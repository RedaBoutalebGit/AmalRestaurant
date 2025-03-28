import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Users, X } from 'lucide-react';

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
  const freeTable = async (tableId, event) => {
    event.stopPropagation();
    
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

  // Render a table button with improved UI
  const renderTable = (table) => {
    const isOccupied = !table.available && table.reservation;
    
    return (
      <div
        key={table.id}
        className={`relative w-20 h-20 flex flex-col justify-start text-sm font-medium rounded-lg cursor-pointer overflow-hidden transition-all hover:shadow-md
          ${isOccupied 
            ? 'bg-red-100 hover:bg-red-200 text-red-800' 
            : 'bg-green-100 hover:bg-green-200 text-green-800'
          }`}
        onClick={() => toggleTableStatus(table.id)}
      >
        {/* Table number (larger and more prominent) */}
        <div className="absolute top-0 left-0 w-full py-1 px-2 text-center font-bold text-lg bg-white bg-opacity-50">
          {table.name}
        </div>
        
        {/* Reservation details (if occupied) */}
        {isOccupied && (
          <div className="mt-8 px-1 w-full flex flex-col items-center">
            {/* Guest info */}
            <div className="text-xs font-medium truncate w-full text-center mt-1">
              {table.reservation.name.split(' ')[0]} {/* Show just first name to save space */}
            </div>
            
            {/* Guest count with icon */}
            <div className="flex items-center justify-center space-x-1 mt-1">
              <Users size={10} />
              <span className="text-xs">{table.reservation.guests}</span>
            </div>
            
            {/* Checkout button (small X icon in bottom right) */}
            {isOccupied && (
              <button 
                className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white hover:bg-blue-600"
                onClick={(e) => freeTable(table.id, e)}
                title="Clear table"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Function to render a section of tables
  const renderTableSection = (sectionName, tables) => (
    <div className="bg-gray-100 rounded-lg p-4">
      <div className="text-md font-semibold mb-3 text-center">{sectionName}</div>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 justify-items-center">
        {tables.map(renderTable)}
      </div>
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
          {/* Grid layout with 2 columns on larger screens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Garden A (1-10) */}
            {renderTableSection(
              "Garden A (1-10)", 
              tables.filter(t => t.section === 'Garden A (1-10)')
            )}
            
            {/* Garden A (20-28) */}
            {renderTableSection(
              "Garden A (20-28)", 
              tables.filter(t => t.section === 'Garden A (20-28)')
            )}
            
            {/* Garden A (60-67) */}
            {renderTableSection(
              "Garden A (60-67)", 
              tables.filter(t => t.section === 'Garden A (60-67)')
            )}
            
            {/* Garden B (30-39) */}
            {renderTableSection(
              "Garden B (30-39)", 
              tables.filter(t => t.section === 'Garden B')
            )}
            
            {/* Hall (40-43) */}
            {renderTableSection(
              "Hall (40-43)", 
              tables.filter(t => t.section === 'Hall')
            )}
            
            {/* Salon (50-57) */}
            {renderTableSection(
              "Salon (50-57)", 
              tables.filter(t => t.section === 'Salon')
            )}
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-6 text-sm justify-center">
            <div className="flex items-center">
              <div className="w-5 h-5 bg-green-100 rounded-md mr-2"></div>
              <span className="text-gray-700">Available</span>
            </div>
            <div className="flex items-center">
              <div className="w-5 h-5 bg-red-100 rounded-md mr-2"></div>
              <span className="text-gray-700">Occupied</span>
            </div>
            <div className="flex items-center">
              <div className="relative w-5 h-5 flex items-center justify-center bg-red-100 rounded-md mr-2">
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center">
                  <X size={8} className="text-white" />
                </div>
              </div>
              <span className="text-gray-700">Clear Table</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableStatusGrid;