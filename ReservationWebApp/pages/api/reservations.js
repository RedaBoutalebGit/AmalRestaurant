// pages/api/reservations.js
import { google } from 'googleapis';

export default async function handler(req, res) {
  try {
    // Log incoming request
    console.log('Request method:', req.method);
    console.log('Request body:', req.body);
    console.log('Request cookies:', req.headers.cookie);

    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Check auth tokens
    const cookies = req.headers.cookie;
    if (!cookies?.includes('auth_tokens')) {
      console.log('No auth tokens found');
      return res.status(401).json({
        error: 'Not authenticated',
        loginUrl: '/api/auth/google'
      });
    }

    // Parse tokens from cookies
    try {
      const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('auth_tokens='));
      const tokens = tokenCookie ? JSON.parse(decodeURIComponent(tokenCookie.split('=')[1])) : null;
      console.log('Parsed tokens:', tokens ? 'Found' : 'Not found');

      if (!tokens) {
        return res.status(401).json({
          error: 'Invalid authentication',
          loginUrl: '/api/auth/google'
        });
      }

      // Set credentials
      oauth2Client.setCredentials(tokens);
    } catch (e) {
      console.error('Error parsing tokens:', e);
      return res.status(401).json({
        error: 'Invalid token format',
        loginUrl: '/api/auth/google'
      });
    }

    // Create sheets instance
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    if (req.method === 'POST') {
      console.log('Processing POST request');
      const { date, time, name, guests, phone, email, source, status, notes } = req.body;

      // Validate required fields
      if (!date || !time || !name || !guests) {
        return res.status(400).json({ 
          error: 'Missing required fields: date, time, name, and guests are required' 
        });
      }

      // Log sheet ID
      console.log('Using Sheet ID:', process.env.SHEET_ID);

      // Attempt to append data
      try {
        const response = await sheets.spreadsheets.values.append({
          spreadsheetId: process.env.SHEET_ID,
          range: 'Reservations!A:K', // Updated to include table column
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[
              Date.now().toString(), // ID
              date,
              time,
              name,
              guests,
              phone || '',
              email || '',
              source || 'online',
              status || 'pending',
              notes || '',
              '' // Empty table assignment initially
            ]]
          }
        });

        console.log('Sheet response:', response.data);
        res.status(201).json(response.data);
      } catch (sheetError) {
        console.error('Sheet API error:', sheetError);
        res.status(500).json({ 
          error: 'Failed to save to sheet',
          details: sheetError.message 
        });
      }
    } else if (req.method === 'GET') {
      try {
        console.log('Fetching reservations from sheet');
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: process.env.SHEET_ID,
          range: 'Reservations!A2:K', // Updated to include table column
        });

        console.log('Sheet response received');
        const rows = response.data.values || [];
        const reservations = rows.map((row, index) => ({
          id: row[0] || `row-${index + 2}`,
          date: row[1],
          time: row[2],
          name: row[3],
          guests: parseInt(row[4]) || 0,
          phone: row[5],
          email: row[6],
          source: row[7],
          status: row[8],
          notes: row[9],
          table: row[10] // Add table number
        }));

        console.log(`Found ${reservations.length} reservations`);
        res.status(200).json(reservations);
      } catch (error) {
        console.error('Error fetching reservations:', error);
        if (error.message === 'No authentication tokens found') {
          return res.status(401).json({
            error: 'Authentication required',
            loginUrl: '/api/auth/google'
          });
        }
        res.status(500).json({ 
          error: 'Failed to fetch reservations',
          details: error.message
        });
      }
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}