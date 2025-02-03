// pages/api/confirm-reservation.js
import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { reservationId, rowIndex } = req.body;

  try {
    // Validate input
    if (!rowIndex) {
      return res.status(400).json({ 
        error: 'Row index is required',
        details: 'Reservation row index must be provided'
      });
    }

    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Get auth tokens from cookie
    const cookies = req.headers.cookie;
    
    // Detailed cookie and token logging
    console.log('Received Cookies:', cookies);

    if (!cookies) {
      return res.status(401).json({
        error: 'No cookies found',
        details: 'Authentication cookies are missing'
      });
    }

    const tokenCookie = cookies.split(';').find(c => c.trim().startsWith('auth_tokens='));
    
    if (!tokenCookie) {
      return res.status(401).json({
        error: 'No auth tokens found in cookies',
        loginUrl: '/api/auth/google'
      });
    }

    let tokens;
    try {
      tokens = JSON.parse(decodeURIComponent(tokenCookie.split('=')[1]));
    } catch (parseError) {
      console.error('Token Parsing Error:', parseError);
      return res.status(401).json({
        error: 'Failed to parse authentication tokens',
        details: parseError.message
      });
    }

    // Validate tokens
    if (!tokens || !tokens.access_token) {
      return res.status(401).json({
        error: 'Invalid authentication',
        details: 'Access token is missing or invalid'
      });
    }

    // Set credentials
    oauth2Client.setCredentials(tokens);

    // Verify Apps Script configuration
    if (!process.env.APPS_SCRIPT_ID) {
      return res.status(500).json({
        error: 'Server configuration error',
        details: 'Apps Script ID is not configured'
      });
    }

    // Call the Apps Script function
    const script = google.script('v1');
    
    try {
      const scriptResponse = await script.scripts.run({
        auth: oauth2Client,
        scriptId: process.env.APPS_SCRIPT_ID,
        resource: {
          function: 'handleConfirmation',
          parameters: [rowIndex]
        }
      });

      // Log script response for debugging
      console.log('Script Response:', scriptResponse.data);

      res.status(200).json({ 
        message: 'Confirmation sent successfully',
        scriptResponseDetails: scriptResponse.data
      });
    } catch (scriptError) {
      console.error('Apps Script Execution Error:', scriptError);
      
      // More detailed error response
      res.status(500).json({ 
        error: 'Failed to execute Apps Script',
        details: scriptError.message,
        scriptError: scriptError.response ? scriptError.response.data : null
      });
    }
  } catch (error) {
    console.error('Confirmation Process Error:', error);
    res.status(500).json({ 
      error: 'Unexpected error in confirmation process',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}