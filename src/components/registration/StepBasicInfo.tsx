import { HospitalFormData, FACILITY_TYPES } from '@/types/registration';
import { Upload, Image, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useRef, useState, useEffect, useCallback } from 'react';

interface StepProps {
  data: HospitalFormData;
  onChange: (updates: Partial<HospitalFormData>) => void;
  errors: Record<string, string>;
  licenseIdStatus: 'idle' | 'checking' | 'available' | 'taken';
  onCheckLicenseId: (id: string) => void;
}

const StepBasicInfo = ({ data, onChange, errors, licenseIdStatus, onCheckLicenseId }: StepProps) => {
  const licenseRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Debounced license check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (data.licenseId.trim()) onCheckLicenseId(data.licenseId);
    }, 600);
    return () => clearTimeout(timer);
  }, [data.licenseId, onCheckLicenseId]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange({ hospitalLogo: file });
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
    }
  };

  return (
    <div className="step-card space-y-5 animate-slide-in-right">
      <div>
        <p className="section-label mb-1">Step 1</p>
        <h2 className="font-heading text-xl font-bold text-foreground">Basic Hospital Information</h2>
      </div>

      <div>
        <label className="field-label">Hospital Name *</label>
        <input className="field-input" placeholder="e.g., Apollo Hospitals" value={data.hospitalName} onChange={(e) => onChange({ hospitalName: e.target.value })} />
        {errors.hospitalName && <p className="field-error">{errors.hospitalName}</p>}
      </div>

      <div>
        <label className="field-label">Hospital License ID *</label>
        <div className="relative">
          <input
            className="field-input pr-10"
            placeholder="e.g., MH-12345-2024"
            value={data.licenseId}
            onChange={(e) => onChange({ licenseId: e.target.value })}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {licenseIdStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            {licenseIdStatus === 'available' && <CheckCircle className="w-4 h-4 text-success" />}
            {licenseIdStatus === 'taken' && <XCircle className="w-4 h-4 text-destructive" />}
          </span>
        </div>
        {licenseIdStatus === 'taken' && <p className="field-error">This License ID is already registered</p>}
        {errors.licenseId && <p className="field-error">{errors.licenseId}</p>}
      </div>

      <div>
        <label className="field-label">License Document Upload *</label>
        <input ref={licenseRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => onChange({ licenseDoc: e.target.files?.[0] || null })} />
        <div
          onClick={() => licenseRef.current?.click()}
          className="upload-zone"
        >
          <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
          {data.licenseDoc ? (
            <p className="text-sm font-medium text-foreground">{data.licenseDoc.name}</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Click to upload PDF, JPG, or PNG</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Max 20MB</p>
            </>
          )}
          {/* Indian corner brackets */}
          <span className="absolute top-2 left-2 text-gold/40 text-lg leading-none">⌐</span>
          <span className="absolute top-2 right-2 text-gold/40 text-lg leading-none rotate-90">⌐</span>
          <span className="absolute bottom-2 left-2 text-gold/40 text-lg leading-none -rotate-90">⌐</span>
          <span className="absolute bottom-2 right-2 text-gold/40 text-lg leading-none rotate-180">⌐</span>
        </div>
        {errors.licenseDoc && <p className="field-error">{errors.licenseDoc}</p>}
      </div>

      <div>
        <label className="field-label">Type of Facility *</label>
        <select className="field-input" value={data.facilityType} onChange={(e) => onChange({ facilityType: e.target.value })}>
          <option value="">Select facility type</option>
          {FACILITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {errors.facilityType && <p className="field-error">{errors.facilityType}</p>}
      </div>

      <div>
        <label className="field-label">Year of Establishment</label>
        <input className="field-input" type="number" placeholder="e.g., 1995" value={data.yearEstablished} onChange={(e) => onChange({ yearEstablished: e.target.value })} />
      </div>

      <div>
        <label className="field-label">Hospital Logo (optional)</label>
        <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => logoRef.current?.click()} className="btn-outline text-sm">
            <Image className="w-4 h-4" /> Upload Logo
          </button>
          {logoPreview && (
            <img src={logoPreview} alt="Logo preview" className="w-14 h-14 rounded-lg object-cover border border-gold/30" />
          )}
        </div>
      </div>
    </div>
  );
};

export default StepBasicInfo;
