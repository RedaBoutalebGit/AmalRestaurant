import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import InventoryMovement from './InventoryMovement';

const InventoryDashboard = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMovementHistory, setShowMovementHistory] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [movements, setMovements] = useState({});
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [itemForm, setItemForm] = useState({
    name: '',
    category: 'Food',
    quantity: 0,
    unit: 'kg',
    costPerUnit: 0,
    minThreshold: 0,
    supplier: '',
    notes: ''
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory', {
        credentials: 'include'
      });
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async (itemId) => {
    try {
      const response = await fetch(`/api/inventory-movements?itemId=${itemId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      setMovements(prev => ({ ...prev, [itemId]: data }));
    } catch (error) {
      console.error('Error fetching movements:', error);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(itemForm),
      });

      if (response.ok) {
        setShowAddModal(false);
        setItemForm({
          name: '',
          category: 'Food',
          quantity: 0,
          unit: 'kg',
          costPerUnit: 0,
          minThreshold: 0,
          supplier: '',
          notes: ''
        });
        fetchInventory();
      }
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleEditItem = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/inventory?id=${selectedItem.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(itemForm),
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedItem(null);
        setItemForm({
          name: '',
          category: 'Food',
          quantity: 0,
          unit: 'kg',
          costPerUnit: 0,
          minThreshold: 0,
          supplier: '',
          notes: ''
        });
        fetchInventory();
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleDeleteItem = async () => {
    try {
      const response = await fetch(`/api/inventory?id=${selectedItem.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setSelectedItem(null);
        fetchInventory();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const toggleMovementHistory = (itemId) => {
    if (!movements[itemId]) {
      fetchMovements(itemId);
    }
    setShowMovementHistory(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const filteredInventory = inventory.filter(item => {
    const categoryMatch = filterCategory === 'all' || item.category === filterCategory;
    const searchMatch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && searchMatch;
  });

  const ItemForm = ({ onSubmit, initialData = null }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          value={itemForm.name}
          onChange={(e) => setItemForm({...itemForm, name: e.target.value})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            value={itemForm.category}
            onChange={(e) => setItemForm({...itemForm, category: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="Food">Food</option>
            <option value="Beverage">Beverage</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Unit</label>
          <select
            value={itemForm.unit}
            onChange={(e) => setItemForm({...itemForm, unit: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="kg">Kilogram (kg)</option>
            <option value="l">Liter (l)</option>
            <option value="units">Units</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Cost per Unit</label>
          <input
            type="number"
            step="0.01"
            value={itemForm.costPerUnit}
            onChange={(e) => setItemForm({...itemForm, costPerUnit: parseFloat(e.target.value)})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Min Threshold</label>
          <input
            type="number"
            step="0.01"
            value={itemForm.minThreshold}
            onChange={(e) => setItemForm({...itemForm, minThreshold: parseFloat(e.target.value)})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Supplier</label>
        <input
          type="text"
          value={itemForm.supplier}
          onChange={(e) => setItemForm({...itemForm, supplier: e.target.value})}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          value={itemForm.notes}
          onChange={(e) => setItemForm({...itemForm, notes: e.target.value})}
          rows="3"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => {
            setShowAddModal(false);
            setShowEditModal(false);
          }}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {initialData ? 'Update Item' : 'Add Item'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Inventory Management</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Item
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Categories</option>
            <option value="Food">Food</option>
            <option value="Beverage">Beverage</option>
          </select>
        </div>
      </div>

      {/* Inventory List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredInventory.map((item) => (
              <React.Fragment key={item.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.supplier}</div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.category === 'Food' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.category}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {item.quantity} {item.unit}
                    </div>
                    {item.quantity <= item.minThreshold && (
                      <div className="flex items-center text-red-600 text-sm">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Low Stock
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      ${item.costPerUnit}/{item.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      <InventoryMovement 
                        item={item} 
                        onMovement={() => {
                          fetchInventory();
                          if (showMovementHistory[item.id]) {
                            fetchMovements(item.id);
                          }
                        }} 
                      />
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setItemForm({
                            name: item.name,
                            category: item.category,
                            quantity: item.quantity,
                            unit: item.unit,
                            costPerUnit: item.costPerUnit,
                            minThreshold: item.minThreshold,
                            supplier: item.supplier,
                            notes: item.notes
                          });
                          setShowEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleMovementHistory(item.id)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        {showMovementHistory[item.id] ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
                {showMovementHistory[item.id] && (
                  <tr className="bg-gray-50">
                    <td colSpan="4" className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        <h4 className="font-medium mb-2">Movement History</h4>
                        {movements[item.id] ? (
                          <div className="space-y-2">
                            {movements[item.id].map((movement) => (
                              <div 
                                key={movement.id}
                                className="flex items-center justify-between border-b border-gray-200 pb-2"
                              >
                                <div className="flex items-center space-x-4">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    movement.type === 'IN' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {movement.type}
                                  </span>
                                  <span>{movement.quantity} {item.unit}</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-gray-900">
                                    {new Date(movement.date).toLocaleDateString()}
                                  </div>
                                  <div className="text-gray-500 text-xs">
                                    {movement.reason}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Add New Item</h3>
            <ItemForm onSubmit={handleAddItem} />
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Edit Item: {selectedItem.name}</h3>
            <ItemForm onSubmit={handleEditItem} initialData={selectedItem} />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-red-600 mb-4">Delete Item</h3>
            <p className="mb-4">Are you sure you want to delete {selectedItem.name}?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteItem}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryDashboard;