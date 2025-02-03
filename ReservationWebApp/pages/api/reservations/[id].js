// pages/api/reservations/[id].js
import { google } from 'googleapis';

export default async function handler(req, res) {
   // Enhanced logging for all environments
   console.log('Request Method:', req.method);
   console.log('Request Query ID:', req.query.id);
   console.log('Request Body:', req.body);
   console.log('Request Cookies:', req.headers.cookie);
  // Initialize Google Sheets client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Detailed cookie parsing and token extraction
  const cookies = req.headers.cookie;
  console.log('Raw Cookies:', cookies);

  if (!cookies) {
    console.error('No cookies found in the request');
    return res.status(401).json({
      error: 'No cookies present',
      detail: 'Authentication cookies are missing'
    });
  }

  try {
    // More robust token extraction
    const tokenCookie = cookies.split(';')
      .map(cookie => cookie.trim())
      .find(cookie => cookie.startsWith('auth_tokens='));

    console.log('Token Cookie Found:', !!tokenCookie);

    if (!tokenCookie) {
      console.error('No auth_tokens cookie found');
      return res.status(401).json({
        error: 'Authentication token not found',
        loginUrl: '/api/auth/google'
      });
    }

    // Safe token parsing
    let tokens;
    try {
      const tokenString = tokenCookie.split('=')[1];
      tokens = JSON.parse(decodeURIComponent(tokenString));
      console.log('Parsed Tokens:', Object.keys(tokens));
    } catch (parseError) {
      console.error('Token Parsing Error:', parseError);
      return res.status(401).json({
        error: 'Failed to parse authentication tokens',
        detail: parseError.message
      });
    }

    // Validate tokens
    if (!tokens.access_token) {
      console.error('Invalid tokens: No access token');
      return res.status(401).json({
        error: 'Invalid authentication',
        detail: 'Access token is missing'
      });
    }

    // Set credentials with detailed error handling
    try {
      oauth2Client.setCredentials(tokens);
    } catch (credentialError) {
      console.error('Credential Setting Error:', credentialError);
      return res.status(401).json({
        error: 'Failed to set credentials',
        detail: credentialError.message
      });
    }

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    const { id } = req.query;

  try {
    // Handle DELETE request
    if (req.method === 'DELETE') {
      console.log('Processing DELETE request for ID:', id);

      // Get all data to find the row
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: 'Reservations!A:K',
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === id);

      if (rowIndex === -1) {
         console.log('Reservation not found with ID:', id);
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

      console.log('Successfully deleted reservation');
      return res.status(200).json({ message: 'Reservation deleted successfully' });
    }

    // Handle PATCH request
    if (req.method === 'PATCH') {
      const updates = req.body;
     console.log('Processing PATCH request for ID:', id);
    console.log('Received updates:', updates);

      // Get current data
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: 'Reservations!A:K',
      });

      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === id);

      if (rowIndex === -1) {
        console.log('Reservation not found with ID:', id);
        return res.status(404).json({ error: 'Reservation not found' });
      }

      const currentRow = rows[rowIndex];
       console.log('Current row data:', currentRow);

      // Check if it's a simple status or table update
      if ((updates.status !== undefined && Object.keys(updates).length === 1) || 
          (updates.table !== undefined && Object.keys(updates).length === 1)) {
         console.log('Performing simple status/table update');
        
        // Update status if provided
        if (updates.status !== undefined) {
           console.log('Updating status to:', updates.status);
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
         console.log('Updating table to:', updates.table);
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
       console.log('Performing full reservation update');
        
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

         console.log('Updated row to be written:', updatedRow);

        try {
          await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SHEET_ID,
            range: `Reservations!A${rowIndex + 1}:K${rowIndex + 1}`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [updatedRow]
            }
          });
        console.log('Row updated successfully');
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
catch (globalError) {
  console.error('Global Error Handler:', globalError);
  return res.status(500).json({
    error: 'Unhandled server error',
    detail: globalError.message,
    stack: globalError.stack
  });
}
}