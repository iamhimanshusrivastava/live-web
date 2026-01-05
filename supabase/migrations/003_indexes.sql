-- Messages Table Indexes
-- Optimize queries that fetch messages for a session ordered by time (chat history)
CREATE INDEX idx_messages_session_created ON messages(session_id, created_at DESC);

-- Optimize queries that fetch pinned messages for a session (featured messages)
CREATE INDEX idx_messages_session_pinned ON messages(session_id, is_pinned) WHERE is_pinned = true;

-- Viewer Sessions Table Indexes
-- Optimize queries that fetch viewers for a session ordered by join time (viewer list)
CREATE INDEX idx_viewer_sessions_session_joined ON viewer_sessions(session_id, joined_at DESC);

-- Enrollments Table Indexes
-- Optimize queries that fetch all sessions a user is enrolled in (user dashboard)
CREATE INDEX idx_enrollments_user ON enrollments(user_id);

-- Optimize queries that fetch all users enrolled in a session (session roster)
CREATE INDEX idx_enrollments_session ON enrollments(session_id);

-- Sessions Table Indexes
-- Optimize queries that fetch only live sessions (homepage, active sessions list)
CREATE INDEX idx_sessions_live ON sessions(is_live) WHERE is_live = true;

-- Profiles Table Indexes
-- Optimize queries that look up users by email (login, user search)
CREATE INDEX idx_profiles_email ON profiles(email);
