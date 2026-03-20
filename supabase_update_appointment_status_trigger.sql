-- Run this in Supabase SQL Editor
-- This updates the existing validation trigger to allow 'accepted', 'Confirmed', and 'Pending Confirmation' statuses

CREATE OR REPLACE FUNCTION public.validate_appointment_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN (
    'Upcoming', 
    'Completed', 
    'Cancelled', 
    'Pending Confirmation', 
    'Confirmed', 
    'accepted'
  ) THEN
    RAISE EXCEPTION 'Invalid appointment status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;
