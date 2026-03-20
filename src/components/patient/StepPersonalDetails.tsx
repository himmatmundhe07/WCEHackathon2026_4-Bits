import { useEffect, useRef, useState, useCallback } from 'react';
import { PatientFormData, GENDERS, BLOOD_GROUPS } from '@/types/patient';
import { Camera, Check, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  data: PatientFormData;
  onChange: (updates: Partial<PatientFormData>) => void;
  errors: Record<string, string>;
  aadhaarStatus: 'idle' | 'checking' | 'available' | 'taken';
  onCheckAadhaar: (val: string) => void;
}

const StepPersonalDetails = ({ data, onChange, errors, aadhaarStatus, onCheckAadhaar }: Props) => {
  const photoRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const aadhaarTimer = useRef<NodeJS.Timeout>();

  // Auto-calculate age
  useEffect(() => {
    if (data.dateOfBirth) {
      const dob = new Date(data.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      onChange({ age });
    }
  }, [data.dateOfBirth]);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange({ profilePhoto: file });
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const formatAadhaar = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 12);
    return digits.replace(/(\d{4})(?=\d)/g, '$1-').slice(0, 14);
  };

  const handleAadhaarChange = (val: string) => {
    const formatted = formatAadhaar(val);
    onChange({ aadhaarNumber: formatted });
    clearTimeout(aadhaarTimer.current);
    aadhaarTimer.current = setTimeout(() => onCheckAadhaar(formatted), 600);
  };

  const formatAbha = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 14);
    return digits.replace(/(\d{2})(\d{4})(\d{4})(\d{0,4})/, (_, a, b, c, d) => [a, b, c, d].filter(Boolean).join('-'));
  };

  return (
    <div className="space-y-5">
      <p className="section-label" style={{ color: '#0891B2' }}>PERSONAL DETAILS</p>

      {/* Full Name */}
      <div>
        <label className="field-label">Full Name <span className="text-destructive">*</span></label>
        <input className="field-input" value={data.fullName} onChange={(e) => onChange({ fullName: e.target.value })} placeholder="Enter your full name" />
        {errors.fullName && <p className="field-error">{errors.fullName}</p>}
      </div>

      {/* DOB + Age */}
      <div>
        <label className="field-label">Date of Birth <span className="text-destructive">*</span></label>
        <input type="date" className="field-input" value={data.dateOfBirth} onChange={(e) => onChange({ dateOfBirth: e.target.value })} />
        {data.age !== null && data.age >= 0 && (
          <p className="text-xs mt-1" style={{ color: '#64748B' }}>Age: {data.age} years</p>
        )}
        {errors.dateOfBirth && <p className="field-error">{errors.dateOfBirth}</p>}
      </div>

      {/* Gender */}
      <div>
        <label className="field-label">Gender</label>
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((g) => (
            <button key={g} type="button" onClick={() => onChange({ gender: g })}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                data.gender === g ? 'border-teal bg-teal/10 text-teal' : 'border-border bg-background text-muted-foreground hover:border-teal/40'
              }`}>
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Blood Group */}
      <div>
        <label className="field-label">Blood Group</label>
        <div className="flex flex-wrap gap-2">
          {BLOOD_GROUPS.map((bg) => (
            <button key={bg} type="button" onClick={() => onChange({ bloodGroup: bg })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                data.bloodGroup === bg ? 'border-teal bg-teal/10 text-teal' : 'border-border bg-background text-muted-foreground hover:border-teal/40'
              }`}>
              {bg}
            </button>
          ))}
        </div>
      </div>

      {/* Profile Photo */}
      <div>
        <label className="field-label">Profile Photo (Optional)</label>
        <div className="flex items-center gap-4">
          <div onClick={() => photoRef.current?.click()}
            className="w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-teal/50 transition-all overflow-hidden"
            style={{ background: '#F7FBFC' }}>
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-8 h-8 text-muted-foreground/40" />
            )}
          </div>
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          <p className="text-xs" style={{ color: '#94A3B8' }}>Click to upload your photo</p>
        </div>
      </div>

      {/* Identity Documents */}
      <div className="mandana-divider" />
      <p className="section-label" style={{ color: '#0891B2' }}>IDENTITY DOCUMENTS</p>

      {/* Aadhaar */}
      <div>
        <label className="field-label">Aadhaar Number <span className="text-destructive">*</span></label>
        <div className="relative">
          <input className={`field-input pr-10 ${errors.aadhaarNumber ? 'border-destructive' : ''}`}
            value={data.aadhaarNumber} onChange={(e) => handleAadhaarChange(e.target.value)}
            placeholder="XXXX-XXXX-XXXX" maxLength={14} />
          {aadhaarStatus === 'checking' && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-muted-foreground" />}
          {aadhaarStatus === 'available' && <Check className="absolute right-3 top-2.5 w-4 h-4 text-success" />}
          {aadhaarStatus === 'taken' && <span className="absolute right-3 top-2.5 text-destructive text-xs font-medium">Already registered</span>}
        </div>
        <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>Your 12-digit Aadhaar number — kept confidential</p>
        {errors.aadhaarNumber && <p className="field-error">{errors.aadhaarNumber}</p>}

        {/* Security note */}
        <div className="mt-2 p-3 rounded-lg flex items-start gap-2" style={{ background: '#FFFBEB', border: '1px solid #F59E0B' }}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#E8A820' }} />
          <p className="text-xs" style={{ color: '#92400E' }}>
            Your Aadhaar number is encrypted and masked. Only the last 4 digits are ever displayed.
          </p>
        </div>
      </div>

      {/* ABHA Card No */}
      <div>
        <label className="field-label">ABHA Card Number (Optional)</label>
        <input className="field-input" value={data.abhaCardNo}
          onChange={(e) => onChange({ abhaCardNo: formatAbha(e.target.value) })}
          placeholder="XX-XXXX-XXXX-XXXX" maxLength={17} />
        <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>14-digit number printed on your Ayushman Bharat Health Card</p>
      </div>

      {/* ABHA ID */}
      <div>
        <label className="field-label">ABHA Address (Optional)</label>
        <input className="field-input" value={data.abhaId}
          onChange={(e) => onChange({ abhaId: e.target.value })}
          placeholder="e.g. yourname@abdm" />
        <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>Your ABHA health address — like an email for your health records</p>
      </div>
    </div>
  );
};

export default StepPersonalDetails;
