// components/InventoryMovement.js
import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const InventoryMovement = ({ item, onMovement }) => {
  const [showModal, setShowModal] = useState(false);
  const [movement, setMovement] = useState({
    type: 'IN',
    quantity: '',
    reason: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const quantityValue = parseFloat(movement.quantity);
    if (isNaN(quantityValue) || quantityValue <= 0) {
      alert('Please enter a valid quantity.');
      return;
    }
  
    try {
      const response = await fetch('/api/inventory-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          itemId: item.id,
          type: movement.type,
          quantity: quantityValue,
          reason: movement.reason,
          currentQuantity: item.quantity
        }),
      });
  
      if (response.ok) {
        const result = await response.json();
        item.quantity = result.newQuantity; // Update stock in UI
        await onMovement();
        setShowModal(false);
        setMovement({ type: 'IN', quantity: '', reason: '' });
      } else {
        const errorData = await response.json();
        alert(errorData.error);
      }
    } catch (error) {
      console.error('Error recording movement:', error);
    }
  };
  

  return (
    <>
      <div className="flex space-x-2">
        <button
          onClick={() => {
            setMovement({ ...movement, type: 'IN' });
            setShowModal(true);
          }}
          className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100"
          title="Stock In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setMovement({ ...movement, type: 'OUT' });
            setShowModal(true);
          }}
          className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100"
          title="Stock Out"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">
              {movement.type === 'IN' ? 'Stock In' : 'Stock Out'}: {item.name}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Quantity ({item.unit})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={movement.quantity}
                    onChange={(e) => setMovement({...movement, quantity: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Reason
                  </label>
                  <textarea
                    value={movement.reason}
                    onChange={(e) => setMovement({...movement, reason: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows="3"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-white rounded ${
                      movement.type === 'IN' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default InventoryMovement;