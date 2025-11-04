// lib/auth.ts - Authentication helpers for F&B Referral System
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/turso";
import { profiles } from "@/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export type UserRole = 'user' | 'cashier' | 'admin';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  points: number;
  fullName?: string | null;
}

// Get current session
export async function getCurrentSession() {
  return await getServerSession(authOptions);
}

// Get authenticated user with profile data
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const session = await getCurrentSession();
  
  if (!session?.user?.id) {
    return null;
  }

  try {
    const profile = await db.select().from(profiles).where(eq(profiles.id, session.user.id)).limit(1);
    
    if (profile.length === 0) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email || '',
      role: profile[0].userRole as UserRole,
      points: profile[0].points,
      fullName: profile[0].fullName,
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

// Check if user has specific role
export async function hasRole(requiredRole: UserRole): Promise<boolean> {
  const user = await getAuthenticatedUser();
  return user?.role === requiredRole;
}

// Check if user has any of the specified roles
export async function hasAnyRole(roles: UserRole[]): Promise<boolean> {
  const user = await getAuthenticatedUser();
  return user ? roles.includes(user.role) : false;
}

// Middleware helpers for API routes
export async function requireAuth(): Promise<{ user: AuthenticatedUser; error?: never } | { user?: never; error: NextResponse }> {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    };
  }

  return { user };
}

export async function requireRole(requiredRole: UserRole): Promise<{ user: AuthenticatedUser; error?: never } | { user?: never; error: NextResponse }> {
  const authResult = await requireAuth();
  
  if (authResult.error) {
    return authResult;
  }

  if (authResult.user.role !== requiredRole) {
    return {
      error: NextResponse.json(
        { success: false, error: `${requiredRole} role required` },
        { status: 403 }
      )
    };
  }

  return { user: authResult.user };
}

export async function requireAnyRole(roles: UserRole[]): Promise<{ user: AuthenticatedUser; error?: never } | { user?: never; error: NextResponse }> {
  const authResult = await requireAuth();
  
  if (authResult.error) {
    return authResult;
  }

  if (!roles.includes(authResult.user.role)) {
    return {
      error: NextResponse.json(
        { success: false, error: `One of the following roles required: ${roles.join(', ')}` },
        { status: 403 }
      )
    };
  }

  return { user: authResult.user };
}

// Specific role helpers
export async function requireAdmin() {
  return await requireRole('admin');
}

export async function requireCashier() {
  return await requireAnyRole(['cashier', 'admin']);
}

export async function requireUser() {
  return await requireAuth();
}

// Update user points (for redemptions)
export async function updateUserPoints(userId: string, pointsToAdd: number): Promise<number> {
  try {
    await db.update(profiles)
      .set({ 
        points: db.select({ points: profiles.points }).from(profiles).where(eq(profiles.id, userId)).limit(1).then(result => (result[0]?.points || 0) + pointsToAdd),
        updatedAt: Date.now()
      })
      .where(eq(profiles.id, userId));

    // Get updated points
    const updatedProfile = await db.select({ points: profiles.points }).from(profiles).where(eq(profiles.id, userId)).limit(1);
    return updatedProfile[0]?.points || 0;
  } catch (error) {
    console.error('Error updating user points:', error);
    throw new Error('Failed to update user points');
  }
}

// Get user profile by ID
export async function getUserProfile(userId: string) {
  try {
    const profile = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
    return profile[0] || null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

// Check if user is active
export async function isUserActive(userId: string): Promise<boolean> {
  try {
    const profile = await getUserProfile(userId);
    return profile?.isActive || false;
  } catch (error) {
    console.error('Error checking user active status:', error);
    return false;
  }
}

// Role hierarchy check (admin > cashier > user)
export function hasHigherOrEqualRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    user: 1,
    cashier: 2,
    admin: 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}