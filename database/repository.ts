import { db } from './db';
import { 
  users, 
  sessions, 
  transcriptions, 
  userPreferences,
  audioChunks,
  videoFrames,
  sessionAnalytics,
  type NewUser,
  type NewSession,
  type NewTranscription,
  type NewUserPreference,
  type NewAudioChunk,
  type NewVideoFrame,
  type Session,
  type Transcription
} from './schema';
import { eq, desc, and } from 'drizzle-orm';

// ==================== USER OPERATIONS ====================

export async function createUser(data: NewUser) {
  const [user] = await db.insert(users).values(data).returning();
  return user;
}

export async function getUserById(userId: string) {
  return db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      preferences: true,
    },
  });
}

export async function updateUser(userId: string, data: Partial<NewUser>) {
  const [user] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  return user;
}

export async function updateUserApiKey(userId: string, apiKey: string, isValid: boolean) {
  return updateUser(userId, {
    apiKey,
    hasValidKey: isValid,
    lastActiveAt: new Date(),
  });
}

// ==================== USER PREFERENCES ====================

export async function createUserPreferences(data: NewUserPreference) {
  const [prefs] = await db.insert(userPreferences).values(data).returning();
  return prefs;
}

export async function updateUserPreferences(userId: string, data: Partial<NewUserPreference>) {
  const [prefs] = await db
    .update(userPreferences)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(userPreferences.userId, userId))
    .returning();
  return prefs;
}

// ==================== SESSION OPERATIONS ====================

export async function createSession(data: NewSession) {
  const [session] = await db.insert(sessions).values(data).returning();
  return session;
}

export async function getSessionById(sessionId: string) {
  return db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    with: {
      transcriptions: {
        orderBy: (transcriptions, { asc }) => [asc(transcriptions.sequenceNumber)],
      },
      user: true,
    },
  });
}

export async function getSessionsByUserId(userId: string, limit = 20) {
  return db.query.sessions.findMany({
    where: eq(sessions.userId, userId),
    orderBy: (sessions, { desc }) => [desc(sessions.startedAt)],
    limit,
    with: {
      transcriptions: {
        orderBy: (transcriptions, { asc }) => [asc(transcriptions.sequenceNumber)],
      },
    },
  });
}

export async function updateSession(sessionId: string, data: Partial<NewSession>) {
  const [session] = await db
    .update(sessions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(sessions.id, sessionId))
    .returning();
  return session;
}

export async function endSession(sessionId: string, status: 'IDLE' | 'ERROR', errorMessage?: string) {
  const session = await getSessionById(sessionId);
  if (!session) return null;

  const endedAt = new Date();
  const durationSeconds = session.startedAt 
    ? (endedAt.getTime() - session.startedAt.getTime()) / 1000 
    : 0;

  return updateSession(sessionId, {
    status,
    endedAt,
    totalDurationSeconds: durationSeconds.toString(),
    lastErrorMessage: errorMessage || null,
  });
}

// ==================== TRANSCRIPTION OPERATIONS ====================

export async function createTranscription(data: NewTranscription) {
  const [transcription] = await db.insert(transcriptions).values(data).returning();
  return transcription;
}

export async function createTranscriptionBatch(data: NewTranscription[]) {
  return db.insert(transcriptions).values(data).returning();
}

export async function getTranscriptionsBySessionId(sessionId: string) {
  return db.query.transcriptions.findMany({
    where: eq(transcriptions.sessionId, sessionId),
    orderBy: (transcriptions, { asc }) => [asc(transcriptions.sequenceNumber)],
  });
}

export async function getNextSequenceNumber(sessionId: string): Promise<number> {
  const lastTranscription = await db.query.transcriptions.findFirst({
    where: eq(transcriptions.sessionId, sessionId),
    orderBy: (transcriptions, { desc }) => [desc(transcriptions.sequenceNumber)],
  });
  
  return (lastTranscription?.sequenceNumber ?? -1) + 1;
}

// ==================== AUDIO CHUNK OPERATIONS ====================

export async function createAudioChunk(data: NewAudioChunk) {
  const [chunk] = await db.insert(audioChunks).values(data).returning();
  return chunk;
}

export async function getAudioChunksBySessionId(sessionId: string) {
  return db.query.audioChunks.findMany({
    where: eq(audioChunks.sessionId, sessionId),
    orderBy: (audioChunks, { asc }) => [asc(audioChunks.sequenceNumber)],
  });
}

// ==================== VIDEO FRAME OPERATIONS ====================

export async function createVideoFrame(data: NewVideoFrame) {
  const [frame] = await db.insert(videoFrames).values(data).returning();
  return frame;
}

export async function getVideoFramesBySessionId(sessionId: string) {
  return db.query.videoFrames.findMany({
    where: eq(videoFrames.sessionId, sessionId),
    orderBy: (videoFrames, { asc }) => [asc(videoFrames.frameNumber)],
  });
}

// ==================== SESSION ANALYTICS ====================

export async function updateSessionAnalytics(sessionId: string) {
  const session = await getSessionById(sessionId);
  if (!session) return null;

  const userMsgCount = session.transcriptions.filter(t => t.sender === 'user').length;
  const modelMsgCount = session.transcriptions.filter(t => t.sender === 'model').length;

  const analytics = {
    id: `analytics_${sessionId}`,
    sessionId,
    totalMessages: session.transcriptions.length,
    userMessages: userMsgCount,
    modelMessages: modelMsgCount,
    updatedAt: new Date(),
  };

  // Upsert analytics
  await db
    .insert(sessionAnalytics)
    .values(analytics)
    .onConflictDoUpdate({
      target: sessionAnalytics.sessionId,
      set: analytics,
    });

  return analytics;
}

// ==================== HELPER: Save conversation turn ====================

export async function saveConversationTurn(
  sessionId: string,
  userText: string | null,
  modelText: string | null
) {
  const newTranscriptions: NewTranscription[] = [];
  let sequenceNum = await getNextSequenceNumber(sessionId);

  if (userText) {
    newTranscriptions.push({
      id: `trans_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      sessionId,
      sender: 'user',
      text: userText,
      transcriptionType: 'input',
      sequenceNumber: sequenceNum++,
      timestamp: new Date(),
    });
  }

  if (modelText) {
    newTranscriptions.push({
      id: `trans_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      sessionId,
      sender: 'model',
      text: modelText,
      transcriptionType: 'output',
      sequenceNumber: sequenceNum++,
      timestamp: new Date(),
    });
  }

  if (newTranscriptions.length > 0) {
    const saved = await createTranscriptionBatch(newTranscriptions);
    await updateSessionAnalytics(sessionId);
    return saved;
  }

  return [];
}
