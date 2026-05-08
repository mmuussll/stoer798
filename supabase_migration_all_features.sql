-- ============================================================
-- الترحيل الشامل: جميع الميزات المضافة
-- تشغيل هذا الملف في Supabase SQL Editor يطبق كل شيء دفعة واحدة
-- ============================================================

-- ------------------------------------------------------------
-- 1. إضافة عمود الهاتف - جدول profiles
-- ------------------------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;

-- تحديث trigger ليتضمن رقم الهاتف
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
LANGUAGE plpgsql
AS $$
DECLARE
  user_count integer;
  assigned_role text;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  IF user_count = 0 THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'user';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    assigned_role
  );

  INSERT INTO public.user_subscriptions (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------
-- 2. إنشاء جدول الإشعارات - notifications
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'system' CHECK (type IN ('system', 'subscription', 'debt', 'alert', 'info')),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- فهارس الإشعارات
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- تفعيل RLS لجدول الإشعارات
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للإشعارات
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
CREATE POLICY "Users can read own notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
ON notifications FOR DELETE
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admin can insert notifications" ON notifications;
CREATE POLICY "Admin can insert notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- تفعيل realtime للإشعارات
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ------------------------------------------------------------
-- 3. إضافة وضع الصيانة - جدول store_settings
-- ------------------------------------------------------------
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS maintenance_mode boolean DEFAULT false;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS maintenance_message text DEFAULT 'الموقع تحت الصيانة حالياً، يرجى المحاولة لاحقاً';

-- ============================================================
-- تم الترحيل بنجاح ✅
-- ============================================================
