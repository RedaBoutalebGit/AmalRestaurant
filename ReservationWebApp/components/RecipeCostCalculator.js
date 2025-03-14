// components/RecipeCostCalculator.js
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator, DollarSign, FileText, Printer, Save, List, Edit, RefreshCw, X } from 'lucide-react';
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
  const [profitMargin, setProfitMargin] = useState(67); // Updated to your standard 3x multiplier (67% margin)
  const [currentRecipeId, setCurrentRecipeId] = useState(null);

  // For printing
  const [showPrintable, setShowPrintable] = useState(false);
  
  // For recipe management
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showRecipeList, setShowRecipeList] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Fetch recipes on component mount
  useEffect(() => {
    fetchRecipes();
  }, []);

  // Units for dropdown
  const units = ['g', 'kg', 'ml', 'l', 'piece', 'tbsp', 'tsp', 'cup', 'oz', 'lb'];

  // API functions
  const fetchRecipes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/recipes', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }
      
      const data = await response.json();
      setRecipes(data);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      setErrorMessage('Failed to load recipes');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecipe = async (id) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/recipes?id=${id}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch recipe');
      }
      
      const recipe = await response.json();
      
      // Load recipe data into form
      setRecipeName(recipe.name);
      setServings(recipe.servings);
      setIngredients(recipe.ingredients);
      setLaborCost(recipe.laborCost);
      setOverheadCost(recipe.overheadCost);
      setProfitMargin(recipe.profitMargin);
      setCurrentRecipeId(recipe.id);
      
      // Close recipe list after loading
      setShowRecipeList(false);
    } catch (error) {
      console.error('Error fetching recipe:', error);
      setErrorMessage('Failed to load recipe');
    } finally {
      setIsLoading(false);
    }
  };

  const saveRecipe = async () => {
    if (!recipeName.trim()) {
      setErrorMessage('Recipe name is required');
      return;
    }
    
    try {
      setIsLoading(true);
      setSaveSuccess(false);
      
      const recipeData = {
        name: recipeName,
        servings: parseInt(servings) || 1,
        ingredients,
        laborCost: parseFloat(laborCost) || 0,
        overheadCost: parseFloat(overheadCost) || 0,
        profitMargin: parseFloat(profitMargin) || 67
      };
      
      let url = '/api/recipes';
      let method = 'POST';
      
      // If editing an existing recipe
      if (currentRecipeId) {
        url = '/api/recipes';
        method = 'PUT';
        recipeData.id = currentRecipeId;
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(recipeData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save recipe');
      }
      
      const result = await response.json();
      
      // If it's a new recipe, set the current recipe ID
      if (!currentRecipeId) {
        setCurrentRecipeId(result.id);
      }
      
      setSaveSuccess(true);
      setErrorMessage('');
      
      // Refresh recipe list
      fetchRecipes();
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving recipe:', error);
      setErrorMessage(error.message || 'Failed to save recipe');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRecipe = async (id) => {
    if (!confirm('Are you sure you want to delete this recipe?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/recipes?id=${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete recipe');
      }
      
      // Reset form if the deleted recipe was the current one
      if (id === currentRecipeId) {
        resetForm();
      }
      
      // Refresh recipe list
      fetchRecipes();
    } catch (error) {
      console.error('Error deleting recipe:', error);
      setErrorMessage('Failed to delete recipe');
    } finally {
      setIsLoading(false);
    }
  };

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
    setProfitMargin(67); // Reset to 67% (3x multiplier)
    setCurrentRecipeId(null);
    setErrorMessage('');
  };

  // Recipe List Modal component
  const RecipeListModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Saved Recipes</h2>
          <button 
            onClick={() => setShowRecipeList(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No saved recipes found.</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipe Name</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recipes.map(recipe => (
                  <tr key={recipe.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{recipe.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => fetchRecipe(recipe.id)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => deleteRecipe(recipe.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setShowRecipeList(false)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  // Printable view component
  const PrintableRecipeView = () => (
    <div className="fixed inset-0 bg-white z-50 p-8 overflow-auto print:p-0">
      <div className="max-w-4xl mx-auto print:max-w-full">
        <div className="flex justify-between items-center mb-6 print:mb-4">
          <h1 className="text-2xl font-bold">{recipeName || 'Untitled Recipe'} - Cost Breakdown</h1>
          <div className="flex space-x-4 print:hidden">
            <button 
              onClick={() => {
                // Use direct window.print() for best compatibility
                window.print();
              }}
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
  
        <div className="mb-6 print:mb-4">
          <p className="text-gray-600">Servings: {servings}</p>
          <p className="text-gray-600">Date: {new Date().toLocaleDateString()}</p>
        </div>
  
        <div className="mb-6 print:mb-4">
          <h2 className="text-xl font-bold mb-3 print:text-lg">Ingredients</h2>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Ingredient</th>
                <th className="border border-gray-300 p-2 text-left">Quantity</th>
                <th className="border border-gray-300 p-2 text-left">Unit</th>
                <th className="border border-gray-300 p-2 text-left">Cost Per Unit</th>
                <th className="border border-gray-300 p-2 text-left">Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {ingredients.map(ingredient => (
                <tr key={ingredient.id}>
                  <td className="border border-gray-300 p-2">{ingredient.name}</td>
                  <td className="border border-gray-300 p-2">{ingredient.quantity}</td>
                  <td className="border border-gray-300 p-2">{ingredient.unit}</td>
                  <td className="border border-gray-300 p-2">{formatCurrency(parseFloat(ingredient.costPerUnit) || 0)}</td>
                  <td className="border border-gray-300 p-2">{formatCurrency(ingredient.totalCost || 0)}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td colSpan="4" className="border border-gray-300 p-2 text-right">Total Ingredient Cost:</td>
                <td className="border border-gray-300 p-2">{formatCurrency(calculateTotalIngredientCost())}</td>
              </tr>
            </tbody>
          </table>
        </div>
  
        <div className="mb-6 print:mb-4">
          <h2 className="text-xl font-bold mb-3 print:text-lg">Additional Costs</h2>
          <table className="w-full border-collapse border border-gray-300">
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2">Labor Cost</td>
                <td className="border border-gray-300 p-2">{formatCurrency(parseFloat(laborCost) || 0)}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">Overhead Cost</td>
                <td className="border border-gray-300 p-2">{formatCurrency(parseFloat(overheadCost) || 0)}</td>
              </tr>
              <tr className="font-bold">
                <td className="border border-gray-300 p-2">Total Recipe Cost</td>
                <td className="border border-gray-300 p-2">{formatCurrency(calculateTotalRecipeCost())}</td>
              </tr>
            </tbody>
          </table>
        </div>
  
        <div className="mb-6 print:mb-4">
          <h2 className="text-xl font-bold mb-3 print:text-lg">Price Analysis</h2>
          <table className="w-full border-collapse border border-gray-300">
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2">Cost Per Serving</td>
                <td className="border border-gray-300 p-2">{formatCurrency(calculateCostPerServing())}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">Food Cost Percentage</td>
                <td className="border border-gray-300 p-2">{calculateFoodCostPercentage().toFixed(2)}%</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">Profit Margin</td>
                <td className="border border-gray-300 p-2">{profitMargin}%</td>
              </tr>
              <tr className="font-bold">
                <td className="border border-gray-300 p-2">Recommended Selling Price</td>
                <td className="border border-gray-300 p-2">{formatCurrency(calculateSellingPrice())}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2">Profit Per Serving</td>
                <td className="border border-gray-300 p-2">{formatCurrency(calculateProfit())}</td>
              </tr>
            </tbody>
          </table>
        </div>
  
        {/* Additional section with print styling */}
        <style jsx global>{`
          @media print {
            @page {
              size: portrait;
              margin: 1cm;
            }
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            .print\\:hidden {
              display: none !important;
            }
          }
        `}</style>
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
            <h1 className="text-2xl font-bold text-gray-800">
              Recipe Cost Calculator
              {currentRecipeId && <span className="ml-2 text-sm text-gray-500">(Editing recipe)</span>}
            </h1>
            <div className="flex space-x-2">
              <button 
                onClick={() => setShowRecipeList(true)}
                className="px-4 py-2 bg-[#e3902b] text-white rounded-lg flex items-center"
              >
                <List className="w-4 h-4 mr-2" />
                My Recipes
              </button>
              <button 
                onClick={saveRecipe}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center disabled:bg-gray-400"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Recipe'}
              </button>
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
                New Recipe
              </button>
            </div>
          </div>

          {/* Success/Error Messages */}
          {saveSuccess && (
            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">Recipe saved successfully!</span>
            </div>
          )}
          
          {errorMessage && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{errorMessage}</span>
              <button 
                onClick={() => setErrorMessage('')}
                className="absolute top-0 bottom-0 right-0 px-4 py-3"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

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

      {/* Modals */}
      {showPrintable && <PrintableRecipeView />}
      {showRecipeList && <RecipeListModal />}
    </div>
  );
}