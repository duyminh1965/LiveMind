import config from '@/lib/config';
import type { Config } from 'drizzle-kit';

export default {
  schema: '@/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: config.env.databaseUrl,
  },
  verbose: true,
  strict: true,
} satisfies Config;
