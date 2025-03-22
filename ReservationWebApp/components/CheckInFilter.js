// components/CheckInFilter.js
import React from 'react';
import { UserCheck, UserX, Users } from 'lucide-react';

const CheckInFilter = ({ currentFilter, onChange }) => {
  const filters = [
    { id: 'all', label: 'All Guests', icon: Users },
    { id: 'arrived', label: 'Arrived', icon: UserCheck },
    { id: 'not-arrived', label: 'Not Arrived', icon: UserX }
  ];

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-500">Filter by arrival:</span>
      <div className="flex rounded-md shadow-sm">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isActive = currentFilter === filter.id;
          
          return (
            <button
              key={filter.id}
              onClick={() => onChange(filter.id)}
              className={`
                flex items-center px-4 py-2 text-sm font-medium
                ${isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'}
                ${filter.id === 'all' ? 'rounded-l-md' : ''}
                ${filter.id === 'not-arrived' ? 'rounded-r-md' : ''}
                border border-gray-300
                ${filter.id !== 'all' ? 'border-l-0' : ''}
              `}
            >
              <Icon className="w-4 h-4 mr-2" />
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CheckInFilter;