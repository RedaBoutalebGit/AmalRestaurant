import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,    // Your Google Client ID
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,  // Your Google Client Secret
      authorization: {
        params: {
          scope: "openid profile email",    // Define the permissions you need
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,   // Optional: Add a secret for session signing
  pages: {
    signIn: "/auth/signin",   // Optional: Custom sign-in page
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;  // Save the access token
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;  // Make the access token available in the session
      return session;
    },
  },
});
