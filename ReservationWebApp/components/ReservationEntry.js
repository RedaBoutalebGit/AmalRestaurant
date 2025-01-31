// components/ReservationEntry.js
import React, { useState } from 'react';
import { Calendar, Clock, Users, Phone, Mail, Save, X } from 'lucide-react';

const ReservationEntry = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    name: '',
    guests: '',
    phone: '',
    email: '',
    notes: '',
    source: 'phone',
    status: 'pending'
  });

  const [showConfirmation, setShowConfirmation] = useState(false);

  // Define which fields are required
  const requiredFields = {
    date: true,
    time: true,
    name: true,
    guests: true,
    phone: false, 
    email: false,
    notes: false,
    source: false,
    status: false
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.loginUrl) {
          window.location.href = data.loginUrl;
          return;
        }
        throw new Error(data.error || 'Failed to save reservation');
      }

      const result = await response.json();
      setFormData({
        date: '',
        time: '',
        name: '',
        guests: '',
        phone: '',
        email: '',
        notes: '',
        source: 'phone',
        status: 'confirmed'
      });
      setShowConfirmation(false);
      onSubmit(result);
    } catch (error) {
      console.error('Error saving reservation:', error);
      alert(error.message);
    }
  };

  const ConfirmationDialog = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Confirm Reservation</h3>
          <button 
            onClick={() => setShowConfirmation(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3">
          <p><strong>Date:</strong> {formData.date}</p>
          <p><strong>Time:</strong> {formData.time}</p>
          <p><strong>Guest:</strong> {formData.name}</p>
          <p><strong>Number of Guests:</strong> {formData.guests}</p>
          {formData.phone && <p><strong>Phone:</strong> {formData.phone}</p>}
          {formData.email && <p><strong>Email:</strong> {formData.email}</p>}
          {formData.notes && <p><strong>Notes:</strong> {formData.notes}</p>}
          <p><strong>Source:</strong> {formData.source}</p>
          <p><strong>Status:</strong> {formData.status}</p>
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={() => setShowConfirmation(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Confirm Reservation
          </button>
        </div>
      </div>
    </div>
  );

  const RequiredLabel = ({ children }) => (
    <label className="block text-sm font-medium text-gray-700">
      {children}
      <span className="text-red-500 ml-1">*</span>
    </label>
  );

  const OptionalLabel = ({ children }) => (
    <label className="block text-sm font-medium text-gray-700">
      {children}
      <span className="text-gray-400 ml-1">(Optional)</span>
    </label>
  );

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
      {showConfirmation && <ConfirmationDialog />}
      
      <h2 className="text-2xl font-bold mb-6">New Reservation</h2>
      <p className="text-sm text-gray-500 mb-6">
        Fields marked with <span className="text-red-500">*</span> are required
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            {requiredFields.date ? (
              <RequiredLabel>Date</RequiredLabel>
            ) : (
              <OptionalLabel>Date</OptionalLabel>
            )}
            <div className="mt-1 flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50">
                <Calendar className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="date"
                required={requiredFields.date}
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            {requiredFields.time ? (
              <RequiredLabel>Time</RequiredLabel>
            ) : (
              <OptionalLabel>Time</OptionalLabel>
            )}
            <div className="mt-1 flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50">
                <Clock className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="time"
                required={requiredFields.time}
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div>
          {requiredFields.name ? (
            <RequiredLabel>Guest Name</RequiredLabel>
          ) : (
            <OptionalLabel>Guest Name</OptionalLabel>
          )}
          <input
            type="text"
            required={requiredFields.name}
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Full name"
          />
        </div>

        <div>
          {requiredFields.guests ? (
            <RequiredLabel>Number of Guests</RequiredLabel>
          ) : (
            <OptionalLabel>Number of Guests</OptionalLabel>
          )}
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50">
              <Users className="h-5 w-5 text-gray-400" />
            </span>
            <input
              type="number"
              required={requiredFields.guests}
              min="1"
              value={formData.guests}
              onChange={(e) => setFormData({...formData, guests: e.target.value})}
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          {requiredFields.phone ? (
            <RequiredLabel>Phone Number</RequiredLabel>
          ) : (
            <OptionalLabel>Phone Number</OptionalLabel>
          )}
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50">
              <Phone className="h-5 w-5 text-gray-400" />
            </span>
            <input
              type="tel"
              required={requiredFields.phone}
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contact number"
            />
          </div>
        </div>

        <div>
          {requiredFields.email ? (
            <RequiredLabel>Email</RequiredLabel>
          ) : (
            <OptionalLabel>Email</OptionalLabel>
          )}
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50">
              <Mail className="h-5 w-5 text-gray-400" />
            </span>
            <input
              type="email"
              required={requiredFields.email}
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Email address"
            />
          </div>
        </div>

        <div>
          {requiredFields.notes ? (
            <RequiredLabel>Notes</RequiredLabel>
          ) : (
            <OptionalLabel>Notes</OptionalLabel>
          )}
          <textarea
            required={requiredFields.notes}
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Special requests, allergies, etc."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Source</label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({...formData, source: e.target.value})}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
            >
              <option value="phone">Phone</option>
              <option value="walk-in">Walk-in</option>
              <option value="email">Email</option>
              <option value="website">Website</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
            >
              {/* <option value="confirmed">Confirmed</option> */}
              <option value="pending">Pending</option>
              <option value="waitlist">Waitlist</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Save className="w-5 h-5 mr-2" />
          Save Reservation
        </button>
      </form>
    </div>
  );
};

export default ReservationEntry;