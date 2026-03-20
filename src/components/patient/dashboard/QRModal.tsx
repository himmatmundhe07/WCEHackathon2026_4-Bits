import { X, Download, Share2, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { PatientProfile } from './PatientProtectedRoute';

interface Props {
  patient: PatientProfile;
  onClose: () => void;
}

const QRModal = ({ patient, onClose }: Props) => {
  const qrUrl = `${window.location.origin}/qr/${patient.id}`;
  const maskedAadhaar = patient.aadhaar_number ? `XXXX-XXXX-${patient.aadhaar_number.slice(-4)}` : null;

  const handleDownload = () => {
    const svg = document.querySelector('#patient-qr-code svg') as SVGElement;
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sanjeevani-qr-${patient.full_name.replace(/\s+/g, '-')}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Sanjeevani Emergency QR', url: qrUrl });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl max-w-lg w-full overflow-hidden" style={{ border: '1px solid #EF4444', boxShadow: '0 8px 40px rgba(239,68,68,0.12)' }}>
        {/* Jharokha arch red */}
        <svg width="100%" height="18" viewBox="0 0 400 18" preserveAspectRatio="none" className="block">
          <path d="M50 18 Q120 18 160 6 Q190 0 200 0 Q210 0 240 6 Q280 18 350 18" fill="none" stroke="#EF4444" strokeOpacity="0.2" strokeWidth="1.5" />
        </svg>

        <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100">
          <X size={18} style={{ color: '#64748B' }} />
        </button>

        <div className="p-8">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* QR Code */}
            <div id="patient-qr-code" className="shrink-0 text-center">
              <QRCodeSVG value={qrUrl} size={200} bgColor="#FFFFFF" fgColor="#0891B2" level="H" />
              <p className="text-[12px] mt-2 italic" style={{ color: '#64748B' }}>Scan for emergency info</p>
              <p className="text-[11px] font-medium" style={{ color: '#1E293B' }}>{patient.full_name}</p>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h2 className="text-lg font-bold mb-1" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
                Your Emergency QR
              </h2>
              <p className="text-[13px] mb-4" style={{ color: '#64748B' }}>
                Emergency responders scan this to access your critical health information instantly.
              </p>

              <div className="space-y-2 text-[13px] mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
                {patient.blood_group && (
                  <p><span className="font-medium" style={{ color: '#EF4444' }}>🩸 Blood Group:</span> {patient.blood_group}</p>
                )}
                {patient.allergies && patient.allergies.length > 0 && (
                  <p><span className="font-medium" style={{ color: '#EF4444' }}>⚠️ Allergic to:</span> {patient.allergies.join(', ')}</p>
                )}
                {patient.current_medications && patient.current_medications.length > 0 && (
                  <p><span className="font-medium" style={{ color: '#0891B2' }}>💊</span> {patient.current_medications.length} active medications</p>
                )}
                {patient.emergency_contact_name && (
                  <p><span className="font-medium" style={{ color: '#0891B2' }}>📞</span> {patient.emergency_contact_name} ({patient.emergency_contact_relation})</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={handleDownload} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold text-white" style={{ background: '#0891B2' }}>
                  <Download size={14} /> Download QR
                </button>
                {navigator.share && (
                  <button onClick={handleShare} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold" style={{ border: '1px solid #0891B2', color: '#0891B2' }}>
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
      </div>
    </div>
  );
};

export default QRModal;
