// components/CancellationReasonDialog.js
import React, { useState } from 'react';
import { X, AlertTriangle, Check } from 'lucide-react';

const CancellationReasonDialog = ({ reservation, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const predefinedReasons = [
    { id: 'closed', text: 'Closed on Sundays' },
    { id: 'booked', text: 'Fully booked' },
    { id: 'capacity', text: 'Not enough capacity for this group size' },
    { id: 'other', text: 'Other reason (specify below)' }
  ];

  const handleSubmit = async () => {
    // Validate input
    if (!reason) {
      setError('Please select a reason for cancellation');
      return;
    }

    if (reason === 'other' && !customReason.trim()) {
      setError('Please specify the cancellation reason');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Determine the final reason text to send
      const finalReason = reason === 'other' ? customReason : predefinedReasons.find(r => r.id === reason)?.text || '';
      
      // Call the parent component's confirm handler with the reason
      await onConfirm(finalReason);
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      setError('Failed to cancel reservation. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-red-600">Cancel Reservation</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-4">Please select a reason for cancelling this reservation:</p>
          
          <div className="space-y-2 mb-4">
            {predefinedReasons.map((option) => (
              <div key={option.id} className="flex items-center">
                <input
                  type="radio"
                  id={option.id}
                  name="cancellationReason"
                  value={option.id}
                  checked={reason === option.id}
                  onChange={(e) => setReason(e.target.value)}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor={option.id} className="ml-2 block text-sm text-gray-700">
                  {option.text}
                </label>
              </div>
            ))}
          </div>
          
          {reason === 'other' && (
            <div className="mt-4">
              <label htmlFor="customReason" className="block text-sm font-medium text-gray-700 mb-1">
                Please specify:
              </label>
              <textarea
                id="customReason"
                rows="2"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2"
                placeholder="Enter the reason for cancellation"
              />
            </div>
          )}
          
          {error && (
            <div className="mt-4 text-red-500 text-sm flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <h4 className="font-medium mb-2">Reservation Details</h4>
            <p><strong>Guest:</strong> {reservation.name}</p>
            <p><strong>Date:</strong> {reservation.date}</p>
            <p><strong>Time:</strong> {reservation.time}</p>
            <p><strong>Guests:</strong> {reservation.guests}</p>
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
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center disabled:bg-gray-400"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⌛</span>
                Processing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Confirm Cancellation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancellationReasonDialog;