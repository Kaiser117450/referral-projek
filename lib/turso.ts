// lib/turso.ts - Enhanced Turso DB Client for F&B Referral System
import { createClient, type Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '@/schema';

// Environment validation
const tursoDbUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoDbUrl || !tursoAuthToken) {
  throw new Error('Missing required Turso DB environment variables: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN');
}

// Create the Turso DB client with connection pooling
export const turso: Client = createClient({
  url: tursoDbUrl,
  authToken: tursoAuthToken,
  syncUrl: tursoDbUrl, // Enable sync for better performance
});

// Create Drizzle ORM instance
export const db = drizzle(turso, { schema });

// Helper function to execute a raw SQL query
export async function executeQuery(sql: string, params: any[] = []) {
  try {
    const result = await turso.execute({
      sql: sql,
      args: params,
    });
    return result;
  } catch (error) {
    console.error('Error executing query:', { sql, params, error });
    throw new Error(`Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to execute multiple queries in a transaction
export async function executeTransaction(queries: { sql: string, args: any[] }[]) {
  if (!queries.length) {
    throw new Error('Transaction requires at least one query');
  }

  const tx = await turso.transaction();
  try {
    const results = [];
    for (const query of queries) {
      const result = await tx.execute(query);
      results.push(result);
    }
    await tx.commit();
    return results;
  } catch (error) {
    await tx.rollback();
    console.error('Error executing transaction:', { queries, error });
    throw new Error(`Database transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to execute a batch of queries (non-transactional)
export async function executeBatch(queries: { sql: string, args: any[] }[]) {
  try {
    const results = await turso.batch(queries);
    return results;
  } catch (error) {
    console.error('Error executing batch:', { queries, error });
    throw new Error(`Database batch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Connection health check
export async function healthCheck(): Promise<boolean> {
  try {
    await executeQuery('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeConnection() {
  try {
    await turso.close();
    console.log('Turso DB connection closed successfully');
  } catch (error) {
    console.error('Error closing Turso DB connection:', error);
  }
}

// Health check function for monitoring
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await executeQuery('SELECT 1 as health_check');
    return result.rows.length > 0 && result.rows[0].health_check === 1;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Database initialization and migration helper
export async function initializeDatabase() {
  try {
    // Check if tables exist by querying sqlite_master
    const tablesResult = await executeQuery(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    
    const existingTables = tablesResult.rows.map(row => row.name);
    const requiredTables = [
      'users', 'accounts', 'sessions', 'verificationTokens',
      'profiles', 'invites', 'referrals', 'ephemeral_codes',
      'redemptions', 'milestones', 'milestone_awards', 'daily_stats'
    ];
    
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.warn('Missing database tables:', missingTables);
      console.log('Please run the database setup script to create missing tables');
      return false;
    }
    
    console.log('Database initialization check passed');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
}
