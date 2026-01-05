-- Migration: 007_realtime.sql
-- Description: Enable real-time subscriptions for core tables
-- This allows clients to subscribe to INSERT, UPDATE, and DELETE events on these tables
-- via Supabase Realtime, enabling live updates for chat messages, reactions, viewer counts, and session status

-- Add messages table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Add reactions table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE reactions;

-- Add viewer_sessions table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE viewer_sessions;

-- Add sessions table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
