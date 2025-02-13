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
    
      // Ensure quantity is a valid number
      const movementQty = parseFloat(quantity);
      if (isNaN(movementQty) || movementQty <= 0) {
        return res.status(400).json({ error: 'Invalid quantity' });
      }
    
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
            movementQty,
            date,
            reason
          ]]
        }
      });
    
      // Fetch current inventory
      const inventoryResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: 'Inventory!A:E', // Adjust column range as needed
      });
    
      const rows = inventoryResponse.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === itemId);
    
      if (rowIndex === -1) {
        return res.status(404).json({ error: 'Item not found' });
      }
    
      // Get current quantity
      const currentQuantity = parseFloat(rows[rowIndex][4]) || 0;
      let newQuantity = currentQuantity;
    
      if (type === 'IN') {
        newQuantity += movementQty;
      } else if (type === 'OUT') {
        newQuantity -= movementQty;
    
        // Prevent stock from going negative
        if (newQuantity < 0) {
          return res.status(400).json({ error: 'Insufficient stock' });
        }
      }
    
      // Update inventory sheet
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.SHEET_ID,
        range: `Inventory!E${rowIndex + 1}`, // Assuming column E contains quantity
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[newQuantity]]
        }
      });
    
      res.status(200).json({ message: 'Stock movement recorded successfully', newQuantity });
    }
   else if (req.method === 'GET') {
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