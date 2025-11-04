// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/turso';
import { users, accounts, sessions, verificationTokens, profiles } from '@/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
      // Customize email templates for F&B branding
      sendVerificationRequest: async ({ identifier: email, url, provider }) => {
        // You can customize this to use your preferred email service
        // For now, using the default NextAuth email sending
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        
        // Get user profile with role information
        const profile = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
        
        if (profile.length > 0) {
          session.user.role = profile[0].userRole;
          session.user.points = profile[0].points;
          session.user.fullName = profile[0].fullName;
        } else {
          session.user.role = 'user';
          session.user.points = 0;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  events: {
    async createUser({ user }) {
      // Create profile for new user
      try {
        await db.insert(profiles).values({
          id: user.id,
          fullName: user.name || null,
          userRole: 'user',
          points: 0,
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        console.log(`Created profile for user: ${user.id}`);
      } catch (error) {
        console.error('Error creating user profile:', error);
      }
    },
    async signIn({ user, account, profile, isNewUser }) {
      console.log(`User signed in: ${user.email} (New user: ${isNewUser})`);
      return true;
    },
  },
  pages: {
    signIn: '/login',
    verifyRequest: '/auth/verify-request',
    error: '/auth/error',
  },
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
