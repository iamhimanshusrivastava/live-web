-- Migration: 011_triggers.sql
-- Description: Create database triggers for automated timestamp updates and user profile creation

-- ============================================================================
-- TRIGGER FUNCTION: update_updated_at
-- ============================================================================

-- Function: update_updated_at
-- Purpose: Automatically updates the updated_at timestamp whenever a record is modified
-- Used by triggers on tables that track last modification time
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

-- Trigger: profiles_updated_at
-- Purpose: Automatically set updated_at on profiles table whenever a profile is modified
CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Trigger: sessions_updated_at
-- Purpose: Automatically set updated_at on sessions table whenever a session is modified
CREATE TRIGGER sessions_updated_at
BEFORE UPDATE ON sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- TRIGGER FUNCTION: handle_new_user
-- ============================================================================

-- Function: handle_new_user
-- Purpose: Automatically creates a profile record when a new user signs up
-- Runs with elevated privileges (SECURITY DEFINER) to insert into profiles table
-- Extracts email and full name from the auth.users metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$;

-- ============================================================================
-- USER CREATION TRIGGER
-- ============================================================================

-- Trigger: on_auth_user_created
-- Purpose: Automatically creates a profile when a new user signs up via Supabase Auth
-- Ensures every authenticated user has a corresponding profile record
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();
