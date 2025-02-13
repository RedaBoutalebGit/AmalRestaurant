// pages/api/inventory.js
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

    if (req.method === 'POST') {
      const { 
        name, 
        category, 
        subcategory, 
        quantity, 
        unit, 
        costPerUnit, 
        minThreshold, 
        supplier, 
        notes, 
        storageLocation,
        expiryDate 
      } = req.body;

      // Validate required fields
      if (!name || !category || !subcategory || !unit || !storageLocation) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const newId = `INV${Date.now()}`;
      
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SHEET_ID,
        range: 'Inventory!A:L', // Extended range to include all fields
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            newId,
            name,
            category,
            subcategory,
            quantity || 0,
            unit,
            costPerUnit || 0,
            minThreshold || 0,
            supplier || '',
            notes || '',
            storageLocation,
            expiryDate || '' // Add expiry date
          ]]
        }
      });

      res.status(201).json({ message: 'Item added successfully', id: newId });

    } else if (req.method === 'GET') {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: 'Inventory!A:L', // Extended range to include all fields
      });

      const rows = response.data.values || [];
      const inventory = rows.map(row => ({
        id: row[0],
        name: row[1],
        category: row[2],
        subcategory: row[3],
        quantity: parseFloat(row[4]) || 0,
        unit: row[5],
        costPerUnit: parseFloat(row[6]) || 0,
        minThreshold: parseFloat(row[7]) || 0,
        supplier: row[8] || '',
        notes: row[9] || '',
        storageLocation: row[10] || '',
        expiryDate: row[11] || '' // Add expiry date
      }));

      res.status(200).json(inventory);

    } else if (req.method === 'PATCH') {
      const { id } = req.query;
      const updates = req.body;

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: 'Inventory!A:L',
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === id);

      if (rowIndex === -1) {
        return res.status(404).json({ error: 'Item not found' });
      }

      const updatedRow = [
        id,
        updates.name || rows[rowIndex][1],
        updates.category || rows[rowIndex][2],
        updates.subcategory || rows[rowIndex][3],
        updates.quantity !== undefined ? updates.quantity : rows[rowIndex][4],
        updates.unit || rows[rowIndex][5],
        updates.costPerUnit || rows[rowIndex][6],
        updates.minThreshold || rows[rowIndex][7],
        updates.supplier || rows[rowIndex][8],
        updates.notes || rows[rowIndex][9],
        updates.storageLocation || rows[rowIndex][10],
        updates.expiryDate || rows[rowIndex][11] || '' // Add expiry date
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.SHEET_ID,
        range: `Inventory!A${rowIndex + 2}:L${rowIndex + 2}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [updatedRow]
        }
      });

      res.status(200).json({ message: 'Item updated successfully' });

    } else if (req.method === 'DELETE') {
      const { id } = req.query;

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: 'Inventory!A:L',
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === id);

      if (rowIndex === -1) {
        return res.status(404).json({ error: 'Item not found' });
      }

      // Get the sheet ID
      const sheetsResponse = await sheets.spreadsheets.get({
        spreadsheetId: process.env.SHEET_ID
      });
      
      const sheetId = sheetsResponse.data.sheets[0].properties.sheetId;

      // Delete the row
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: process.env.SHEET_ID,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex + 1,
                endIndex: rowIndex + 2
              }
            }
          }]
        }
      });

      res.status(200).json({ message: 'Item deleted successfully' });
    }

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}