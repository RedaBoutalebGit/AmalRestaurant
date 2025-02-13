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

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}