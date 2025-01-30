// middleware/auth.js
import { getOAuthClient } from '../utils/googleSheets';
import { parse, serialize } from 'cookie';

export async function withAuth(handler) {
  return async (req, res) => {
    const cookies = parse(req.headers.cookie || '');
    const accessToken = cookies.access_token;
    const refreshToken = cookies.refresh_token;

    // If no tokens, redirect to auth
    if (!accessToken && !refreshToken) {
      if (req.url === '/api/auth/google' || req.url === '/api/auth/callback') {
        return handler(req, res);
      }
      return res.redirect('/api/auth/google');
    }

    // If access token exists, continue
    if (accessToken) {
      req.accessToken = accessToken;
      return handler(req, res);
    }

    // If only refresh token exists, try to refresh access token
    try {
      const oauth2Client = getOAuthClient();
      oauth2Client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await oauth2Client.refreshAccessToken();

      // Set new access token cookie
      res.setHeader('Set-Cookie', serialize('access_token', credentials.access_token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600 // 1 hour
      }));

      req.accessToken = credentials.access_token;
      return handler(req, res);
    } catch (error) {
      console.error('Token refresh error:', error);
      return res.redirect('/api/auth/google');
    }
  };
}