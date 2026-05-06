-- Backfill: Create profiles + subscriptions for existing users
-- Run this in Supabase SQL Editor after running supabase_migration_users_system.sql

-- Insert missing profiles for existing auth.users
INSERT INTO profiles (id, email, full_name, role)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  CASE WHEN row_number() OVER (ORDER BY u.created_at ASC) = 1 THEN 'admin' ELSE 'user' END
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Insert missing subscriptions for existing auth.users
INSERT INTO user_subscriptions (user_id)
SELECT u.id
FROM auth.users u
LEFT JOIN user_subscriptions us ON us.user_id = u.id
WHERE us.user_id IS NULL;
