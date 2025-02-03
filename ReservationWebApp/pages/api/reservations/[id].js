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
      // console.log('Processing DELETE request for ID:', id);

      // Get all data to find the row
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: 'Reservations!A:K',
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === id);

      if (rowIndex === -1) {
        // console.log('Reservation not found with ID:', id);
        return res.status(404).json({ error: 'Reservation not found' });
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
                startIndex: rowIndex,
                endIndex: rowIndex + 1
              }
            }
          }]
        }
      });

      // console.log('Successfully deleted reservation');
      return res.status(200).json({ message: 'Reservation deleted successfully' });
    }

    // Handle PATCH request
    if (req.method === 'PATCH') {
      const updates = req.body;
     //  console.log('Processing PATCH request for ID:', id);
      // console.log('Received updates:', updates);

      // Get current data
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: 'Reservations!A:K',
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === id);

      if (rowIndex === -1) {
       //  console.log('Reservation not found with ID:', id);
        return res.status(404).json({ error: 'Reservation not found' });
      }

      const currentRow = rows[rowIndex];
      // console.log('Current row data:', currentRow);

      // Check if it's a simple status or table update
      if ((updates.status !== undefined && Object.keys(updates).length === 1) || 
          (updates.table !== undefined && Object.keys(updates).length === 1)) {
        // console.log('Performing simple status/table update');
        
        // Update status if provided
        if (updates.status !== undefined) {
          // console.log('Updating status to:', updates.status);
          await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SHEET_ID,
            range: `Reservations!I${rowIndex + 1}`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [[updates.status]]
            }
          });
        }

        // Update table if provided
        if (updates.table !== undefined) {
         //  console.log('Updating table to:', updates.table);
          await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SHEET_ID,
            range: `Reservations!K${rowIndex + 1}`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [[updates.table]]
            }
          });
        }
      } else {
        // Full reservation update
       //  console.log('Performing full reservation update');
        
        const updatedRow = [
          id, // Keep original ID
          updates.date || currentRow[1],
          updates.time || currentRow[2],
          updates.name || currentRow[3],
          updates.guests ? updates.guests.toString() : currentRow[4],
          updates.phone || currentRow[5] || '',
          updates.email || currentRow[6] || '',
          currentRow[7], // Preserve source
          updates.status || currentRow[8],
          updates.notes || currentRow[9] || '',
          currentRow[10] || '' // Preserve table assignment
        ];

        // console.log('Updated row to be written:', updatedRow);

        try {
          await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SHEET_ID,
            range: `Reservations!A${rowIndex + 1}:K${rowIndex + 1}`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [updatedRow]
            }
          });
         //  console.log('Row updated successfully');
        } catch (updateError) {
          console.error('Error updating row:', updateError);
          throw updateError;
        }
      }

      return res.status(200).json({ 
        message: 'Reservation updated successfully',
        updates: updates
      });
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
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}