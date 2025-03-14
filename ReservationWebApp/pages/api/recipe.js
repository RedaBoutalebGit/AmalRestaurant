// pages/api/recipes.js
import { google } from 'googleapis';

export default async function handler(req, res) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Check auth tokens
    const cookies = req.headers.cookie;
    if (!cookies?.includes('auth_tokens')) {
      return res.status(401).json({
        error: 'Not authenticated',
        loginUrl: '/api/auth/google'
      });
    }

    const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('auth_tokens='));
    const tokens = tokenCookie ? JSON.parse(decodeURIComponent(tokenCookie.split('=')[1])) : null;

    oauth2Client.setCredentials(tokens);
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    // GET - Fetch all recipes
    if (req.method === 'GET' && !req.query.id) {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: 'Recipes!A:B', // Recipe ID and name for list view
      });

      // If the Recipes sheet doesn't exist yet, return empty array
      if (response.status === 400) {
        return res.status(200).json([]);
      }

      const rows = response.data.values || [];
      // Skip header row if it exists
      const recipes = rows.length > 0 && rows[0][0] === 'id' 
        ? rows.slice(1).map(row => ({ id: row[0], name: row[1] })) 
        : rows.map(row => ({ id: row[0], name: row[1] }));

      return res.status(200).json(recipes);
    }

    // GET specific recipe
    if (req.method === 'GET' && req.query.id) {
      const { id } = req.query;
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: `RecipeDetails!A:Z`, // Get all potential columns
      });

      const rows = response.data.values || [];
      const recipe = rows.find(row => row[0] === id);
      
      if (!recipe) {
        return res.status(404).json({ error: 'Recipe not found' });
      }
      
      // Parse the recipe data
      const recipeData = {
        id: recipe[0],
        name: recipe[1],
        servings: parseInt(recipe[2]) || 1,
        ingredients: JSON.parse(recipe[3] || '[]'),
        laborCost: parseFloat(recipe[4]) || 0,
        overheadCost: parseFloat(recipe[5]) || 0,
        profitMargin: parseFloat(recipe[6]) || 67,
        createdAt: recipe[7],
        updatedAt: recipe[8]
      };
      
      return res.status(200).json(recipeData);
    }

    // POST - Create a new recipe
    if (req.method === 'POST') {
      const { name, servings, ingredients, laborCost, overheadCost, profitMargin } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Recipe name is required' });
      }
      
      const recipeId = `RECIPE_${Date.now()}`;
      const now = new Date().toISOString();
      
      // First, check if the Recipes sheet exists, if not create it
      try {
        await sheets.spreadsheets.values.get({
          spreadsheetId: process.env.SHEET_ID,
          range: 'Recipes!A1',
        });
      } catch (error) {
        // Sheet doesn't exist, create it with headers
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: process.env.SHEET_ID,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: 'Recipes',
                  }
                }
              },
              {
                addSheet: {
                  properties: {
                    title: 'RecipeDetails',
                  }
                }
              }
            ]
          }
        });
        
        // Add headers to the sheets
        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.SHEET_ID,
          range: 'Recipes!A1:B1',
          valueInputOption: 'RAW',
          requestBody: {
            values: [['id', 'name']]
          }
        });
        
        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.SHEET_ID,
          range: 'RecipeDetails!A1:I1',
          valueInputOption: 'RAW',
          requestBody: {
            values: [['id', 'name', 'servings', 'ingredients', 'laborCost', 'overheadCost', 'profitMargin', 'createdAt', 'updatedAt']]
          }
        });
      }
      
      // Add recipe to list (Recipe sheet)
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SHEET_ID,
        range: 'Recipes!A:B',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[recipeId, name]]
        }
      });
      
      // Add detailed recipe data (RecipeDetails sheet)
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SHEET_ID,
        range: 'RecipeDetails!A:I',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            recipeId,
            name,
            servings.toString(),
            JSON.stringify(ingredients),
            laborCost.toString(),
            overheadCost.toString(),
            profitMargin.toString(),
            now,
            now
          ]]
        }
      });
      
      return res.status(201).json({ 
        id: recipeId,
        name,
        message: 'Recipe saved successfully' 
      });
    }

    // PUT - Update an existing recipe
    if (req.method === 'PUT') {
      const { id, name, servings, ingredients, laborCost, overheadCost, profitMargin } = req.body;
      
      if (!id || !name) {
        return res.status(400).json({ error: 'Recipe ID and name are required' });
      }
      
      const now = new Date().toISOString();
      
      // Find the recipe in RecipeDetails
      const detailsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: 'RecipeDetails!A:A', // Just the IDs column
      });
      
      const detailsRows = detailsResponse.data.values || [];
      const detailsRowIndex = detailsRows.findIndex(row => row[0] === id);
      
      if (detailsRowIndex === -1) {
        return res.status(404).json({ error: 'Recipe not found' });
      }
      
      // Update the recipe details
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.SHEET_ID,
        range: `RecipeDetails!A${detailsRowIndex + 1}:I${detailsRowIndex + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            id,
            name,
            servings.toString(),
            JSON.stringify(ingredients),
            laborCost.toString(),
            overheadCost.toString(),
            profitMargin.toString(),
            detailsRows[detailsRowIndex][7] || now, // preserve original creation date
            now
          ]]
        }
      });
      
      // Find the recipe in Recipes list to update the name
      const listResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: 'Recipes!A:A', // Just the IDs column
      });
      
      const listRows = listResponse.data.values || [];
      const listRowIndex = listRows.findIndex(row => row[0] === id);
      
      if (listRowIndex !== -1) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.SHEET_ID,
          range: `Recipes!B${listRowIndex + 1}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[name]]
          }
        });
      }
      
      return res.status(200).json({ 
        id,
        name,
        message: 'Recipe updated successfully' 
      });
    }

    // DELETE - Remove a recipe
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'Recipe ID is required' });
      }
      
      // Get the sheet ID for Recipes
      const sheetsResponse = await sheets.spreadsheets.get({
        spreadsheetId: process.env.SHEET_ID
      });
      
      // Find the sheet IDs
      const recipesSheet = sheetsResponse.data.sheets.find(s => s.properties.title === 'Recipes');
      const detailsSheet = sheetsResponse.data.sheets.find(s => s.properties.title === 'RecipeDetails');
      
      if (!recipesSheet || !detailsSheet) {
        return res.status(404).json({ error: 'Recipe sheets not found' });
      }
      
      const recipesSheetId = recipesSheet.properties.sheetId;
      const detailsSheetId = detailsSheet.properties.sheetId;
      
      // Find the recipe row in Recipes list
      const listResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: 'Recipes!A:A',
      });
      
      const listRows = listResponse.data.values || [];
      const listRowIndex = listRows.findIndex(row => row[0] === id);
      
      // Find the recipe row in RecipeDetails
      const detailsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: 'RecipeDetails!A:A',
      });
      
      const detailsRows = detailsResponse.data.values || [];
      const detailsRowIndex = detailsRows.findIndex(row => row[0] === id);
      
      const batchRequests = [];
      
      // Delete from Recipes list if found
      if (listRowIndex !== -1) {
        batchRequests.push({
          deleteDimension: {
            range: {
              sheetId: recipesSheetId,
              dimension: 'ROWS',
              startIndex: listRowIndex,
              endIndex: listRowIndex + 1
            }
          }
        });
      }
      
      // Delete from RecipeDetails if found
      if (detailsRowIndex !== -1) {
        batchRequests.push({
          deleteDimension: {
            range: {
              sheetId: detailsSheetId,
              dimension: 'ROWS',
              startIndex: detailsRowIndex,
              endIndex: detailsRowIndex + 1
            }
          }
        });
      }
      
      if (batchRequests.length > 0) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: process.env.SHEET_ID,
          requestBody: {
            requests: batchRequests
          }
        });
      }
      
      return res.status(200).json({ message: 'Recipe deleted successfully' });
    }

    // Handle unsupported methods
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}