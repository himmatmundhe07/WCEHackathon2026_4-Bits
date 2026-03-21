<div align="center">
  <img src="https://img.shields.io/badge/Sanveevani-Emergency_Response_Platform-0891B2?style=for-the-badge&logo=react" alt="Sanjeevani" />
  <h1>🏥 Sanjeevani</h1>
  <p><b>Advanced AI-Powered Emergency Healthcare Ecosystem</b></p>
  <p><i>Instantly bridging the critical information gap between accidents and hospitals to save lives.</i></p>
</div>

---

## 🛑 The Core Problem
**"During medical emergencies, the critical delay in accessing a patient’s medical history, identifying their exact location, and administrating immediate first-aid costs millions of lives globally every year."**

When a traumatic accident happens, the healthcare system runs into **four massive roadblocks**:
1. **The 'John Doe' Problem:** Patients often arrive at hospitals unconscious or unable to communicate. Doctors have zero access to their blood group, severe allergies (like penicillin), or chronic conditions.
2. **The Bystander Disconnect:** Bystanders witness accidents but do not know the exact GPS coordinates to give an ambulance, nor how to administer life-saving first-aid safely.
3. **The Blood Shortage:** Hospitals frequently run out of specific rare blood types during massive traumas, with no instant way to ping local donors.
4. **The Post-Care Financial Barrier:** Even if saved, underprivileged patients cannot afford the hospital bills or structured recovery plans.

---

## 💡 The Sanjeevani Solution
Sanjeevani is a complete lifecycle ecosystem connecting **Patients, Hospitals, Pharmacies, and NGOs** into one unified platform. 

### 🚀 Key Innovations & Features

#### 1. 📷 Facial Biometrics & QR Medical Passports
For unconscious patients, Sanjeevani utilizes integrated **Facial Recognition (face-api.js)** built straight into the Hospital Dashboard. Doctors scan the patient's face in the ER and instantly pull their entire medical profile, blood type, and allergy constraints. Alternatively, a standardized **QR Code** can be scanned from the patient's wallet.

#### 2. 📍 Live Interactive SOS & GPS Tracking
Bystanders scanning a patient's QR code are presented with a massive **"SOS" button**. When tapped, it bypasses the need for an app, directly transmitting exactly mapped Leaflet GPS coordinates to the Hospital Command Center.

#### 3. 🧠 Gemini AI Predictive Triage
When an SOS is received, the platform passes the patient's medical history through **Google Gemini 2.5 AI** to predict triage risk severity (Red/Yellow/Green) and highlight fatal drug interactions before the ambulance even reaches the hospital.

#### 4. 💬 Live First-Aid Broadcasting
While the ambulance is driving to the location, ER doctors can type live first-aid instructions directly from their dashboard. These instructions pop up instantly on the bystander's phone screen, teaching them how to safely stabilize the patient.

#### 5. 🩸 Live Geo-Blood Network
A real-time ping system allows hospitals facing critical blood shortages to instantly alert and dispatch verified local donors within a geofenced area.

#### 6. 🤰 AI Maternal Health & Recovery
Using our AI generation engine, pregnant women and recovering patients can select their current medical state and instantly receive extremely personalized, medically safe Diet Plans and Yoga/Fitness routines.

#### 7. 🤝 NGO Sponsorship & E-Pharmacies
A localized digital safety net. Verified NGOs can instantly flag and anonymously fund medical bills for impoverished trauma patients, while digital e-prescriptions are sent directly to integrated platform Pharmacies for doorstep delivery.

---

## 🛠️ Technology Stack

**Frontend & UI Architecture**
* React 18 & TypeScript (Powered by Vite)
* Tailwind CSS
* shadcn/ui & Radix UI (Glassmorphic interactive components)

**Artificial Intelligence & Computer Vision**
* Google Gemini 2.5 Flash API (Triage Prediction & Maternal Health Generation)
* `face-api.js` (ER Facial Scanner)

**Backend, Database & Cloud**
* Supabase (PostgreSQL Database)
* Supabase Realtime Subscriptions (Live SOS Tracking)
* Supabase Auth & Storage

**Geolocation & Logistics**
* `react-leaflet` & Leaflet.js (Live Mapping Interface)
* `html5-qrcode` (Scanner) & `qrcode.react` (Generator)

---

## ⚙️ Getting Started Locally

```bash
# 1. Clone the repository
git clone https://github.com/himmatmundhe07/WCEHackathon2026_4-Bits.git

# 2. Install dependencies
npm install

# 3. Add your Environment Variables (.env)
# VITE_SUPABASE_PROJECT_ID=
# VITE_SUPABASE_URL=
# VITE_SUPABASE_PUBLISHABLE_KEY=
# VITE_GEMINI_API_KEY=

# 4. Start the development server
npm run dev
```

---
<p align="center"><i>Proudly built for WCE Hackathon 2026</i></p>
