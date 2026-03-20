import { usePatientContext } from '@/hooks/usePatientContext';
import { QRCodeSVG } from 'qrcode.react';
import JharokhaArch from '@/components/admin/JharokhaArch';
import { Download, Share2, Printer, Phone, AlertTriangle, Heart, ShieldCheck, Camera } from 'lucide-react';
import PatientSOSPanel from '@/components/patient/dashboard/PatientSOSPanel';
import EmergencyAssistant from '@/components/patient/dashboard/EmergencyAssistant';
import FaceScanner from '@/components/common/FaceScanner';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PatientEmergency = () => {
  const { patient } = usePatientContext();
  const [isFaceScannerOpen, setIsFaceScannerOpen] = useState(false);
  const [hasFaceId, setHasFaceId] = useState(!!(patient as any).face_descriptor);
  const qrUrl = `${window.location.origin}/qr/${patient.id}`;

  const handleFaceScanSuccess = async (descriptor: Float32Array) => {
    try {
       const descriptorJson = JSON.stringify(Array.from(descriptor));
       const { error } = await (supabase as any).from('patients').update({ face_descriptor: descriptorJson }).eq('id', patient.id);
       
       if (error) {
         toast.error("Failed to save Face ID to database.");
         setIsFaceScannerOpen(false);
         return;
       }
       
       toast.success("Biometric Face ID registered successfully!");
       setHasFaceId(true);
       setIsFaceScannerOpen(false);
    } catch(err) {
       console.error(err);
       toast.error("An error occurred while saving biometrics.");
       setIsFaceScannerOpen(false);
    }
  };

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
      {/* Dynamic SOS System */}
      <PatientSOSPanel patientId={patient.id} />

      {/* Medical AI Triage Assistant */}
      <EmergencyAssistant />

      {/* Biometric Face ID Registration */}
      <div className="bg-white rounded-xl overflow-hidden shadow-sm" style={{ border: '1px solid #E2EEF1' }}>
        <JharokhaArch color="#6366f1" opacity={0.15} />
        <div className="p-6 md:p-8 flex flex-col items-center justify-center text-center">
           <ShieldCheck size={48} className={`mb-4 ${hasFaceId ? 'text-green-500' : 'text-indigo-500'}`} />
           <h2 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-wide">
             {hasFaceId ? 'Biometrics Active' : 'Emergency Face ID'}
           </h2>
           <p className="max-w-md text-sm text-slate-500 mb-6 leading-relaxed">
             {hasFaceId 
               ? "Your facial biometrics are securely registered. Paramedics can now identify you instantly even if you are unresponsive and cannot provide your QR code." 
               : "Register your face using our 128-point biometric AI. If you are unresponsive in an accident and your phone is lost, paramedics can scan your face to retrieve your medical profile."}
           </p>

           {isFaceScannerOpen ? (
             <FaceScanner mode="register" onCancel={() => setIsFaceScannerOpen(false)} onScanSuccess={handleFaceScanSuccess} />
           ) : (
             <button 
               onClick={() => setIsFaceScannerOpen(true)}
               className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 ${
                 hasFaceId ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
               }`}
             >
               <Camera size={18} /> {hasFaceId ? 'Re-scan Face ID' : 'Enroll Face ID'}
             </button>
           )}
        </div>
      </div>

      {/* Premium Digital Medical ID Card */}
      <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl overflow-hidden relative shadow-md border border-[#E2EEF1]">
        <JharokhaArch color="#0891B2" opacity={0.15} />
        
        {/* Card Header Strip */}
        <div className="bg-[#0891B2] text-white px-6 py-3 flex justify-between items-center relative z-10 shadow border-b border-[#0369A1]">
          <div className="flex items-center gap-2">
             <Heart size={18} fill="currentColor" className="text-white" />
             <span className="font-black tracking-widest uppercase text-sm">Sanjeevani Medical Pass</span>
          </div>
          <span className="text-[10px] font-bold bg-white text-[#0891B2] px-2.5 py-1 rounded-full shadow-inner tracking-wider">SCAN FOR VITALS</span>
        </div>

        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center bg-[url('https://www.transparenttextures.com/patterns/clean-gray-paper.png')]">
          <div id="emergency-qr" className="shrink-0 bg-white p-4 rounded-2xl shadow-xl border border-[#E2EEF1] relative transition-transform hover:scale-105 group">
            <QRCodeSVG value={qrUrl} size={180} bgColor="#FFFFFF" fgColor="#000000" level="H" />
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#1E293B] text-white text-[11px] font-black uppercase px-4 py-1.5 rounded-full shadow-md whitespace-nowrap opacity-100 transition-opacity">
              {patient.full_name}
            </div>
            <p className="text-[10px] mt-4 text-center font-bold text-slate-400 uppercase tracking-widest">Public Profile Link</p>
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>Your Emergency QR</h2>
              <p className="text-[13px] leading-relaxed" style={{ color: '#64748B' }}>
                Emergency responders scan this to access your critical health information instantly — no password required. <strong>Set this as your lock screen wallpaper to stay safe.</strong>
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-[13px] mb-4">
              {patient.blood_group && (
                <div className="bg-red-50 p-3 rounded-xl border border-red-100 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1">Blood Group</span>
                  <span className="font-black text-lg text-red-700">{patient.blood_group}</span>
                </div>
              )}
              {(patient.allergies || []).length > 0 && (
                <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-1">Allergies</span>
                  <span className="font-black text-xs text-orange-700">{patient.allergies!.join(', ')}</span>
                </div>
              )}
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
