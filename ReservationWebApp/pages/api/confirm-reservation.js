// pages/api/confirm-reservation.js
import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { rowIndex } = req.body;
    
    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Get tokens from cookie
    const cookies = req.headers.cookie;
    const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('auth_tokens='));
    const tokens = tokenCookie ? JSON.parse(decodeURIComponent(tokenCookie.split('=')[1])) : null;

    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    oauth2Client.setCredentials(tokens);
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    // Get the row data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: `Reservations!A${rowIndex}:K${rowIndex}`
    });

    const rowData = response.data.values[0];
    const reservationData = {
      name: rowData[3],
      date: rowData[1],
      time: rowData[2],
      guests: rowData[4],
      email: rowData[6],
      table: rowData[10],
      notes: rowData[9]
    };

    // Update status to confirmed
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.SHEET_ID,
      range: `Reservations!I${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [['confirmed']]
      }
    });

    // Call Apps Script to send email
    const script = google.script('v1');
    await script.scripts.run({
      auth: oauth2Client,
      scriptId: process.env.APPS_SCRIPT_ID,
      resource: {
        function: 'handleConfirmation',
        parameters: [rowIndex]
      }
    });

    res.status(200).json({ message: 'Reservation confirmed successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}