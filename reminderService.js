import twilio from 'twilio';
import moment from 'moment';
import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env if running standalone
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase URL or Key in environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Twilio credentials should be loaded from environment variables to prevent GitHub secret exposure
const twilioSid = process.env.TWILIO_ACCOUNT_SID;
const twilioToken = process.env.TWILIO_AUTH_TOKEN;

if (!twilioSid || !twilioToken) {
  console.error("❌ Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN in environment variables!");
  process.exit(1);
}

const client = twilio(twilioSid, twilioToken);

async function sendReminder(phone, message) {
  try {
    if (!phone) {
      console.log("❌ Phone number is missing, skipping...");
      return;
    }
    let formattedPhone = phone.toString().trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone; // Assuming +91 is country code
    }

    const response = await client.messages.create({
      body: message,
      from: 'whatsapp:+14155238886', // Twilio's default WhatsApp sandbox number
      to: `whatsapp:${formattedPhone}`
    });
    console.log(`✅ Message sent to ${formattedPhone}: ${response.sid}`);
  } catch (err) {
    console.log(`❌ Failed to send message to ${phone}:`, err.message);
  }
}

async function checkReminders() {
  // Get current time in 24-hour format (e.g., "13:00" for 1 PM)
  const currentTime = moment().format("HH:mm");
  console.log("⏰ Checking reminders at:", currentTime);

  try {
    // Fetch all active medicines and join with patients table to get phone numbers
    const { data: medicines, error } = await supabase
      .from('prescription_medicines')
      .select(`
        *,
        patients (
          full_name,
          phone
        )
      `)
      .eq('is_active', true);

    if (error) throw error;
    if (!medicines || medicines.length === 0) {
      console.log("No active medicines found.");
      return;
    }

    medicines.forEach(med => {
      const scheduleOptions = med.schedule;
      if (!Array.isArray(scheduleOptions)) return;

      scheduleOptions.forEach(sched => {
        if (!sched || !sched.time) return;

        // Parse the medicine time to handle both "13:00" and "1:00 PM" formats safely
        const medTimeParsed = moment(sched.time, ["HH:mm", "h:mm A", "ha", "h:mma"]).format("HH:mm");
        const patientName = med.patients?.full_name || 'Patient';
        const patientPhone = sched.phone || med.patients?.phone;

        // Uncomment for debugging if necessary:
        // console.log(`👉 Checking Patient: ${patientName} | Med: ${med.medicine_name} | Set for: ${medTimeParsed} | Current: ${currentTime}`);

        // If the current time matches the medicine time, send the reminder!
        if (medTimeParsed === currentTime) {
          const dosageInfo = med.dosage ? `(${med.dosage})` : '';
          const withInfo = sched.with ? `\nInstructions: ${sched.with}` : '';
          const message = `Reminder: Hi ${patientName}, time to take your medicine:\n\n💊 *${med.medicine_name}* ${dosageInfo}${withInfo}\n\nStay healthy! 🩺`;

          console.log(`📩 Sending WhatsApp Message to ${patientName} at ${patientPhone}`);
          sendReminder(patientPhone, message);
        }
      });
    });

  } catch (err) {
    console.log("❌ Error fetching reminders:", err.message);
  }
}

function startReminder() {
  console.log("🚀 Starting Twilio WhatsApp reminder cron service...");
  checkReminders(); // Run once immediately to check current minute
  cron.schedule('* * * * *', checkReminders); // Run every minute
}

startReminder();
