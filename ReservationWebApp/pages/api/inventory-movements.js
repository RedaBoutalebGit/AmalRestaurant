// pages/api/inventory-movements.js
import { google } from 'googleapis';

export default async function handler(req, res) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Auth check
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
      const { itemId, type, quantity, reason, date = new Date().toISOString() } = req.body;

      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SHEET_ID,
        range: 'InventoryMovements!A:F',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            `MOV${Date.now()}`,
            itemId,
            type,
            quantity,
            date,
            reason
          ]]
        }
      });

      // Update current inventory quantity
      const inventory = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: 'Inventory!A:D',
      });

      const rows = inventory.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === itemId);
      
      if (rowIndex !== -1) {
        const currentQuantity = parseFloat(rows[rowIndex][3]);
        const newQuantity = type === 'IN' ? 
          currentQuantity + parseFloat(quantity) : 
          currentQuantity - parseFloat(quantity);

        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.SHEET_ID,
          range: `Inventory!D${rowIndex + 2}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[newQuantity]]
          }
        });
      }

      res.status(200).json({ message: 'Movement recorded successfully' });
    } else if (req.method === 'GET') {
      const { itemId } = req.query;
      
      try {
        // First get inventory data to map names
        const inventoryResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: process.env.SHEET_ID,
          range: 'Inventory!A:B', // Get ID and Name columns
        });
        
        const inventoryMap = {};
        inventoryResponse.data.values?.forEach(row => {
          inventoryMap[row[0]] = row[1]; // Map ID to Name
        });
    
        // Then get movements
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: process.env.SHEET_ID,
          range: 'InventoryMovements!A:F',
        });
    
        const rows = response.data.values || [];
        const movements = rows.map(row => ({
          id: row[0],
          itemId: row[1],
          itemName: inventoryMap[row[1]] || 'Unknown Item', // Add item name
          type: row[2],
          quantity: parseFloat(row[3]),
          date: row[4],
          reason: row[5]
        }));
    
        // Filter by itemId if provided
        const filteredMovements = itemId ? 
          movements.filter(m => m.itemId === itemId) : 
          movements;
    
        res.status(200).json(filteredMovements);
      } catch (error) {
        console.error('Error fetching movements:', error);
        res.status(500).json({ error: error.message });
      }
    }

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}