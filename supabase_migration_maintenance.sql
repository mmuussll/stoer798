-- Migration: Maintenance Mode
-- Run this in Supabase SQL Editor if the columns don't exist yet

ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS maintenance_mode boolean DEFAULT false;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS maintenance_message text DEFAULT 'الموقع تحت الصيانة حالياً، يرجى المحاولة لاحقاً';
