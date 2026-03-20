import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

async function createAdmin() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
     console.error("Missing url or key", url, key);
     return;
  }
  
  try {
      const response = await fetch(url + '/auth/v1/signup', {
        method: 'POST',
        headers: {
          'apikey': key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'admin@sanjeevani.health',
          password: 'password123',
          data: { role: 'admin' }
        })
      });
      const data = await response.json();
      console.log(data);
  } catch(e) {
      console.error(e);
  }
}

createAdmin();
