# LiveMind Database Setup Guide

## Prerequisites

- PostgreSQL 14+ installed
- Node.js 18+
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
npm install @prisma/client
npm install -D prisma
```

### 2. Configure Database

Create a `.env` file in your project root:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/livemind?schema=public"
GEMINI_API_KEY="your-gemini-api-key"
```

**For local development:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/livemind?schema=public"
```

**For production (example with Railway/Supabase):**
```env
DATABASE_URL="postgresql://user:password@host.region.provider.com:5432/dbname"
```

### 3. Create Database

Connect to PostgreSQL and create the database:

```sql
CREATE DATABASE livemind;
```

Or using psql:
```bash
psql -U postgres
CREATE DATABASE livemind;
\q
```

### 4. Run Migrations

Generate Prisma Client and run migrations:

```bash
# Generate Prisma Client
npx prisma generate

# Create and run initial migration
npx prisma migrate dev --name init

# Or for production
npx prisma migrate deploy
```

### 5. Seed Database (Optional)

Create a seed file at `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      hasValidKey: true,
      preferences: {
        create: {
          voiceName: 'Zephyr',
          isCameraEnabled: true,
          isMicEnabled: true,
        },
      },
    },
  });

  console.log('Created user:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

Run seed:
```bash
npx prisma db seed
```

### 6. Verify Setup

Use Prisma Studio to view your database:

```bash
npx prisma studio
```

This will open a browser at `http://localhost:5555` where you can view and edit data.

## Integration with Existing Code

### Update the Live Component

Here's how to integrate the database services into your existing `Live` component:

```typescript
import { sessionService, transcriptionService } from '@/services/database';

// Inside Live component:
const [sessionId, setSessionId] = useState<string | null>(null);

// When starting a session:
const startSession = async () => {
  try {
    // Create session in database
    const session = await sessionService.create(userId, {
      isCameraEnabled: settings.isCameraEnabled,
      isMicEnabled: settings.isMicEnabled,
      voiceName: settings.voiceName,
    });
    
    setSessionId(session.id);
    
    // Update status to ACTIVE when connection opens
    await sessionService.updateStatus(session.id, 'ACTIVE');
    
    // ... rest of your existing code
  } catch (err) {
    // ...
  }
};

// When saving transcriptions (on turnComplete):
if (message.serverContent?.turnComplete) {
  const transcriptions = [];
  
  if (currentInputTranscriptionRef.current) {
    transcriptions.push({
      sessionId: sessionId!,
      sender: 'user' as const,
      text: currentInputTranscriptionRef.current,
    });
  }
  
  if (currentOutputTranscriptionRef.current) {
    transcriptions.push({
      sessionId: sessionId!,
      sender: 'model' as const,
      text: currentOutputTranscriptionRef.current,
    });
  }
  
  // Save to database
  await transcriptionService.createMany(transcriptions);
  
  // Update UI state
  setHistory(prev => [...prev, ...newEntries]);
}

// When stopping session:
const stopSession = useCallback(async () => {
  if (sessionId) {
    await sessionService.updateStatus(sessionId, 'COMPLETED');
  }
  
  // ... rest of your existing cleanup code
}, [sessionId]);
```

## API Routes (Next.js)

### Create Session History API

`app/api/sessions/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { sessionService } from '@/services/database';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 });
  }
  
  const sessions = await sessionService.getUserSessions(userId);
  return NextResponse.json(sessions);
}
```

### Get Session Details API

`app/api/sessions/[id]/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { sessionService } from '@/services/database';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await sessionService.getWithTranscriptions(params.id);
  
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }
  
  return NextResponse.json(session);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  await sessionService.delete(params.id);
  return NextResponse.json({ success: true });
}
```

## Useful Prisma Commands

```bash
# View database in browser
npx prisma studio

# Create a new migration after schema changes
npx prisma migrate dev --name description_of_changes

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Generate Prisma Client after schema changes
npx prisma generate

# Format schema file
npx prisma format

# Validate schema
npx prisma validate

# Pull database schema into Prisma (if database exists)
npx prisma db pull

# Push schema to database without migrations (dev only)
npx prisma db push
```

## Database Indexes

The schema includes optimized indexes for common queries:

- `users.email` - Fast user lookup
- `sessions.userId + createdAt` - Recent sessions by user
- `sessions.status` - Filter by session status
- `transcriptions.sessionId + timestamp` - Chronological message retrieval
- `audio_chunks.sessionId + timestamp` - Audio playback ordering
- `video_frames.sessionId + frameNumber` - Video frame sequence

## Data Retention & Cleanup

Consider implementing cleanup scripts for old data:

```typescript
// scripts/cleanup.ts
import { prisma } from '@/lib/prisma';

async function cleanupOldSessions() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Delete sessions older than 30 days
  const result = await prisma.session.deleteMany({
    where: {
      createdAt: { lt: thirtyDaysAgo },
      status: { in: ['COMPLETED', 'IDLE', 'ERROR'] },
    },
  });
  
  console.log(`Deleted ${result.count} old sessions`);
}

cleanupOldSessions();
```

## Backup Strategy

### Automated Backups (PostgreSQL)

```bash
# Create backup
pg_dump -U username -d livemind > backup_$(date +%Y%m%d).sql

# Restore backup
psql -U username -d livemind < backup_20250130.sql
```

### Using Prisma Migrations

All schema changes are versioned in `prisma/migrations/` directory. Commit these to version control.

## Production Considerations

1. **Connection Pooling**: Use PgBouncer or Prisma's connection pooling
2. **Encryption**: Encrypt sensitive fields like `apiKey` before storing
3. **Monitoring**: Set up database monitoring (pg_stat_statements)
4. **Backups**: Automated daily backups with point-in-time recovery
5. **Indexes**: Monitor slow queries and add indexes as needed
6. **Rate Limiting**: Prevent abuse of database writes during sessions

## Troubleshooting

### Connection Issues

```bash
# Test PostgreSQL connection
psql -U postgres -h localhost -p 5432 -d livemind

# Check if database exists
psql -U postgres -c "\l"

# Check Prisma connection
npx prisma db execute --stdin <<< "SELECT 1"
```

### Migration Issues

```bash
# Mark migration as applied without running it
npx prisma migrate resolve --applied "migration_name"

# Mark migration as rolled back
npx prisma migrate resolve --rolled-back "migration_name"
```

### Schema Conflicts

```bash
# Pull current database state
npx prisma db pull

# Force push schema (destructive - dev only)
npx prisma db push --accept-data-loss
```

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Database Schema Design](https://www.prisma.io/dataguide/intro/intro-to-schemas)