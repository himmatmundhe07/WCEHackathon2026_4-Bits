import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  try {
    const rxData = {
      hospital_id: 'db0dcb8f-647d-4b5c-b171-ecaf1e2df4a5', // Need a valid UUID or it will fail
      patient_id: 'c8fb5823-149d-4712-bf6d-978160bc0055', // Valid UUID
      doctor_name: 'Test Doctor',
      diagnosis: 'Test Diagnosis',
      prescription_date: new Date().toISOString().split('T')[0],
      feedback_after_days: 7,
      feedback_requested: true,
      valid_until: new Date().toISOString().split('T')[0]
    };
    
    // We will just do a dry-run select to see if fetch works
    const { data: rx, error: rxErr } = await supabase.from('prescriptions').select().limit(1);
    if (rxErr) {
      console.error("Fetch Error:", rxErr);
    } else {
      console.log("Fetch Success:", rx);
    }
  } catch (err) {
    console.error("Exception:", err);
  }
}

testInsert();
