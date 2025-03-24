// components/CheckInStatus.js
import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle } from 'lucide-react';

const CheckInStatus = ({ reservation, onStatusChange }) => {
  const [isCheckedIn, setIsCheckedIn] = useState(reservation.checkedIn === 'yes');
  const [isUpdating, setIsUpdating] = useState(false);

  // Update local state when reservation prop changes
  useEffect(() => {
    setIsCheckedIn(reservation.checkedIn === 'yes');
  }, [reservation.checkedIn]);

  const handleToggleCheckIn = async () => {
    setIsUpdating(true);
    try {
      const newStatus = isCheckedIn ? 'no' : 'yes';
      
      const response = await fetch(`/api/reservations/${reservation.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ checkedIn: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update check-in status');
      }

      // Only update local state after successful API call
      setIsCheckedIn(!isCheckedIn);
      
      // Call the parent component's callback to refresh data
      if (onStatusChange) {
        console.log(`Toggled check-in for ${reservation.id} to ${newStatus}`);
        await onStatusChange(reservation.id, newStatus);
      }
    } catch (error) {
      console.error('Error updating check-in status:', error);
      // Revert the local state in case of error
      setIsCheckedIn(reservation.checkedIn === 'yes');
      // You could add error handling UI here
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center">
      <button
        onClick={handleToggleCheckIn}
        disabled={isUpdating}
        className={`flex items-center space-x-1 ${
          isCheckedIn 
            ? 'text-green-600 hover:text-green-700' 
            : 'text-gray-400 hover:text-gray-600'
        } transition-colors`}
        title={isCheckedIn ? 'Guest has arrived' : 'Mark guest as arrived'}
      >
        {isUpdating ? (
          <div className="w-5 h-5 rounded-full border-2 border-t-transparent border-gray-600 animate-spin"></div>
        ) : isCheckedIn ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          <Circle className="w-5 h-5" />
        )}
        <span className="text-sm font-medium">
          {isCheckedIn ? 'Checked In' : 'Not Arrived'}
        </span>
      </button>
    </div>
  );
};

export default CheckInStatus;