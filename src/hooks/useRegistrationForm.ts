import { useState, useCallback } from 'react';
import { HospitalFormData, initialFormData } from '@/types/registration';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Errors = Record<string, string>;

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validators: Record<number, (data: HospitalFormData) => Errors> = {
  1: (data) => {
    const e: Errors = {};
    if (!data.hospitalName.trim()) e.hospitalName = 'Hospital name is required';
    if (!data.licenseId.trim()) e.licenseId = 'License ID is required';
    if (!data.licenseDoc) e.licenseDoc = 'Please upload your license document';
    if (!data.facilityType) e.facilityType = 'Please select a facility type';
    return e;
  },
  2: (data) => {
    const e: Errors = {};
    if (!data.fullAddress.trim()) e.fullAddress = 'Address is required';
    if (!data.city.trim()) e.city = 'City is required';
    if (!data.state.trim()) e.state = 'State is required';
    if (!data.pinCode.trim() || data.pinCode.length !== 6) e.pinCode = 'Valid 6-digit PIN code required';
    if (!data.phone.trim()) e.phone = 'Phone number is required';
    if (!data.emergencyHelpline.trim()) e.emergencyHelpline = 'Emergency helpline is required';
    if (!data.email.trim() || !validateEmail(data.email)) e.email = 'Valid email is required';
    return e;
  },
  3: (data) => {
    const e: Errors = {};
    if (!data.totalDoctors) e.totalDoctors = 'Required';
    if (!data.totalNurses) e.totalNurses = 'Required';
    if (!data.totalBeds) e.totalBeds = 'Required';
    return e;
  },
  4: (data) => {
    const e: Errors = {};
    if (data.specializations.length === 0) e.specializations = 'Select at least one specialization';
    return e;
  },
  5: (data) => {
    const e: Errors = {};
    if (!data.adminName.trim()) e.adminName = 'Name is required';
    if (!data.designation.trim()) e.designation = 'Designation is required';
    if (!data.adminEmail.trim() || !validateEmail(data.adminEmail)) e.adminEmail = 'Valid email is required';
    if (data.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (data.password !== data.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!data.agreeTerms) e.agreeTerms = 'You must agree to the terms';
    if (!data.confirmAccuracy) e.confirmAccuracy = 'You must confirm accuracy';
    return e;
  },
};

export type VerificationPhase = 'form' | 'submitting' | 'success';

export const useRegistrationForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<HospitalFormData>(initialFormData);
  const [errors, setErrors] = useState<Errors>({});
  const [phase, setPhase] = useState<VerificationPhase>('form');
  const [userId, setUserId] = useState<string | null>(null);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [licenseIdStatus, setLicenseIdStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [adminEmailStatus, setAdminEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const updateForm = useCallback((updates: Partial<HospitalFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    const keys = Object.keys(updates);
    setErrors((prev) => {
      const next = { ...prev };
      keys.forEach((k) => delete next[k]);
      return next;
    });
  }, []);

  const validateStep = useCallback(() => {
    const validator = validators[step];
    if (!validator) return true;
    const stepErrors = validator(formData);
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  }, [step, formData]);

  const next = useCallback(() => {
    if (validateStep()) {
      setStep((s) => Math.min(s + 1, 5));
    }
  }, [validateStep]);

  const back = useCallback(() => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 1));
  }, []);

  // Check license ID uniqueness (debounced call from component)
  const checkLicenseId = useCallback(async (licenseId: string) => {
    if (!licenseId.trim()) {
      setLicenseIdStatus('idle');
      return;
    }
    setLicenseIdStatus('checking');
    try {
      const { data } = await supabase
        .from('hospitals')
        .select('license_id')
        .eq('license_id', licenseId)
        .maybeSingle();
      setLicenseIdStatus(data ? 'taken' : 'available');
    } catch {
      setLicenseIdStatus('idle');
    }
  }, []);

  // Check admin email uniqueness
  const checkAdminEmail = useCallback(async (email: string) => {
    if (!email.trim() || !validateEmail(email)) {
      setAdminEmailStatus('idle');
      return;
    }
    setAdminEmailStatus('checking');
    try {
      const { data } = await supabase
        .from('hospitals')
        .select('admin_email')
        .eq('admin_email', email)
        .maybeSingle();
      setAdminEmailStatus(data ? 'taken' : 'available');
    } catch {
      setAdminEmailStatus('idle');
    }
  }, []);

  // Upload file to Supabase Storage
  const uploadFile = async (bucket: string, path: string, file: File) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { cacheControl: '3600', upsert: true });
    if (error) throw error;
    return data.path;
  };

  // Step 5 submit: create auth user (without email OTP) → insert hospital record
  const submit = useCallback(async () => {
    if (!validateStep()) return;
    setIsSubmitting(true);
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.adminEmail,
        password: formData.password,
        options: {
          data: {
            full_name: formData.adminName,
            designation: formData.designation,
            role: 'hospital_admin',
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!authData?.user?.id) throw new Error('User creation failed');

      const createdUserId: string = authData.user.id;
      setUserId(createdUserId);

      await insertHospitalRecord();
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [validateStep, formData]);

  const insertHospitalRecord = async () => {
    setPhase('submitting');
    try {
      // Upload files
      let licenseDocUrl = '';
      let logoUrl = '';

      if (formData.licenseDoc) {
        const path = `licenses/${formData.licenseId}_${Date.now()}.${formData.licenseDoc.name.split('.').pop()}`;
        const uploadedPath = await uploadFile('hospital-documents', path, formData.licenseDoc);
        licenseDocUrl = uploadedPath;
      }
      if (formData.hospitalLogo) {
        const path = `logos/${formData.hospitalName.replace(/\s+/g, '-')}_${Date.now()}.${formData.hospitalLogo.name.split('.').pop()}`;
        const uploadedPath = await uploadFile('hospital-logos', path, formData.hospitalLogo);
        const { data: { publicUrl } } = supabase.storage.from('hospital-logos').getPublicUrl(uploadedPath);
        logoUrl = publicUrl;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const customSpecs = formData.otherSpecialization.trim()
        ? [formData.otherSpecialization.trim()]
        : [];

      const { data, error } = await supabase.from('hospitals').insert([{
        hospital_name: formData.hospitalName,
        license_id: formData.licenseId,
        license_document_url: licenseDocUrl,
        facility_type: formData.facilityType,
        year_established: formData.yearEstablished ? parseInt(formData.yearEstablished) : null,
        logo_url: logoUrl,
        address: formData.fullAddress,
        city: formData.city,
        state: formData.state,
        pin_code: formData.pinCode,
        phone: formData.phone,
        emergency_helpline: formData.emergencyHelpline,
        email: formData.email,
        website: formData.website || null,
        maps_link: formData.googleMapsLink || null,
        total_doctors: parseInt(formData.totalDoctors) || 0,
        total_nurses: parseInt(formData.totalNurses) || 0,
        support_staff: parseInt(formData.totalSupportStaff) || 0,
        total_beds: parseInt(formData.totalBeds) || 0,
        icu_beds: parseInt(formData.icuBeds) || 0,
        general_ward_beds: parseInt(formData.generalWardBeds) || 0,
        private_rooms: parseInt(formData.privateRooms) || 0,
        operation_theatres: parseInt(formData.operationTheatres) || 0,
        ambulances: parseInt(formData.ambulances) || 0,
        emergency_24x7: formData.emergency24x7,
        blood_bank: formData.bloodBank,
        pharmacy: formData.pharmacy,
        specializations: formData.specializations,
        custom_specializations: customSpecs,
        admin_name: formData.adminName,
        admin_designation: formData.designation,
        admin_email: formData.adminEmail,
        supabase_user_id: user.id,
        email_verified: true,
        phone_verified: true,
        two_fa_completed: true,
      }]).select('id').single();

      if (error) throw error;
      setHospitalId(data?.id || null);
      setPhase('success');
      toast.success('Hospital registered successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to register hospital');
      setPhase('form');
    }
  };


  return {
    step, formData, errors, phase, userId, hospitalId, isSubmitting,
    licenseIdStatus, adminEmailStatus,
    updateForm, next, back, submit,
    checkLicenseId, checkAdminEmail,
  };
};
