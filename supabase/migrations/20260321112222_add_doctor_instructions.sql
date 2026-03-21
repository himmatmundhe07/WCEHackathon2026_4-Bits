-- Add doctor_instructions to emergencies table to allow doctors to send first-aid advice to bystanders
ALTER TABLE emergencies ADD COLUMN IF NOT EXISTS doctor_instructions TEXT;
