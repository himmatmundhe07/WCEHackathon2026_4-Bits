-- Add this to Supabase SQL Editor to create the notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_user_id UUID NOT NULL,         -- supabase auth user id of recipient
  recipient_type TEXT NOT NULL,             -- 'patient' | 'hospital' | 'admin'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',        -- 'info' | 'appointment' | 'approval' | 'alert'
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_id TEXT,                          -- optional: appointment id, hospital id etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT TO authenticated
  USING (recipient_user_id = auth.uid());

CREATE POLICY "Authenticated can insert notifications"
  ON notifications FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE TO authenticated
  USING (recipient_user_id = auth.uid());

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE TO authenticated
  USING (recipient_user_id = auth.uid());
