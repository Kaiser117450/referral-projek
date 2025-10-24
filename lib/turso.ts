// lib/turso.ts
import { createClient } from '@libsql/client';

// Get the Turso DB URL and auth token from environment variables
const tursoDbUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

// Throw an error if the environment variables are not set
if (!tursoDbUrl || !tursoAuthToken) {
  throw new Error('Missing Turso DB environment variables');
}

// Create the Turso DB client
export const turso = createClient({
  url: tursoDbUrl,
  authToken: tursoAuthToken,
});

// Helper function to execute a SQL query
export async function executeQuery(sql: string, params: any[] = []) {
  try {
    const result = await turso.execute({
      sql: sql,
      args: params,
    });
    return result;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}

// Helper function to execute a transaction
export async function executeTransaction(queries: { sql: string, args: any[] }[]) {
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
    console.error('Error executing transaction:', error);
    throw error;
  }
}
