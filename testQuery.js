import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function testSupabase() {
  console.log("Fetching hospitals...");
  const { data: hosp, error: hErr } = await supabase.from('hospitals').select('*').limit(1);
  if (hErr) console.error("Hospitals error:", hErr);
  else console.log("Hospitals:", hosp?.length > 0 ? "Success" : "Empty");
  
  console.log("Fetching patients...");
  const { data: pat, error: pErr } = await supabase.from('patients').select('*').limit(1);
  if (pErr) console.error("Patients error:", pErr);
  else console.log("Patients:", pat?.length > 0 ? "Success" : "Empty");
}

testSupabase();
