import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Users, X, Clock, Coffee } from 'lucide-react';

const TableStatusGrid = ({ reservations = [] }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedService, setSelectedService] = useState('all');
  
  // Define service time slots
  const serviceSlots = {
    first: { name: "1st Service", time: "12:00 - 14:00" },
    second: { name: "2nd Service", time: "14:00 - 15:30" }
  };
  
  // Enhanced table structure that can handle multiple services
  const [tables, setTables] = useState([
    // Tables 1-10: Garden A
    ...Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: String(i + 1),
      section: 'Garden A (1-10)',
      services: {
        first: { available: true, reservation: null },
        second: { available: true, reservation: null }
      }
    })),
    
    // Tables 20-28: Garden A
    ...Array.from({ length: 9 }, (_, i) => ({
      id: i + 20,
      name: String(i + 20),
      section: 'Garden A (20-28)',
      services: {
        first: { available: true, reservation: null },
        second: { available: true, reservation: null }
      }
    })),
    
    // Tables 30-39: Garden B
    ...Array.from({ length: 10 }, (_, i) => ({
      id: i + 30,
      name: String(i + 30),
      section: 'Garden B',
      services: {
        first: { available: true, reservation: null },
        second: { available: true, reservation: null }
      }
    })),
    
    // Tables 40-43: Hall
    ...Array.from({ length: 4 }, (_, i) => ({
      id: i + 40,
      name: String(i + 40),
      section: 'Hall',
      services: {
        first: { available: true, reservation: null },
        second: { available: true, reservation: null }
      }
    })),
    
    // Tables 50-57: Salon
    ...Array.from({ length: 8 }, (_, i) => ({
      id: i + 50,
      name: String(i + 50),
      section: 'Salon',
      services: {
        first: { available: true, reservation: null },
        second: { available: true, reservation: null }
      }
    })),
    
    // Tables 60-67: Garden A
    ...Array.from({ length: 8 }, (_, i) => ({
      id: i + 60,
      name: String(i + 60),
      section: 'Garden A (60-67)',
      services: {
        first: { available: true, reservation: null },
        second: { available: true, reservation: null }
      }
    }))
  ]);

  // Determine service based on reservation time
  const getServiceFromTime = (time) => {
    if (!time) return null;
    
    // Check if the time includes AM/PM format or is in 24-hour format
    const timeStr = time.toLowerCase();
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
      hour = parseInt(time.split(':')[0]);
    }
    
    // Set service based on hour
    if (hour >= 12 && hour < 14) {
      return 'first';
    } else if (hour >= 14 && hour < 15.5) {
      return 'second';
    }
    
    return null;
  };

  // Look for service information in the notes or from service column
  const getServiceInfo = (reservation) => {
    // First check if service is directly in the reservation object
    if (reservation.service) {
      return reservation.service;
    }
    
    // Then check the notes
    if (reservation.notes) {
      if (reservation.notes.includes('1st Service') || reservation.notes.includes('first service')) {
        return 'first';
      } else if (reservation.notes.includes('2nd Service') || reservation.notes.includes('second service')) {
        return 'second';
      }
    }
    
    // Finally, try to determine from time
    return getServiceFromTime(reservation.time);
  };

  // Toggle the expanded state of the section
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Free up a table for a specific service
  const freeTable = async (tableId, service, event) => {
    event.stopPropagation();
    
    // Find the table and its reservation for this service
    const table = tables.find(t => t.id === tableId);
    if (!table || !table.services[service] || !table.services[service].reservation) return;
    
    // Get the reservation ID
    const reservationId = table.services[service].reservation.id;
    
    // Update the table status locally
    setTables(tables.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          services: {
            ...t.services,
            [service]: {
              available: true,
              reservation: null
            }
          }
        };
      }
      return t;
    }));
    
    // Update the reservation in the database to remove table assignment
    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          table: '', // Remove table assignment
          service: '' // Remove service assignment
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update reservation');
      }
      
    } catch (error) {
      console.error('Error freeing table:', error);
      alert('Failed to update reservation status. Please try again.');
    }
  };

  // Update tables based on reservations
  useEffect(() => {
    // Create a copy of the current tables
    const updatedTables = [...tables];
    
    // First reset all table services that don't have a current reservation
    updatedTables.forEach(table => {
      // For each service, check if we need to reset
      Object.keys(table.services).forEach(service => {
        if (table.services[service].reservation && 
            !reservations.find(r => r.id === table.services[service].reservation.id)) {
          table.services[service] = {
            available: true,
            reservation: null
          };
        }
      });
    });
    
    // Then update tables based on current reservations
    reservations.forEach(reservation => {
      // If reservation has a table assigned
      if (reservation.table) {
        const tableId = parseInt(reservation.table);
        const tableIndex = updatedTables.findIndex(t => t.id === tableId);
        
        if (tableIndex !== -1) {
          // Determine which service this reservation is for
          const serviceType = getServiceInfo(reservation) || 'first'; // Default to first service if not specified
          
          // Update the table for this specific service
          updatedTables[tableIndex].services[serviceType] = {
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

  // Filter tables based on selected service
  const filteredTables = tables.filter(table => {
    if (selectedService === 'all') {
      return true;
    }
    
    // For a specific service, show tables if they have a reservation for that service
    // or if they are available for that service
    return !table.services[selectedService].available || 
           table.services[selectedService].reservation !== null;
  });

  // Render a table with potentially multiple service statuses
  const renderTable = (table) => {
    // Determine if the table is occupied for either service
    const firstServiceOccupied = !table.services.first.available && table.services.first.reservation;
    const secondServiceOccupied = !table.services.second.available && table.services.second.reservation;
    
    // Determine the color class based on table status
    // If both services are occupied, we'll use a split background
    let tableClass = '';
    
    if (firstServiceOccupied && secondServiceOccupied) {
      tableClass = 'bg-gradient-to-b from-red-100 to-purple-100 hover:from-red-200 hover:to-purple-200';
    } else if (firstServiceOccupied) {
      tableClass = 'bg-red-100 hover:bg-red-200 text-red-800';
    } else if (secondServiceOccupied) {
      tableClass = 'bg-purple-100 hover:bg-purple-200 text-purple-800';
    } else {
      tableClass = 'bg-green-100 hover:bg-green-200 text-green-800';
    }
    
    return (
      <div
        key={table.id}
        className={`relative w-20 h-20 flex flex-col justify-start text-sm font-medium rounded-lg cursor-pointer overflow-hidden transition-all hover:shadow-md ${tableClass}`}
      >
        {/* Table number (larger and more prominent) */}
        <div className="absolute top-0 left-0 w-full py-1 px-2 text-center font-bold text-lg bg-white bg-opacity-50">
          {table.name}
        </div>
        
        {/* Indicate if table has multiple services occupied */}
        {firstServiceOccupied && secondServiceOccupied && (
          <div className="absolute top-0 right-0 p-1">
            <span className="flex items-center">
              <Coffee size={10} className="mr-1" />
              <span className="text-xs">Both</span>
            </span>
          </div>
        )}
        
        {/* Reservation details for first service */}
        {firstServiceOccupied && (
          <div className={`${secondServiceOccupied ? 'mt-6' : 'mt-8'} px-1 w-full flex flex-col items-center`}>
            {secondServiceOccupied ? (
              <div className="bg-red-200 w-full text-center text-xs py-0.5">1st</div>
            ) : (
              <div className="absolute top-0 right-0 p-1">
                <span className="flex items-center">
                  <Clock size={10} className="mr-1" />
                  <span className="text-xs">1st</span>
                </span>
              </div>
            )}
            
            <div className="text-xs font-medium truncate w-full text-center">
              {table.services.first.reservation.name.split(' ')[0]}
            </div>
            
            <div className="flex items-center justify-center space-x-1">
              <Users size={10} />
              <span className="text-xs">{table.services.first.reservation.guests}</span>
            </div>
            
            {/* Clear button for first service */}
            <button 
              className="absolute bottom-1 left-1 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white hover:bg-blue-600"
              onClick={(e) => freeTable(table.id, 'first', e)}
              title="Clear 1st service"
            >
              <X size={12} />
            </button>
          </div>
        )}
        
        {/* Reservation details for second service */}
        {secondServiceOccupied && (
          <div className={`${firstServiceOccupied ? 'mt-14' : 'mt-8'} px-1 w-full flex flex-col items-center`}>
            {firstServiceOccupied ? (
              <div className="bg-purple-200 w-full text-center text-xs py-0.5">2nd</div>
            ) : (
              <div className="absolute top-0 right-0 p-1">
                <span className="flex items-center">
                  <Clock size={10} className="mr-1" />
                  <span className="text-xs">2nd</span>
                </span>
              </div>
            )}
            
            <div className="text-xs font-medium truncate w-full text-center">
              {table.services.second.reservation.name.split(' ')[0]}
            </div>
            
            <div className="flex items-center justify-center space-x-1">
              <Users size={10} />
              <span className="text-xs">{table.services.second.reservation.guests}</span>
            </div>
            
            {/* Clear button for second service */}
            <button 
              className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white hover:bg-blue-600"
              onClick={(e) => freeTable(table.id, 'second', e)}
              title="Clear 2nd service"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>
    );
  };

  // Function to render a section of tables
  const renderTableSection = (sectionName, filteredTables) => {
    const sectionTables = filteredTables.filter(t => t.section === sectionName);
    if (sectionTables.length === 0) return null;
    
    return (
      <div className="bg-gray-100 rounded-lg p-4">
        <div className="text-md font-semibold mb-3 text-center">{sectionName}</div>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 justify-items-center">
          {sectionTables.map(renderTable)}
        </div>
      </div>
    );
  };

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
          {/* Service filter */}
          <div className="flex justify-center mb-4">
            <div className="bg-white rounded-lg shadow-sm border p-1 inline-flex">
              <button
                onClick={() => setSelectedService('all')}
                className={`px-4 py-2 rounded-md flex items-center ${
                  selectedService === 'all' 
                    ? 'bg-gray-100 text-gray-800 font-medium' 
                    : 'text-gray-500 hover:bg-gray-50'
                } transition-colors`}
                title="Show all tables"
              >
                All Tables
              </button>
              <button
                onClick={() => setSelectedService('first')}
                className={`px-4 py-2 rounded-md flex items-center ${
                  selectedService === 'first' 
                    ? 'bg-red-100 text-red-800 font-medium' 
                    : 'text-gray-500 hover:bg-gray-50'
                } transition-colors`}
                title="Show 1st service tables"
              >
                <Clock className="w-4 h-4 mr-2" />
                1st Service (12:00-14:00)
              </button>
              <button
                onClick={() => setSelectedService('second')}
                className={`px-4 py-2 rounded-md flex items-center ${
                  selectedService === 'second' 
                    ? 'bg-purple-100 text-purple-800 font-medium' 
                    : 'text-gray-500 hover:bg-gray-50'
                } transition-colors`}
                title="Show 2nd service tables"
              >
                <Clock className="w-4 h-4 mr-2" />
                2nd Service (14:00-15:30)
              </button>
            </div>
          </div>
          
          {/* Grid layout with 2 columns on larger screens */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Garden A (1-10) */}
            {renderTableSection(
              "Garden A (1-10)", 
              filteredTables
            )}
            
            {/* Garden A (20-28) */}
            {renderTableSection(
              "Garden A (20-28)", 
              filteredTables
            )}
            
            {/* Garden A (60-67) */}
            {renderTableSection(
              "Garden A (60-67)", 
              filteredTables
            )}
            
            {/* Garden B (30-39) */}
            {renderTableSection(
              "Garden B", 
              filteredTables
            )}
            
            {/* Hall (40-43) */}
            {renderTableSection(
              "Hall", 
              filteredTables
            )}
            
            {/* Salon (50-57) */}
            {renderTableSection(
              "Salon", 
              filteredTables
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
              <span className="text-gray-700">1st Service (12:00-14:00)</span>
            </div>
            <div className="flex items-center">
              <div className="w-5 h-5 bg-purple-100 rounded-md mr-2"></div>
              <span className="text-gray-700">2nd Service (14:00-15:30)</span>
            </div>
            <div className="flex items-center">
              <div className="w-5 h-5 bg-gradient-to-b from-red-100 to-purple-100 rounded-md mr-2"></div>
              <span className="text-gray-700">Both Services</span>
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