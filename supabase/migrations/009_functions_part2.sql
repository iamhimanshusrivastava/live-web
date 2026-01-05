-- Migration: 009_functions_part2.sql
-- Description: Create database function for handling user session departures

-- Function: leave_session
-- Purpose: Marks when a user leaves a live session by recording the departure timestamp
-- This updates the viewer_sessions record to set left_at to the current time
-- Only updates records where left_at is NULL (i.e., still active sessions)
-- Used when users close the session page or explicitly leave
CREATE OR REPLACE FUNCTION leave_session(p_session_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE SQL
AS $$
  UPDATE viewer_sessions
  SET left_at = NOW()
  WHERE session_id = p_session_id
  AND user_id = p_user_id
  AND left_at IS NULL;
$$;
