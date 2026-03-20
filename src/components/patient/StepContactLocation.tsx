import { PatientFormData } from '@/types/patient';

interface Props {
  data: PatientFormData;
  onChange: (updates: Partial<PatientFormData>) => void;
  errors: Record<string, string>;
}

const StepContactLocation = ({ data, onChange, errors }: Props) => (
  <div className="space-y-5">
    <p className="section-label" style={{ color: '#0891B2' }}>CONTACT & LOCATION</p>

    <div>
      <label className="field-label">Phone Number</label>
      <input className="field-input" value={data.phone} onChange={(e) => onChange({ phone: e.target.value })} placeholder="+91 98765 43210" />
      <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>Used only for emergency alerts — not for login</p>
    </div>

    <div>
      <label className="field-label">Full Address</label>
      <textarea className="field-input min-h-[64px]" rows={2} value={data.address} onChange={(e) => onChange({ address: e.target.value })} placeholder="Street address, area, landmark..." />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="field-label">City</label>
        <input className="field-input" value={data.city} onChange={(e) => onChange({ city: e.target.value })} placeholder="City" />
      </div>
      <div>
        <label className="field-label">State</label>
        <input className="field-input" value={data.state} onChange={(e) => onChange({ state: e.target.value })} placeholder="State" />
      </div>
    </div>

    <div>
      <label className="field-label">PIN Code</label>
      <input className="field-input max-w-[200px]" value={data.pinCode} onChange={(e) => onChange({ pinCode: e.target.value.replace(/\D/g, '').slice(0, 6) })} placeholder="6-digit PIN" maxLength={6} />
    </div>
  </div>
);

export default StepContactLocation;
