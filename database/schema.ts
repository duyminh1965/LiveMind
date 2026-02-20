import { pgTable, text, timestamp, boolean, pgEnum, integer, varchar, jsonb, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const sessionStatusEnum = pgEnum('session_status', ['IDLE', 'CONNECTING', 'ACTIVE', 'ERROR']);
export const messageSenderEnum = pgEnum('message_sender', ['user', 'model']);
export const transcriptionTypeEnum = pgEnum('transcription_type', ['input', 'output']);
export const mediaTypeEnum = pgEnum('media_type', ['audio', 'video']);

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: varchar('email', { length: 255 }),
  apiKey: text('api_key'), // Should be encrypted in production
  hasValidKey: boolean('has_valid_key').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastActiveAt: timestamp('last_active_at').defaultNow().notNull(),
});

// User preferences table
export const userPreferences = pgTable('user_preferences', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  defaultVoiceName: varchar('default_voice_name', { length: 100 }).default('Zephyr').notNull(),
  defaultCameraEnabled: boolean('default_camera_enabled').default(true).notNull(),
  defaultMicEnabled: boolean('default_mic_enabled').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Sessions table
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: sessionStatusEnum('status').default('IDLE').notNull(),
  modelName: varchar('model_name', { length: 255 }).default('gemini-2.5-flash-native-audio-preview-12-2025').notNull(),
  voiceName: varchar('voice_name', { length: 100 }).default('Zephyr').notNull(),
  isCameraEnabled: boolean('is_camera_enabled').default(true).notNull(),
  isMicEnabled: boolean('is_mic_enabled').default(true).notNull(),
  systemInstruction: text('system_instruction'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
  lastErrorMessage: text('last_error_message'),
  totalDurationSeconds: decimal('total_duration_seconds', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Transcriptions/Messages table
export const transcriptions = pgTable('transcriptions', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
  sender: messageSenderEnum('sender').notNull(),
  text: text('text').notNull(),
  transcriptionType: transcriptionTypeEnum('transcription_type'),
  sequenceNumber: integer('sequence_number').notNull(), // Order within session
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Audio chunks table (optional - for replay/analysis)
export const audioChunks = pgTable('audio_chunks', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
  transcriptionId: text('transcription_id').references(() => transcriptions.id, { onDelete: 'set null' }),
  type: transcriptionTypeEnum('type').notNull(), // 'input' or 'output'
  audioData: text('audio_data'), // Base64 encoded or path to storage
  mimeType: varchar('mime_type', { length: 100 }),
  durationSeconds: decimal('duration_seconds', { precision: 10, scale: 3 }),
  sampleRate: integer('sample_rate'),
  sequenceNumber: integer('sequence_number').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Video frames table (optional - for replay/analysis)
export const videoFrames = pgTable('video_frames', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
  imageData: text('image_data'), // Base64 encoded or path to storage
  mimeType: varchar('mime_type', { length: 100 }).default('image/jpeg').notNull(),
  frameNumber: integer('frame_number').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Session metadata/analytics table (optional)
export const sessionAnalytics = pgTable('session_analytics', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
  totalMessages: integer('total_messages').default(0).notNull(),
  userMessages: integer('user_messages').default(0).notNull(),
  modelMessages: integer('model_messages').default(0).notNull(),
  totalAudioDurationSeconds: decimal('total_audio_duration_seconds', { precision: 10, scale: 2 }),
  totalVideoFrames: integer('total_video_frames').default(0),
  averageResponseTimeSeconds: decimal('average_response_time_seconds', { precision: 10, scale: 2 }),
  interruptionCount: integer('interruption_count').default(0),
  errorCount: integer('error_count').default(0),
  metadata: jsonb('metadata'), // Flexible JSON field for additional data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  preferences: one(userPreferences),
  sessions: many(sessions),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
  transcriptions: many(transcriptions),
  audioChunks: many(audioChunks),
  videoFrames: many(videoFrames),
  analytics: one(sessionAnalytics),
}));

export const transcriptionsRelations = relations(transcriptions, ({ one, many }) => ({
  session: one(sessions, {
    fields: [transcriptions.sessionId],
    references: [sessions.id],
  }),
  audioChunks: many(audioChunks),
}));

export const audioChunksRelations = relations(audioChunks, ({ one }) => ({
  session: one(sessions, {
    fields: [audioChunks.sessionId],
    references: [sessions.id],
  }),
  transcription: one(transcriptions, {
    fields: [audioChunks.transcriptionId],
    references: [transcriptions.id],
  }),
}));

export const videoFramesRelations = relations(videoFrames, ({ one }) => ({
  session: one(sessions, {
    fields: [videoFrames.sessionId],
    references: [sessions.id],
  }),
}));

export const sessionAnalyticsRelations = relations(sessionAnalytics, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionAnalytics.sessionId],
    references: [sessions.id],
  }),
}));

// Type exports for use in your application
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type UserPreference = typeof userPreferences.$inferSelect;
export type NewUserPreference = typeof userPreferences.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Transcription = typeof transcriptions.$inferSelect;
export type NewTranscription = typeof transcriptions.$inferInsert;

export type AudioChunk = typeof audioChunks.$inferSelect;
export type NewAudioChunk = typeof audioChunks.$inferInsert;

export type VideoFrame = typeof videoFrames.$inferSelect;
export type NewVideoFrame = typeof videoFrames.$inferInsert;

export type SessionAnalytics = typeof sessionAnalytics.$inferSelect;
export type NewSessionAnalytics = typeof sessionAnalytics.$inferInsert;
