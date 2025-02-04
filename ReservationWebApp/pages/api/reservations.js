// pages/api/reservations.js
import { google } from 'googleapis';

// Constants for validation
const VALID_TIME_SLOTS = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30'];
const MIN_GUESTS = 1;
const MAX_GUESTS = 20;

async function generateUniqueId(sheets) {
  try {
    // Get all existing IDs
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: 'Reservations!A:A',
    });
    
    const existingIds = response.data.values || [];
    let maxNum = 0;
    
    existingIds.forEach(row => {
      if (row[0] && row[0].startsWith('R')) {
        const num = parseInt(row[0].substring(1));
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    
    return 'R' + String(maxNum + 1).padStart(5, '0');
  } catch (error) {
    console.error('Error generating ID:', error);
    throw new Error('Failed to generate unique ID');
  }
}

function validateReservationData(data) {
  const { date, time, name, guests, phone } = data;
  const errors = [];

  // Check required fields
  if (!date || !time || !name || !guests) {
    errors.push('Missing required fields: date, time, name, and guests are required');
  }

  // Validate time slot
  if (!VALID_TIME_SLOTS.includes(time)) {
    errors.push('Invalid time slot. Must be one of: ' + VALID_TIME_SLOTS.join(', '));
  }

  // Validate guest count
  const guestCount = parseInt(guests);
  if (isNaN(guestCount) || guestCount < MIN_GUESTS || guestCount > MAX_GUESTS) {
    errors.push(`Guest count must be between ${MIN_GUESTS} and ${MAX_GUESTS}`);
  }

  // Validate date
  const reservationDate = new Date(date);
  const today = new Date();
  if (reservationDate < today) {
    errors.push('Cannot make reservation for past dates');
  }

  // Check if it's a Sunday (0 is Sunday in JavaScript)
  if (reservationDate.getDay() === 0) {
    errors.push('Restaurant is closed on Sundays');
  }

  return errors;
}

export default async function handler(req, res) {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const cookies = req.headers.cookie;
    if (!cookies?.includes('auth_tokens')) {
      console.log('No auth tokens found');
      return res.status(401).json({
        error: 'Not authenticated',
        loginUrl: '/api/auth/google'
      });
    }

    try {
      const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('auth_tokens='));
      const tokens = tokenCookie ? JSON.parse(decodeURIComponent(tokenCookie.split('=')[1])) : null;

      if (!tokens) {
        return res.status(401).json({
          error: 'Invalid authentication',
          loginUrl: '/api/auth/google'
        });
      }

      oauth2Client.setCredentials(tokens);
    } catch (e) {
      console.error('Error parsing tokens:', e);
      return res.status(401).json({
        error: 'Invalid token format',
        loginUrl: '/api/auth/google'
      });
    }

    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    if (req.method === 'POST') {
      const { date, time, name, guests, phone, email, source, status, notes } = req.body;

      // Validate reservation data
      const validationErrors = validateReservationData(req.body);
      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: validationErrors 
        });
      }

      try {
        // Generate unique ID
        const newId = await generateUniqueId(sheets);

        const response = await sheets.spreadsheets.values.append({
          spreadsheetId: process.env.SHEET_ID,
          range: 'Reservations!A:K',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[
              newId,
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

        // Get updated list
        const updatedResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: process.env.SHEET_ID,
          range: 'Reservations!A2:M', // Extended to include email status
        });
        
        const updatedRows = updatedResponse.data.values || [];
        const updatedReservations = updatedRows.map(row => ({
          id: row[0],
          date: row[1],
          time: row[2],
          name: row[3],
          guests: parseInt(row[4]) || 0,
          phone: row[5],
          email: row[6],
          source: row[7],
          status: row[8],
          notes: row[9],
          table: row[10],
          emailSent: row[12] || null
        }));

        res.status(201).json({
          message: 'Reservation created successfully',
          reservations: updatedReservations
        });
      } catch (sheetError) {
        console.error('Sheet API error:', sheetError);
        res.status(500).json({ 
          error: 'Failed to save to sheet',
          details: sheetError.message 
        });
      }

    } else if (req.method === 'GET') {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: process.env.SHEET_ID,
          range: 'Reservations!A2:M', // Extended to include email status
        });

        const rows = response.data.values || [];
        const reservations = rows.map(row => ({
          id: row[0],
          date: row[1],
          time: row[2],
          name: row[3],
          guests: parseInt(row[4]) || 0,
          phone: row[5],
          email: row[6],
          source: row[7],
          status: row[8],
          notes: row[9],
          table: row[10],
          emailSent: row[12] || null
        }));

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