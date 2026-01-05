-- ============================================================
-- RLS Policies - Part 2: Enrollments and Messages
-- ============================================================
-- Security Model:
-- - Users can only see their own enrollments
-- - Only enrolled users can read messages in sessions
-- - Only enrolled users can send messages
-- - Instructors can moderate (delete) messages in their sessions
-- - Service role has full access for admin operations
-- ============================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Service role can manage enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can read messages in enrolled sessions" ON messages;
DROP POLICY IF EXISTS "Enrolled users can send messages" ON messages;
DROP POLICY IF EXISTS "Instructors can delete messages in their sessions" ON messages;

-- Enable Row Level Security on enrollments table
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Enrollments Table Policies

-- Allow users to view only their own enrollments
-- Used for: user dashboard showing enrolled sessions
CREATE POLICY "Users can view own enrollments"
  ON enrollments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow service role full access for enrollment management
-- Used for: admin operations, bulk enrollments, course management
CREATE POLICY "Service role can manage enrollments"
  ON enrollments
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================

-- Enable Row Level Security on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Messages Table Policies

-- Allow users to read messages only in sessions they're enrolled in
-- Used for: displaying chat messages to enrolled participants
CREATE POLICY "Users can read messages in enrolled sessions"
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.session_id = messages.session_id
        AND enrollments.user_id = auth.uid()
    )
  );

-- Allow enrolled users to send messages in sessions they're enrolled in
-- Used for: sending chat messages during live sessions
CREATE POLICY "Enrolled users can send messages"
  ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM enrollments
      WHERE enrollments.session_id = messages.session_id
        AND enrollments.user_id = auth.uid()
    )
  );

-- Allow instructors to delete messages in their own sessions
-- Used for: message moderation, removing inappropriate content
CREATE POLICY "Instructors can delete messages in their sessions"
  ON messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = messages.session_id
        AND sessions.instructor_id = auth.uid()
    )
  );
