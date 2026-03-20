import { useState, useRef, UIEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Loader2, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck,
  Building, CreditCard, FileText, Clock, Download, MapPin, BadgeCheck
} from 'lucide-react';
import JharokhaFrame from '@/components/registration/JharokhaFrame';

type Step = 'business' | 'bank' | 'tnc' | 'success';

interface FormData {
  // Business
  pharmacyName: string;
  ownerName: string;
  pharmacyType: string;
  licenseNumber: string;
  gstNumber: string;
  panNumber: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pin_code: string;
  website: string;
  password: string;
  confirmPassword: string;

  // Bank
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  accountType: string;
  branchName: string;
  upiId: string;
  upiName: string;
  preferredMethod: 'bank' | 'upi';
  deductionConsent: boolean;

  // T&C
  tncAgreed1: boolean;
  tncAgreed2: boolean;
}

const STEP_LABELS: Record<Step, string> = {
  business: 'Business Details',
  bank: 'Bank Details',
  tnc: 'Agreement',
  success: 'Done',
};
const STEPS: Step[] = ['business', 'bank', 'tnc', 'success'];
const PHARMA_TYPES = ['Retail Pharmacy', 'Wholesale Agency', 'Online Pharmacy', 'Hospital Pharmacy', 'Diagnostic Partner'];
const ACCOUNT_TYPES = ['Savings', 'Current', 'OD Account'];

const TNC_TEXT = `SANJEEVANI PHARMA PARTNER REVENUE SHARING AGREEMENT
Version: v1.0 | Effective: 1 April 2026

1. PARTIES
   This agreement is between Sanjeevani Health Infrastructure
   Pvt. Ltd. ("Sanjeevani") and the pharmacy/agency registering
   on this platform ("Partner").

2. PLATFORM COMMISSION
   2.1 Partner agrees to pay Sanjeevani a platform commission
       of 8% (eight percent) on all gross revenue generated
       through the Sanjeevani platform each calendar month.
   2.2 This rate may be renegotiated annually with 30 days
       written notice from Sanjeevani.
   2.3 The commission is calculated on gross transaction value
       before any discounts offered to patients.

3. DEDUCTION MECHANISM
   3.1 Sanjeevani will generate a monthly statement by the
       5th of every subsequent month.
   3.2 Partner will have 5 business days to review the
       statement and raise disputes.
   3.3 If no dispute is raised, Sanjeevani will initiate the
       deduction from the registered bank account or UPI
       by the 15th of each month.
   3.4 Failed deductions will be retried twice. If all attempts
       fail, the Partner's account will be suspended until
       outstanding dues are cleared.

4. DISPUTES
   4.1 Disputes must be raised within 5 business days of
       statement generation via the Sanjeevani Portal.
   4.2 Sanjeevani will resolve disputes within 10 business days.
   4.3 Undisputed portions of a statement will be deducted
       even if a partial dispute is raised.

5. PLATFORM ACCESS
   5.1 Active platform access is conditional on timely payment
       of commissions.
   5.2 Accounts more than 30 days overdue will be suspended.
   5.3 Accounts more than 60 days overdue may be permanently
       terminated.

6. DATA & PRIVACY
   6.1 Bank details provided are encrypted and used solely
       for commission deduction purposes.
   6.2 Sanjeevani will never share Partner financial details
       with any third party except as required by law.

7. TERMINATION
   7.1 Either party may terminate this agreement with 30 days
       written notice.
   7.2 Outstanding dues must be settled before termination
       takes effect.
   7.3 Patient data and prescription history will be retained
       as required by law.

8. GOVERNING LAW
   This agreement is governed by the laws of India.
   Disputes shall be resolved in courts of Jaipur, Rajasthan.`;

const PharmaRegistration = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('business');
  const [isLoading, setIsLoading] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [clientIp, setClientIp] = useState<string>('0.0.0.0');
  const scrollRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormData>({
    pharmacyName: '', ownerName: '', pharmacyType: '', licenseNumber: '', gstNumber: '', panNumber: '',
    email: '', phone: '', address: '', city: '', state: '', pin_code: '', website: '', password: '', confirmPassword: '',
    accountHolderName: '', bankName: '', accountNumber: '', confirmAccountNumber: '', ifscCode: '', accountType: '', branchName: '',
    upiId: '', upiName: '', preferredMethod: 'bank', deductionConsent: false,
    tncAgreed1: false, tncAgreed2: false
  });

  const set = (key: keyof FormData, val: any) => setFormData(prev => ({ ...prev, [key]: val }));

  const currentStepIdx = STEPS.indexOf(step);
  const accentColor = '#0891B2'; // Teal accent

  useEffect(() => {
    // Attempt to get IP
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setClientIp(data.ip))
      .catch(() => {});
  }, []);

  const handleMaskAccountNumber = (acc: string) => {
    if (acc.length <= 4) return acc;
    return '*'.repeat(acc.length - 4) + acc.slice(-4);
  };

  const validateBusiness = () => {
    const required: (keyof FormData)[] = [
      'pharmacyName', 'ownerName', 'pharmacyType', 'licenseNumber', 'gstNumber', 
      'panNumber', 'email', 'phone', 'address', 'city', 'state', 'pin_code',
      'password', 'confirmPassword'
    ];
    if (required.some(k => !formData[k])) { toast.error('Please fill in all required fields'); return false; }
    if (formData.password !== formData.confirmPassword) { toast.error('Passwords do not match'); return false; }
    if (formData.password.length < 8) { toast.error('Password must be at least 8 characters'); return false; }
    return true;
  };

  const validateBank = () => {
    if (formData.preferredMethod === 'bank') {
      const required: (keyof FormData)[] = ['accountHolderName', 'bankName', 'accountNumber', 'confirmAccountNumber', 'ifscCode', 'accountType'];
      if (required.some(k => !formData[k])) { toast.error('Please fill in all bank details'); return false; }
      if (formData.accountNumber !== formData.confirmAccountNumber) { toast.error('Account numbers do not match'); return false; }
    } else {
      if (!formData.upiId || !formData.upiName) { toast.error('Please fill in UPI details'); return false; }
    }
    if (!formData.deductionConsent) { toast.error('You must agree to the deduction consent'); return false; }
    return true;
  };

  const handleNextSteps = () => {
    if (step === 'business' && validateBusiness()) setStep('bank');
    else if (step === 'bank' && validateBank()) setStep('tnc');
  };

  const handleTncScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 10) {
      setHasScrolledToBottom(true);
    }
  };

  const handleRegister = async () => {
    if (!formData.tncAgreed1 || !formData.tncAgreed2) {
      toast.error('You must agree to all terms and conditions');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { full_name: formData.ownerName, role: 'pharma', pharmacy_name: formData.pharmacyName },
        },
      });
      if (signUpError) throw signUpError;

      const newUserId = authData.user?.id;
      if (!newUserId) throw new Error('Account creation failed');
      setUserId(newUserId);

      // 2. Insert pharmacy profile
      const { error: pharmaErr } = await (supabase as any).from('pharmacies').insert([{
        id: newUserId,
        pharmacy_name: formData.pharmacyName,
        owner_name: formData.ownerName,
        pharmacy_type: formData.pharmacyType,
        license_number: formData.licenseNumber,
        gst_number: formData.gstNumber,
        pan_number: formData.panNumber,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pin_code: formData.pin_code,
        website: formData.website || null,
        verification_status: 'Pending',
        tnc_agreed: true,
        tnc_agreed_at: new Date().toISOString(),
        tnc_version: 'v1.0',
        revenue_share_pct: 8.00 // standard platform commission
      }]);
      if (pharmaErr) throw pharmaErr;

      // 3. Insert bank details
      const { error: bankErr } = await (supabase as any).from('pharmacy_bank_details').insert([{
        pharmacy_id: newUserId,
        account_holder_name: formData.accountHolderName || null,
        bank_name: formData.bankName || null,
        account_number: formData.accountNumber || null,
        ifsc_code: formData.ifscCode || null,
        account_type: formData.accountType || null,
        branch_name: formData.branchName || null,
        upi_id: formData.upiId || null,
        preferred_method: formData.preferredMethod,
        deduction_consent: formData.deductionConsent,
        deduction_consent_at: new Date().toISOString(),
        deduction_consent_ip: clientIp,
      }]);
      if (bankErr) throw bankErr;

      setStep('success');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0FDF4] py-10 px-4" style={{ backgroundColor: '#F0F9FF' }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <Building size={20} className="text-[#0891B2]" />
            <span className="text-sm font-semibold text-[#0891B2]">Sanjeevani Pharma Partner</span>
          </div>
          <h1 className="text-3xl font-bold text-[#1E293B]">Register your Agency/Pharmacy</h1>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center mb-10">
          {STEPS.map((s, i) => {
            const isDone = currentStepIdx > i;
            const isActive = step === s;
            return (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
                    style={{
                      background: isActive ? accentColor : isDone ? '#10B981' : '#E2EEF1',
                      color: (isActive || isDone) ? 'white' : '#94A3B8',
                      boxShadow: isActive ? `0 0 0 4px ${accentColor}22` : 'none',
                    }}
                  >
                    {isDone ? <CheckCircle2 size={16} /> : i + 1}
                  </div>
                  <span className="text-[11px] mt-1.5 font-semibold"
                    style={{ color: isActive ? accentColor : isDone ? '#10B981' : '#CBD5E1' }}>
                    {STEP_LABELS[s]}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-14 sm:w-20 h-0.5 mx-1 mb-5 transition-all duration-300"
                    style={{ background: isDone ? '#10B981' : '#E2EEF1' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* ══ STEP 1: Business Details ══════════════════════════════════════════ */}
        {step === 'business' && (
          <div className="bg-white rounded-xl shadow-sm border border-[#E2EEF1] overflow-hidden">
            <div className="h-1.5 w-full bg-[#F59E0B] opacity-18" /> {/* Jharokha arch amber 18% equivalent visual */}
            <div className="p-8 space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pharmacy / Agency Name <span className="text-red-500">*</span></label>
                  <input type="text" className="field-input mt-1" value={formData.pharmacyName} onChange={e => set('pharmacyName', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Owner / Director Name <span className="text-red-500">*</span></label>
                  <input type="text" className="field-input mt-1" value={formData.ownerName} onChange={e => set('ownerName', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pharmacy Type <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {PHARMA_TYPES.map(type => (
                    <button key={type} onClick={() => set('pharmacyType', type)}
                      className={`px-4 py-2 rounded-lg text-sm transition-all ${formData.pharmacyType === type ? 'bg-[#0891B2] text-white border-transparent' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
                      style={{ border: formData.pharmacyType === type ? 'none' : '1px solid #E2EEF1' }}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Drug License No <span className="text-red-500">*</span></label>
                  <input type="text" className="field-input mt-1 uppercase" value={formData.licenseNumber} onChange={e => set('licenseNumber', e.target.value.toUpperCase())} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">GST Number <span className="text-red-500">*</span></label>
                  <input type="text" className="field-input mt-1 uppercase" value={formData.gstNumber} onChange={e => set('gstNumber', e.target.value.toUpperCase())} maxLength={15} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">PAN Number <span className="text-red-500">*</span></label>
                  <input type="text" className="field-input mt-1 uppercase" value={formData.panNumber} onChange={e => set('panNumber', e.target.value.toUpperCase())} maxLength={10} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Email <span className="text-red-500">*</span></label>
                  <input type="email" className="field-input mt-1" value={formData.email} onChange={e => set('email', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Phone <span className="text-red-500">*</span></label>
                  <input type="tel" className="field-input mt-1" value={formData.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, ''))} maxLength={10} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Full Address <span className="text-red-500">*</span></label>
                  <input type="text" className="field-input mt-1" value={formData.address} onChange={e => set('address', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">City <span className="text-red-500">*</span></label>
                  <input type="text" className="field-input mt-1" value={formData.city} onChange={e => set('city', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State <span className="text-red-500">*</span></label>
                  <input type="text" className="field-input mt-1" value={formData.state} onChange={e => set('state', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">PIN Code <span className="text-red-500">*</span></label>
                  <input type="text" className="field-input mt-1" value={formData.pin_code} onChange={e => set('pin_code', e.target.value.replace(/\D/g, ''))} maxLength={6} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Website (Optional)</label>
                  <input type="url" className="field-input mt-1" placeholder="https://" value={formData.website} onChange={e => set('website', e.target.value)} />
                </div>
              </div>

              <hr className="border-[#E2EEF1]" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password <span className="text-red-500">*</span></label>
                  <input type="password" className="field-input mt-1" placeholder="Min 8 chars" value={formData.password} onChange={e => set('password', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm Password <span className="text-red-500">*</span></label>
                  <input type="password" className="field-input mt-1" value={formData.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button onClick={handleNextSteps}
                  className="bg-[#F59E0B] hover:bg-[#D97706] text-white px-8 py-2.5 rounded-xl font-bold transition-all inline-flex items-center gap-2">
                  Next <ArrowRight size={18} />
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ══ STEP 2: Bank Details ══════════════════════════════════════════ */}
        {step === 'bank' && (
          <div className="bg-white rounded-xl shadow-sm border border-[#E2EEF1] overflow-hidden">
            <div className="h-1.5 w-full bg-[#0891B2] opacity-18" />
            <div className="p-8 space-y-6">
              
              <div className="flex items-center gap-3 border-b border-[#E2EEF1] pb-4">
                <CreditCard size={24} className="text-[#0891B2]" />
                <h2 className="text-xl font-bold text-[#1E293B]">Payment Details</h2>
              </div>

              <div className="bg-[#FFFBEB] border border-[#FDE68A] p-4 rounded-xl flex items-start gap-3">
                <BadgeCheck className="text-[#F59E0B] shrink-0 mt-0.5" />
                <p className="text-sm text-[#92400E]">
                  Sanjeevani deducts a platform commission from your monthly revenue. 
                  These details are used exclusively for that purpose. Your data is encrypted and never shared.
                </p>
              </div>

              <div className="flex bg-[#F8FAFC] p-1 rounded-xl">
                <button onClick={() => set('preferredMethod', 'bank')} 
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${formData.preferredMethod === 'bank' ? 'bg-white shadow-sm text-[#0891B2]' : 'text-gray-500 hover:text-gray-700'}`}>
                  🏦 Bank Account
                </button>
                <button onClick={() => set('preferredMethod', 'upi')} 
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${formData.preferredMethod === 'upi' ? 'bg-white shadow-sm text-[#0891B2]' : 'text-gray-500 hover:text-gray-700'}`}>
                  📱 UPI
                </button>
              </div>

              {formData.preferredMethod === 'bank' && (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Holder Name (As per PAN) <span className="text-red-500">*</span></label>
                    <input type="text" className="field-input mt-1" value={formData.accountHolderName} onChange={e => set('accountHolderName', e.target.value.toUpperCase())} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bank Name <span className="text-red-500">*</span></label>
                    <input type="text" className="field-input mt-1" value={formData.bankName} onChange={e => set('bankName', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Account Number <span className="text-red-500">*</span></label>
                      <input type="password" placeholder="Enter account number" className="field-input mt-1 font-mono tracking-wider" value={formData.accountNumber} onChange={e => set('accountNumber', e.target.value.replace(/\D/g, ''))} />
                      {formData.accountNumber && <p className="text-xs text-gray-500 mt-1">Masked: {handleMaskAccountNumber(formData.accountNumber)}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Confirm Account Number <span className="text-red-500">*</span></label>
                      <input type="text" className="field-input mt-1 font-mono" placeholder="Re-enter account number" value={formData.confirmAccountNumber} onChange={e => set('confirmAccountNumber', e.target.value.replace(/\D/g, ''))} />
                      {formData.confirmAccountNumber && formData.accountNumber && formData.accountNumber !== formData.confirmAccountNumber && (
                        <p className="text-xs text-red-500 mt-1">Account numbers do not match</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">IFSC Code <span className="text-red-500">*</span></label>
                      <input type="text" className="field-input mt-1 uppercase" placeholder="e.g. SBIN0001234" value={formData.ifscCode} onChange={e => set('ifscCode', e.target.value.toUpperCase())} maxLength={11} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Account Type <span className="text-red-500">*</span></label>
                      <select className="field-input mt-1" value={formData.accountType} onChange={e => set('accountType', e.target.value)}>
                        <option value="">Select Account Type...</option>
                        {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Branch Name (Optional)</label>
                    <input type="text" className="field-input mt-1" value={formData.branchName} onChange={e => set('branchName', e.target.value)} />
                  </div>
                </div>
              )}

              {formData.preferredMethod === 'upi' && (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">UPI ID <span className="text-red-500">*</span></label>
                    <input type="text" className="field-input mt-1 font-mono" placeholder="e.g. agency@okicici" value={formData.upiId} onChange={e => set('upiId', e.target.value.toLowerCase())} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Registered Name on UPI <span className="text-red-500">*</span></label>
                    <input type="text" className="field-input mt-1" value={formData.upiName} onChange={e => set('upiName', e.target.value)} />
                  </div>
                </div>
              )}

              <hr className="border-[#E2EEF1]" />

              <div className="bg-[#F8FAFC] border border-[#E2EEF1] p-4 rounded-xl">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1 w-5 h-5 rounded border-gray-300 text-[#0891B2] focus:ring-[#0891B2]"
                    checked={formData.deductionConsent} onChange={e => set('deductionConsent', e.target.checked)} />
                  <span className="text-sm text-gray-700">
                    <strong>I authorise Sanjeevani Health Infrastructure Pvt. Ltd.</strong> to deduct the agreed platform commission percentage from the above account/UPI each month, based on the revenue generated through the Sanjeevani platform. This authorisation remains valid until revoked in writing.
                  </span>
                </label>
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={() => setStep('business')} className="text-gray-500 font-medium hover:text-gray-800 transition-all">
                  ← Back
                </button>
                <button onClick={handleNextSteps} disabled={!formData.deductionConsent}
                  className="bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 text-white px-8 py-2.5 rounded-xl font-bold transition-all inline-flex items-center gap-2">
                  Next <ArrowRight size={18} />
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ══ STEP 3: Terms & Conditions ════════════════════════════════════ */}
        {step === 'tnc' && (
          <div className="bg-white rounded-xl shadow-sm border border-[#E2EEF1] overflow-hidden">
            <div className="h-1.5 w-full bg-[#F59E0B] opacity-18" />
            <div className="p-8 space-y-6">
              
              <div className="flex items-center gap-3 border-b border-[#E2EEF1] pb-4">
                <FileText size={24} className="text-[#F59E0B]" />
                <h2 className="text-xl font-bold text-[#1E293B]">Revenue Sharing Agreement</h2>
              </div>

              {/* Commission Rate Badge */}
              <div className="flex items-center justify-between bg-gradient-to-r from-[#FFFBEB] to-[#FEF3C7] border border-[#FDE68A] p-6 rounded-2xl shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-[#B45309] uppercase tracking-wider mb-1">Your Commission Rate</p>
                  <p className="text-4xl font-extrabold text-[#F59E0B] mb-2 font-display">8% <span className="text-lg font-medium text-[#D97706]">of platform revenue</span></p>
                  <p className="text-sm text-[#92400E] max-w-sm">This is deducted monthly from your earnings via the Sanjeevani platform.</p>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#F8FAFC] border border-[#E2EEF1] p-3 rounded-xl text-center">
                  <p className="text-xs text-gray-500 font-medium mb-1">💊 You Earn</p>
                  <p className="font-bold text-gray-800">₹1,00,000</p>
                  <p className="text-[10px] text-gray-400">in a month</p>
                </div>
                <div className="bg-[#FEF2F2] border border-[#FECACA] p-3 rounded-xl text-center">
                  <p className="text-xs text-[#DC2626] font-medium mb-1">📊 We Deduct</p>
                  <p className="font-bold text-[#EF4444]">₹8,000 (8%)</p>
                  <p className="text-[10px] text-[#F87171]">per month</p>
                </div>
                <div className="bg-[#ECFDF5] border border-[#A7F3D0] p-3 rounded-xl text-center">
                  <p className="text-xs text-[#059669] font-medium mb-1">💰 You Keep</p>
                  <p className="font-bold text-[#10B981]">₹92,000</p>
                  <p className="text-[10px] text-[#34D399]">net earnings</p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-gray-700">Scroll to read the full agreement</span>
                  {hasScrolledToBottom && <CheckCircle2 size={16} className="text-[#10B981]" />}
                </div>
                <div 
                  className="h-64 overflow-y-auto bg-[#F8FAFC] border-2 border-[#E2EEF1] rounded-xl p-5 text-[13px] text-[#1E293B] font-mono leading-relaxed"
                  onScroll={handleTncScroll}
                  ref={scrollRef}
                >
                  <pre className="whitespace-pre-wrap font-sans">{TNC_TEXT}</pre>
                </div>
              </div>

              <div className="space-y-4">
                <label className={`flex items-start gap-3 ${!hasScrolledToBottom ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input type="checkbox" className="mt-1 w-5 h-5 rounded border-gray-300 text-[#F59E0B] focus:ring-[#F59E0B]"
                    checked={formData.tncAgreed1} onChange={e => set('tncAgreed1', e.target.checked)} disabled={!hasScrolledToBottom} />
                  <span className="text-sm text-gray-700">
                    I have read and understood the complete Revenue Sharing Agreement above. I agree to the commission rate of 8% on all platform revenue generated by my pharmacy.
                  </span>
                </label>

                <label className={`flex items-start gap-3 ${!hasScrolledToBottom ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input type="checkbox" className="mt-1 w-5 h-5 rounded border-gray-300 text-[#F59E0B] focus:ring-[#F59E0B]"
                    checked={formData.tncAgreed2} onChange={e => set('tncAgreed2', e.target.checked)} disabled={!hasScrolledToBottom} />
                  <span className="text-sm text-gray-700">
                    I confirm that I am authorised to enter into financial agreements on behalf of <strong>{formData.pharmacyName || 'this pharmacy'}</strong> and that the bank/UPI details provided are correct and belong to the registered business.
                  </span>
                </label>
              </div>

              <div className="bg-[#F8FAFC] border-t border-[#E2EEF1] -mx-8 -mb-8 px-8 py-5 mt-6 flex justify-between items-center text-xs text-gray-400">
                <p>Agreement Version: v1.0 | Your IP: {clientIp} | Timestamp: {new Date().toLocaleTimeString()}</p>
                <div className="flex gap-4">
                  <button onClick={() => setStep('bank')} className="font-medium hover:text-gray-800 transition-all">← Back</button>
                  <button onClick={handleRegister} disabled={!hasScrolledToBottom || !formData.tncAgreed1 || !formData.tncAgreed2 || isLoading}
                    className="bg-[#F59E0B] hover:bg-[#D97706] disabled:bg-gray-300 disabled:text-gray-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2">
                    {isLoading ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : 'Submit Registration'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ══ STEP 4: Submit Success ════════════════════════════════════════ */}
        {step === 'success' && (
           <div className="bg-white rounded-xl shadow-sm border border-[#E2EEF1] overflow-hidden max-w-lg mx-auto text-center p-10 relative">
            <div className="absolute top-0 inset-x-0 h-2 bg-[#F59E0B] opacity-18" />
            
            <div className="w-20 h-20 bg-[#FFFBEB] text-[#F59E0B] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-[#FDE68A]">
              <Clock size={40} />
            </div>

            <h2 className="text-2xl font-bold text-[#1E293B] mb-2">Application Submitted</h2>
            <p className="text-[#64748B] text-sm mb-6">
              Our team will verify your drug license, GST, and bank details within 2 business days. You'll receive an email at <span className="font-semibold text-gray-700">{formData.email}</span> once your account is activated.
            </p>

            <div className="bg-[#F8FAFC] rounded-xl p-5 text-left mb-6 border border-[#E2EEF1]">
              <p className="font-semibold text-sm mb-3 text-gray-800">What happens next?</p>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex gap-3"><div className="w-5 h-5 rounded-full bg-[#0891B2] text-white flex items-center justify-center text-xs shrink-0">1</div> Document verification (1-2 days)</div>
                <div className="flex gap-3"><div className="w-5 h-5 rounded-full bg-[#0891B2] text-white flex items-center justify-center text-xs shrink-0">2</div> Bank details verification (1 day)</div>
                <div className="flex gap-3"><div className="w-5 h-5 rounded-full bg-[#0891B2] text-white flex items-center justify-center text-xs shrink-0">3</div> Account activation + first login</div>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-sm text-[#B45309] font-mono mb-6 shadow-sm">
              Reg ID: {userId || 'N/A'}
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={() => window.print()} className="w-full border-2 border-[#F59E0B] text-[#D97706] font-bold py-2.5 rounded-xl hover:bg-[#FFFBEB] transition-all flex justify-center items-center gap-2">
                <Download size={18} /> Download Confirmation
              </button>
              <button onClick={() => navigate('/')} className="text-sm font-medium text-gray-500 hover:text-gray-800">
                Return to Home
              </button>
            </div>
           </div>
        )}

      </div>
    </div>
  );
};

export default PharmaRegistration;
