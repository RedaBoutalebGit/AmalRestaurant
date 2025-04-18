import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, AlertTriangle, ChevronDown, ChevronUp, Plus as PlusIcon, Minus as MinusIcon } from 'lucide-react';
import InventoryMovement from './InventoryMovement';

const categories = {
  dryGoods: {
    name: "Dry Goods-البضائع الجافة",
    subcategories: ["Grains-الحبوب", "Pasta", "Flour-الطحين", "Spices-توابل", "Dried Herbs-الأعشاب", "Legumes-القطنيات"]
  },
  freshProduce: {
    name: "Fresh Produce-المنتجات الطازجة",
    subcategories: ["Vegetables-الخضار", "Fruits-الفواكه", "Fresh Herbs-الأعشاب الطازجة", "Salad Greens-السلطة"]
  },
  proteins: {
    name: "Proteins",
    subcategories: ["Meat-اللحوم", "Poultry-الدواجن", "Fish & Seafood-الأسماك ", "Eggs-البيض"]
  },
  dairyAndCold: {
    name: "Dairy & Cold Items-منتوجات الحليب",
    subcategories: ["Milk-حليب", "Cheese-جبنة", "Butter-زبدة", "Yogurt", "Cream-كريمة"]
  },
  beverages: {
    name: "Beverages-المشروبات",
    subcategories: ["Water-ماء", "Soft Drinks-مشروبات غازية", "Juices-عصائر"]
  },
  saucesAndCondiments: {
    name: "Sauces & Condiments-الصلصات",
    subcategories: ["Cooking Sauces-صلصات الطبخ", "Table Sauces-صلصات ", "Dressings-التوابل", "Oils-الزيوت", "Vinegars-الخل"]
  },
  frozenItems: {
    name: "Frozen Items-العناصر المجمدة",
    subcategories: ["Frozen Vegetables-خضروات مجمدة", "Frozen Meat-لحوم مجمدة", "Ice Cream-آيس كريم", "Other"]
  },
  disposables: {
    name: "Disposables & Packaging",
    subcategories: ["Takeout Containers", "Napkins", "Utensils", "Cleaning Supplies"]
  }
};

const unitsByCategory = {
  dryGoods: ["kg", "g", "box", "packet"],
  freshProduce: ["kg", "g", "piece"],
  proteins: ["kg", "g", "piece"],
  dairyAndCold: ["l", "ml", "kg", "piece"],
  beverages: ["l", "ml", "bottle", "can"],
  saucesAndCondiments: ["l", "ml", "bottle", "kg"],
  frozenItems: ["kg", "g", "piece", "box"],
  disposables: ["piece", "pack", "box", "roll"]
};

const storageLocations = {
  dryStorage: "Dry Storage Room -غرفة التخزين الجاف ",
  coolRoom: "Cool Room-غرفة باردة",
  freezer: "Freezer",
  bar: "Bar Area"
};
const InventoryDashboard = () => {
  // States
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMovementHistory, setShowMovementHistory] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [movements, setMovements] = useState({});
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSubcategory, setFilterSubcategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showExpiryWarning, setShowExpiryWarning] = useState(true);
  const [expiryFilter, setExpiryFilter] = useState('all');

  const [itemForm, setItemForm] = useState({
    name: '',
    category: '',
    subcategory: '',
    quantity: 0,
    unit: '',
    costPerUnit: 0,
    minThreshold: 0,
    supplier: '',
    notes: '',
    storageLocation: '',
    expiryDate: ''
  });

  // Utility Functions
  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return 'no-expiry';
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 7) return 'expiring-soon';
    return 'valid';
  };

  // API Functions
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

  // Initial Load
  useEffect(() => {
    fetchInventory();
  }, []);

  // Filter Function
  const filteredInventory = inventory.filter(item => {
    const categoryMatch = filterCategory === 'all' || item.category === filterCategory;
    const subcategoryMatch = filterSubcategory === 'all' || item.subcategory === filterSubcategory;
    const searchMatch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const expiryMatch = expiryFilter === 'all' || getExpiryStatus(item.expiryDate) === expiryFilter;
    
    return categoryMatch && subcategoryMatch && searchMatch && expiryMatch;
  });


// Handler Functions
const handleAddItem = async (e, formData) => {
  e.preventDefault();
  try {
    const response = await fetch('/api/inventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(formData), // Use the passed formData
    });

    if (response.ok) {
      setShowAddModal(false);
      fetchInventory();
    }
  } catch (error) {
    console.error('Error adding item:', error);
  }
};

const handleEditItem = async (e, formData) => {
  e.preventDefault();
  try {
    const response = await fetch(`/api/inventory?id=${selectedItem.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(formData), // Use the passed formData
    });

    if (response.ok) {
      setShowEditModal(false);
      setSelectedItem(null);
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



// ExpiryNotifications Component
const ExpiryNotifications = ({ inventory }) => {
  const expiringItems = inventory.filter(item => {
    if (!item.expiryDate) return false;
    const status = getExpiryStatus(item.expiryDate);
    return status === 'expired' || status === 'expiring-soon';
  });

  if (expiringItems.length === 0) return null;

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Expiry Alerts
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <ul className="list-disc pl-5 space-y-1">
              {expiringItems.map(item => (
                <li key={item.id}>
                  {item.name} - {
                    getExpiryStatus(item.expiryDate) === 'expired' 
                      ? 'EXPIRED' 
                      : `Expires in ${Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))} days`
                  }
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// ItemForm Component
const ItemForm = ({ onSubmit, initialData = null }) => {
  const [localForm, setLocalForm] = useState({
    name: initialData?.name || '',
    category: initialData?.category || '',
    subcategory: initialData?.subcategory || '',
    quantity: initialData?.quantity || 0,
    unit: initialData?.unit || '',
    costPerUnit: initialData?.costPerUnit || 0,
    minThreshold: initialData?.minThreshold || 0,
    supplier: initialData?.supplier || '',
    notes: initialData?.notes || '',
    storageLocation: initialData?.storageLocation || '',
    expiryDate: initialData?.expiryDate || ''
  });
  
  const [hasExpiry, setHasExpiry] = useState(initialData?.expiryDate ? true : false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e, localForm);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          value={localForm.name}
          onChange={(e) => setLocalForm(prev => ({ ...prev, name: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            value={localForm.category}
            onChange={(e) => {
              setLocalForm(prev => ({
                ...prev,
                category: e.target.value,
                subcategory: '',
                unit: ''
              }));
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Select Category</option>
            {Object.entries(categories).map(([key, cat]) => (
              <option key={key} value={key}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Subcategory</label>
          <select
            value={localForm.subcategory}
            onChange={(e) => setLocalForm(prev => ({ ...prev, subcategory: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            disabled={!localForm.category}
            required
          >
            <option value="">Select Subcategory</option>
            {localForm.category && categories[localForm.category].subcategories.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Unit</label>
          <select
            value={localForm.unit}
            onChange={(e) => setLocalForm(prev => ({ ...prev, unit: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Select Unit</option>
            {localForm.category && unitsByCategory[localForm.category].map(unit => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Storage Location</label>
          <select
            value={localForm.storageLocation}
            onChange={(e) => setLocalForm(prev => ({ ...prev, storageLocation: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Select Location</option>
            {Object.entries(storageLocations).map(([key, location]) => (
              <option key={key} value={key}>{location}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Cost per Unit</label>
          <input
            type="number"
            step="0.01"
            value={localForm.costPerUnit}
            onChange={(e) => setLocalForm(prev => ({ ...prev, costPerUnit: parseFloat(e.target.value) }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Min Threshold</label>
          <input
            type="number"
            step="0.01"
            value={localForm.minThreshold}
            onChange={(e) => setLocalForm(prev => ({ ...prev, minThreshold: parseFloat(e.target.value) }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Supplier</label>
        <input
          type="text"
          value={localForm.supplier}
          onChange={(e) => setLocalForm(prev => ({ ...prev, supplier: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          id="hasExpiry"
          checked={hasExpiry}
          onChange={(e) => setHasExpiry(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="hasExpiry" className="ml-2 text-sm text-gray-700">
          This item has an expiry date
        </label>
      </div>

      {hasExpiry && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
          <input
            type="date"
            value={localForm.expiryDate || ''}
            onChange={(e) => setLocalForm(prev => ({ ...prev, expiryDate: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          value={localForm.notes}
          onChange={(e) => setLocalForm(prev => ({ ...prev, notes: e.target.value }))}
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
};


  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  // Main Render
  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {showExpiryWarning && <ExpiryNotifications inventory={inventory} />}

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setFilterSubcategory('all');
              }}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="all">All Categories</option>
              {Object.entries(categories).map(([key, cat]) => (
                <option key={key} value={key}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filterSubcategory}
              onChange={(e) => setFilterSubcategory(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              disabled={filterCategory === 'all'}
            >
              <option value="all">All Subcategories</option>
              {filterCategory !== 'all' && categories[filterCategory].subcategories.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="all">All Expiry Status</option>
              <option value="expired">Expired</option>
              <option value="expiring-soon">Expiring Soon</option>
              <option value="valid">Valid</option>
              <option value="no-expiry">No Expiry Date</option>
            </select>
          </div>
        </div>
      </div>
      {/* Main Table */}
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
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Storage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expiry
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInventory.map((item) => (
              <React.Fragment key={item.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.supplier}</div>
                        <div className="text-sm text-gray-500">Cost: Dhs{item.costPerUnit}/{item.unit}</div>
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.category === 'dryGoods' ? 'bg-green-100 text-green-800' : 
                      item.category === 'freshProduce' ? 'bg-emerald-100 text-emerald-800' :
                      item.category === 'proteins' ? 'bg-red-100 text-red-800' :
                      item.category === 'dairyAndCold' ? 'bg-blue-100 text-blue-800' :
                      item.category === 'beverages' ? 'bg-purple-100 text-purple-800' :
                      item.category === 'saucesAndCondiments' ? 'bg-yellow-100 text-yellow-800' :
                      item.category === 'frozenItems' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {categories[item.category]?.name}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">{item.subcategory}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {storageLocations[item.storageLocation]}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {item.expiryDate && (
                      <div className={`text-sm ${
                        getExpiryStatus(item.expiryDate) === 'expired' ? 'text-red-600' :
                        getExpiryStatus(item.expiryDate) === 'expiring-soon' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {new Date(item.expiryDate).toLocaleDateString()}
                        {getExpiryStatus(item.expiryDate) === 'expired' && 
                          <div className="text-red-600 font-medium">(EXPIRED)</div>
                        }
                        {getExpiryStatus(item.expiryDate) === 'expiring-soon' && 
                          <div className="text-yellow-600 font-medium">
                            ({Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))} days)
                          </div>
                        }
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
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
                            subcategory: item.subcategory,
                            quantity: item.quantity,
                            unit: item.unit,
                            costPerUnit: item.costPerUnit,
                            minThreshold: item.minThreshold,
                            supplier: item.supplier,
                            notes: item.notes,
                            storageLocation: item.storageLocation,
                            expiryDate: item.expiryDate
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
                    <td colSpan="6" className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">Movement History for {item.name}</h4>
                          <span className="text-sm text-gray-500">
                            Current Stock: {item.quantity} {item.unit}
                          </span>
                        </div>
                        {movements[item.id] ? (
                          <div className="space-y-2">
                            <table className="min-w-full">
                              <thead>
                                <tr className="text-xs text-gray-500 uppercase">
                                  <th className="px-3 py-2 text-left">Date</th>
                                  <th className="px-3 py-2 text-left">Type</th>
                                  <th className="px-3 py-2 text-left">Quantity</th>
                                  <th className="px-3 py-2 text-left">Reason</th>
                                </tr>
                              </thead>
                              <tbody>
                                {movements[item.id].map((movement) => (
                                  <tr 
                                    key={movement.id}
                                    className="border-b border-gray-200 last:border-0"
                                  >
                                    <td className="px-3 py-2">
                                      {new Date(movement.date).toLocaleDateString()} 
                                      {new Date(movement.date).toLocaleTimeString()}
                                    </td>
                                    <td className="px-3 py-2">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        movement.type === 'IN' 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {movement.type}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2">
                                      {movement.type === 'IN' ? '+' : '-'}
                                      {movement.quantity} {item.unit}
                                    </td>
                                    <td className="px-3 py-2 text-gray-600">
                                      {movement.reason}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
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

      {/* Modals */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Add New Item</h3>
            <ItemForm onSubmit={handleAddItem} />
          </div>
        </div>
      )}

      {showEditModal && selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Edit Item: {selectedItem.name}</h3>
            <ItemForm onSubmit={handleEditItem} initialData={selectedItem} />
          </div>
        </div>
      )}

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
