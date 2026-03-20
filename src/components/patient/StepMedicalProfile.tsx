import { useRef } from 'react';
import { PatientFormData, COMMON_ALLERGIES, COMMON_CONDITIONS, INSURANCE_TYPES } from '@/types/patient';
import TagInput from './TagInput';
import { Upload, Check, AlertTriangle } from 'lucide-react';

interface Props {
  data: PatientFormData;
  onChange: (updates: Partial<PatientFormData>) => void;
  errors: Record<string, string>;
}

const StepMedicalProfile = ({ data, onChange, errors }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleInsuranceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onChange({ insuranceCardFile: file });
  };

  const isExpiringSoon = () => {
    if (!data.insuranceValidityDate) return false;
    const expiry = new Date(data.insuranceValidityDate);
    const now = new Date();
    const diff = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 30;
  };

  return (
    <div className="space-y-5">
      <p className="section-label" style={{ color: '#0891B2' }}>MEDICAL PROFILE</p>

      {/* Info box */}
      <div className="p-4 rounded-lg" style={{ background: '#EBF7FA', border: '1px solid rgba(8,145,178,0.3)' }}>
        <p className="text-[13px]" style={{ color: '#0E6685', fontFamily: 'Inter, sans-serif' }}>
          This information is stored securely and only shared with healthcare providers you authorise, or in emergencies via your QR code.
        </p>
      </div>

      {/* Allergies */}
      <div className="mandana-divider" />
      <div>
        <label className="field-label">Allergies</label>
        <TagInput tags={data.allergies} onChange={(tags) => onChange({ allergies: tags })}
          placeholder="e.g. Penicillin, Dust, Peanuts..."
          quickAddOptions={COMMON_ALLERGIES} chipColor="red" />
      </div>

      {/* Chronic Conditions */}
      <div className="mandana-divider" />
      <div>
        <label className="field-label">Chronic Conditions</label>
        <TagInput tags={data.chronicConditions} onChange={(tags) => onChange({ chronicConditions: tags })}
          placeholder="e.g. Diabetes Type 2, Hypertension..."
          quickAddOptions={COMMON_CONDITIONS} chipColor="amber" />
      </div>

      {/* Medications */}
      <div className="mandana-divider" />
      <div>
        <label className="field-label">Current Medications</label>
        <TagInput tags={data.currentMedications} onChange={(tags) => onChange({ currentMedications: tags })}
          placeholder="e.g. Metformin 500mg, Amlodipine 5mg..." chipColor="teal" />
        <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>Include dosage if known</p>
      </div>

      {/* Past Surgeries */}
      <div className="mandana-divider" />
      <div>
        <label className="field-label">Past Surgeries</label>
        <textarea className="field-input min-h-[64px]" rows={2} value={data.pastSurgeries}
          onChange={(e) => onChange({ pastSurgeries: e.target.value })}
          placeholder="e.g. Appendectomy 2018, ACL Surgery 2021" />
      </div>

      {/* Organ Donor */}
      <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#F7FBFC' }}>
        <span className="text-sm font-medium" style={{ color: '#1E293B' }}>I am willing to be an organ donor</span>
        <button type="button" onClick={() => onChange({ organDonor: !data.organDonor })}
          className={`w-12 h-6 rounded-full transition-all relative ${data.organDonor ? 'bg-teal' : 'bg-muted'}`}>
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${data.organDonor ? 'left-[26px]' : 'left-0.5'}`} />
        </button>
      </div>

      {/* Insurance */}
      <div className="mandana-divider" />
      <p className="section-label" style={{ color: '#0891B2' }}>INSURANCE & HEALTH SCHEMES</p>

      <div className="p-3 rounded-lg" style={{ background: '#EBF7FA', border: '1px solid rgba(8,145,178,0.3)' }}>
        <p className="text-[13px]" style={{ color: '#0E6685' }}>
          Add your insurance details so hospitals can process your claims faster in an emergency.
        </p>
      </div>

      {/* Has Insurance Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#F7FBFC' }}>
        <span className="text-sm font-medium" style={{ color: '#1E293B' }}>Do you have health insurance?</span>
        <button type="button" onClick={() => onChange({ hasInsurance: !data.hasInsurance })}
          className={`w-12 h-6 rounded-full transition-all relative ${data.hasInsurance ? 'bg-teal' : 'bg-muted'}`}>
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${data.hasInsurance ? 'left-[26px]' : 'left-0.5'}`} />
        </button>
      </div>

      {data.hasInsurance && (
        <div className="space-y-4 animate-fade-up">
          {/* Insurance Type */}
          <div>
            <label className="field-label">Insurance Type</label>
            <div className="flex flex-wrap gap-2">
              {INSURANCE_TYPES.map((t) => (
                <button key={t} type="button" onClick={() => onChange({ insuranceType: t })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    data.insuranceType === t ? 'border-teal bg-teal/10 text-teal' : 'border-border bg-background text-muted-foreground hover:border-teal/40'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="field-label">Insurance Provider</label>
            <input className="field-input" value={data.insuranceProvider} onChange={(e) => onChange({ insuranceProvider: e.target.value })}
              placeholder="e.g. Star Health, HDFC Ergo, New India Assurance" />
          </div>

          <div>
            <label className="field-label">Policy Number</label>
            <input className="field-input" value={data.insurancePolicyNo} onChange={(e) => onChange({ insurancePolicyNo: e.target.value })}
              placeholder="e.g. P/211111/01/2024/001234" />
          </div>

          <div>
            <label className="field-label">Sum Insured</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">₹</span>
              <input className="field-input pl-7" value={data.sumInsured} onChange={(e) => onChange({ sumInsured: e.target.value })}
                placeholder="e.g. 5,00,000" />
            </div>
          </div>

          <div>
            <label className="field-label">Policy Valid Until</label>
            <input type="date" className="field-input" value={data.insuranceValidityDate}
              onChange={(e) => onChange({ insuranceValidityDate: e.target.value })} />
            {isExpiringSoon() && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#E8A820' }} />
                <p className="text-xs" style={{ color: '#E8A820' }}>Your policy expires soon. Consider renewing it.</p>
              </div>
            )}
          </div>

          {/* Insurance Card Upload */}
          <div>
            <label className="field-label">Upload Insurance Card (optional)</label>
            <div className="upload-zone" onClick={() => fileRef.current?.click()}>
              {data.insuranceCardFile ? (
                <div className="flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span className="text-sm text-foreground">{data.insuranceCardFile.name}</span>
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">Front side of your insurance card</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">PDF or image</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleInsuranceFile} />
          </div>

          {/* Government Schemes */}
          {data.insuranceType === 'Government' && (
            <>
              <div className="mandana-divider" />
              <p className="section-label" style={{ color: '#10B981' }}>GOVERNMENT HEALTH SCHEMES</p>

              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#F0FDF4' }}>
                <span className="text-sm font-medium" style={{ color: '#1E293B' }}>Enrolled in Ayushman Bharat PM-JAY?</span>
                <button type="button" onClick={() => onChange({ ayushmanEnrolled: !data.ayushmanEnrolled })}
                  className={`w-12 h-6 rounded-full transition-all relative ${data.ayushmanEnrolled ? 'bg-success' : 'bg-muted'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${data.ayushmanEnrolled ? 'left-[26px]' : 'left-0.5'}`} />
                </button>
              </div>

              {data.ayushmanEnrolled && (
                <div>
                  <label className="field-label">Ayushman Bharat Beneficiary ID</label>
                  <input className="field-input" value={data.ayushmanBeneficiaryId}
                    onChange={(e) => onChange({ ayushmanBeneficiaryId: e.target.value })}
                    placeholder="e.g. AB-RJ-123456789" />
                  <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>Printed on your Ayushman Bharat golden card</p>
                </div>
              )}

              <div>
                <label className="field-label">State Health Scheme</label>
                <input className="field-input" value={data.stateSchemeName}
                  onChange={(e) => onChange({ stateSchemeName: e.target.value })}
                  placeholder="e.g. Chiranjeevi Yojana, Rajshri Yojana, CGHS" />
                <p className="text-xs mt-1" style={{ color: '#94A3B8' }}>Any state government health scheme you are enrolled in</p>
              </div>

              <div>
                <label className="field-label">State Scheme Beneficiary ID</label>
                <input className="field-input" value={data.stateSchemeId}
                  onChange={(e) => onChange({ stateSchemeId: e.target.value })}
                  placeholder="Your ID under the state scheme" />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default StepMedicalProfile;
