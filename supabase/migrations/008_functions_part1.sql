-- Migration: 008_functions_part1.sql
-- Description: Create database function for calculating live viewer counts

-- Function: get_current_viewers
-- Purpose: Calculates the number of currently active viewers in a live session
-- This counts all viewer_sessions records where the user has joined but not yet left
-- Used for displaying real-time viewer counts in the UI
-- Returns: Integer count of active viewers for the specified session
CREATE OR REPLACE FUNCTION get_current_viewers(p_session_id UUID)
RETURNS INT
LANGUAGE SQL
STABLE
AS $$
  SELECT COUNT(*)::INT
  FROM viewer_sessions
  WHERE session_id = p_session_id
  AND left_at IS NULL;
$$;
