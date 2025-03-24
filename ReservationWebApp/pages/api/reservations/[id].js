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
     const response = await sheets.spreadsheets.values.get({
       spreadsheetId: process.env.SHEET_ID,
       range: 'Reservations!A:N',
     });

     const rows = response.data.values || [];
     const rowIndex = rows.findIndex(row => row[0] === id);

     if (rowIndex === -1) {
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

     return res.status(200).json({ message: 'Reservation deleted successfully' });
   }

   // Handle PATCH request
   if (req.method === 'PATCH') {
     const updates = req.body;

     // Get current data
     const response = await sheets.spreadsheets.values.get({
       spreadsheetId: process.env.SHEET_ID,
       range: 'Reservations!A:N',
     });

     const rows = response.data.values || [];
     const rowIndex = rows.findIndex(row => row[0] === id);

     if (rowIndex === -1) {
       return res.status(404).json({ error: 'Reservation not found' });
     }

     // If it's a check-in status update
     if (updates.checkedIn !== undefined) {
       try {
         // Use column N (index 13) for CheckedIn
         const columnLetter = 'N';
         
         console.log(`Updating check-in status for reservation ${id} to ${updates.checkedIn} in column ${columnLetter}`);
         
         // Update the checkedIn status
         await sheets.spreadsheets.values.update({
           spreadsheetId: process.env.SHEET_ID,
           range: `Reservations!${columnLetter}${rowIndex + 1}`,
           valueInputOption: 'RAW',
           requestBody: {
             values: [[updates.checkedIn]]
           }
         });

         return res.status(200).json({ 
           message: 'Check-in status updated successfully',
           checkedIn: updates.checkedIn
         });
       } catch (error) {
         console.error('Error updating check-in status:', error);
         return res.status(500).json({ error: 'Failed to update check-in status' });
       }
     }

     // If it's a simple status or table update
     if (updates.status !== undefined || updates.table !== undefined) {
       // Update status if provided
       if (updates.status !== undefined) {
         await sheets.spreadsheets.values.update({
           spreadsheetId: process.env.SHEET_ID,
           range: `Reservations!I${rowIndex + 1}`,
           valueInputOption: 'RAW',
           requestBody: {
             values: [[updates.status]]
           }
         });

         // If status is confirmed, trigger email
         if (updates.status === 'confirmed') {
          try {
            // First update the status to "confirming"
            await sheets.spreadsheets.values.update({
              spreadsheetId: process.env.SHEET_ID,
              range: `Reservations!I${rowIndex + 1}`,
              valueInputOption: 'RAW',
              requestBody: {
                values: [['confirming']]
              }
            });
        
            // Set email queue status
            await sheets.spreadsheets.values.update({
              spreadsheetId: process.env.SHEET_ID,
              range: `Reservations!L${rowIndex + 1}`,
              valueInputOption: 'RAW',
              requestBody: {
                values: [['queued']]
              }
            });
          } catch (error) {
            console.error('Error queuing email:', error);
            throw error;
          }
        }

        if (updates.status === 'cancelled') {
          try {
            // Update status
            await sheets.spreadsheets.values.update({
              spreadsheetId: process.env.SHEET_ID,
              range: `Reservations!I${rowIndex + 1}`,
              valueInputOption: 'RAW',
              requestBody: {
                values: [['cancelled']]
              }
            });
        
            // Queue cancellation email
            await sheets.spreadsheets.values.update({
              spreadsheetId: process.env.SHEET_ID,
              range: `Reservations!L${rowIndex + 1}`,
              valueInputOption: 'RAW',
              requestBody: {
                values: [['queuedCancellation']]
              }
            });
          } catch (error) {
            console.error('Error queuing cancellation email:', error);
            throw error;
          }
        }
        
       }

       // Update table if provided
       if (updates.table !== undefined) {
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
       const currentRow = rows[rowIndex];
       const updatedRow = [
         id,
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

       await sheets.spreadsheets.values.update({
         spreadsheetId: process.env.SHEET_ID,
         range: `Reservations!A${rowIndex + 1}:K${rowIndex + 1}`,
         valueInputOption: 'RAW',
         requestBody: {
           values: [updatedRow]
         }
       });
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
     details: process.env.NODE_ENV === 'development' ? error.message : undefined
   });
 }
}