-- Migration: add_enrollments_and_update_messages
-- Description: Create enrollments table for session registration
-- This migration was previously applied directly to Supabase without a local file
-- Recreated from database schema for record-keeping purposes

-- Create enrollments table
-- Tracks which users are enrolled/registered for which sessions
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, session_id)
);

-- Add comment to explain the table purpose
COMMENT ON TABLE enrollments IS 'Tracks user enrollment/registration for live sessions';
