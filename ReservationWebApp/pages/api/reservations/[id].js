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
       range: 'Reservations!A:K',
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
     console.log("Received updates:", updates);

     // Get current data
     const response = await sheets.spreadsheets.values.get({
       spreadsheetId: process.env.SHEET_ID,
       range: 'Reservations!A:P', // Extended range to include check-in columns
     });

     const rows = response.data.values || [];
     const rowIndex = rows.findIndex(row => row[0] === id);

     if (rowIndex === -1) {
       return res.status(404).json({ error: 'Reservation not found' });
     }

     // If it's a service update along with table assignment
  if (updates.service !== undefined || updates.table !== undefined) {
    // If we're removing a table assignment
    if (updates.table === '') {
      // Clear the table assignment
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.SHEET_ID,
        range: `Reservations!K${rowIndex + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['']]
        }
      });
      
      // Also clear the service if it's being explicitly set to empty
      if (updates.service === '') {
        // Make sure column P exists
        if (rows[0].length >= 16) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SHEET_ID,
            range: `Reservations!P${rowIndex + 1}`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [['']]
            }
          });
        }
      }
      
      return res.status(200).json({ 
        message: 'Table assignment removed successfully',
        updates: updates
      });
    }
    
    // Update table if provided
    if (updates.table) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.SHEET_ID,
        range: `Reservations!K${rowIndex + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[updates.table]]
        }
      });
    }
    
    // Update service if provided
    if (updates.service) {
      // Ensure column P exists
      if (rows[0].length < 16) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: process.env.SHEET_ID,
          range: `Reservations!P1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [['Service']]
          }
        });
      }
      
      // Update the service
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.SHEET_ID,
        range: `Reservations!P${rowIndex + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[updates.service]]
        }
      });
      
      // If we're assigning a service, make sure the notes reflect this
      if (updates.notes === undefined && updates.service) {
        const currentNotes = rows[rowIndex][9] || '';
        const serviceInfo = updates.service === 'first' ? 
          '1st Service (12:00-14:00)' : 
          '2nd Service (14:00-15:30)';
          
        // Only add if not already in notes
        if (!currentNotes.includes(serviceInfo)) {
          const updatedNotes = currentNotes ? 
            `${currentNotes}\nTable ${updates.table} assigned for ${serviceInfo}` :
            `Table ${updates.table} assigned for ${serviceInfo}`;
            
          await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SHEET_ID,
            range: `Reservations!J${rowIndex + 1}`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [[updatedNotes]]
            }
          });
        }
      }
    }
    
    // Update notes if provided
    if (updates.notes !== undefined) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.SHEET_ID,
        range: `Reservations!J${rowIndex + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[updates.notes]]
        }
      });
    }

    return res.status(200).json({ 
      message: 'Reservation updated successfully',
      updates: updates
    });
  }


     // If it's a simple status or table or check-in update
     if (updates.status !== undefined || updates.table !== undefined || updates.checkInStatus !== undefined) {
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
       
       // Handle check-in status update separately
       if (updates.checkInStatus !== undefined) {
         try {
           console.log("Updating check-in status to:", updates.checkInStatus);
           
           // Make sure we actually have a column N in the sheet
           if (rows[0].length < 14) {
             // Need to append columns for check-in status
             await sheets.spreadsheets.values.update({
               spreadsheetId: process.env.SHEET_ID,
               range: `Reservations!N1:O1`,
               valueInputOption: 'RAW',
               requestBody: {
                 values: [['CheckedIn', 'CheckInTime']]
               }
             });
           }
           
           // Update the CheckedIn status (column N) - matching your AppScript logic
           // Your AppScript uses "no" as default, so when status is "arrived", we set it to "yes"
           const checkedInValue = updates.checkInStatus === 'arrived' ? 'yes' : 'no';
           
           await sheets.spreadsheets.values.update({
             spreadsheetId: process.env.SHEET_ID,
             range: `Reservations!N${rowIndex + 1}`,
             valueInputOption: 'RAW',
             requestBody: {
               values: [[checkedInValue]]
             }
           });
           
           // Also update the check-in time if provided
           if (updates.checkInTime !== undefined) {
             await sheets.spreadsheets.values.update({
               spreadsheetId: process.env.SHEET_ID,
               range: `Reservations!O${rowIndex + 1}`,
               valueInputOption: 'RAW',
               requestBody: {
                 values: [[updates.checkInTime]]
               }
             });
           }
         } catch (error) {
           console.error('Error updating check-in status:', error);
           throw new Error('Failed to update check-in status: ' + error.message);
         }
       }
     } else {
       // Full reservation update
       const currentRow = rows[rowIndex];
       // Ensure the row has enough elements for all fields we want to update
       while (currentRow.length < 15) {
         currentRow.push(''); // Add empty values for missing columns
       }
       
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
        currentRow[10] || '', // Preserve table assignment
        currentRow[11] || '', // Preserve column L (email queue)
        currentRow[12] || '', // Preserve column M (email sent)
        updates.checkInStatus || currentRow[13] || '', // Column N for check-in status
        updates.checkInTime || currentRow[14] || ''  // Column O for check-in time
       ];

       await sheets.spreadsheets.values.update({
         spreadsheetId: process.env.SHEET_ID,
         range: `Reservations!A${rowIndex + 1}:O${rowIndex + 1}`,
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