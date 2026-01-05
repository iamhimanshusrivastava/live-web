-- Drop existing tables to recreate with new schema
DROP TABLE IF EXISTS viewer_sessions CASCADE;
DROP TABLE IF EXISTS session_analytics CASCADE;

-- Viewer Sessions table
-- Tracks when users join and leave live sessions
-- Automatically calculates watch duration using a generated column
CREATE TABLE viewer_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  left_at TIMESTAMPTZ,
  duration_seconds INT
);

-- Reactions table
-- Stores emoji reactions to chat messages
-- Prevents duplicate reactions from the same user with unique constraint
CREATE TABLE reactions (
  id BIGSERIAL PRIMARY KEY,
  message_id BIGINT REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(message_id, user_id, emoji)
);

-- Session Analytics table
-- Stores computed analytics data for each session
-- Generated after a session ends for reporting and insights
CREATE TABLE session_analytics (
  session_id UUID PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,
  total_viewers INT DEFAULT 0,
  peak_viewers INT DEFAULT 0,
  total_messages INT DEFAULT 0,
  avg_watch_duration_seconds INT DEFAULT 0,
  unique_chatters INT DEFAULT 0,
  chat_log JSONB,
  computed_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
