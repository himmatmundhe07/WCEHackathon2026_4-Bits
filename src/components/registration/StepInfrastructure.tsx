import { HospitalFormData } from '@/types/registration';

interface StepProps {
  data: HospitalFormData;
  onChange: (updates: Partial<HospitalFormData>) => void;
  errors: Record<string, string>;
}

const NumberField = ({
  label, value, field, onChange, error,
}: {
  label: string; value: string; field: string;
  onChange: (updates: Partial<HospitalFormData>) => void; error?: string;
}) => (
  <div>
    <label className="field-label">{label}</label>
    <input
      className="field-input"
      type="number"
      min="0"
      placeholder="0"
      value={value}
      onChange={(e) => onChange({ [field]: e.target.value } as Partial<HospitalFormData>)}
    />
    {error && <p className="field-error">{error}</p>}
  </div>
);

const ToggleField = ({
  label, value, field, onChange,
}: {
  label: string; value: boolean; field: string;
  onChange: (updates: Partial<HospitalFormData>) => void;
}) => (
  <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 hover:border-gold/30 transition-colors">
    <span className="text-sm font-medium text-foreground">{label}</span>
    <button
      type="button"
      onClick={() => onChange({ [field]: !value } as Partial<HospitalFormData>)}
      className={`relative w-12 h-6 rounded-full transition-colors ${value ? 'bg-teal' : 'bg-muted'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-card shadow transition-transform ${
          value ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

const StepInfrastructure = ({ data, onChange, errors }: StepProps) => {
  return (
    <div className="step-card space-y-6 animate-slide-in-right">
      <div>
        <p className="section-label mb-1">Step 3</p>
        <h2 className="font-heading text-xl font-bold text-foreground">Staff & Infrastructure</h2>
      </div>

      <div>
        <h3 className="section-label mb-3">Staff Count</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NumberField label="Doctors *" value={data.totalDoctors} field="totalDoctors" onChange={onChange} error={errors.totalDoctors} />
          <NumberField label="Nurses *" value={data.totalNurses} field="totalNurses" onChange={onChange} error={errors.totalNurses} />
          <NumberField label="Support Staff" value={data.totalSupportStaff} field="totalSupportStaff" onChange={onChange} />
        </div>
      </div>

      {/* Element 4 — Mandana diamond divider */}
      <div className="mandana-divider" role="separator" aria-hidden="true" />

      <div>
        <h3 className="section-label mb-3">Bed & Facility Count</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <NumberField label="Total Beds *" value={data.totalBeds} field="totalBeds" onChange={onChange} error={errors.totalBeds} />
          <NumberField label="ICU Beds" value={data.icuBeds} field="icuBeds" onChange={onChange} />
          <NumberField label="General Ward" value={data.generalWardBeds} field="generalWardBeds" onChange={onChange} />
          <NumberField label="Private Rooms" value={data.privateRooms} field="privateRooms" onChange={onChange} />
          <NumberField label="Operation Theatres" value={data.operationTheatres} field="operationTheatres" onChange={onChange} />
          <NumberField label="Ambulances" value={data.ambulances} field="ambulances" onChange={onChange} />
        </div>
      </div>

      {/* Element 4 — Mandana diamond divider */}
      <div className="mandana-divider" role="separator" aria-hidden="true" />

      <div>
        <h3 className="section-label mb-3">Services</h3>
        <div className="space-y-3">
          <ToggleField label="24/7 Emergency Service" value={data.emergency24x7} field="emergency24x7" onChange={onChange} />
          <ToggleField label="Blood Bank Available" value={data.bloodBank} field="bloodBank" onChange={onChange} />
          <ToggleField label="Pharmacy Available" value={data.pharmacy} field="pharmacy" onChange={onChange} />
        </div>
      </div>
    </div>
  );
};

export default StepInfrastructure;
