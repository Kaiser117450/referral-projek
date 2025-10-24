// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { turso } from '@/lib/turso';
import { profiles } from '@/schema'; // Assuming schema is defined in @/schema.ts

export const authOptions = {
  adapter: DrizzleAdapter(turso, {
    usersTable: profiles,
    // accountsTable: accounts,
    // sessionsTable: sessions,
    // verificationTokensTable: verificationTokens,
  }),
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      session.user.role = user.role;
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Assign default role to new users
      await turso.update(profiles).set({ role: 'user' }).where({ id: user.id });
    },
  },
  pages: {
    signIn: '/login',
    verifyRequest: '/auth/verify-request',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
