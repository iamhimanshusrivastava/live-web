-- ============================================================
-- RLS Policies - Part 1: Profiles and Sessions
-- ============================================================

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

DROP POLICY IF EXISTS "Sessions are viewable by everyone" ON sessions;
DROP POLICY IF EXISTS "Instructors can insert sessions" ON sessions;
DROP POLICY IF EXISTS "Instructors can insert their own sessions" ON sessions;
DROP POLICY IF EXISTS "Instructors can update own sessions" ON sessions;
DROP POLICY IF EXISTS "Instructors can update their own sessions" ON sessions;

-- Enable Row Level Security on profiles table (in case not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Table Policies

-- Allow everyone to view all profiles (public profile information)
-- Used for: displaying instructor names, avatars in chat, user listings
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles
  FOR SELECT
  USING (true);

-- Allow users to update only their own profile
-- Used for: profile settings, avatar updates, name changes
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================

-- Enable Row Level Security on sessions table (in case not already enabled)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Sessions Table Policies

-- Allow everyone to view all sessions (public session listings)
-- Used for: browsing sessions, session details page, upcoming sessions list
CREATE POLICY "Sessions are viewable by everyone"
  ON sessions
  FOR SELECT
  USING (true);

-- Allow authenticated instructors to create their own sessions
-- Used for: instructors creating new sessions
CREATE POLICY "Instructors can insert sessions"
  ON sessions
  FOR INSERT
  WITH CHECK (auth.uid() = instructor_id);

-- Allow instructors to update only their own sessions
-- Used for: updating session details, going live, ending sessions
CREATE POLICY "Instructors can update own sessions"
  ON sessions
  FOR UPDATE
  USING (auth.uid() = instructor_id);
