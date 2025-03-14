// pages/recipe-import.js
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Upload, FileText, Check, AlertTriangle, ArrowRight } from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';
import logo from '../public/logo.png';
import ExcelJS from 'exceljs';

function RecipeImportContent() {
  const [file, setFile] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [recipeData, setRecipeData] = useState(null);
  const [recipeName, setRecipeName] = useState('');
  const [servings, setServings] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [ingredients, setIngredients] = useState([]);

  // Handle file upload
  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);
    
    // Reset states
    setSheetNames([]);
    setSelectedSheet('');
    setRecipeData(null);
    setPreviewMode(false);
    setErrorMessage('');
    setSuccessMessage('');

    if (uploadedFile) {
      try {
        const workbook = new ExcelJS.Workbook();
        const arrayBuffer = await uploadedFile.arrayBuffer();
        
        await workbook.xlsx.load(arrayBuffer);
        
        // Get sheet names
        const sheets = [];
        workbook.eachSheet((worksheet, sheetId) => {
          sheets.push(worksheet.name);
        });
        
        setSheetNames(sheets);
      } catch (error) {
        console.error('Error reading Excel file:', error);
        setErrorMessage('Failed to parse Excel file. Please check the file format.');
      }
    }
  };

  // Handle sheet selection
  const handleSheetSelect = async (sheetName) => {
    if (!file) return;
    
    setSelectedSheet(sheetName);
    setPreviewMode(false);
    setIsLoading(true);
    
    try {
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      
      await workbook.xlsx.load(arrayBuffer);
      
      const worksheet = workbook.getWorksheet(sheetName);
      
      if (!worksheet) {
        throw new Error('Worksheet not found');
      }
      
      // Extract recipe name
      let foundRecipeName = '';
      
      // Look for recipe name in the first few rows
      for (let rowNumber = 1; rowNumber <= 10; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        
        for (let colNumber = 1; colNumber <= 10; colNumber++) {
          const cell = row.getCell(colNumber);
          
          if (cell.value && typeof cell.value === 'string') {
            const cellText = cell.value.toLowerCase();
            
            if (cellText.includes('intitulé') || cellText.includes('recette') || cellText.includes('titre')) {
              // Check the next cell for the recipe name
              const nameCell = row.getCell(colNumber + 1);
              if (nameCell && nameCell.value) {
                foundRecipeName = nameCell.value.toString();
                break;
              }
            }
          }
        }
        
        if (foundRecipeName) break;
      }
      
      // If we didn't find a recipe name with labels, try to find it directly
      if (!foundRecipeName) {
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (rowNumber <= 5 && !foundRecipeName) {
            const cell = row.getCell(2); // Often recipe name is in the second column
            if (cell && cell.value && typeof cell.value === 'string' && cell.value.length > 3) {
              foundRecipeName = cell.value;
            }
          }
        });
      }
      
      // Extract ingredients
      let extractedIngredients = [];
      let ingredientSection = false;
      let startRow = -1;
      
      // First, find the ingredients section
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (startRow === -1) {
          for (let i = 1; i <= row.cellCount; i++) {
            const cell = row.getCell(i);
            if (cell && cell.value) {
              const cellText = cell.value.toString().toLowerCase();
              if (cellText.includes('denrées') || cellText.includes('ingredients') || 
                  cellText.includes('ingrédient') || cellText.includes('produit')) {
                startRow = rowNumber + 1; // Start from the next row
                break;
              }
            }
          }
        }
      });
      
      // If we found an ingredient section, extract the ingredients
      if (startRow > 0) {
        // Find columns for name, quantity, unit, and cost
        const columns = {
          name: 1,
          quantity: 2,
          unit: 3,
          price: 4,
          total: 5
        };
        
        for (let rowNumber = startRow; rowNumber <= worksheet.rowCount; rowNumber++) {
          const row = worksheet.getRow(rowNumber);
          
          // Skip empty rows
          if (row.cellCount < 2) continue;
          
          const nameCell = row.getCell(columns.name);
          const quantityCell = row.getCell(columns.quantity);
          const unitCell = row.getCell(columns.unit);
          const priceCell = row.getCell(columns.price);
          const totalCell = row.getCell(columns.total);
          
          // If we have a name and quantity, consider it an ingredient
          if (nameCell && nameCell.value && quantityCell && quantityCell.value) {
            const name = nameCell.value.toString();
            const quantity = parseFloat(quantityCell.value) || 0;
            const unit = unitCell && unitCell.value ? unitCell.value.toString() : '';
            const costPerUnit = parseFloat(priceCell && priceCell.value ? priceCell.value : 0) || 0;
            const totalCost = parseFloat(totalCell && totalCell.value ? totalCell.value : 0) || (quantity * costPerUnit);
            
            extractedIngredients.push({
              id: extractedIngredients.length + 1,
              name: name,
              quantity: quantity.toString(),
              unit: mapUnit(unit),
              costPerUnit: costPerUnit.toString(),
              totalCost: totalCost
            });
          }
          
          // If we hit a blank row after finding some ingredients, we're done
          if (extractedIngredients.length > 0 && row.cellCount < 2) {
            break;
          }
        }
      }
      
      // Set the data
      setRecipeName(foundRecipeName);
      setIngredients(extractedIngredients);
      setRecipeData(true); // Just a flag to indicate we have data
      
    } catch (error) {
      console.error('Error processing sheet:', error);
      setErrorMessage('Failed to process the selected sheet: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Map Excel units to our standard units
  const mapUnit = (excelUnit) => {
    if (!excelUnit) return 'g';
    
    const unitMap = {
      'KG': 'kg',
      'kg': 'kg',
      'Kg': 'kg',
      'G': 'g',
      'g': 'g',
      'L': 'l',
      'l': 'l',
      'ml': 'ml',
      'ML': 'ml',
      'pièce': 'piece',
      'Pièce': 'piece',
      'piece': 'piece',
      'PIECE': 'piece',
      'pc': 'piece',
      'cuillère': 'tbsp',
      'cuillere': 'tbsp',
      'c. à soupe': 'tbsp',
      'tbsp': 'tbsp',
      'tsp': 'tsp'
    };
    
    return unitMap[excelUnit] || 'g'; // Default to grams if unit is not recognized
  };

  // Preview the recipe
  const previewRecipe = () => {
    if (ingredients.length === 0) {
      setErrorMessage('No ingredients found. Please check the Excel format.');
      return;
    }
    
    setPreviewMode(true);
  };

  // Save the recipe
  const saveRecipe = async () => {
    if (!recipeName.trim()) {
      setErrorMessage('Recipe name is required');
      return;
    }
    
    if (ingredients.length === 0) {
      setErrorMessage('No ingredients found');
      return;
    }
    
    try {
      setIsLoading(true);
      setErrorMessage('');
      setSuccessMessage('');
      
      const recipeData = {
        name: recipeName,
        servings: parseInt(servings) || 1,
        ingredients,
        laborCost: 0, // Default values, can be adjusted later
        overheadCost: 0,
        profitMargin: 67
      };
      
      const response = await fetch('/api/recipes', {
        method: 'POST',
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
      
      setSuccessMessage(`Recipe "${recipeName}" imported successfully!`);
      
      // Reset states for next import
      setTimeout(() => {
        setFile(null);
        setSheetNames([]);
        setSelectedSheet('');
        setRecipeData(null);
        setRecipeName('');
        setServings(1);
        setIngredients([]);
        setPreviewMode(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error saving recipe:', error);
      setErrorMessage(error.message || 'Failed to save recipe');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate total ingredient cost
  const calculateTotalIngredientCost = () => {
    return ingredients.reduce((sum, ingredient) => sum + (ingredient.totalCost || 0), 0);
  };

  // Format currency
  const formatCurrency = (value) => {
    return `Dhs ${value.toFixed(2)}`;
  };

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
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-[#ffdbb0]"
              >
                Recipe Calculator
              </Link>
              <Link
                href="/recipe-import"
                className="px-4 py-2 rounded-md text-sm font-medium bg-[#e3902b] text-white"
              >
                Recipe Import
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Import Recipe from Excel
          </h1>
          
          {/* Error/Success Messages */}
          {errorMessage && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                <span className="block sm:inline">{errorMessage}</span>
              </div>
            </div>
          )}
          
          {successMessage && (
            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
              <div className="flex items-center">
                <Check className="w-5 h-5 mr-2" />
                <span className="block sm:inline">{successMessage}</span>
              </div>
            </div>
          )}
          
          {/* Step 1: Upload Excel File */}
          <div className={`mb-6 ${selectedSheet ? 'opacity-50' : ''}`}>
            <h2 className="text-lg font-medium text-gray-800 mb-4">Step 1: Upload Excel File</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileUpload}
                accept=".xlsx,.xls"
                disabled={selectedSheet !== ''}
              />
              <label 
                htmlFor="file-upload"
                className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Select Excel File
              </label>
              {file && (
                <div className="mt-4">
                  <div className="flex items-center justify-center text-gray-700">
                    <FileText className="w-5 h-5 mr-2 text-blue-500" />
                    <span>{file.name}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="ml-3 text-gray-600">Processing file...</p>
            </div>
          )}
          
          {/* Step 2: Select Sheet */}
          {sheetNames.length > 0 && !isLoading && (
            <div className={`mb-6 ${previewMode ? 'opacity-50' : ''}`}>
              <h2 className="text-lg font-medium text-gray-800 mb-4">Step 2: Select Recipe Sheet</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {sheetNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => handleSheetSelect(name)}
                    className={`p-4 border rounded-lg text-center hover:bg-gray-50 ${
                      selectedSheet === name ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                    disabled={previewMode}
                  >
                    <FileText className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                    <span className="block font-medium">{name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Step 3: Preview and Edit */}
          {selectedSheet && !previewMode && !isLoading && (
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Step 3: Edit Recipe Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Name</label>
                  <input
                    type="text"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    placeholder="Enter recipe name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Servings</label>
                  <input
                    type="number"
                    min="1"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="text-md font-medium text-gray-700 mb-2">Found Ingredients ({ingredients.length})</h3>
                {ingredients.length === 0 ? (
                  <div className="text-yellow-600 bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      <p>No ingredients detected. The Excel format may not match expected patterns.</p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingredient</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Per Unit</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {ingredients.map((ingredient) => (
                          <tr key={ingredient.id}>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <input
                                type="text"
                                value={ingredient.name}
                                onChange={(e) => {
                                  const updatedIngredients = ingredients.map(ing => 
                                    ing.id === ingredient.id ? {...ing, name: e.target.value} : ing
                                  );
                                  setIngredients(updatedIngredients);
                                }}
                                className="border border-gray-300 rounded p-1 w-full"
                              />
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <input
                                type="number"
                                step="0.001"
                                min="0"
                                value={ingredient.quantity}
                                onChange={(e) => {
                                  const quantity = e.target.value;
                                  const totalCost = parseFloat(quantity) * parseFloat(ingredient.costPerUnit || 0);
                                  const updatedIngredients = ingredients.map(ing => 
                                    ing.id === ingredient.id ? {...ing, quantity, totalCost} : ing
                                  );
                                  setIngredients(updatedIngredients);
                                }}
                                className="border border-gray-300 rounded p-1 w-full"
                              />
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <select
                                value={ingredient.unit}
                                onChange={(e) => {
                                  const updatedIngredients = ingredients.map(ing => 
                                    ing.id === ingredient.id ? {...ing, unit: e.target.value} : ing
                                  );
                                  setIngredients(updatedIngredients);
                                }}
                                className="border border-gray-300 rounded p-1 w-full"
                              >
                                <option value="g">g</option>
                                <option value="kg">kg</option>
                                <option value="ml">ml</option>
                                <option value="l">l</option>
                                <option value="piece">piece</option>
                                <option value="tbsp">tbsp</option>
                                <option value="tsp">tsp</option>
                              </select>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={ingredient.costPerUnit}
                                onChange={(e) => {
                                  const costPerUnit = e.target.value;
                                  const totalCost = parseFloat(ingredient.quantity || 0) * parseFloat(costPerUnit);
                                  const updatedIngredients = ingredients.map(ing => 
                                    ing.id === ingredient.id ? {...ing, costPerUnit, totalCost} : ing
                                  );
                                  setIngredients(updatedIngredients);
                                }}
                                className="border border-gray-300 rounded p-1 w-full"
                              />
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-right">
                              {formatCurrency(ingredient.totalCost || 0)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50">
                          <td colSpan="4" className="px-3 py-2 text-right font-medium">Total Ingredient Cost:</td>
                          <td className="px-3 py-2 text-right font-bold">{formatCurrency(calculateTotalIngredientCost())}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={previewRecipe}
                  disabled={ingredients.length === 0 || !recipeName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center disabled:bg-gray-400"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Continue
                </button>
              </div>
            </div>
          )}
          
          {/* Step 4: Confirmation and Save */}
          {previewMode && (
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Step 4: Confirm and Save Recipe</h2>
              
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold">{recipeName}</h3>
                  <p className="text-gray-600">Servings: {servings}</p>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Ingredients:</h4>
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-3 py-2 text-left">Ingredient</th>
                        <th className="px-3 py-2 text-left">Quantity</th>
                        <th className="px-3 py-2 text-left">Unit</th>
                        <th className="px-3 py-2 text-left">Cost Per Unit</th>
                        <th className="px-3 py-2 text-left">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ingredients.map((ingredient) => (
                        <tr key={ingredient.id} className="border-b">
                          <td className="px-3 py-2">{ingredient.name}</td>
                          <td className="px-3 py-2">{ingredient.quantity}</td>
                          <td className="px-3 py-2">{ingredient.unit}</td>
                          <td className="px-3 py-2">{formatCurrency(parseFloat(ingredient.costPerUnit) || 0)}</td>
                          <td className="px-3 py-2">{formatCurrency(ingredient.totalCost || 0)}</td>
                        </tr>
                      ))}
                      <tr className="font-bold">
                        <td colSpan="4" className="px-3 py-2 text-right">Total Ingredient Cost:</td>
                        <td className="px-3 py-2">{formatCurrency(calculateTotalIngredientCost())}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setPreviewMode(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg"
                >
                  Edit
                </button>
                <button
                  onClick={saveRecipe}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center disabled:bg-gray-400"
                >
                  {isLoading ? 'Saving...' : 'Save Recipe'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RecipeImportPage() {
  return (
    <ProtectedRoute pageName="recipe">
      <RecipeImportContent />
    </ProtectedRoute>
  );
}