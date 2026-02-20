import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import config from '@/lib/config';

// For query purposes
const queryClient = postgres(config.env.databaseUrl);
export const db = drizzle(queryClient, { schema });

// For migrations
const migrationClient = postgres(config.env.databaseUrl);
export const migrationDb = drizzle(migrationClient, { schema });
