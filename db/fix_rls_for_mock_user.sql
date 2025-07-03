-- Fix RLS policies to work with mock user (SimpleAuth)
-- This allows our mock user to access data without real auth.uid()

-- ====================
-- DISABLE RLS TEMPORARILY FOR TESTING
-- ====================

-- Disable RLS on users table for service role operations
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Disable RLS on projects table for service role operations  
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- Disable RLS on tasks table for service role operations
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;

-- ====================
-- CREATE MOCK USER IF NOT EXISTS
-- ====================

-- Insert mock user for SimpleAuth (using proper UUID format)
INSERT INTO public.users (id, email, full_name, preferences)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'chirag@narraite.xyz', 
  'Chirag',
  '{}'
)
ON CONFLICT (id) DO NOTHING;

-- ====================
-- ALTERNATIVE: UPDATE RLS POLICIES FOR MOCK USER
-- (Uncomment these if you want to re-enable RLS later)
-- ====================

/*
-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Add policies that work with mock user
CREATE POLICY "Allow mock user access" ON public.users
  FOR ALL USING (id = 'mock-user-chirag');

CREATE POLICY "Allow mock user projects" ON public.projects
  FOR ALL USING (user_id = 'mock-user-chirag');

CREATE POLICY "Allow mock user tasks" ON public.tasks
  FOR ALL USING (user_id = 'mock-user-chirag');
*/

-- ====================
-- TEST DATA (Optional)
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
ON CONFLICT (user_id, repo_url) DO NOTHING;