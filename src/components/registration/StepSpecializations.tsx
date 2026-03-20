import { HospitalFormData, SPECIALIZATIONS } from '@/types/registration';
import { X, Plus } from 'lucide-react';
import { useState } from 'react';

interface StepProps {
  data: HospitalFormData;
  onChange: (updates: Partial<HospitalFormData>) => void;
  errors: Record<string, string>;
}

const StepSpecializations = ({ data, onChange, errors }: StepProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const toggleSpec = (spec: string) => {
    const updated = data.specializations.includes(spec)
      ? data.specializations.filter((s) => s !== spec)
      : [...data.specializations, spec];
    onChange({ specializations: updated });
  };

  const addOther = () => {
    const trimmed = data.otherSpecialization.trim();
    if (trimmed && !data.specializations.includes(trimmed)) {
      onChange({
        specializations: [...data.specializations, trimmed],
        otherSpecialization: '',
      });
    }
  };

  const filtered = SPECIALIZATIONS.filter((s) =>
    s.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="step-card space-y-5 animate-slide-in-right">
      <div>
        <p className="section-label mb-1">Step 4</p>
        <h2 className="font-heading text-xl font-bold text-foreground">Treatments & Specializations</h2>
        <p className="text-sm text-muted-foreground mt-1">Select all departments and treatments available at your facility.</p>
      </div>

      <input
        className="field-input"
        placeholder="Search specializations..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-1">
        {filtered.map((spec) => {
          const isSelected = data.specializations.includes(spec);
          return (
            <button
              key={spec}
              type="button"
              onClick={() => toggleSpec(spec)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                isSelected
                  ? 'bg-teal text-teal-foreground border-teal shadow-sm'
                  : 'bg-card text-foreground border-border hover:border-gold/50'
              }`}
              style={isSelected ? { boxShadow: '0 2px 8px hsl(var(--teal) / 0.25)' } : undefined}
            >
              {spec}
            </button>
          );
        })}
      </div>

      {errors.specializations && <p className="field-error">{errors.specializations}</p>}

      <div>
        <label className="field-label">Add Other Specialization</label>
        <div className="flex gap-2">
          <input
            className="field-input flex-1"
            placeholder="e.g., Sports Medicine"
            value={data.otherSpecialization}
            onChange={(e) => onChange({ otherSpecialization: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOther())}
          />
          <button type="button" onClick={addOther} className="btn-primary px-4">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {data.specializations.length > 0 && (
        <div>
          <label className="field-label">Selected ({data.specializations.length})</label>
          <div className="flex flex-wrap gap-2">
            {data.specializations.map((spec) => (
              <span key={spec} className={SPECIALIZATIONS.includes(spec) ? 'chip-tag' : 'chip-tag-gold'}>
                {spec}
                <button type="button" onClick={() => toggleSpec(spec)} className="hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StepSpecializations;
