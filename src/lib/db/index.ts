import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

/**
 * PostgreSQL connection client
 */
const client = postgres(process.env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

/**
 * Drizzle ORM database instance
 * 
 * Usage:
 * ```typescript
 * import { db } from '@/lib/db';
 * 
 * const users = await db.select().from(schema.users).where(eq(schema.users.id, userId));
 * ```
 */
export const db = drizzle(client, { schema });

/**
 * Export all schema definitions for use in queries
 */
export { schema };
export * from './schema';
