import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Initialize admin client (bypasses RLS)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Create server client with user context (respects RLS)
export function createServerClient() {
  const cookieStore = cookies();

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

// Create server client with request context (for API routes)
export function createServerClientWithRequest(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieHeader.split(';').map(cookie => {
            const [name, value] = cookie.trim().split('=');
            return { name, value };
          });
        },
        setAll() {
          // This is called from API routes, cookies are set via response
        },
      },
    }
  );
}

// Helper functions for authentication
export async function getUserFromServer() {
  const supabase = createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error getting user from server:', error);
    return null;
  }
  
  return user;
}

export async function getUserProfileFromServer() {
  const user = await getUserFromServer();
  if (!user) return null;

  const supabase = createServerClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error getting profile from server:', error);
    return null;
  }

  return profile;
}

export async function getUserRoleFromServer() {
  const profile = await getUserProfileFromServer();
  return profile?.user_role || null;
}

export async function hasRoleFromServer(role: string) {
  const userRole = await getUserRoleFromServer();
  return userRole === role;
}

export async function isAdminFromServer() {
  return hasRoleFromServer('admin');
}

export async function isCashierFromServer() {
  return hasRoleFromServer('cashier');
}

// Authentication middleware functions
export async function requireAuth() {
  const user = await getUserFromServer();
  if (!user) {
    throw new Error('Authentication required');
  }
  
  const supabase = createServerClient();
  return { user, supabase };
}

export async function requireRole(role: string) {
  const { user, supabase } = await requireAuth();
  const userRole = await getUserRoleFromServer();
  
  if (userRole !== role) {
    throw new Error(`Role '${role}' required`);
  }
  
  return { user, supabase };
}

export async function requireAdmin() {
  return requireRole('admin');
}

export async function requireCashier() {
  return requireRole('cashier');
}
