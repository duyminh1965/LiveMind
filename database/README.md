# LiveMind PostgreSQL Database with Drizzle ORM

Complete database schema and setup for the LiveMind multimodal AI companion application.

## 📋 Table of Contents

- [Features](#features)
- [Database Schema](#database-schema)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Migration Guide](#migration-guide)

## ✨ Features

- **Complete session tracking** - Store all conversation sessions with metadata
- **Full transcription history** - Save user and model messages with timestamps
- **User preferences** - Customizable default settings per user
- **Optional media storage** - Audio chunks and video frames for replay/analysis
- **Session analytics** - Track message counts, durations, and performance metrics
- **Type-safe** - Full TypeScript support with Drizzle ORM
- **Relational queries** - Efficient data fetching with relations

## 🗄️ Database Schema

### Tables

#### 1. **users**
Stores user account information and API key validation status.

| Column | Type | Description |
|--------|------|-------------|
| id | text (PK) | Unique user identifier |
| email | varchar(255) | User email address |
| apiKey | text | Encrypted Gemini API key |
| hasValidKey | boolean | Whether API key is validated |
| createdAt | timestamp | Account creation time |
| updatedAt | timestamp | Last update time |
| lastActiveAt | timestamp | Last activity timestamp |

#### 2. **user_preferences**
User-specific default settings for new sessions.

| Column | Type | Description |
|--------|------|-------------|
| id | text (PK) | Unique preference ID |
| userId | text (FK) | Reference to users table |
| defaultVoiceName | varchar(100) | Default voice (e.g., 'Zephyr') |
| defaultCameraEnabled | boolean | Default camera state |
| defaultMicEnabled | boolean | Default mic state |

#### 3. **sessions**
Individual conversation sessions with LiveMind.

| Column | Type | Description |
|--------|------|-------------|
| id | text (PK) | Unique session identifier |
| userId | text (FK) | Reference to users table |
| status | enum | IDLE, CONNECTING, ACTIVE, ERROR |
| modelName | varchar(255) | AI model used |
| voiceName | varchar(100) | Voice used in session |
| isCameraEnabled | boolean | Camera state for session |
| isMicEnabled | boolean | Mic state for session |
| systemInstruction | text | System prompt used |
| startedAt | timestamp | Session start time |
| endedAt | timestamp | Session end time (null if active) |
| lastErrorMessage | text | Last error if any |
| totalDurationSeconds | decimal(10,2) | Total session duration |

#### 4. **transcriptions**
All messages exchanged during sessions.

| Column | Type | Description |
|--------|------|-------------|
| id | text (PK) | Unique transcription ID |
| sessionId | text (FK) | Reference to sessions table |
| sender | enum | 'user' or 'model' |
| text | text | Transcribed message content |
| transcriptionType | enum | 'input' or 'output' |
| sequenceNumber | integer | Order within session |
| timestamp | timestamp | Message timestamp |

#### 5. **audio_chunks** (Optional)
Raw audio data for replay and analysis.

| Column | Type | Description |
|--------|------|-------------|
| id | text (PK) | Unique chunk ID |
| sessionId | text (FK) | Reference to sessions table |
| transcriptionId | text (FK) | Reference to transcriptions table |
| type | enum | 'input' or 'output' |
| audioData | text | Base64 encoded audio or storage path |
| mimeType | varchar(100) | Audio MIME type |
| durationSeconds | decimal(10,3) | Chunk duration |
| sampleRate | integer | Audio sample rate (16000 or 24000) |
| sequenceNumber | integer | Order within session |

#### 6. **video_frames** (Optional)
Video frames captured during sessions.

| Column | Type | Description |
|--------|------|-------------|
| id | text (PK) | Unique frame ID |
| sessionId | text (FK) | Reference to sessions table |
| imageData | text | Base64 JPEG or storage path |
| mimeType | varchar(100) | Always 'image/jpeg' |
| frameNumber | integer | Frame sequence number |
| timestamp | timestamp | Frame capture time |

#### 7. **session_analytics** (Optional)
Aggregated metrics per session.

| Column | Type | Description |
|--------|------|-------------|
| id | text (PK) | Unique analytics ID |
| sessionId | text (FK) | Reference to sessions table |
| totalMessages | integer | Total message count |
| userMessages | integer | User message count |
| modelMessages | integer | Model message count |
| totalAudioDurationSeconds | decimal(10,2) | Total audio duration |
| totalVideoFrames | integer | Total frames captured |
| averageResponseTimeSeconds | decimal(10,2) | Avg response time |
| interruptionCount | integer | Number of interruptions |
| errorCount | integer | Number of errors |
| metadata | jsonb | Flexible JSON metadata |

## 🚀 Installation

### 1. Install Dependencies

```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit tsx typescript @types/node
```

### 2. Setup Database

Create a PostgreSQL database:

```bash
# Using psql
createdb livemind

# Or using Docker
docker run --name livemind-postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=livemind \
  -p 5432:5432 \
  -d postgres:16
```

### 3. Configure Environment

Create a `.env` file:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/livemind
```

### 4. Generate and Run Migrations

```bash
# Generate migration files
npm run db:generate

# Apply migrations
npm run db:migrate

# Or push schema directly (for development)
npm run db:push
```

## ⚙️ Configuration

### File Structure

```
src/
├── db/
│   ├── schema.ts           # Database schema definitions
│   ├── db.ts              # Database connection
│   ├── repository.ts      # Database operations
│   ├── migrate.ts         # Migration runner
│   └── usage-examples.ts  # Integration examples
├── drizzle.config.ts      # Drizzle configuration
└── .env                   # Environment variables
```

## 📖 Usage

### Basic Operations

```typescript
import { 
  createUser, 
  createSession, 
  saveConversationTurn,
  getSessionsByUserId 
} from './db/repository';

// Create a user
const user = await createUser({
  id: 'user_123',
  email: 'user@example.com',
  apiKey: 'encrypted_api_key',
  hasValidKey: true,
});

// Create a session
const session = await createSession({
  id: 'session_456',
  userId: user.id,
  status: 'ACTIVE',
  modelName: 'gemini-2.5-flash-native-audio-preview-12-2025',
  voiceName: 'Zephyr',
  isCameraEnabled: true,
  isMicEnabled: true,
});

// Save a conversation turn
await saveConversationTurn(
  session.id,
  'Hello, how are you?',           // User message
  'I am doing well, thank you!'    // Model response
);

// Load user's session history
const sessions = await getSessionsByUserId(user.id, 10);
```

### Integration with Live Component

See `usage-examples.ts` for detailed integration examples. Key integration points:

1. **On session start** - Create database session
2. **On turn complete** - Save transcriptions
3. **On session end** - Update session with end time and duration
4. **On error** - Log error message to session

Example modification to your `Live.tsx`:

```typescript
const startSession = async () => {
  // Initialize DB session
  const { session } = await initializeUserSession(userId, apiKey);
  setCurrentSessionId(session.id);
  
  // ... existing Gemini API connection code ...
  
  sessionPromiseRef.current = ai.live.connect({
    callbacks: {
      onmessage: async (message) => {
        // ... existing transcription handling ...
        
        if (message.serverContent?.turnComplete && currentSessionId) {
          // Save to database
          await saveConversationTurn(
            currentSessionId,
            currentInputTranscriptionRef.current,
            currentOutputTranscriptionRef.current
          );
        }
      }
    }
  });
};
```

## 📚 API Reference

### User Operations

- `createUser(data: NewUser)` - Create new user
- `getUserById(userId: string)` - Get user with preferences
- `updateUser(userId: string, data: Partial<NewUser>)` - Update user
- `updateUserApiKey(userId: string, apiKey: string, isValid: boolean)` - Update API key

### Session Operations

- `createSession(data: NewSession)` - Create new session
- `getSessionById(sessionId: string)` - Get session with transcriptions
- `getSessionsByUserId(userId: string, limit?: number)` - Get user's sessions
- `updateSession(sessionId: string, data: Partial<NewSession>)` - Update session
- `endSession(sessionId: string, status, errorMessage?)` - End session with duration

### Transcription Operations

- `createTranscription(data: NewTranscription)` - Create single transcription
- `createTranscriptionBatch(data: NewTranscription[])` - Create multiple transcriptions
- `getTranscriptionsBySessionId(sessionId: string)` - Get all session transcriptions
- `saveConversationTurn(sessionId, userText, modelText)` - Save complete turn

### Analytics Operations

- `updateSessionAnalytics(sessionId: string)` - Update session analytics

## 🔧 Migration Guide

### From In-Memory to Database

1. **Add database initialization** to your component's mount/initialization
2. **Replace state-based history** with database queries
3. **Add save operations** when transcriptions are received
4. **Implement session lifecycle** management (start, update, end)

### Storage Optimization

For production, consider:

1. **External storage** for audio/video (S3, R2, etc.)
   - Store paths in database instead of base64 data
   - Implement signed URL generation for access

2. **Data retention policies**
   - Archive old sessions
   - Delete media after X days
   - Compress old transcriptions

3. **Indexing strategy**
   - Add indexes on frequently queried fields
   - Consider full-text search for transcriptions

## 🎯 Next Steps

1. Set up authentication (NextAuth, Clerk, etc.)
2. Implement user session restoration
3. Add conversation search functionality
4. Create session replay feature
5. Build analytics dashboard
6. Add export functionality (PDF, JSON)

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please read the contributing guidelines first.
