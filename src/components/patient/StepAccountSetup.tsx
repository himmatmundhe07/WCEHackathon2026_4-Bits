import { useRef, useEffect } from 'react';
import { PatientFormData } from '@/types/patient';
import { Check, Loader2, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface Props {
  data: PatientFormData;
  onChange: (updates: Partial<PatientFormData>) => void;
  errors: Record<string, string>;
  emailStatus: 'idle' | 'checking' | 'available' | 'taken';
  onCheckEmail: (val: string) => void;
}

const getPasswordStrength = (pw: string): { label: string; color: string; width: string } => {
  if (pw.length < 8) return { label: 'Too short', color: '#EF4444', width: '20%' };
  let score = 0;
  if (/[a-z]/.test(pw)) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (pw.length >= 12) score++;
  if (score <= 2) return { label: 'Weak', color: '#EF4444', width: '33%' };
  if (score <= 3) return { label: 'Fair', color: '#F59E0B', width: '66%' };
  return { label: 'Strong', color: '#10B981', width: '100%' };
};

const StepAccountSetup = ({ data, onChange, errors, emailStatus, onCheckEmail }: Props) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const emailTimer = useRef<NodeJS.Timeout>();

  const handleEmailChange = (val: string) => {
    onChange({ email: val });
    clearTimeout(emailTimer.current);
    emailTimer.current = setTimeout(() => onCheckEmail(val), 600);
  };

  const strength = getPasswordStrength(data.password);

  return (
    <div className="space-y-5">
      <p className="section-label" style={{ color: '#0891B2' }}>CREATE YOUR ACCOUNT</p>

      {/* Email */}
      <div>
        <label className="field-label">Email Address <span className="text-destructive">*</span></label>
        <div className="relative">
          <input className={`field-input pr-10 ${errors.email ? 'border-destructive' : ''}`}
            value={data.email} onChange={(e) => handleEmailChange(e.target.value)}
            placeholder="your.email@example.com" type="email" />
          {emailStatus === 'checking' && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-muted-foreground" />}
          {emailStatus === 'available' && <Check className="absolute right-3 top-2.5 w-4 h-4 text-success" />}
          {emailStatus === 'taken' && <span className="absolute right-3 top-2.5 text-destructive text-xs font-medium">Already taken</span>}
        </div>
        {errors.email && <p className="field-error">{errors.email}</p>}
      </div>

      {/* Password */}
      <div>
        <label className="field-label">Password <span className="text-destructive">*</span></label>
        <div className="relative">
          <input className={`field-input pr-10 ${errors.password ? 'border-destructive' : ''}`}
            type={showPassword ? 'text' : 'password'} value={data.password}
            onChange={(e) => onChange({ password: e.target.value })}
            placeholder="Min. 8 characters, 1 uppercase, 1 number" />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {data.password && (
          <div className="mt-2">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: strength.width, background: strength.color }} />
            </div>
            <p className="text-xs mt-1 font-medium" style={{ color: strength.color }}>{strength.label}</p>
          </div>
        )}
        {errors.password && <p className="field-error">{errors.password}</p>}
      </div>

      {/* Confirm Password */}
      <div>
        <label className="field-label">Confirm Password <span className="text-destructive">*</span></label>
        <div className="relative">
          <input className={`field-input pr-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
            type={showConfirm ? 'text' : 'password'} value={data.confirmPassword}
            onChange={(e) => onChange({ confirmPassword: e.target.value })}
            placeholder="Re-enter your password" />
          <button type="button" onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {data.confirmPassword && data.password !== data.confirmPassword && (
          <p className="field-error">Passwords do not match</p>
        )}
        {errors.confirmPassword && <p className="field-error">{errors.confirmPassword}</p>}
      </div>

      {/* Checkboxes */}
      <div className="space-y-3 pt-2">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={data.agreeTerms}
            onChange={(e) => onChange({ agreeTerms: e.target.checked })}
            className="mt-1 w-4 h-4 rounded border-border accent-teal" />
          <span className="text-sm" style={{ color: '#1E293B' }}>
            I agree to Sanjeevani's <span className="text-teal underline cursor-pointer">Terms & Conditions</span> and <span className="text-teal underline cursor-pointer">Privacy Policy</span>
          </span>
        </label>
        {errors.agreeTerms && <p className="field-error ml-7">{errors.agreeTerms}</p>}

        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={data.consentHealthData}
            onChange={(e) => onChange({ consentHealthData: e.target.checked })}
            className="mt-1 w-4 h-4 rounded border-border accent-teal" />
          <span className="text-sm" style={{ color: '#1E293B' }}>
            I consent to my health data being used for emergency care purposes
          </span>
        </label>
        {errors.consentHealthData && <p className="field-error ml-7">{errors.consentHealthData}</p>}
      </div>
    </div>
  );
};

export default StepAccountSetup;
