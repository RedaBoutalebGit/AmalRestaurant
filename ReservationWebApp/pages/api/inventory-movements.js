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

      // First, log the movement
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

      // Then update the inventory quantity
      const inventory = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: 'Inventory!A:L',
      });

      const rows = inventory.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === itemId);
      
      if (rowIndex !== -1) {
        const currentQuantity = parseFloat(rows[rowIndex][4]); // Column E (index 4) is quantity
        const newQuantity = type === 'IN' ? 
          currentQuantity + parseFloat(quantity) : 
          currentQuantity - parseFloat(quantity);

        // Update quantity in column E
        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.SHEET_ID,
          range: `Inventory!E${rowIndex + 2}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[newQuantity]]
          }
        });

        // Return the success response with the new quantity
        res.status(200).json({ 
          message: 'Movement recorded successfully',
          newQuantity: newQuantity
        });
      } else {
        res.status(404).json({ error: 'Item not found' });
      }

    } else if (req.method === 'GET') {
      const { itemId } = req.query;
      
      try {
        // Get inventory data for item names
        const inventoryResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: process.env.SHEET_ID,
          range: 'Inventory!A:B',
        });
        
        const inventoryMap = {};
        inventoryResponse.data.values?.forEach(row => {
          inventoryMap[row[0]] = row[1];
        });
    
        // Get movements
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: process.env.SHEET_ID,
          range: 'InventoryMovements!A:F',
        });
    
        const rows = response.data.values || [];
        const movements = rows
          .map(row => ({
            id: row[0],
            itemId: row[1],
            itemName: inventoryMap[row[1]] || 'Unknown Item',
            type: row[2],
            quantity: parseFloat(row[3]),
            date: row[4],
            reason: row[5]
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date));
    
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