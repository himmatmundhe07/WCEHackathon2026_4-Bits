# 🏥 Sanjeevani — Emergency Healthcare Response Platform  
### Hackathon Startup Project Documentation

---

# 1. Project Overview

**Sanjeevani** is a digital emergency healthcare platform designed to help hospitals and emergency responders access **critical patient medical information instantly during emergencies**.

In many real-world accidents or medical emergencies, patients arrive at hospitals **unconscious or unable to communicate**, and doctors have **no access to their medical history, allergies, or emergency contacts**. This delay can lead to **wrong treatment, allergic reactions, or even death**.

Sanjeevani solves this problem using a **QR-based emergency health identity system**.

Each patient receives a **unique emergency QR code** that can be scanned by hospitals or emergency responders. The scan instantly reveals **life-saving medical data** such as:

- Blood group
- Allergies
- Chronic diseases
- Current medications
- Emergency contacts

This allows doctors to make **faster and safer treatment decisions**.

---

# 2. Problem Statement

Emergency healthcare systems often face critical challenges:

### Lack of Patient Information
Hospitals frequently receive patients who cannot communicate due to unconsciousness, trauma, or shock.

### Treatment Delays
Doctors spend valuable time trying to identify the patient or contacting family members.

### Medical Errors
Without knowledge of allergies or medical history, doctors may administer **dangerous medications**.

### Poor Coordination Between Hospitals
Hospitals often lack **real-time systems to manage emergency admissions and patient information**.

### Lack of Emergency Identity
Most people do not carry easily accessible medical information during emergencies.

---

# 3. Proposed Solution

Sanjeevani introduces a **digital emergency identity system** powered by QR codes.

### Core Idea

Every patient creates a **digital emergency health profile** and receives a **unique QR code**.

When scanned by a hospital:

1. The hospital instantly accesses **critical health information**
2. Doctors see **allergies, blood group, medications, and conditions**
3. The patient can be **immediately admitted and assigned a bed**
4. Emergency contacts can be notified

This dramatically reduces **treatment delay and medical risk**.

---

# 4. Target Users

### Patients
Individuals who want a secure digital record of their emergency health data.

### Hospitals
Healthcare providers that need quick access to critical patient information.

### Emergency Responders
Ambulance staff or first responders who must quickly identify patient health risks.

### Healthcare Authorities
Organizations that want better emergency response infrastructure.

---

# 5. Key Features

## Unified Authentication
A seamless, centralized login and registration portal for Patients, Hospitals, and Pharmacies, ensuring secure role-based access across the platform.

## Patient System

### Patient Registration
Patients create a secure profile containing:

- Name
- Age
- Gender
- Blood group
- Allergies
- Chronic diseases
- Current medications
- Emergency contact details

### Emergency QR Code
Each patient receives a **unique QR code** that acts as a digital emergency identity.

### Medical Profile
Patients can maintain:

- Health history
- Allergies
- Medication details
- Medical reports

### AI-Powered Fitness & Recovery Tracker
Patients receive personalized, AI-generated fitness and recovery plans tailored to their specific health conditions and post-treatment needs.

### Emergency Contact System
Hospitals can quickly view and contact emergency contacts.

---

## Hospital Dashboard

Hospitals access a dedicated **Hospital Management Dashboard**.

### Overview Dashboard

Displays key operational data:

- Beds available
- Admitted patients
- Today's appointments
- Active emergency alerts

---

### Patient Management

Hospitals can:

- View admitted patients
- Filter patient records using localized geographic data (State, District)
- Access patient medical profiles
- Record treatment notes
- Upload medical reports

---

### Appointment Management

Hospitals can manage:

- Patient appointments
- Confirm or cancel appointments
- View upcoming visits

---

### Emergency Alert System

The most important feature of the platform.

When a QR code is scanned:

- An **emergency alert** is created
- Doctors see **critical patient information**
- Immediate treatment decisions can be made

---

### Bed Management

Hospitals can track:

- Available beds
- Occupied beds
- Ward allocation
- Bed assignments for admitted patients

---

## Pharmacy Partner System

Pharmacies can register as verified partners on the Sanjeevani platform to handle medications and prescriptions seamlessly.

### Registration & Subscription
Pharmacies securely sign up and purchase active subscription plans to gain verified partner status.

### Prescription & Order Management
Pharmacies manage digital prescriptions directly from hospitals and process patient medical orders.

### Revenue & Analytics
Partner pharmacies can monitor their daily revenue, track commissions, and download comprehensive monthly sales statements.

---

# 6. Emergency Workflow

The system is designed around a simple emergency workflow.

### Step 1 — Patient Registration
A patient registers and creates a medical profile.

### Step 2 — QR Code Generation
The system generates a **unique emergency QR code**.

### Step 3 — Emergency Situation
The patient is brought to a hospital.

### Step 4 — QR Scan
Hospital staff scans the patient's QR code.

### Step 5 — Medical Data Access
Doctors instantly see:

- Blood group
- Allergies
- Chronic diseases
- Medications
- Emergency contacts

### Step 6 — Admission
The patient is admitted and assigned a hospital bed.

---

# 7. System Architecture

### Frontend
- React
- Tailwind CSS

### Backend
- Supabase (PostgreSQL)
- Supabase Authentication
- Supabase Realtime

### Storage
- Supabase Storage for medical documents and reports

### Additional Libraries
- Recharts for dashboard charts
- jsPDF for generating reports
- QR code libraries for generating emergency QR codes

---

# 8. Database Structure

Core tables used in the system:

### hospitals
Stores hospital information and registration details.

### patients
Stores patient profiles and medical information.

### patient_appointments
Stores appointment bookings between patients and hospitals.

### hospital_patients
Links hospitals with admitted patients.

### hospital_beds
Tracks bed availability and assignments.

### qr_scan_logs
Stores logs of QR scans during emergencies.

### patient_reports
Stores uploaded medical reports.

### patient_vitals
Stores vital medical data recorded during treatment.

---

# 9. Innovation and Impact

Sanjeevani introduces several impactful innovations:

### Instant Medical Identification
QR-based patient identity enables instant access to health data.

### Faster Emergency Response
Doctors can begin treatment immediately.

### Reduced Medical Errors
Allergies and medications are visible instantly.

### Digital Health Infrastructure
Creates a scalable healthcare platform for hospitals.

### Potential Integration
Future integration with:

- Government health IDs
- National health databases
- Ambulance networks

---

# 10. Future Scope

The platform can expand significantly beyond the hackathon prototype.

### AI Medical Assistance
AI models can analyze patient symptoms and medical history.

### Face Recognition Identification
Hospitals could identify patients even without QR codes.

### Voice-Based Emergency Activation
Patients could trigger emergency alerts using voice commands.

### Wearable Device Integration
Health data from smartwatches could sync automatically.

### National Emergency Network
Hospitals across the country could share emergency data.

---

# 11. Market Opportunity

Healthcare technology is a rapidly growing sector.

### Digital Health Market
Expected to grow significantly in the next decade.

### Hospital Digitization
Hospitals are increasingly adopting digital health systems.

### Emergency Healthcare Need
Emergency medical identification is still poorly implemented globally.

This creates strong potential for a **scalable healthcare startup**.

---

# 12. Why This is a Strong Startup Idea

Sanjeevani solves a **real and critical healthcare problem**.

### Life-Saving Impact
Provides doctors with life-saving information instantly.

### Scalable Platform
Can be adopted by hospitals nationwide.

### Strong Social Impact
Improves emergency healthcare response.

### Technology Driven
Uses modern technologies like cloud platforms and real-time systems.

---

# 13. Hackathon MVP Scope

For the hackathon prototype, the following core features are implemented:

- Patient registration
- Emergency QR code generation
- Hospital dashboard
- Patient admission system
- Emergency QR scan alerts
- Bed assignment system

This MVP demonstrates the **core emergency healthcare workflow**.

---

# 14. Conclusion

Sanjeevani is a healthcare innovation platform designed to improve **emergency medical response** by providing hospitals instant access to critical patient information.

By combining **digital health records, QR-based identification, and hospital dashboards**, the platform enables doctors to make **faster, safer, and more informed decisions during emergencies**.

The project has the potential to evolve into a **nationwide emergency healthcare infrastructure platform**, saving lives and transforming how hospitals handle emergency patients.

## Getting Started Locally

```sh
# Install the necessary dependencies
npm install

# Start the development server
npm run dev
```
