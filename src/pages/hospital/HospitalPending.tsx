import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Copy, Download, ArrowLeft } from 'lucide-react';
import JharokhaArch from '@/components/admin/JharokhaArch';
import jsPDF from 'jspdf';

const HospitalPending = () => {
  const navigate = useNavigate();
  const [hospital, setHospital] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/hospital/login', { replace: true }); return; }
      const { data } = await supabase.from('hospitals').select('*').eq('supabase_user_id', user.id).single();
      if (!data) { navigate('/register', { replace: true }); return; }
      if (data.verification_status === 'Verified') { navigate('/hospital/dashboard', { replace: true }); return; }
      if (data.verification_status === 'Rejected') { navigate('/hospital/rejected', { replace: true }); return; }
      setHospital(data);
    };
    check();
  }, [navigate]);

  const handleCopy = () => {
    if (hospital?.id) { navigator.clipboard.writeText(hospital.id); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const handleDownloadPDF = () => {
    if (!hospital) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Sanjeevani — Registration Confirmation', 20, 25);
    doc.setFontSize(12);
    doc.text(`Hospital: ${hospital.hospital_name}`, 20, 45);
    doc.text(`License ID: ${hospital.license_id}`, 20, 55);
    doc.text(`Facility Type: ${hospital.facility_type || 'N/A'}`, 20, 65);
    doc.text(`Submitted: ${new Date(hospital.registered_at).toLocaleDateString()}`, 20, 75);
    doc.text(`Registration ID: ${hospital.id}`, 20, 85);
    doc.text('Status: Under Review', 20, 95);
    doc.save('sanjeevani-registration-confirmation.pdf');
  };

  if (!hospital) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F7FBFC' }}>
      <div className="w-full max-w-[520px] bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: '#E2EEF1' }}>
        <JharokhaArch color="#F59E0B" opacity={0.2} />
        <div className="p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: '#FFFBEB' }}>
            <Clock size={28} style={{ color: '#F59E0B' }} />
          </div>
          <h1 className="text-xl font-bold mb-2" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
            Your Registration is Under Review
          </h1>
          <p className="text-[14px] mb-6" style={{ color: '#64748B', fontFamily: 'Inter, sans-serif' }}>
            Our team is verifying your hospital license. This typically takes up to 48 hours. We'll email you once verified.
          </p>

          <div className="flex items-center justify-center gap-2 mb-6">
            <code className="px-3 py-1.5 rounded-md text-[12px] font-mono" style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}>
              {hospital.id}
            </code>
            <button onClick={handleCopy} className="p-1.5 rounded hover:bg-gray-100">
              <Copy size={14} style={{ color: copied ? '#10B981' : '#64748B' }} />
            </button>
          </div>

          <button onClick={handleDownloadPDF} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border text-[13px] font-medium mb-6 hover:bg-gray-50 transition-colors" style={{ borderColor: '#F59E0B', color: '#F59E0B' }}>
            <Download size={16} /> Download Confirmation PDF
          </button>

          <div className="text-left p-4 rounded-lg mb-6" style={{ background: '#F7FBFC', border: '1px solid #E2EEF1' }}>
            <p className="text-[12px] font-semibold mb-2" style={{ color: '#64748B' }}>SUBMITTED INFORMATION</p>
            <div className="space-y-1.5 text-[13px]" style={{ color: '#1E293B' }}>
              <p><span style={{ color: '#64748B' }}>Hospital:</span> {hospital.hospital_name}</p>
              <p><span style={{ color: '#64748B' }}>License ID:</span> {hospital.license_id}</p>
              <p><span style={{ color: '#64748B' }}>Facility Type:</span> {hospital.facility_type || 'N/A'}</p>
              <p><span style={{ color: '#64748B' }}>Submitted:</span> {new Date(hospital.registered_at).toLocaleDateString()}</p>
            </div>
          </div>

          <p className="text-[13px] mb-3" style={{ color: '#64748B' }}>
            <a href="mailto:support@sanjeevani.in" className="hover:underline">Contact Support</a>
          </p>

          <button onClick={async () => { await supabase.auth.signOut(); navigate('/'); }} className="text-[13px] font-medium" style={{ color: '#EF4444' }}>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default HospitalPending;
