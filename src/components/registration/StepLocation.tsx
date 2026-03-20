import { HospitalFormData } from '@/types/registration';

interface StepProps {
  data: HospitalFormData;
  onChange: (updates: Partial<HospitalFormData>) => void;
  errors: Record<string, string>;
}

const StepLocation = ({ data, onChange, errors }: StepProps) => {
  return (
    <div className="step-card space-y-5 animate-slide-in-right">
      <div>
        <p className="section-label mb-1">Step 2</p>
        <h2 className="font-heading text-xl font-bold text-foreground">Location & Contact Details</h2>
      </div>

      <div>
        <label className="field-label">Full Address *</label>
        <textarea className="field-input min-h-[80px] resize-none" placeholder="Street address, landmark..." value={data.fullAddress} onChange={(e) => onChange({ fullAddress: e.target.value })} />
        {errors.fullAddress && <p className="field-error">{errors.fullAddress}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="field-label">City *</label>
          <input className="field-input" placeholder="Mumbai" value={data.city} onChange={(e) => onChange({ city: e.target.value })} />
          {errors.city && <p className="field-error">{errors.city}</p>}
        </div>
        <div>
          <label className="field-label">State *</label>
          <input className="field-input" placeholder="Maharashtra" value={data.state} onChange={(e) => onChange({ state: e.target.value })} />
          {errors.state && <p className="field-error">{errors.state}</p>}
        </div>
        <div>
          <label className="field-label">PIN Code *</label>
          <input className="field-input" placeholder="400001" maxLength={6} value={data.pinCode} onChange={(e) => onChange({ pinCode: e.target.value.replace(/\D/g, '') })} />
          {errors.pinCode && <p className="field-error">{errors.pinCode}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label">Phone Number *</label>
          <input className="field-input" placeholder="+91 98765 43210" value={data.phone} onChange={(e) => onChange({ phone: e.target.value })} />
          {errors.phone && <p className="field-error">{errors.phone}</p>}
        </div>
        <div>
          <label className="field-label">Emergency Helpline *</label>
          <input className="field-input" placeholder="+91 98765 43211" value={data.emergencyHelpline} onChange={(e) => onChange({ emergencyHelpline: e.target.value })} />
          {errors.emergencyHelpline && <p className="field-error">{errors.emergencyHelpline}</p>}
        </div>
      </div>

      <div>
        <label className="field-label">Email Address *</label>
        <input className="field-input" type="email" placeholder="info@hospital.com" value={data.email} onChange={(e) => onChange({ email: e.target.value })} />
        {errors.email && <p className="field-error">{errors.email}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label">Website URL (optional)</label>
          <input className="field-input" placeholder="https://www.hospital.com" value={data.website} onChange={(e) => onChange({ website: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Google Maps Link (optional)</label>
          <input className="field-input" placeholder="https://maps.google.com/..." value={data.googleMapsLink} onChange={(e) => onChange({ googleMapsLink: e.target.value })} />
        </div>
      </div>
    </div>
  );
};

export default StepLocation;
