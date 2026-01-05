-- Migration: 006_rls_part3.sql
-- Description: Enable RLS and create policies for reactions, viewer_sessions, and session_analytics tables
-- Security: Ensures users can only access/modify data they're authorized to view

-- ============================================================================
-- REACTIONS TABLE RLS
-- ============================================================================

-- Enable RLS on reactions table
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see reactions in enrolled sessions
-- Security reasoning: Users should only see reactions from sessions they're enrolled in
-- Uses nested EXISTS to check if user is enrolled in the session via the message's session
CREATE POLICY "Users can see reactions in enrolled sessions"
ON reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM messages
    JOIN enrollments ON enrollments.session_id = messages.session_id
    WHERE messages.id = reactions.message_id
    AND enrollments.user_id = auth.uid()
  )
);

-- Policy: Users can add reactions
-- Security reasoning: Users can only create reactions for themselves
-- Ensures the user_id in the reaction matches the authenticated user
CREATE POLICY "Users can add reactions"
ON reactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- VIEWER_SESSIONS TABLE RLS
-- ============================================================================

-- Enable RLS on viewer_sessions table
ALTER TABLE viewer_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view own session data
-- Security reasoning: Users should only see their own viewing session records
-- Prevents users from seeing when/how long others have watched sessions
CREATE POLICY "Users can view own session data"
ON viewer_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can create viewer session
-- Security reasoning: Users can only create viewing sessions for themselves
-- Prevents creating fake viewing records for other users
CREATE POLICY "Users can create viewer session"
ON viewer_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update own viewer session
-- Security reasoning: Users can only update their own viewing session records
-- Allows updating left_at timestamp and last_heartbeat for active sessions
CREATE POLICY "Users can update own viewer session"
ON viewer_sessions
FOR UPDATE
USING (auth.uid() = user_id);

-- ============================================================================
-- SESSION_ANALYTICS TABLE RLS
-- ============================================================================

-- Enable RLS on session_analytics table
ALTER TABLE session_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Session analytics are public
-- Security reasoning: Analytics data is aggregate/summary data with no PII
-- Safe to expose publicly as it contains counts, timestamps, and JSON chat logs
-- Instructors and admins can use this to review session performance
CREATE POLICY "Session analytics are public"
ON session_analytics
FOR SELECT
USING (true);
