import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Helper function to get user session
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return session;
};

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  return user;
};

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const session = await getSession();
  return !!session;
};

// Helper function to get user role
export const getUserRole = async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
    
  if (error) {
    console.error('Error getting user role:', error);
    return null;
  }
  
  return profile?.role || 'user';
};

// Helper function to check if user has specific role
export const hasRole = async (role: 'user' | 'cashier' | 'admin') => {
  const userRole = await getUserRole();
  return userRole === role;
};

// Helper function to check if user is admin
export const isAdmin = async () => {
  return await hasRole('admin');
};

// Helper function to check if user is cashier
export const isCashier = async () => {
  return await hasRole('cashier');
};
