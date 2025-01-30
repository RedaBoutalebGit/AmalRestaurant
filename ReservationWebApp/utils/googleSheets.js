// utils/googleSheets.js
import { google } from 'googleapis';
import { parse } from 'cookie';
import { decryptToken } from './encryption';

export async function getGoogleSheets(req) {
  // Initialize OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Get tokens from cookie
  const cookies = parse(req.headers.cookie || '');
  if (!cookies.auth_tokens) {
    throw new Error('No authentication tokens found');
  }

  // Decrypt and parse tokens
  const tokens = JSON.parse(decryptToken(cookies.auth_tokens));
  
  // Set credentials
  oauth2Client.setCredentials(tokens);

  // Handle token refresh if needed
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.refresh_token) {
      // Store new tokens (you might want to implement this)
      // await updateStoredTokens(tokens);
    }
  });

  return google.sheets({ version: 'v4', auth: oauth2Client });
}