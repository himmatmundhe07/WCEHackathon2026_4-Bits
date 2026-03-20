import { Download, ArrowLeft, CheckCircle2, Mail, Phone } from 'lucide-react';
import { HospitalFormData } from '@/types/registration';
import { useCallback } from 'react';

interface SuccessScreenProps {
  hospitalId: string | null;
  formData: HospitalFormData;
}

const SuccessScreen = ({ hospitalId, formData }: SuccessScreenProps) => {
  const generatePDF = useCallback(async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;

    doc.setFontSize(22);
    doc.setTextColor(11, 27, 62);
    doc.text('Sanjeevani — Registration Confirmation', margin, y);
    y += 15;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Registration ID: ${hospitalId || 'N/A'}`, margin, y);
    y += 5;
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, margin, y);
    y += 12;

    doc.setDrawColor(232, 168, 32);
    doc.setLineWidth(0.5);
    doc.line(margin, y, 190, y);
    y += 10;

    const sections = [
      { title: 'Hospital Details', fields: [
        ['Hospital Name', formData.hospitalName],
        ['License ID', formData.licenseId],
        ['Facility Type', formData.facilityType],
        ['Year Established', formData.yearEstablished || 'N/A'],
      ]},
      { title: 'Location & Contact', fields: [
        ['Address', formData.fullAddress],
        ['City / State / PIN', `${formData.city}, ${formData.state} - ${formData.pinCode}`],
        ['Phone', formData.phone],
        ['Emergency Helpline', formData.emergencyHelpline],
        ['Email', formData.email],
      ]},
      { title: 'Infrastructure', fields: [
        ['Doctors', formData.totalDoctors],
        ['Nurses', formData.totalNurses],
        ['Total Beds', formData.totalBeds],
        ['24/7 Emergency', formData.emergency24x7 ? 'Yes' : 'No'],
      ]},
      { title: 'Admin', fields: [
        ['Admin Name', formData.adminName],
        ['Designation', formData.designation],
        ['Admin Email', formData.adminEmail],
      ]},
    ];

    for (const section of sections) {
      doc.setFontSize(13);
      doc.setTextColor(11, 27, 62);
      doc.text(section.title, margin, y);
      y += 8;

      doc.setFontSize(10);
      for (const [label, value] of section.fields) {
        doc.setTextColor(100, 100, 100);
        doc.text(`${label}:`, margin, y);
        doc.setTextColor(30, 30, 30);
        doc.text(String(value), margin + 55, y);
        y += 6;
      }
      y += 6;
    }

    if (formData.specializations.length > 0) {
      doc.setFontSize(13);
      doc.setTextColor(11, 27, 62);
      doc.text('Specializations', margin, y);
      y += 8;
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      const specText = formData.specializations.join(', ');
      const lines = doc.splitTextToSize(specText, 170);
      doc.text(lines, margin, y);
    }

    doc.save(`Sanjeevani_Registration_${formData.hospitalName.replace(/\s+/g, '_')}.pdf`);
  }, [hospitalId, formData]);

  return (
    <div className="step-card flex flex-col items-center text-center py-12 px-6 animate-fade-up">
      {/* Element 9 — Rangoli glow behind checkmark */}
      <div className="relative w-24 h-24 flex items-center justify-center mb-6">
        <div className="rangoli-glow absolute inset-0 m-auto" style={{ width: 200, height: 200, top: -38, left: -38 }} />
        <div className="relative z-10 w-24 h-24 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, hsl(var(--gold) / 0.15), hsl(var(--teal) / 0.1))' }}>
          <svg viewBox="0 0 52 52" className="w-14 h-14">
            <circle cx="26" cy="26" r="25" fill="none" stroke="hsl(var(--gold))" strokeWidth="2" opacity="0.3" />
            <path
              className="draw-checkmark"
              fill="none"
              stroke="hsl(var(--gold))"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14 27l8 8 16-16"
            />
          </svg>
        </div>
      </div>

      {/* Bilingual message */}
      <p className="font-heading text-lg italic text-gold mb-2">
        Aapka swagat hai. आपका स्वागत है।
      </p>

      <h2 className="font-heading text-2xl font-bold text-foreground mb-3">
        Registration Submitted Successfully!
      </h2>

      <p className="text-muted-foreground max-w-md mb-4">
        Your hospital has been registered on <span className="font-semibold text-foreground">Sanjeevani</span>. Our team will verify your license within <span className="font-semibold text-gold">48 hours</span>.
      </p>

      {/* Registration ID badge */}
      {hospitalId && (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--gold) / 0.1), hsl(var(--teal) / 0.1))',
            border: '1px solid hsl(var(--gold) / 0.3)'
          }}>
          <span className="text-xs text-muted-foreground">Registration ID:</span>
          <span className="text-sm font-mono font-bold text-foreground">{hospitalId.slice(0, 8).toUpperCase()}</span>
        </div>
      )}

      {/* Verification badges */}
      <div className="flex items-center gap-4 mb-8">
        <span className="inline-flex items-center gap-1.5 text-sm text-success font-medium">
          <Mail className="w-4 h-4" /> Email Verified
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm text-success font-medium">
          <Phone className="w-4 h-4" /> Phone Verified
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={generatePDF} className="btn-primary">
          <Download className="w-4 h-4" />
          Download Confirmation PDF
        </button>
        <button onClick={() => window.location.reload()} className="btn-outline">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>

      <div className="mt-10 p-4 rounded-lg max-w-md"
        style={{ background: 'hsl(var(--gold) / 0.06)', border: '1px solid hsl(var(--gold) / 0.15)' }}>
        <p className="text-xs text-muted-foreground">
          📧 A confirmation email has been sent to your registered address via Supabase Auth. For queries, contact <span className="text-gold font-medium">support@sanjeevani.health</span>
        </p>
      </div>
    </div>
  );
};

export default SuccessScreen;
