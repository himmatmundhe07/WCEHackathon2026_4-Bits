-- Run this in Supabase SQL Editor to enable Realtime for these tables

-- 1. Ensure the publication exists
begin;
  -- If supabase_realtime already exists, this does nothing
  -- If not, it creates it. Usually it exists by default in Supabase.
commit;

-- 2. Add tables to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE patient_appointments;

-- 3. Turn on replica identity so UPDATE operations send the full row payload
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE patient_appointments REPLICA IDENTITY FULL;
