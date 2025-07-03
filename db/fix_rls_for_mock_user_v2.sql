-- Fix RLS policies to work with mock user (SimpleAuth) - Version 2
-- This version handles the auth.users foreign key constraint properly

-- ====================
-- DISABLE RLS TEMPORARILY FOR TESTING
-- ====================

-- Disable RLS on all tables for service role operations
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;

-- ====================
-- CREATE MOCK USER IN AUTH TABLE FIRST
-- ====================

-- First, we need to create the user in auth.users table
-- This requires inserting into the auth schema (which might not be directly accessible)
-- Alternative approach: Modify the users table to not require auth.users FK

-- ====================
-- OPTION 1: REMOVE FOREIGN KEY CONSTRAINT
-- ====================

-- Drop the foreign key constraint to auth.users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Now we can insert our mock user without auth.users dependency
INSERT INTO public.users (id, email, full_name, preferences)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'chirag@narraite.xyz', 
  'Chirag',
  '{}'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  updated_at = NOW();

-- ====================
-- CREATE SAMPLE PROJECT
-- ====================

-- Add a sample project for testing
INSERT INTO public.projects (user_id, repo_url, repo_name, repo_owner, name, description)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'https://github.com/Schreezer/Codex-home',
  'Codex-home',
  'Schreezer',
  'Sample Project',
  'A sample project for testing the async-code platform'
)
ON CONFLICT (user_id, repo_url) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ====================
-- OPTIONAL: ADD FOREIGN KEY BACK (but make it optional)
-- ====================

-- You can uncomment this if you want to re-add the FK constraint later
-- but make it DEFERRABLE so it doesn't block our mock user
/*
ALTER TABLE public.users 
ADD CONSTRAINT users_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) 
ON DELETE CASCADE 
DEFERRABLE INITIALLY DEFERRED;
*/

-- ====================
-- VERIFICATION QUERIES
-- ====================

-- Check if our mock user was created
SELECT 'Mock user created:' as status, id, email, full_name 
FROM public.users 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Check if sample project was created
SELECT 'Sample project created:' as status, id, name, repo_name 
FROM public.projects 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Show table info
SELECT 'Users table:' as info, COUNT(*) as count FROM public.users;
SELECT 'Projects table:' as info, COUNT(*) as count FROM public.projects;
SELECT 'Tasks table:' as info, COUNT(*) as count FROM public.tasks;