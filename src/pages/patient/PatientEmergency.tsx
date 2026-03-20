import { usePatientContext } from '@/hooks/usePatientContext';
import { QRCodeSVG } from 'qrcode.react';
import JharokhaArch from '@/components/admin/JharokhaArch';
import { Download, Share2, Printer, Phone, AlertTriangle, Heart } from 'lucide-react';

const PatientEmergency = () => {
  const { patient } = usePatientContext();
  const qrUrl = `${window.location.origin}/qr/${patient.id}`;

  const handleDownload = () => {
    const svg = document.querySelector('#emergency-qr svg') as SVGElement;
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sanjeevani-emergency-qr.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maskedAadhaar = patient.aadhaar_number ? `XXXX-XXXX-${patient.aadhaar_number.slice(-4)}` : null;

  return (
    <div className="space-y-6">
      {/* QR Card */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #EF4444', boxShadow: '0 2px 12px rgba(239,68,68,0.1)' }}>
        <JharokhaArch color="#EF4444" opacity={0.2} />
        <div className="p-6 flex flex-col md:flex-row gap-6">
          <div id="emergency-qr" className="shrink-0 text-center">
            <QRCodeSVG value={qrUrl} size={200} bgColor="#FFFFFF" fgColor="#0891B2" level="H" />
            <p className="text-[12px] mt-2 italic" style={{ color: '#64748B' }}>Scan to view emergency profile</p>
            <p className="text-[11px] font-medium" style={{ color: '#1E293B' }}>{patient.full_name}</p>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold mb-1" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Your Emergency QR</h2>
            <p className="text-[13px] mb-4" style={{ color: '#64748B' }}>
              Emergency responders scan this to access your critical health information instantly — no login required.
            </p>
            <div className="space-y-2 text-[13px] mb-4">
              {patient.blood_group && <p>🩸 <span className="font-medium" style={{ color: '#EF4444' }}>Blood Group:</span> {patient.blood_group}</p>}
              {(patient.allergies || []).length > 0 && <p>⚠️ <span className="font-medium" style={{ color: '#EF4444' }}>Allergic to:</span> {patient.allergies!.join(', ')}</p>}
              {(patient.current_medications || []).length > 0 && <p>💊 {patient.current_medications!.length} active medications</p>}
              {patient.emergency_contact_name && <p>📞 {patient.emergency_contact_name} ({patient.emergency_contact_relation})</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleDownload} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold text-white" style={{ background: '#0891B2' }}>
                <Download size={14} /> Download QR
              </button>
              {navigator.share && (
                <button onClick={() => navigator.share({ title: 'Emergency QR', url: qrUrl })} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: '1px solid #0891B2', color: '#0891B2' }}>
                  <Share2 size={14} /> Share
                </button>
              )}
              <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: '1px solid #64748B', color: '#64748B' }}>
                <Printer size={14} /> Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#0891B2" opacity={0.18} />
        <div className="p-5">
          <h3 className="text-base font-bold mb-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Emergency Contacts</h3>
          {patient.emergency_contact_name ? (
            <div className="p-4 rounded-lg" style={{ border: '1px solid #E2EEF1' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white" style={{ background: '#0891B2' }}>①</div>
                <div>
                  <p className="text-[14px] font-semibold" style={{ color: '#1E293B' }}>{patient.emergency_contact_name}</p>
                  <p className="text-[12px]" style={{ color: '#64748B' }}>{patient.emergency_contact_relation} · {patient.emergency_contact_phone}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="py-4 text-center text-[13px]" style={{ color: '#94A3B8' }}>No emergency contacts added. Update in Settings.</p>
          )}
        </div>
      </div>

      {/* Medical Emergency Preferences */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#F59E0B" opacity={0.18} />
        <div className="p-5">
          <h3 className="text-base font-bold mb-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Medical Emergency Preferences</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#F7FBFC' }}>
              <div className="flex items-center gap-2">
                <Heart size={16} style={{ color: '#EF4444' }} />
                <span className="text-[13px] font-medium" style={{ color: '#1E293B' }}>Organ Donor</span>
              </div>
              <span className="text-[12px] font-bold" style={{ color: patient.organ_donor ? '#10B981' : '#64748B' }}>
                {patient.organ_donor ? 'Yes ✓' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#F7FBFC' }}>
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} style={{ color: '#F59E0B' }} />
                <span className="text-[13px] font-medium" style={{ color: '#1E293B' }}>Blood Group</span>
              </div>
              <span className="text-[12px] font-bold" style={{ color: '#EF4444' }}>{patient.blood_group || 'Not set'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientEmergency;
