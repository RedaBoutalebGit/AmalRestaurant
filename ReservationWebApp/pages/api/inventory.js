// pages/api/inventory.js
import { google } from 'googleapis';

export default async function handler(req, res) {
  try {
    // Initialize OAuth2 client
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

    if (!tokens) {
      return res.status(401).json({
        error: 'Invalid authentication',
        loginUrl: '/api/auth/google'
      });
    }

    oauth2Client.setCredentials(tokens);
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    if (req.method === 'GET') {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: 'Inventory!A2:J',
      });

      const rows = response.data.values || [];
      const inventory = rows.map((row) => ({
        id: row[0],
        name: row[1],
        category: row[2],
        quantity: parseFloat(row[3]),
        unit: row[4],
        costPerUnit: parseFloat(row[5]),
        minThreshold: parseFloat(row[6]),
        lastUpdated: row[7],
        supplier: row[8],
        notes: row[9]
      }));

      res.status(200).json(inventory);

    } else if (req.method === 'POST') {
      const { name, category, quantity, unit, costPerUnit, minThreshold, supplier, notes } = req.body;

      // Generate new ID
      const newId = `INV${Date.now()}`;

      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SHEET_ID,
        range: 'Inventory!A:J',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            newId,
            name,
            category,
            quantity,
            unit,
            costPerUnit,
            minThreshold,
            new Date().toISOString(),
            supplier,
            notes
          ]]
        }
      });

      res.status(201).json({ message: 'Item added successfully', id: newId });

    }
     else if (req.method === 'PATCH') {
  const { id } = req.query;
  const updates = req.body;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: 'Inventory!A:J',
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
    updates.quantity || rows[rowIndex][3],
    updates.unit || rows[rowIndex][4],
    updates.costPerUnit || rows[rowIndex][5],
    updates.minThreshold || rows[rowIndex][6],
    new Date().toISOString(),
    updates.supplier || rows[rowIndex][8],
    updates.notes || rows[rowIndex][9]
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SHEET_ID,
    range: `Inventory!A${rowIndex + 2}:J${rowIndex + 2}`,
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
    range: 'Inventory!A:J',
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
    else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
  
}