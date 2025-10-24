// schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  role: text('role').notNull().default('user'),
  points: integer('points').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).defaultNow(),
});
