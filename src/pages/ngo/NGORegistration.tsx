import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Heart, ArrowLeft, ArrowRight, ShieldCheck, Loader2, CheckCircle2, Globe, MapPin, FileText } from 'lucide-react';
import JharokhaArch from '@/components/admin/JharokhaArch';

const NGORegistration = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    ngoName: '',
    registrationNo: '',
    email: '',
    password: '',
    website: '',
    location: '',
    focusArea: 'General Health',
    description: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async () => {
    if (!formData.email || !formData.password || !formData.ngoName) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Sign up user in Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { role: 'ngo', full_name: formData.ngoName }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Create NGO Profile
        const { error: profileError } = await supabase.from('ngo_profiles').insert({
          user_id: authData.user.id,
          ngo_name: formData.ngoName,
          registration_no: formData.registrationNo,
          website: formData.website,
          location: formData.location,
          focus_area: formData.focusArea,
          description: formData.description
        });

        if (profileError) throw profileError;
        setIsSuccess(true);
      }
    } catch (e: any) {
      toast.error(e.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden text-center p-10 animate-fade-up">
           <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} className="text-emerald-500" />
           </div>
           <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration Submitted!</h2>
           <p className="text-slate-500 text-sm mb-8">
             Thank you for partnering with Sanjeevani. Our team will verify your NGO credentials and get back to you within 24-48 hours.
           </p>
           <button onClick={() => navigate('/login?role=ngo')} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all">
             Back to Login
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {/* Left Panel - Branding */}
      <div className="lg:w-1/3 bg-rose-600 p-12 text-white flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 jaali-pattern opacity-10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
              <Heart size={24} />
            </div>
            <span className="text-2xl font-bold tracking-tight">Sanjeevani <span className="font-light">Impact</span></span>
          </div>
          
          <h1 className="text-4xl font-bold mb-6 leading-tight">Join the Health Safety Net.</h1>
          <p className="text-rose-100 text-lg mb-8 leading-relaxed">
            Partner with India's most transparent medical sponsorship platform and help patients get the care they deserve.
          </p>

          <div className="space-y-6">
            <ImpactPoint icon={<ShieldCheck />} text="Verified NGO Status" />
            <ImpactPoint icon={<Globe />} text="Nationwide Reach" />
            <ImpactPoint icon={<FileText />} text="Transparent Reporting" />
          </div>
        </div>

        <div className="relative z-10 text-rose-200 text-sm italic">
          "Technology meets Compassion."
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="max-w-xl w-full">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-rose-600 transition-colors mb-8 text-sm font-medium">
            <ArrowLeft size={16} /> Back
          </button>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <JharokhaArch color="#E11D48" />
            <div className="p-8 lg:p-10">
              <div className="mb-8">
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-[0.2em]">Step {step} of 2</span>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">
                  {step === 1 ? 'NGO Basic Details' : 'Account Credentials'}
                </h2>
              </div>

              {step === 1 ? (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">NGO Name *</label>
                    <input name="ngoName" value={formData.ngoName} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all" placeholder="Enter NGO name" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Registration No. *</label>
                      <input name="registrationNo" value={formData.registrationNo} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all" placeholder="e.g. 1234/2026" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Focus Area</label>
                      <select name="focusArea" value={formData.focusArea} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all">
                        <option>General Health</option>
                        <option>Cancer Care</option>
                        <option>Child Health</option>
                        <option>Rural Healthcare</option>
                        <option>Disability Support</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Location / City *</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input name="location" value={formData.location} onChange={handleChange} className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all" placeholder="e.g. Mumbai, Maharashtra" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Website (Optional)</label>
                    <input name="website" value={formData.website} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all" placeholder="https://www.ngo.org" />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Official Email *</label>
                    <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all" placeholder="contact@ngo.org" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Create Password *</label>
                    <input name="password" type="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all" placeholder="Min. 8 characters" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Brief Mission Statement</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all h-24" placeholder="How do you plan to use Sanjeevani for impact?" />
                  </div>
                </div>
              )}

              <div className="mt-10 flex gap-4">
                {step === 2 && (
                  <button onClick={() => setStep(1)} className="flex-1 py-4 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all">
                    Back
                  </button>
                )}
                <button 
                  onClick={step === 1 ? () => setStep(2) : handleRegister}
                  disabled={isLoading}
                  className="flex-[2] py-4 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-900/10"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                      {step === 1 ? 'Continue' : 'Submit Application'}
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ImpactPoint = ({ icon, text }: { icon: any, text: string }) => (
  <div className="flex items-center gap-4 group">
    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
      {icon}
    </div>
    <span className="font-medium">{text}</span>
  </div>
);

export default NGORegistration;
