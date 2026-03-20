export interface PatientFormData {
  // Step 1 — Personal Details
  fullName: string;
  dateOfBirth: string;
  age: number | null;
  gender: string;
  bloodGroup: string;
  profilePhoto: File | null;
  profilePhotoUrl: string;
  aadhaarNumber: string;
  abhaCardNo: string;
  abhaId: string;

  // Step 2 — Contact & Location
  phone: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;

  // Step 3 — Emergency Contact
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;

  // Step 4 — Medical Profile
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
  pastSurgeries: string;
  organDonor: boolean;
  hasInsurance: boolean;
  insuranceType: string;
  insuranceProvider: string;
  insurancePolicyNo: string;
  sumInsured: string;
  insuranceValidityDate: string;
  insuranceCardFile: File | null;
  insuranceCardUrl: string;
  ayushmanEnrolled: boolean;
  ayushmanBeneficiaryId: string;
  stateSchemeName: string;
  stateSchemeId: string;

  // Step 5 — Account Setup
  email: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
  consentHealthData: boolean;
}

export const initialPatientFormData: PatientFormData = {
  fullName: '',
  dateOfBirth: '',
  age: null,
  gender: '',
  bloodGroup: '',
  profilePhoto: null,
  profilePhotoUrl: '',
  aadhaarNumber: '',
  abhaCardNo: '',
  abhaId: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  pinCode: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: '',
  allergies: [],
  chronicConditions: [],
  currentMedications: [],
  pastSurgeries: '',
  organDonor: false,
  hasInsurance: false,
  insuranceType: '',
  insuranceProvider: '',
  insurancePolicyNo: '',
  sumInsured: '',
  insuranceValidityDate: '',
  insuranceCardFile: null,
  insuranceCardUrl: '',
  ayushmanEnrolled: false,
  ayushmanBeneficiaryId: '',
  stateSchemeName: '',
  stateSchemeId: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false,
  consentHealthData: false,
};

export const PATIENT_STEPS = [
  { number: 1, title: 'Personal Details', description: 'Identity & Documents' },
  { number: 2, title: 'Contact & Location', description: 'Your Address' },
  { number: 3, title: 'Emergency Contact', description: 'Critical Info' },
  { number: 4, title: 'Medical Profile', description: 'Health Records' },
  { number: 5, title: 'Account Setup', description: 'Login Credentials' },
];

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown'];
export const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
export const RELATIONSHIPS = ['Father', 'Mother', 'Spouse / Partner', 'Sibling', 'Child', 'Friend', 'Guardian', 'Other'];
export const INSURANCE_TYPES = ['Government', 'Private', 'Corporate / Employer'];

export const COMMON_ALLERGIES = ['Penicillin', 'Aspirin', 'Sulfa', 'Latex', 'Dust', 'Pollen', 'Peanuts', 'Dairy'];
export const COMMON_CONDITIONS = ['Diabetes Type 1', 'Diabetes Type 2', 'Hypertension', 'Asthma', 'Heart Disease', 'Thyroid', 'Epilepsy', 'Arthritis'];
