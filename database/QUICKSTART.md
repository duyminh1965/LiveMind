# 🚀 Quick Start Guide

Get your LiveMind database up and running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ running (local or cloud)
- Your LiveMind application code

## Step 1: Install Dependencies (1 min)

```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit tsx typescript @types/node
```

## Step 2: Setup Environment (1 min)

Create `.env` file in your project root:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/livemind
```

Replace with your actual database credentials.

## Step 3: Add Database Files (1 min)

Copy these files to your project:

```
src/db/
├── schema.ts          # Copy from schema.ts
├── db.ts             # Copy from db.ts
├── repository.ts     # Copy from repository.ts
└── migrate.ts        # Copy from migrate.ts

drizzle.config.ts     # Copy from drizzle.config.ts
```

## Step 4: Run Migrations (1 min)

```bash
# Generate migration files
npx drizzle-kit generate:pg

# Apply migrations to database
npm run db:migrate

# Or for development, push schema directly
npx drizzle-kit push:pg
```

## Step 5: Integrate with Your App (1 min)

In your `Live.tsx` component:

```typescript
import { 
  createSession, 
  saveConversationTurn,
  endSession 
} from '@/db/repository';

// Add state for session tracking
const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

// Modify your startSession function
const startSession = async () => {
  // ... existing setup code ...
  
  // Create DB session
  const session = await createSession({
    id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    userId: 'user_123', // Replace with actual user ID from auth
    status: 'CONNECTING',
    modelName: MODEL_NAME,
    voiceName: settings.voiceName,
    isCameraEnabled: settings.isCameraEnabled,
    isMicEnabled: settings.isMicEnabled,
  });
  
  setCurrentSessionId(session.id);
  
  // ... rest of your code ...
};

// In your onmessage callback, save transcriptions
if (message.serverContent?.turnComplete && currentSessionId) {
  await saveConversationTurn(
    currentSessionId,
    currentInputTranscriptionRef.current,
    currentOutputTranscriptionRef.current
  );
}

// In stopSession, end the DB session
const stopSession = useCallback(async () => {
  // ... existing cleanup ...
  
  if (currentSessionId) {
    await endSession(currentSessionId, 'IDLE');
    setCurrentSessionId(null);
  }
}, [currentSessionId]);
```

## ✅ Verify Setup

Open Drizzle Studio to view your database:

```bash
npx drizzle-kit studio
```

This opens a web UI at `https://local.drizzle.studio` where you can browse your data.

## 📊 Test It Out

Start a conversation in LiveMind, then check your database:

```bash
# Connect to PostgreSQL
psql -d livemind

# View sessions
SELECT id, status, started_at, model_name FROM sessions;

# View transcriptions
SELECT sender, text, timestamp FROM transcriptions ORDER BY timestamp DESC LIMIT 10;
```

## 🎯 Next Steps

- Add user authentication
- Implement session history UI
- Set up data retention policies
- Configure production database (Supabase, Railway, Neon)

## 🆘 Troubleshooting

### Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**: Make sure PostgreSQL is running:
```bash
# Start PostgreSQL (Mac)
brew services start postgresql

# Start PostgreSQL (Linux)
sudo systemctl start postgresql

# Or use Docker
docker start livemind-postgres
```

### Migration Error

```
Error: relation "sessions" already exists
```

**Solution**: Drop and recreate the database:
```bash
dropdb livemind
createdb livemind
npm run db:migrate
```

### Type Errors

```
Cannot find module '@/db/repository'
```

**Solution**: Update your `tsconfig.json` paths or use relative imports:
```typescript
import { createSession } from './db/repository';
```

## 📖 Full Documentation

See `README.md` for complete documentation and advanced usage.
