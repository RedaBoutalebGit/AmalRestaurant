// pages/api/send-confirmation-email.js
import { google } from 'googleapis';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { reservation } = req.body;
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
    
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const emailContent = `
      <html>
        <body>
          <h2>Reservation Confirmed!</h2>
          <p>Dear ${reservation.name},</p>
          <p>Your reservation at Gueliz Restaurant has been confirmed:</p>
          <ul>
            <li>Date: ${reservation.date}</li>
            <li>Time: ${reservation.time}</li>
            <li>Guests: ${reservation.guests}</li>
            ${reservation.table ? `<li>Table: ${reservation.table}</li>` : ''}
          </ul>
          <p>If you need to modify your reservation, please contact us.</p>
          <p>Thank you for choosing Gueliz Restaurant!</p>
        </body>
      </html>
    `;

    const encodedEmail = Buffer.from(emailContent)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
        to: reservation.email,
        subject: 'Reservation Confirmed - Gueliz Restaurant'
      }
    });

    res.status(200).json({ message: 'Confirmation email sent' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: error.message });
  }
}