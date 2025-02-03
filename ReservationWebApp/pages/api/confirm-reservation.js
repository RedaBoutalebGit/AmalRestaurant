// pages/api/confirm-reservation.js
import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Starting confirmation process');
    const { rowIndex } = req.body;
    
    if (!rowIndex) {
      return res.status(400).json({ error: 'Row index is required' });
    }

    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Get tokens from cookie
    const cookies = req.headers.cookie;
    if (!cookies) {
      return res.status(401).json({ error: 'No auth cookies found' });
    }

    const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('auth_tokens='));
    const tokens = tokenCookie ? JSON.parse(decodeURIComponent(tokenCookie.split('=')[1])) : null;

    if (!tokens) {
      return res.status(401).json({ error: 'No auth tokens found' });
    }

    oauth2Client.setCredentials(tokens);
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    console.log('Updating status to confirmed');
    // Update status to confirmed
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.SHEET_ID,
      range: `Reservations!I${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [['confirmed']]
      }
    });

    // Get row data for email
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: `Reservations!A${rowIndex}:K${rowIndex}`
    });

    if (!response.data.values || !response.data.values[0]) {
      throw new Error('Row data not found');
    }

    const rowData = response.data.values[0];
    const email = rowData[6]; // Column G: Email

    if (email) {
      console.log('Sending confirmation email');
      // Send email using Google Sheets script
      const script = google.script('v1');
      await script.scripts.run({
        auth: oauth2Client,
        scriptId: process.env.APPS_SCRIPT_ID,
        resource: {
          function: 'handleConfirmation',
          parameters: [rowIndex]
        }
      });
    }

    console.log('Confirmation process completed');
    res.status(200).json({ message: 'Reservation confirmed successfully' });
  } catch (error) {
    console.error('Confirmation error:', error);
    res.status(500).json({ 
      error: 'Failed to confirm reservation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}