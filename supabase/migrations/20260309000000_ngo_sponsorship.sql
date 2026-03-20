-- NGO Profiles
CREATE TABLE ngo_profiles (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ngo_name        TEXT NOT NULL,
  registration_no TEXT UNIQUE,
  description     TEXT,
  focus_area      TEXT, -- e.g., "Cancer", "Rural Health", "Child Care"
  website         TEXT,
  location        TEXT,
  verified        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Sponsorship Requests (Patients flagging bills for help)
CREATE TABLE sponsorship_requests (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id      UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  hospital_id     UUID REFERENCES hospitals(id),
  amount_needed   DECIMAL(12,2) NOT NULL,
  amount_raised   DECIMAL(12,2) DEFAULT 0,
  reason          TEXT NOT NULL, -- "Need help for chemotherapy", "Heart surgery"
  status          TEXT DEFAULT 'Pending', -- 'Pending', 'Approved', 'Funded', 'Completed'
  urgency         TEXT DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Critical'
  document_url    TEXT, -- Proof of financial need
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Sponsorship Transactions (Tracking who paid for what)
CREATE TABLE sponsorship_donations (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id      UUID REFERENCES sponsorship_requests(id) ON DELETE CASCADE,
  ngo_id          UUID REFERENCES ngo_profiles(id),
  amount          DECIMAL(12,2) NOT NULL,
  donated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE ngo_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorship_donations ENABLE ROW LEVEL SECURITY;

-- NGOs can read all requests
CREATE POLICY "NGOs can view all requests" ON sponsorship_requests FOR SELECT TO authenticated;

-- Patients can create their own requests
CREATE POLICY "Patients can create requests" ON sponsorship_requests FOR INSERT TO authenticated;

-- NGOs can view their own profile
CREATE POLICY "NGOs can view own profile" ON ngo_profiles FOR ALL TO authenticated USING (auth.uid() = user_id);
