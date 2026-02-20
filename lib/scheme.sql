-- 1. Create an Enum for who is speaking
CREATE TYPE sender_type AS ENUM ('user', 'model');

-- 2. Store the Session Metadata (The "Phone Call")
CREATE TABLE live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(50),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  model_name TEXT,
  status TEXT DEFAULT 'active' -- 'active', 'completed', 'error'
);

-- 3. Store the actual Chat History
CREATE TABLE live_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
  sender sender_type NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Index for fast history retrieval
CREATE INDEX idx_messages_session ON live_messages(session_id);

--5> add
ALTER TABLE live_sessions
ADD COLUMN client_ip TEXT,
ADD COLUMN user_agent TEXT,
ADD COLUMN latitude DOUBLE PRECISION,
ADD COLUMN longitude DOUBLE PRECISION,
ADD COLUMN device_type TEXT, -- e.g., 'Mobile' or 'Desktop'
ADD COLUMN screen_res TEXT;  -- e.g., '1920x1080'
ADD COLUMN client_identifier TEXT;