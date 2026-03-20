import { useState, useCallback } from 'react';
import { PatientFormData, initialPatientFormData } from '@/types/patient';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Errors = Record<string, string>;

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validators: Record<number, (data: PatientFormData) => Errors> = {
  1: (data) => {
    const e: Errors = {};
    if (!data.fullName.trim()) e.fullName = 'Full name is required';
    if (!data.dateOfBirth) e.dateOfBirth = 'Date of birth is required';
    if (!data.aadhaarNumber.trim() || data.aadhaarNumber.replace(/\D/g, '').length !== 12)
      e.aadhaarNumber = 'Valid 12-digit Aadhaar number required';
    return e;
  },
  2: () => ({}), // All optional
  3: (data) => {
    const e: Errors = {};
    if (!data.emergencyContactName.trim()) e.emergencyContactName = 'Emergency contact name is required';
    if (!data.emergencyContactPhone.trim()) e.emergencyContactPhone = 'Emergency contact phone is required';
    if (!data.emergencyContactRelation) e.emergencyContactRelation = 'Relationship is required';
    return e;
  },
  4: () => ({}), // All optional
  5: (data) => {
    const e: Errors = {};
    if (!data.email.trim() || !validateEmail(data.email)) e.email = 'Valid email is required';
    if (data.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(data.password)) e.password = 'Password needs at least 1 uppercase letter';
    if (!/[0-9]/.test(data.password)) e.password = 'Password needs at least 1 number';
    if (data.password !== data.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!data.agreeTerms) e.agreeTerms = 'You must agree to the terms';
    if (!data.consentHealthData) e.consentHealthData = 'Health data consent is required';
    return e;
  },
};

export type PatientPhase = 'form' | 'email_otp' | 'submitting' | 'success';

export const usePatientSignupForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<PatientFormData>(initialPatientFormData);
  const [errors, setErrors] = useState<Errors>({});
  const [phase, setPhase] = useState<PatientPhase>('form');
  const [patientId, setPatientId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [aadhaarStatus, setAadhaarStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const updateForm = useCallback((updates: Partial<PatientFormData>) => {
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

  const skipStep = useCallback(() => {
    setErrors({});
    setStep((s) => Math.min(s + 1, 5));
  }, []);

  const checkEmail = useCallback(async (email: string) => {
    if (!email.trim() || !validateEmail(email)) { setEmailStatus('idle'); return; }
    setEmailStatus('checking');
    try {
      const { data } = await supabase
        .from('patients')
        .select('email')
        .eq('email', email)
        .maybeSingle();
      setEmailStatus(data ? 'taken' : 'available');
    } catch { setEmailStatus('idle'); }
  }, []);

  const checkAadhaar = useCallback(async (aadhaar: string) => {
    const digits = aadhaar.replace(/\D/g, '');
    if (digits.length !== 12) { setAadhaarStatus('idle'); return; }
    const masked = `XXXX-XXXX-${digits.slice(-4)}`;
    setAadhaarStatus('checking');
    try {
      const { data } = await supabase
        .from('patients')
        .select('aadhaar_number')
        .eq('aadhaar_number', masked)
        .maybeSingle();
      setAadhaarStatus(data ? 'taken' : 'available');
    } catch { setAadhaarStatus('idle'); }
  }, []);

  const uploadFile = async (bucket: string, path: string, file: File) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { cacheControl: '3600', upsert: true });
    if (error) throw error;
    return data.path;
  };

  const submit = useCallback(async () => {
    if (!validateStep()) return;
    setIsSubmitting(true);
    try {
      // Create auth user using standard signUp
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.fullName, role: 'patient' }
        }
      });

      if (signUpError) throw signUpError;
      if (!authData?.user?.id) throw new Error('User creation failed');

      const createdUserId: string = authData.user.id;

      // Upload files
      let profilePhotoUrl = formData.profilePhotoUrl;
      let insuranceCardUrl = formData.insuranceCardUrl;

      if (formData.profilePhoto) {
        const path = `${createdUserId}/${Date.now()}.${formData.profilePhoto.name.split('.').pop()}`;
        const uploadedPath = await uploadFile('patient-photos', path, formData.profilePhoto);
        const { data: { publicUrl } } = supabase.storage.from('patient-photos').getPublicUrl(uploadedPath);
        profilePhotoUrl = publicUrl;
      }
      if (formData.insuranceCardFile) {
        const path = `${createdUserId}/${Date.now()}.${formData.insuranceCardFile.name.split('.').pop()}`;
        insuranceCardUrl = await uploadFile('patient-documents', path, formData.insuranceCardFile);
      }

      // Mask Aadhaar
      const aadhaarDigits = formData.aadhaarNumber.replace(/\D/g, '');
      const maskedAadhaar = aadhaarDigits.length === 12 ? `XXXX-XXXX-${aadhaarDigits.slice(-4)}` : null;

      // Insert patient record
      const { data, error } = await supabase.from('patients').insert([{
        full_name: formData.fullName,
        date_of_birth: formData.dateOfBirth || null,
        age: formData.age,
        gender: formData.gender || null,
        blood_group: formData.bloodGroup || null,
        profile_photo_url: profilePhotoUrl || null,
        aadhaar_number: maskedAadhaar,
        abha_card_no: formData.abhaCardNo.replace(/\D/g, '') || null,
        abha_id: formData.abhaId || null,
        email: formData.email,
        phone: formData.phone || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        pin_code: formData.pinCode || null,
        emergency_contact_name: formData.emergencyContactName || null,
        emergency_contact_phone: formData.emergencyContactPhone || null,
        emergency_contact_relation: formData.emergencyContactRelation || null,
        allergies: formData.allergies,
        chronic_conditions: formData.chronicConditions,
        current_medications: formData.currentMedications,
        past_surgeries: formData.pastSurgeries ? formData.pastSurgeries.split('\n').filter(Boolean) : [],
        organ_donor: formData.organDonor,
        has_insurance: formData.hasInsurance,
        insurance_type: formData.hasInsurance ? formData.insuranceType || null : null,
        insurance_provider: formData.insuranceProvider || null,
        insurance_policy_no: formData.insurancePolicyNo || null,
        insurance_card_url: insuranceCardUrl || null,
        insurance_validity_date: formData.insuranceValidityDate || null,
        sum_insured: formData.sumInsured || null,
        ayushman_bharat_enrolled: formData.ayushmanEnrolled,
        ayushman_beneficiary_id: formData.ayushmanBeneficiaryId || null,
        state_scheme_name: formData.stateSchemeName || null,
        state_scheme_id: formData.stateSchemeId || null,
        supabase_user_id: createdUserId,
      }]).select('id').single();

      if (error) throw error;
      setPatientId(data?.id || null);
      setPhase('success');
      toast.success('Account created successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [validateStep, formData]);

  return {
    step, formData, errors, phase, patientId, isSubmitting,
    emailStatus, aadhaarStatus,
    updateForm, next, back, skipStep, submit,
    checkEmail, checkAadhaar, setPhase,
  };
};
