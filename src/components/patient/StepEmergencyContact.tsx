import { PatientFormData, RELATIONSHIPS } from '@/types/patient';
import { AlertTriangle } from 'lucide-react';

interface Props {
  data: PatientFormData;
  onChange: (updates: Partial<PatientFormData>) => void;
  errors: Record<string, string>;
}

const StepEmergencyContact = ({ data, onChange, errors }: Props) => (
  <div className="space-y-5">
    <p className="section-label" style={{ color: '#0891B2' }}>EMERGENCY CONTACT</p>

    {/* Warning box */}
    <div className="p-4 rounded-lg flex items-start gap-3" style={{ background: '#FFFBEB', border: '1px solid #F59E0B' }}>
      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#E8A820' }} />
      <p className="text-[13px]" style={{ color: '#92400E', fontFamily: 'Inter, sans-serif' }}>
        In a medical emergency, this person will be contacted immediately and may be shown your critical health information.
      </p>
    </div>

    <div>
      <label className="field-label">Emergency Contact Name <span className="text-destructive">*</span></label>
      <input className="field-input" value={data.emergencyContactName} onChange={(e) => onChange({ emergencyContactName: e.target.value })} placeholder="Full name of your emergency contact" />
      {errors.emergencyContactName && <p className="field-error">{errors.emergencyContactName}</p>}
    </div>

    <div>
      <label className="field-label">Emergency Contact Phone <span className="text-destructive">*</span></label>
      <input className="field-input" value={data.emergencyContactPhone} onChange={(e) => onChange({ emergencyContactPhone: e.target.value })} placeholder="+91 98765 43210" />
      {errors.emergencyContactPhone && <p className="field-error">{errors.emergencyContactPhone}</p>}
    </div>

    <div>
      <label className="field-label">Relationship <span className="text-destructive">*</span></label>
      <select className="field-input" value={data.emergencyContactRelation} onChange={(e) => onChange({ emergencyContactRelation: e.target.value })}>
        <option value="">Select relationship</option>
        {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      {errors.emergencyContactRelation && <p className="field-error">{errors.emergencyContactRelation}</p>}
    </div>
  </div>
);

export default StepEmergencyContact;
