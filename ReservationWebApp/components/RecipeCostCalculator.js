// components/RecipeCostCalculator.js
import React, { useState } from 'react';
import { Plus, Trash2, Calculator, DollarSign, PlusCircle, MinusCircle, FileText, Printer } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import logo from '../public/logo.png';

export default function RecipeCostCalculator() {
  const [recipeName, setRecipeName] = useState('');
  const [servings, setServings] = useState(1);
  const [ingredients, setIngredients] = useState([
    { id: 1, name: '', quantity: '', unit: 'g', costPerUnit: '', totalCost: 0 }
  ]);
  const [laborCost, setLaborCost] = useState(0);
  const [overheadCost, setOverheadCost] = useState(0);
  const [profitMargin, setProfitMargin] = useState(30);

  // For printing
  const [showPrintable, setShowPrintable] = useState(false);

  // Units for dropdown
  const units = ['g', 'kg', 'ml', 'l', 'piece', 'tbsp', 'tsp', 'cup', 'oz', 'lb'];

  // Add new ingredient row
  const addIngredient = () => {
    const newId = ingredients.length > 0 
      ? Math.max(...ingredients.map(i => i.id)) + 1 
      : 1;
    
    setIngredients([
      ...ingredients, 
      { id: newId, name: '', quantity: '', unit: 'g', costPerUnit: '', totalCost: 0 }
    ]);
  };

  // Remove ingredient row
  const removeIngredient = (id) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter(ingredient => ingredient.id !== id));
    }
  };

  // Handle ingredient field changes
  const handleIngredientChange = (id, field, value) => {
    const updatedIngredients = ingredients.map(ingredient => {
      if (ingredient.id === id) {
        const updatedIngredient = { ...ingredient, [field]: value };
        
        // Calculate total cost if both quantity and costPerUnit are numbers
        if (field === 'quantity' || field === 'costPerUnit') {
          const quantity = field === 'quantity' ? parseFloat(value) || 0 : parseFloat(ingredient.quantity) || 0;
          const costPerUnit = field === 'costPerUnit' ? parseFloat(value) || 0 : parseFloat(ingredient.costPerUnit) || 0;
          updatedIngredient.totalCost = quantity * costPerUnit;
        }
        
        return updatedIngredient;
      }
      return ingredient;
    });
    
    setIngredients(updatedIngredients);
  };

  // Calculate total ingredient cost
  const calculateTotalIngredientCost = () => {
    return ingredients.reduce((sum, ingredient) => sum + (ingredient.totalCost || 0), 0);
  };

  // Calculate recipe total cost
  const calculateTotalRecipeCost = () => {
    const ingredientCost = calculateTotalIngredientCost();
    return ingredientCost + parseFloat(laborCost || 0) + parseFloat(overheadCost || 0);
  };

  // Calculate cost per serving
  const calculateCostPerServing = () => {
    const totalCost = calculateTotalRecipeCost();
    const servingsNum = parseFloat(servings) || 1;
    return totalCost / servingsNum;
  };

  // Calculate selling price with profit margin
  const calculateSellingPrice = () => {
    const costPerServing = calculateCostPerServing();
    const margin = parseFloat(profitMargin) || 0;
    return costPerServing / (1 - (margin / 100));
  };

  // Calculate total profit
  const calculateProfit = () => {
    const sellingPrice = calculateSellingPrice();
    const costPerServing = calculateCostPerServing();
    return sellingPrice - costPerServing;
  };

  // Calculate food cost percentage
  const calculateFoodCostPercentage = () => {
    const ingredientCost = calculateTotalIngredientCost();
    const totalCost = calculateTotalRecipeCost();
    return totalCost > 0 ? (ingredientCost / totalCost) * 100 : 0;
  };

  // Format currency
  const formatCurrency = (value) => {
    return `Dhs ${value.toFixed(2)}`;
  };

  // Handle Print View
  const togglePrintView = () => {
    setShowPrintable(!showPrintable);
  };

  // Reset form
  const resetForm = () => {
    setRecipeName('');
    setServings(1);
    setIngredients([
      { id: 1, name: '', quantity: '', unit: 'g', costPerUnit: '', totalCost: 0 }
    ]);
    setLaborCost(0);
    setOverheadCost(0);
    setProfitMargin(30);
  };

  // Printable view component
  const PrintableRecipeView = () => (
    <div className="fixed inset-0 bg-white z-50 p-8 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{recipeName || 'Untitled Recipe'} - Cost Breakdown</h1>
          <div className="flex space-x-4">
            <button 
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </button>
            <button 
              onClick={togglePrintView}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg"
            >
              Close
            </button>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-600">Servings: {servings}</p>
          <p className="text-gray-600">Date: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold mb-3">Ingredients</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">Ingredient</th>
                <th className="border p-2 text-left">Quantity</th>
                <th className="border p-2 text-left">Unit</th>
                <th className="border p-2 text-left">Cost Per Unit</th>
                <th className="border p-2 text-left">Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map(ingredient => (
                <tr key={ingredient.id}>
                  <td className="border p-2">{ingredient.name}</td>
                  <td className="border p-2">{ingredient.quantity}</td>
                  <td className="border p-2">{ingredient.unit}</td>
                  <td className="border p-2">{formatCurrency(parseFloat(ingredient.costPerUnit) || 0)}</td>
                  <td className="border p-2">{formatCurrency(ingredient.totalCost || 0)}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td colSpan="4" className="border p-2 text-right">Total Ingredient Cost:</td>
                <td className="border p-2">{formatCurrency(calculateTotalIngredientCost())}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold mb-3">Additional Costs</h2>
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="border p-2">Labor Cost</td>
                <td className="border p-2">{formatCurrency(parseFloat(laborCost) || 0)}</td>
              </tr>
              <tr>
                <td className="border p-2">Overhead Cost</td>
                <td className="border p-2">{formatCurrency(parseFloat(overheadCost) || 0)}</td>
              </tr>
              <tr className="font-bold">
                <td className="border p-2">Total Recipe Cost</td>
                <td className="border p-2">{formatCurrency(calculateTotalRecipeCost())}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold mb-3">Price Analysis</h2>
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="border p-2">Cost Per Serving</td>
                <td className="border p-2">{formatCurrency(calculateCostPerServing())}</td>
              </tr>
              <tr>
                <td className="border p-2">Food Cost Percentage</td>
                <td className="border p-2">{calculateFoodCostPercentage().toFixed(2)}%</td>
              </tr>
              <tr>
                <td className="border p-2">Profit Margin</td>
                <td className="border p-2">{profitMargin}%</td>
              </tr>
              <tr className="font-bold">
                <td className="border p-2">Recommended Selling Price</td>
                <td className="border p-2">{formatCurrency(calculateSellingPrice())}</td>
              </tr>
              <tr>
                <td className="border p-2">Profit Per Serving</td>
                <td className="border p-2">{formatCurrency(calculateProfit())}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Image src={logo} alt="Restaurant Logo" width={100} height={100} />
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-[#ffdbb0]"
              >
                Reservations
              </Link>
              <Link
                href="/inventory"
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-[#ffdbb0]"
              >
                Inventory
              </Link>
              <Link
                href="/recipe-calculator"
                className="px-4 py-2 rounded-md text-sm font-medium bg-[#e3902b] text-white"
              >
                Recipe Calculator
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Recipe Cost Calculator</h1>
            <div className="flex space-x-2">
              <button 
                onClick={togglePrintView}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center"
              >
                <FileText className="w-4 h-4 mr-2" />
                View Report
              </button>
              <button 
                onClick={resetForm}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Recipe Details */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Recipe Name</label>
              <input
                type="text"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="Enter recipe name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Number of Servings</label>
              <input
                type="number"
                min="1"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Profit Margin (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={profitMargin}
                onChange={(e) => setProfitMargin(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
          </div>

          {/* Ingredients Table */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-800">Ingredients</h2>
              <button 
                onClick={addIngredient}
                className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Ingredient
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingredient</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Per Unit</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ingredients.map((ingredient) => (
                    <tr key={ingredient.id}>
                      <td className="p-3">
                        <input
                          type="text"
                          value={ingredient.name}
                          onChange={(e) => handleIngredientChange(ingredient.id, 'name', e.target.value)}
                          className="block w-full border-gray-300 rounded-md shadow-sm p-2 border"
                          placeholder="Ingredient name"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={ingredient.quantity}
                          onChange={(e) => handleIngredientChange(ingredient.id, 'quantity', e.target.value)}
                          className="block w-full border-gray-300 rounded-md shadow-sm p-2 border"
                          placeholder="Qty"
                        />
                      </td>
                      <td className="p-3">
                        <select
                          value={ingredient.unit}
                          onChange={(e) => handleIngredientChange(ingredient.id, 'unit', e.target.value)}
                          className="block w-full border-gray-300 rounded-md shadow-sm p-2 border"
                        >
                          {units.map(unit => (
                            <option key={unit} value={unit}>{unit}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">Dhs</span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={ingredient.costPerUnit}
                            onChange={(e) => handleIngredientChange(ingredient.id, 'costPerUnit', e.target.value)}
                            className="block w-full pl-12 border-gray-300 rounded-md shadow-sm p-2 border"
                            placeholder="0.00"
                          />
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(ingredient.totalCost || 0)}
                        </div>
                      </td>
                      <td className="p-3">
                        <button 
                          onClick={() => removeIngredient(ingredient.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={ingredients.length === 1}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td colSpan="4" className="p-3 text-right font-medium">Total Ingredient Cost:</td>
                    <td className="p-3 font-bold">{formatCurrency(calculateTotalIngredientCost())}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Additional Costs */}
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Additional Costs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Labor Cost</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">Dhs</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={laborCost}
                    onChange={(e) => setLaborCost(e.target.value)}
                    className="block w-full pl-12 pr-12 border-gray-300 rounded-md shadow-sm p-2 border"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Overhead Cost</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">Dhs</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={overheadCost}
                    onChange={(e) => setOverheadCost(e.target.value)}
                    className="block w-full pl-12 pr-12 border-gray-300 rounded-md shadow-sm p-2 border"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Recipe Cost Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Total Recipe Cost</h3>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(calculateTotalRecipeCost())}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Cost Per Serving</h3>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(calculateCostPerServing())}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Food Cost Percentage</h3>
                <p className="text-2xl font-bold text-gray-900">{calculateFoodCostPercentage().toFixed(2)}%</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Profit Margin</h3>
                <p className="text-2xl font-bold text-gray-900">{profitMargin}%</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Recommended Selling Price</h3>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(calculateSellingPrice())}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Profit Per Serving</h3>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(calculateProfit())}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Printable View */}
      {showPrintable && <PrintableRecipeView />}
    </div>
  );
}