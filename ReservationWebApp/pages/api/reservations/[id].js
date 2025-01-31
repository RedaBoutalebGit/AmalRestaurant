// pages/api/reservations/[id].js
import { google } from 'googleapis';

export default async function handler(req, res) {
  // Initialize Google Sheets client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Get auth tokens from cookie
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
  const { id } = req.query;

  try {
    // Handle DELETE request
    if (req.method === 'DELETE') {
      console.log('Processing DELETE request for ID:', id);

      // Get all data to find the row
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: 'Reservations!A:K', // Updated to include table column
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === id);

      if (rowIndex === -1) {
        console.log('Reservation not found with ID:', id);
        return res.status(404).json({ error: 'Reservation not found' });
      }

      console.log('Found reservation at row:', rowIndex + 1);

      // Get the sheet ID (required for batchUpdate)
      const sheetsResponse = await sheets.spreadsheets.get({
        spreadsheetId: process.env.SHEET_ID
      });
      
      const sheetId = sheetsResponse.data.sheets[0].properties.sheetId;

      // Delete the row using batchUpdate
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: process.env.SHEET_ID,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: sheetId,
                  dimension: 'ROWS',
                  startIndex: rowIndex,
                  endIndex: rowIndex + 1
                }
              }
            }
          ]
        }
      });

      console.log('Successfully deleted reservation');
      return res.status(200).json({ message: 'Reservation deleted successfully' });
    }

    // Handle PATCH request (for updating status or table)
    if (req.method === 'PATCH') {
      const { status, table } = req.body;
      console.log('Processing PATCH request for ID:', id, 'Status:', status, 'Table:', table);

      // Get current data to find the row
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: 'Reservations!A:K', // Updated to include table column
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === id);

      if (rowIndex === -1) {
        console.log('Reservation not found with ID:', id);
        return res.status(404).json({ error: 'Reservation not found' });
      }

      console.log('Found reservation at row:', rowIndex + 1);

      // Update based on what was provided
      if (status !== undefined) {
        // Update status (Column I)
        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.SHEET_ID,
          range: `Reservations!I${rowIndex + 1}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[status]]
          }
        });
      }

      if (table !== undefined) {
        // Update table assignment (Column K)
        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.SHEET_ID,
          range: `Reservations!K${rowIndex + 1}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[table]]
          }
        });
      }

      console.log('Successfully updated reservation');
      return res.status(200).json({ message: 'Reservation updated successfully' });
    }

    // Handle unsupported methods
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowedMethods: ['DELETE', 'PATCH']
    });

  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}