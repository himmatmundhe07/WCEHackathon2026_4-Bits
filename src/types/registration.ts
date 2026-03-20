export interface HospitalFormData {
  // Step 1
  hospitalName: string;
  licenseId: string;
  licenseDoc: File | null;
  facilityType: string;
  yearEstablished: string;
  hospitalLogo: File | null;

  // Step 2
  fullAddress: string;
  city: string;
  state: string;
  pinCode: string;
  phone: string;
  emergencyHelpline: string;
  email: string;
  website: string;
  googleMapsLink: string;

  // Step 3
  totalDoctors: string;
  totalNurses: string;
  totalSupportStaff: string;
  totalBeds: string;
  icuBeds: string;
  generalWardBeds: string;
  privateRooms: string;
  operationTheatres: string;
  ambulances: string;
  emergency24x7: boolean;
  bloodBank: boolean;
  pharmacy: boolean;

  // Step 4
  specializations: string[];
  otherSpecialization: string;

  // Step 5
  adminName: string;
  designation: string;
  adminEmail: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
  confirmAccuracy: boolean;
}

export const initialFormData: HospitalFormData = {
  hospitalName: '',
  licenseId: '',
  licenseDoc: null,
  facilityType: '',
  yearEstablished: '',
  hospitalLogo: null,
  fullAddress: '',
  city: '',
  state: '',
  pinCode: '',
  phone: '',
  emergencyHelpline: '',
  email: '',
  website: '',
  googleMapsLink: '',
  totalDoctors: '',
  totalNurses: '',
  totalSupportStaff: '',
  totalBeds: '',
  icuBeds: '',
  generalWardBeds: '',
  privateRooms: '',
  operationTheatres: '',
  ambulances: '',
  emergency24x7: false,
  bloodBank: false,
  pharmacy: false,
  specializations: [],
  otherSpecialization: '',
  adminName: '',
  designation: '',
  adminEmail: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false,
  confirmAccuracy: false,
};

export const SPECIALIZATIONS = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Oncology', 'Pediatrics',
  'Gynecology & Obstetrics', 'Dermatology', 'ENT', 'Ophthalmology',
  'Psychiatry', 'Nephrology', 'Gastroenterology', 'Pulmonology',
  'Urology', 'General Surgery', 'Plastic Surgery', 'Radiology & Imaging',
  'Physiotherapy', 'Ayurveda / AYUSH', 'Dental', 'Trauma & Emergency Care',
  'Dialysis', 'Laparoscopy', 'Organ Transplant',
];

export const FACILITY_TYPES = [
  'Private Hospital',
  'Government Hospital',
  'Clinic',
  'Nursing Home',
  'Diagnostic Center',
  'Trauma Center',
];

export const STEPS = [
  { number: 1, title: 'Basic Info', description: 'Hospital Identity' },
  { number: 2, title: 'Location', description: 'Contact Details' },
  { number: 3, title: 'Infrastructure', description: 'Staff & Beds' },
  { number: 4, title: 'Specializations', description: 'Treatments' },
  { number: 5, title: 'Admin Account', description: 'Login Setup' },
];
