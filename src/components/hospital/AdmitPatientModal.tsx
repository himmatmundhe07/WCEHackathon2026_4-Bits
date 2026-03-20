import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { BedDouble, Activity, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface AdmitPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalId: string;
  alert: any; // The qr_scan_logs row with patients relation
  onSuccess: () => void;
}

const AdmitPatientModal = ({ isOpen, onClose, hospitalId, alert, onSuccess }: AdmitPatientModalProps) => {
  const [beds, setBeds] = useState<any[]>([]);
  const [selectedBedId, setSelectedBedId] = useState<string>('');
  const [diagnosis, setDiagnosis] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && hospitalId) {
      fetchAvailableBeds();
    }
  }, [isOpen, hospitalId]);

  const fetchAvailableBeds = async () => {
    const { data } = await supabase
      .from('hospital_beds')
      .select('*')
      .eq('hospital_id', hospitalId)
      .eq('status', 'Available')
      .order('ward_name')
      .order('bed_number');
    setBeds(data || []);
  };

  const handleAdmit = async () => {
    if (!selectedBedId) {
      toast.error('Please select an available bed.');
      return;
    }

    setLoading(true);
    try {
      const selectedBed = beds.find(b => b.id === selectedBedId);

      // 1. Create hospital admission record
      const { data: admissionData, error: admissionError } = await supabase
        .from('hospital_patients')
        .insert({
          hospital_id: hospitalId,
          patient_id: alert.patient_id,
          ward: selectedBed?.ward_name,
          bed_number: selectedBed?.bed_number,
          diagnosis: diagnosis || 'Emergency Admission',
          admitted_at: new Date().toISOString(),
          notes: {
            reason: 'Emergency QR Scan',
            alert_id: alert.id,
          }
        })
        .select()
        .single();

      if (admissionError) throw admissionError;

      // 2. Update Bed Status to Occupied
      const { error: bedError } = await supabase
        .from('hospital_beds')
        .update({ status: 'Occupied', patient_id: alert.patient_id, notes: 'Emergency Admission' })
        .eq('id', selectedBedId);

      if (bedError) throw bedError;

      // 3. Mark the emergency alert as resolved
      await supabase
        .from('qr_scan_logs')
        .update({ 
           resolved: true, 
           resolved_at: new Date().toISOString(), 
           resolved_by: 'Automated Admission',
           action_taken: `Admitted to ${selectedBed?.ward_name} - Bed ${selectedBed?.bed_number}`
        })
        .eq('id', alert.id);

      toast.success('Patient successfully admitted and bed assigned!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to admit patient.');
    } finally {
      setLoading(false);
    }
  };

  if (!alert || !alert.patients) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-white p-4 rounded-t-lg -mx-6 -mt-6 rounded-b-none mb-4" style={{ background: '#F59E0B' }}>
            <Activity size={20} />
            <DialogTitle className="text-white text-lg font-bold uppercase tracking-tight m-0">
               Emergency Admission
            </DialogTitle>
          </div>
          <DialogDescription className="text-left text-[14px] text-slate-800 font-medium">
            Admitting <span className="font-bold text-amber-600">{alert.patients.full_name}</span> from emergency scan.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
           <div>
              <label className="text-[13px] font-bold text-slate-700 block mb-1">Select Available Bed</label>
              <select 
                className="w-full border border-slate-200 rounded-lg p-2.5 text-[14px] bg-slate-50 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                value={selectedBedId}
                onChange={(e) => setSelectedBedId(e.target.value)}
              >
                 <option value="" disabled>-- Select Ward & Bed --</option>
                 {beds.map(bed => (
                    <option key={bed.id} value={bed.id}>
                       {bed.ward_name} — Bed {bed.bed_number} ({bed.bed_type})
                    </option>
                 ))}
                 {beds.length === 0 && <option value="" disabled>No available beds found!</option>}
              </select>
           </div>

           <div>
              <label className="text-[13px] font-bold text-slate-700 block mb-1">Initial Diagnosis (Optional)</label>
              <input 
                type="text" 
                placeholder="E.g., Trauma, Allergic Reaction..." 
                className="w-full border border-slate-200 rounded-lg p-2.5 text-[14px] bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />
           </div>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-slate-100">
          <button 
             onClick={onClose} 
             disabled={loading}
             className="px-4 py-2 rounded-lg font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-[13px]"
          >
             Cancel
          </button>
          <button 
             onClick={handleAdmit} 
             disabled={loading || !selectedBedId}
             className="px-4 py-2 rounded-lg font-bold text-white transition-colors text-[13px] flex items-center gap-2 disabled:opacity-50"
             style={{ background: '#F59E0B' }}
          >
             {loading ? 'Processing...' : <><CheckCircle2 size={16} /> Confirm Admission</>}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdmitPatientModal;
