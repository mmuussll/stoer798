-- Migration: Notifications System
-- Run this in Supabase SQL Editor

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'system' CHECK (type IN ('system', 'subscription', 'debt', 'alert', 'info')),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 3. Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Users can read their own notifications
CREATE POLICY "Users can read own notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON notifications FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Admin can insert notifications for any user
CREATE POLICY "Admin can insert notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- 5. Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
