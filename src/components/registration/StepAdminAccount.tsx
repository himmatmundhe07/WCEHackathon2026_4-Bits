import { HospitalFormData } from '@/types/registration';
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface StepProps {
  data: HospitalFormData;
  onChange: (updates: Partial<HospitalFormData>) => void;
  errors: Record<string, string>;
  adminEmailStatus: 'idle' | 'checking' | 'available' | 'taken';
  onCheckAdminEmail: (email: string) => void;
}

const StepAdminAccount = ({ data, onChange, errors, adminEmailStatus, onCheckAdminEmail }: StepProps) => {
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Debounced email check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (data.adminEmail.trim()) onCheckAdminEmail(data.adminEmail);
    }, 600);
    return () => clearTimeout(timer);
  }, [data.adminEmail, onCheckAdminEmail]);

  return (
    <div className="step-card space-y-5 animate-slide-in-right">
      <div>
        <p className="section-label mb-1">Step 5</p>
        <h2 className="font-heading text-xl font-bold text-foreground">Admin Account Setup</h2>
        <p className="text-sm text-muted-foreground mt-1">This account will be used to manage your hospital on Sanjeevani.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label">Admin Full Name *</label>
          <input className="field-input" placeholder="Dr. Rajesh Kumar" value={data.adminName} onChange={(e) => onChange({ adminName: e.target.value })} />
          {errors.adminName && <p className="field-error">{errors.adminName}</p>}
        </div>
        <div>
          <label className="field-label">Designation *</label>
          <input className="field-input" placeholder="Hospital Administrator" value={data.designation} onChange={(e) => onChange({ designation: e.target.value })} />
          {errors.designation && <p className="field-error">{errors.designation}</p>}
        </div>
      </div>

      <div>
        <label className="field-label">Admin Email *</label>
        <div className="relative">
          <input
            className="field-input pr-10"
            type="email"
            placeholder="admin@hospital.com"
            value={data.adminEmail}
            onChange={(e) => onChange({ adminEmail: e.target.value })}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {adminEmailStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            {adminEmailStatus === 'available' && <CheckCircle className="w-4 h-4 text-success" />}
            {adminEmailStatus === 'taken' && <XCircle className="w-4 h-4 text-destructive" />}
          </span>
        </div>
        {adminEmailStatus === 'taken' && <p className="field-error">This email is already registered</p>}
        {errors.adminEmail && <p className="field-error">{errors.adminEmail}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label">Password *</label>
          <div className="relative">
            <input
              className="field-input pr-10"
              type={showPass ? 'text' : 'password'}
              placeholder="Min 8 characters"
              value={data.password}
              onChange={(e) => onChange({ password: e.target.value })}
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="field-error">{errors.password}</p>}
        </div>
        <div>
          <label className="field-label">Confirm Password *</label>
          <div className="relative">
            <input
              className="field-input pr-10"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Re-enter password"
              value={data.confirmPassword}
              onChange={(e) => onChange({ confirmPassword: e.target.value })}
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="field-error">{errors.confirmPassword}</p>}
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.agreeTerms}
            onChange={(e) => onChange({ agreeTerms: e.target.checked })}
            className="mt-0.5 w-4 h-4 rounded border-border accent-gold"
          />
          <span className="text-sm text-foreground">
            I agree to Sanjeevani's <a href="#" className="text-gold underline hover:text-gold/80">Terms & Conditions</a> and <a href="#" className="text-gold underline hover:text-gold/80">Privacy Policy</a>
          </span>
        </label>
        {errors.agreeTerms && <p className="field-error ml-7">{errors.agreeTerms}</p>}

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.confirmAccuracy}
            onChange={(e) => onChange({ confirmAccuracy: e.target.checked })}
            className="mt-0.5 w-4 h-4 rounded border-border accent-gold"
          />
          <span className="text-sm text-foreground">
            I confirm all submitted information is accurate and the license is valid
          </span>
        </label>
        {errors.confirmAccuracy && <p className="field-error ml-7">{errors.confirmAccuracy}</p>}
      </div>
    </div>
  );
};

export default StepAdminAccount;
