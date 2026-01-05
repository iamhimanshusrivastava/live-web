-- Migration: 010_analytics_function.sql
-- Description: Create function to compute comprehensive session analytics
-- This function aggregates viewer data, message data, and chat logs for a completed session

-- Function: compute_session_analytics
-- Purpose: Calculates and stores analytics metrics for a session
-- Called after a session ends to generate the analytics report
-- Computes: total viewers, peak concurrent viewers, message counts, watch duration, and full chat log
CREATE OR REPLACE FUNCTION compute_session_analytics(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_viewers INT;
  v_peak_viewers INT;
  v_total_messages INT;
  v_avg_duration INT;
  v_unique_chatters INT;
  v_chat_log JSONB;
BEGIN
  -- Calculate total number of unique viewers who joined the session
  -- Counts distinct viewer_sessions records for this session
  SELECT COUNT(DISTINCT user_id)::INT INTO v_total_viewers
  FROM viewer_sessions
  WHERE session_id = p_session_id;

  -- Calculate peak concurrent viewers (highest number of simultaneous viewers)
  -- Uses a complex subquery that:
  -- 1. Creates events for each join (+1) and leave (-1)
  -- 2. Calculates running sum to get concurrent viewers at any point
  -- 3. Takes the maximum of those running sums
  SELECT COALESCE(MAX(concurrent), 0)::INT INTO v_peak_viewers
  FROM (
    SELECT 
      event_time,
      SUM(change) OVER (ORDER BY event_time) AS concurrent
    FROM (
      -- Join events: add 1 to concurrent count
      SELECT joined_at AS event_time, 1 AS change
      FROM viewer_sessions
      WHERE session_id = p_session_id
      
      UNION ALL
      
      -- Leave events: subtract 1 from concurrent count
      SELECT left_at AS event_time, -1 AS change
      FROM viewer_sessions
      WHERE session_id = p_session_id
      AND left_at IS NOT NULL
    ) events
  ) concurrent_viewers;

  -- Calculate total number of messages sent during the session
  SELECT COUNT(*)::INT INTO v_total_messages
  FROM messages
  WHERE session_id = p_session_id;

  -- Calculate average watch duration in seconds
  -- Only includes viewer sessions where user has left (left_at is not NULL)
  -- Duration is calculated as: EXTRACT(EPOCH FROM (left_at - joined_at))
  SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (left_at - joined_at)))::INT, 0) INTO v_avg_duration
  FROM viewer_sessions
  WHERE session_id = p_session_id
  AND left_at IS NOT NULL;

  -- Calculate number of unique users who sent messages
  SELECT COUNT(DISTINCT user_id)::INT INTO v_unique_chatters
  FROM messages
  WHERE session_id = p_session_id;

  -- Build complete chat log as JSONB array
  -- Includes message ID, user name, content, timestamp, and type
  -- Ordered chronologically by creation time
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', m.id,
        'user_name', m.user_name,
        'content', m.content,
        'created_at', m.created_at,
        'message_type', m.message_type,
        'is_pinned', m.is_pinned
      ) ORDER BY m.created_at
    ),
    '[]'::jsonb
  ) INTO v_chat_log
  FROM messages m
  WHERE m.session_id = p_session_id;

  -- Insert or update the analytics record
  -- ON CONFLICT updates all fields if analytics already exist for this session
  INSERT INTO session_analytics (
    session_id,
    total_viewers,
    peak_viewers,
    total_messages,
    avg_watch_duration_seconds,
    unique_chatters,
    chat_log,
    computed_at
  ) VALUES (
    p_session_id,
    v_total_viewers,
    v_peak_viewers,
    v_total_messages,
    v_avg_duration,
    v_unique_chatters,
    v_chat_log,
    NOW()
  )
  ON CONFLICT (session_id) DO UPDATE SET
    total_viewers = EXCLUDED.total_viewers,
    peak_viewers = EXCLUDED.peak_viewers,
    total_messages = EXCLUDED.total_messages,
    avg_watch_duration_seconds = EXCLUDED.avg_watch_duration_seconds,
    unique_chatters = EXCLUDED.unique_chatters,
    chat_log = EXCLUDED.chat_log,
    computed_at = NOW();
END;
$$;
