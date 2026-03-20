import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

/* --- Color palette matching Sanjeevani brand --- */
const COLORS = {
  primary: [8, 145, 178] as [number, number, number],
  accent: [245, 158, 11] as [number, number, number],
  dark: [30, 41, 59] as [number, number, number],
  gray: [100, 116, 139] as [number, number, number],
  lightBg: [235, 247, 250] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  green: [16, 185, 129] as [number, number, number],
  red: [239, 68, 68] as [number, number, number],
  purple: [139, 92, 246] as [number, number, number],
};

/* --- Shared Header --- */
function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  const w = doc.internal.pageSize.getWidth();

  // Top accent bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, w, 4, 'F');
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 4, w, 1.5, 'F');

  // Logo text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...COLORS.primary);
  doc.text('Sanjeevani', 14, 18);

  // Divider line (no emojis)
  doc.setDrawColor(...COLORS.accent);
  doc.setLineWidth(0.5);
  doc.line(14, 21, 60, 21);

  // Title
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.dark);
  doc.text(title, 14, 32);

  if (subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.gray);
    doc.text(subtitle, 14, 37);
  }

  // Date stamp
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gray);
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, w - 14, 18, { align: 'right' });
}

/* --- Shared Footer --- */
function addFooter(doc: jsPDF) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setFillColor(...COLORS.lightBg);
  doc.rect(0, h - 12, w, 12, 'F');
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gray);
  doc.text('Sanjeevani -- Digital Health Platform  |  This is a computer-generated document', w / 2, h - 5, { align: 'center' });
}

/* =====================================================
   1. PRESCRIPTION PDF
   ===================================================== */
export function generatePrescriptionPDF(rx: {
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  bloodGroup?: string;
  doctorName: string;
  doctorSpecialization?: string;
  hospitalName: string;
  hospitalCity?: string;
  diagnosis: string;
  generalInstructions?: string;
  prescriptionDate: string;
  validUntil?: string;
  medicines: {
    name: string;
    dosage: string;
    form: string;
    timesPerDay: number;
    durationDays: number;
    schedule?: { time: string; label: string; with: string }[];
    specialInstructions?: string;
  }[];
}) {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();

  addHeader(doc, 'Prescription', `${rx.hospitalName}${rx.hospitalCity ? ' -- ' + rx.hospitalCity : ''}`);

  let y = 44;

  // Patient & Doctor info box
  doc.setFillColor(...COLORS.lightBg);
  doc.roundedRect(14, y, w - 28, 28, 2, 2, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('Patient:', 18, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`${rx.patientName}${rx.patientAge ? `, ${rx.patientAge} yrs` : ''}${rx.patientGender ? `, ${rx.patientGender}` : ''}`, 40, y + 7);

  if (rx.bloodGroup) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.red);
    doc.text(`Blood: ${rx.bloodGroup}`, w - 18, y + 7, { align: 'right' });
  }

  doc.setTextColor(...COLORS.dark);
  doc.setFont('helvetica', 'bold');
  doc.text('Doctor:', 18, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(`Dr. ${rx.doctorName}${rx.doctorSpecialization ? ' (' + rx.doctorSpecialization + ')' : ''}`, 40, y + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('Diagnosis:', 18, y + 21);
  doc.setFont('helvetica', 'normal');
  doc.text(rx.diagnosis, 48, y + 21);

  y += 34;

  // Date line
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gray);
  doc.text(`Date: ${rx.prescriptionDate ? format(new Date(rx.prescriptionDate), 'dd MMM yyyy') : '--'}`, 14, y);
  if (rx.validUntil) {
    doc.text(`Valid Until: ${format(new Date(rx.validUntil), 'dd MMM yyyy')}`, w - 14, y, { align: 'right' });
  }
  y += 6;

  // Rx symbol
  doc.setFontSize(28);
  doc.setTextColor(...COLORS.primary);
  doc.text('Rx', 14, y + 10);
  y += 4;

  // Medicines table
  const medRows = rx.medicines.map((m, idx) => {
    const scheduleStr = (m.schedule || []).map(s => `${s.label} (${s.time}) -- ${s.with}`).join('\n');
    return [
      String(idx + 1),
      `${m.name}\n${m.form}`,
      m.dosage,
      `${m.timesPerDay}x / day\n${m.durationDays} days`,
      scheduleStr || '--',
      m.specialInstructions || '--',
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['#', 'Medicine', 'Dosage', 'Frequency', 'Schedule', 'Instructions']],
    body: medRows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3, textColor: COLORS.dark, lineColor: [209, 235, 241], lineWidth: 0.3 },
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [247, 251, 252] },
    columnStyles: { 0: { cellWidth: 8, halign: 'center' }, 1: { cellWidth: 30 }, 4: { cellWidth: 42 } },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // General Instructions
  if (rx.generalInstructions) {
    doc.setFillColor(255, 251, 235);
    doc.roundedRect(14, y, w - 28, 16, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text('General Instructions:', 18, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(rx.generalInstructions, 18, y + 12);
    y += 20;
  }

  // Signature line
  doc.setDrawColor(...COLORS.gray);
  doc.line(w - 70, y + 12, w - 14, y + 12);
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gray);
  doc.text(`Dr. ${rx.doctorName}`, w - 42, y + 18, { align: 'center' });
  doc.text('Authorized Signatory', w - 42, y + 22, { align: 'center' });

  addFooter(doc);
  doc.save(`Prescription_${rx.patientName.replace(/\s/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
}

/* =====================================================
   2. FEEDBACK REPORT PDF
   ===================================================== */
export function generateFeedbackPDF(data: {
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  bloodGroup?: string;
  doctorName: string;
  hospitalName: string;
  diagnosis: string;
  prescriptionDate: string;
  feedback: {
    improvement_rating: number;
    adherence_rating: string;
    symptoms_resolved: boolean;
    pain_level_before: number;
    pain_level_after: number;
    had_side_effects: boolean;
    side_effects: string[];
    side_effect_severity?: string;
    patient_notes?: string;
    submitted_at?: string;
    medicine_feedback?: { medicine_name: string; rating: number; notes?: string }[];
  };
}) {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  const fb = data.feedback;
  const ratingLabels = ['', 'Much worse', 'Worse', 'Same', 'Better', 'Much better'];

  addHeader(doc, 'Patient Feedback Report', data.hospitalName);

  let y = 44;

  // Patient box
  doc.setFillColor(...COLORS.lightBg);
  doc.roundedRect(14, y, w - 28, 20, 2, 2, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text(`Patient: ${data.patientName}`, 18, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Dr. ${data.doctorName} | Diagnosis: ${data.diagnosis}`, 18, y + 14);
  doc.setTextColor(...COLORS.gray);
  doc.text(`Rx Date: ${data.prescriptionDate ? format(new Date(data.prescriptionDate), 'dd MMM yyyy') : '--'}`, w - 18, y + 7, { align: 'right' });
  y += 28;

  // Rating cards
  const cardW = (w - 42) / 3;
  const cards = [
    { label: 'Improvement', value: ratingLabels[fb.improvement_rating] || '--', sub: `${fb.improvement_rating}/5`, color: COLORS.green },
    { label: 'Adherence', value: fb.adherence_rating, sub: '', color: COLORS.primary },
    { label: 'Pain Change', value: `${fb.pain_level_before} -> ${fb.pain_level_after}`, sub: fb.pain_level_before > fb.pain_level_after ? 'Improved' : fb.pain_level_before === fb.pain_level_after ? 'Same' : 'Worsened', color: fb.pain_level_before > fb.pain_level_after ? COLORS.green : COLORS.red },
  ];

  cards.forEach((c, i) => {
    const x = 14 + i * (cardW + 7);
    doc.setFillColor(...c.color);
    doc.roundedRect(x, y, cardW, 22, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text(c.label, x + cardW / 2, y + 6, { align: 'center' });
    doc.setFontSize(12);
    doc.text(c.value, x + cardW / 2, y + 14, { align: 'center' });
    if (c.sub) {
      doc.setFontSize(7);
      doc.text(c.sub, x + cardW / 2, y + 19, { align: 'center' });
    }
  });
  y += 30;

  // Symptoms
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('Symptoms Resolved:', 14, y);
  doc.setFont('helvetica', 'normal');
  const symColor = fb.symptoms_resolved ? COLORS.green : COLORS.red;
  doc.setTextColor(...symColor);
  doc.text(fb.symptoms_resolved ? 'Yes' : 'No', 58, y);
  y += 8;

  // Side effects
  doc.setTextColor(...COLORS.dark);
  doc.setFont('helvetica', 'bold');
  doc.text('Side Effects:', 14, y);
  if (fb.had_side_effects) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.red);
    doc.text(`${fb.side_effect_severity || ''} -- ${(fb.side_effects || []).join(', ')}`, 46, y);
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.green);
    doc.text('None reported', 46, y);
  }
  y += 10;

  // Medicine feedback
  if (fb.medicine_feedback && fb.medicine_feedback.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.dark);
    doc.text('Medicine-wise Feedback', 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['Medicine', 'Rating', 'Patient Notes']],
      body: fb.medicine_feedback.map(mf => [mf.medicine_name, `${mf.rating}/5`, mf.notes || '--']),
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 3, textColor: COLORS.dark },
      headStyles: { fillColor: COLORS.accent, textColor: COLORS.white, fontStyle: 'bold' },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Patient notes
  if (fb.patient_notes) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, w - 28, 18, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.gray);
    doc.text("Patient's Words:", 18, y + 6);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLORS.dark);
    doc.text(`"${fb.patient_notes}"`, 18, y + 13);
  }

  addFooter(doc);
  doc.save(`Feedback_Report_${data.patientName.replace(/\s/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
}

/* =====================================================
   3. ANALYTICS REPORT PDF
   ===================================================== */
export function generateAnalyticsReportPDF(data: {
  hospitalName: string;
  totalPrescriptions: number;
  totalFeedback: number;
  feedbackRate: number;
  avgImprovement: string;
  topMedicine: string;
  topMedicines: { name: string; count: number }[];
  effectivenessData: { name: string; rating: number }[];
  ageGroupData: { group: string; rating: number; count: number }[];
  sideEffects: { name: string; value: number }[];
  adherenceData: { name: string; value: number }[];
}) {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();

  addHeader(doc, 'Prescription Analytics Report', data.hospitalName);

  let y = 44;

  // Summary cards
  const cardW = (w - 42) / 4;
  const summaryCards = [
    { label: 'Total Rx', value: String(data.totalPrescriptions), color: COLORS.primary },
    { label: 'Feedback Rate', value: data.feedbackRate + '%', color: COLORS.green },
    { label: 'Avg Improvement', value: data.avgImprovement + '/5', color: COLORS.accent },
    { label: 'Most Prescribed', value: data.topMedicine.length > 12 ? data.topMedicine.slice(0, 12) + '...' : data.topMedicine, color: COLORS.gray },
  ];

  summaryCards.forEach((c, i) => {
    const x = 14 + i * (cardW + 4.6);
    doc.setFillColor(...c.color);
    doc.roundedRect(x, y, cardW, 18, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text(c.label, x + cardW / 2, y + 6, { align: 'center' });
    doc.setFontSize(13);
    doc.text(c.value, x + cardW / 2, y + 14, { align: 'center' });
  });
  y += 26;

  // Top Medicines
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('Top Prescribed Medicines', 14, y);
  y += 4;

  if (data.topMedicines.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['#', 'Medicine', 'Times Prescribed']],
      body: data.topMedicines.slice(0, 10).map((m, i) => [String(i + 1), m.name, String(m.count)]),
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 3, textColor: COLORS.dark },
      headStyles: { fillColor: COLORS.accent, textColor: COLORS.white },
      columnStyles: { 0: { cellWidth: 10, halign: 'center' }, 2: { cellWidth: 30, halign: 'center' } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLORS.gray);
    doc.text('No prescription data yet.', 14, y + 6);
    y += 14;
  }

  // Medicine Effectiveness
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('Medicine Effectiveness (Patient Ratings)', 14, y);
  y += 4;

  if (data.effectivenessData.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Medicine', 'Avg Rating (1-5)', 'Assessment']],
      body: data.effectivenessData.map(m => [
        m.name,
        m.rating.toFixed(1),
        m.rating >= 4 ? 'Effective' : m.rating >= 3 ? 'Moderate' : 'Low',
      ]),
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 3, textColor: COLORS.dark },
      headStyles: { fillColor: COLORS.green, textColor: COLORS.white },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLORS.gray);
    doc.text('No effectiveness data yet.', 14, y + 6);
    y += 14;
  }

  // New page
  doc.addPage();
  addHeader(doc, 'Analytics Report (continued)', data.hospitalName);
  y = 44;

  // Age Group
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('Effectiveness by Age Group', 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['Age Group', 'Avg Improvement', 'Responses', 'Assessment']],
    body: data.ageGroupData.map(a => [
      a.group,
      a.rating > 0 ? a.rating.toFixed(1) + '/5' : 'No data',
      String(a.count),
      a.count === 0 ? '--' : a.rating >= 4 ? 'Great response' : a.rating >= 3 ? 'Moderate' : 'Below average',
    ]),
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 3, textColor: COLORS.dark },
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.white },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // Side Effects
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('Reported Side Effects', 14, y);
  y += 4;

  if (data.sideEffects.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Side Effect', 'Reports', '% of Feedback']],
      body: data.sideEffects.map(se => [
        se.name, String(se.value),
        data.totalFeedback > 0 ? ((se.value / data.totalFeedback) * 100).toFixed(0) + '%' : '--',
      ]),
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 3, textColor: COLORS.dark },
      headStyles: { fillColor: COLORS.red, textColor: COLORS.white },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLORS.gray);
    doc.text('No side effects reported.', 14, y + 6);
    y += 14;
  }

  // Adherence
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('Medicine Adherence Distribution', 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['Adherence Level', 'Patients', 'Assessment']],
    body: data.adherenceData.map(a => [
      a.name, String(a.value),
      a.name === 'Always' || a.name === 'Mostly' ? 'Good' : a.name === 'Sometimes' ? 'Moderate' : 'Needs attention',
    ]),
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 3, textColor: COLORS.dark },
    headStyles: { fillColor: COLORS.purple, textColor: COLORS.white },
    margin: { left: 14, right: 14 },
  });

  addFooter(doc);
  doc.save(`Analytics_Report_${data.hospitalName.replace(/\s/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
}

/* =====================================================
   4. COMPLETE PATIENT PROFILE PDF — Full medical summary
   ===================================================== */
export function generatePatientProfilePDF(data: {
  fullName: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  dateOfBirth?: string;
  abhaCardNo?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  allergies?: string[];
  chronicConditions?: string[];
  pastSurgeries?: string[];
  disabilities?: string[];
  currentMedications?: string[];
  organDonor?: boolean;
  insurance?: {
    provider?: string;
    policyNo?: string;
    type?: string;
    validUntil?: string;
    sumInsured?: string;
  };
  pastTreatments?: {
    type: string;
    title: string;
    hospital_name: string;
    doctor_name: string;
    date: string;
    end_date?: string;
    diagnosis: string;
    outcome: string;
    notes?: string;
  }[];
  prescriptions?: {
    doctorName: string;
    diagnosis: string;
    date: string;
    status: string;
    medicineCount: number;
  }[];
}) {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();

  addHeader(doc, 'Complete Medical Profile', 'Sanjeevani Health Platform');

  let y = 44;

  // Patient Name Banner
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(14, y, w - 28, 16, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.white);
  doc.text(data.fullName, 20, y + 11);
  if (data.bloodGroup) {
    doc.setFillColor(...COLORS.red);
    doc.roundedRect(w - 40, y + 3, 24, 10, 2, 2, 'F');
    doc.setFontSize(10);
    doc.text(data.bloodGroup, w - 28, y + 10.5, { align: 'center' });
  }
  y += 22;

  // Personal Details
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text('PERSONAL DETAILS', 14, y);
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(14, y + 2, w - 14, y + 2);
  y += 8;

  const personalRows: string[][] = [];
  if (data.dateOfBirth) personalRows.push(['Date of Birth', format(new Date(data.dateOfBirth), 'dd MMM yyyy')]);
  if (data.age) personalRows.push(['Age', `${data.age} years`]);
  if (data.gender) personalRows.push(['Gender', data.gender]);
  if (data.phone) personalRows.push(['Phone', data.phone]);
  if (data.email) personalRows.push(['Email', data.email]);
  if (data.address) personalRows.push(['Address', `${data.address}${data.city ? ', ' + data.city : ''}${data.state ? ', ' + data.state : ''}${data.pinCode ? ' - ' + data.pinCode : ''}`]);
  if (data.abhaCardNo) personalRows.push(['ABHA Card No.', data.abhaCardNo]);
  personalRows.push(['Organ Donor', data.organDonor ? 'Yes' : 'No']);

  autoTable(doc, {
    startY: y,
    body: personalRows,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2, textColor: COLORS.dark },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40, textColor: COLORS.gray } },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // Emergency Contact
  if (data.emergencyContactName) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.red);
    doc.text('EMERGENCY CONTACT', 14, y);
    doc.setDrawColor(...COLORS.red);
    doc.line(14, y + 2, w - 14, y + 2);
    y += 8;

    autoTable(doc, {
      startY: y,
      body: [
        ['Name', data.emergencyContactName],
        ['Relation', data.emergencyContactRelation || '--'],
        ['Phone', data.emergencyContactPhone || '--'],
      ],
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2, textColor: COLORS.dark },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40, textColor: COLORS.gray } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // Medical Information
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.accent);
  doc.text('MEDICAL INFORMATION', 14, y);
  doc.setDrawColor(...COLORS.accent);
  doc.line(14, y + 2, w - 14, y + 2);
  y += 8;

  // Allergies
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.red);
  doc.text('Allergies:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.dark);
  doc.text((data.allergies || []).length > 0 ? data.allergies!.join(', ') : 'None recorded', 44, y);
  y += 6;

  // Chronic Conditions
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.accent);
  doc.text('Chronic Conditions:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.dark);
  doc.text((data.chronicConditions || []).length > 0 ? data.chronicConditions!.join(', ') : 'None recorded', 56, y);
  y += 6;

  // Past Surgeries
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.purple);
  doc.text('Past Surgeries:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.dark);
  doc.text((data.pastSurgeries || []).length > 0 ? data.pastSurgeries!.join(', ') : 'None recorded', 50, y);
  y += 6;

  // Current Medications
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text('Current Medications:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.dark);
  doc.text((data.currentMedications || []).length > 0 ? data.currentMedications!.join(', ') : 'None', 58, y);
  y += 6;

  // Disabilities
  if ((data.disabilities || []).length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.gray);
    doc.text('Disabilities:', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.dark);
    doc.text(data.disabilities!.join(', '), 44, y);
    y += 6;
  }

  // Insurance
  if (data.insurance?.provider) {
    y += 4;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.green);
    doc.text('INSURANCE DETAILS', 14, y);
    doc.setDrawColor(...COLORS.green);
    doc.line(14, y + 2, w - 14, y + 2);
    y += 8;

    autoTable(doc, {
      startY: y,
      body: [
        ['Provider', data.insurance.provider],
        ['Policy No.', data.insurance.policyNo || '--'],
        ['Type', data.insurance.type || '--'],
        ['Valid Until', data.insurance.validUntil ? format(new Date(data.insurance.validUntil), 'dd MMM yyyy') : '--'],
        ['Sum Insured', data.insurance.sumInsured || '--'],
      ],
      theme: 'plain',
      styles: { fontSize: 9, cellPadding: 2, textColor: COLORS.dark },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40, textColor: COLORS.gray } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // Past Treatments
  if ((data.pastTreatments || []).length > 0) {
    // Check if we need a new page
    if (y > 200) { doc.addPage(); addHeader(doc, 'Medical Profile (continued)', 'Past Treatments'); y = 44; }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.purple);
    doc.text('PAST TREATMENTS & HOSPITALIZATIONS', 14, y);
    doc.setDrawColor(...COLORS.purple);
    doc.line(14, y + 2, w - 14, y + 2);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['Type', 'Treatment', 'Hospital', 'Doctor', 'Date', 'Outcome']],
      body: data.pastTreatments!.map(t => [
        t.type,
        t.title,
        t.hospital_name || '--',
        t.doctor_name ? 'Dr. ' + t.doctor_name : '--',
        t.date ? format(new Date(t.date), 'dd MMM yy') : '--',
        t.outcome || '--',
      ]),
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2.5, textColor: COLORS.dark },
      headStyles: { fillColor: COLORS.purple, textColor: COLORS.white, fontStyle: 'bold', fontSize: 8 },
      columnStyles: { 0: { cellWidth: 24 }, 4: { cellWidth: 20 }, 5: { cellWidth: 20 } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // Recent Prescriptions
  if ((data.prescriptions || []).length > 0) {
    if (y > 220) { doc.addPage(); addHeader(doc, 'Medical Profile (continued)', 'Prescriptions'); y = 44; }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text('RECENT PRESCRIPTIONS', 14, y);
    doc.setDrawColor(...COLORS.primary);
    doc.line(14, y + 2, w - 14, y + 2);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['Doctor', 'Diagnosis', 'Date', 'Medicines', 'Status']],
      body: data.prescriptions!.map(p => [
        'Dr. ' + p.doctorName,
        p.diagnosis,
        p.date ? format(new Date(p.date), 'dd MMM yy') : '--',
        String(p.medicineCount),
        p.status,
      ]),
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2.5, textColor: COLORS.dark },
      headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold', fontSize: 8 },
      margin: { left: 14, right: 14 },
    });
  }

  addFooter(doc);
  doc.save(`Patient_Profile_${data.fullName.replace(/\s/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
}

/* =====================================================
   5. PHARMACY ALERT REPORT PDF (ANONYMOUS)
   ===================================================== */
export function generatePharmacyAlertReportPDF(data: {
  diagnosis: string;
  feedback: {
    improvement_rating: number;
    adherence_rating: string;
    symptoms_resolved: boolean;
    pain_level_before: number;
    pain_level_after: number;
    had_side_effects: boolean;
    side_effects: string[];
    side_effect_severity?: string;
  };
}) {
  const doc = new jsPDF();
  const w = doc.internal.pageSize.getWidth();
  const fb = data.feedback;
  const ratingLabels = ['', 'Much worse', 'Worse', 'Same', 'Better', 'Much better'];

  // Anonymous Header
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, w, 4, 'F');
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 4, w, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...COLORS.primary);
  doc.text('Pharmacy Medication Feedback Alert', 14, 20);
  
  doc.setDrawColor(...COLORS.red);
  doc.setLineWidth(0.5);
  doc.line(14, 26, w - 14, 26);

  doc.setFontSize(9);
  doc.setTextColor(...COLORS.gray);
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, 14, 34);
  
  let y = 46;

  // Diagnosis box
  doc.setFillColor(...COLORS.lightBg);
  doc.roundedRect(14, y, w - 28, 16, 2, 2, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('Condition / Diagnosis:', 18, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.diagnosis || 'Not specified', 62, y + 10);
  y += 26;

  // Rating cards
  const cardW = (w - 42) / 3;
  const cards = [
    { label: 'Improvement', value: ratingLabels[fb.improvement_rating] || '--', color: COLORS.green },
    { label: 'Adherence', value: fb.adherence_rating, color: COLORS.primary },
    { label: 'Pain Change', value: `${fb.pain_level_before} -> ${fb.pain_level_after}`, color: fb.pain_level_before > fb.pain_level_after ? COLORS.green : fb.pain_level_before < fb.pain_level_after ? COLORS.red : COLORS.gray },
  ];

  cards.forEach((c, i) => {
    const x = 14 + i * (cardW + 7);
    doc.setFillColor(...c.color);
    doc.roundedRect(x, y, cardW, 22, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.white);
    doc.text(c.label, x + cardW / 2, y + 8, { align: 'center' });
    doc.setFontSize(12);
    doc.text(c.value, x + cardW / 2, y + 16, { align: 'center' });
  });
  y += 32;

  // Symptoms
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.dark);
  doc.text('Symptoms Resolved:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...(fb.symptoms_resolved ? COLORS.green : COLORS.red));
  doc.text(fb.symptoms_resolved ? 'Yes' : 'No', 56, y);
  y += 10;

  // Side effects
  doc.setTextColor(...COLORS.dark);
  doc.setFont('helvetica', 'bold');
  doc.text('Reported Side Effects:', 14, y);
  if (fb.had_side_effects) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.red);
    doc.text(`${fb.side_effect_severity || ''} -- ${(fb.side_effects || []).join(', ')}`, 58, y);
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.green);
    doc.text('None reported', 58, y);
  }
  y += 18;

  // Note to pharmacy
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(...COLORS.red);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y, w - 28, 22, 2, 2, 'FD');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.red);
  doc.text('ATTENTION PHARMACY:', 18, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.dark);
  doc.text('Please review the reported adverse effects and medication outcomes', 18, y + 14);
  doc.text('for internal quality control. This data is strictly anonymous.', 18, y + 19);

  // Footer
  const h = doc.internal.pageSize.getHeight();
  doc.setFillColor(...COLORS.lightBg);
  doc.rect(0, h - 12, w, 12, 'F');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gray);
  doc.text('Confidential & Anonymous Pharmacovigilance Report', w / 2, h - 5, { align: 'center' });

  doc.save(`Pharmacy_Alert_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
}
