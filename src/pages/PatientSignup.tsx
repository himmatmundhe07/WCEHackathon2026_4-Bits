import { ArrowLeft, ArrowRight, Loader2, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PatientSignupSidebar from '@/components/patient/PatientSignupSidebar';
import PatientSuccessScreen from '@/components/patient/PatientSuccessScreen';
import StepPersonalDetails from '@/components/patient/StepPersonalDetails';
import StepContactLocation from '@/components/patient/StepContactLocation';
import StepEmergencyContact from '@/components/patient/StepEmergencyContact';
import StepMedicalProfile from '@/components/patient/StepMedicalProfile';
import StepAccountSetup from '@/components/patient/StepAccountSetup';
import JharokhaFrame from '@/components/registration/JharokhaFrame';
import GlobalLanguageSwitcher from '@/components/GlobalLanguageSwitcher';
import { usePatientSignupForm } from '@/hooks/usePatientSignupForm';
import { PATIENT_STEPS } from '@/types/patient';

const PatientSignup = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    step, formData, errors, phase, patientId, isSubmitting,
    emailStatus, aadhaarStatus,
    updateForm, next, back, skipStep, submit,
    checkEmail, checkAadhaar,
  } = usePatientSignupForm();

  const renderStep = () => {
    switch (step) {
      case 1: return <StepPersonalDetails data={formData} onChange={updateForm} errors={errors} aadhaarStatus={aadhaarStatus} onCheckAadhaar={checkAadhaar} />;
      case 2: return <StepContactLocation data={formData} onChange={updateForm} errors={errors} />;
      case 3: return <StepEmergencyContact data={formData} onChange={updateForm} errors={errors} />;
      case 4: return <StepMedicalProfile data={formData} onChange={updateForm} errors={errors} />;
      case 5: return <StepAccountSetup data={formData} onChange={updateForm} errors={errors} emailStatus={emailStatus} onCheckEmail={checkEmail} />;
      default: return null;
    }
  };

  if (phase === 'success') {
    return <PatientSuccessScreen patientId={patientId} email={formData.email} />;
  }

  const canSkip = step >= 2 && step <= 4;
  const progressPercent = (step / PATIENT_STEPS.length) * 100;

  return (
    <div className="min-h-screen flex" style={{ background: '#F7FBFC' }}>
      <PatientSignupSidebar currentStep={step} />

      <main className="flex-1 lg:ml-[280px]">
        {/* Mobile top banner */}
        <div className="lg:hidden px-4 py-3 flex items-center justify-between" style={{ background: '#EBF7FA' }}>
          <div>
            <p className="text-xs font-medium" style={{ color: '#0891B2' }}>
              {t('signup.stepOf', { current: step, total: PATIENT_STEPS.length })} — {PATIENT_STEPS[step - 1].title}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <GlobalLanguageSwitcher />
            <button onClick={() => navigate('/')} className="text-xs" style={{ color: '#64748B' }}>{t('signup.home')}</button>
          </div>
        </div>
        {/* Mobile progress bar */}
        <div className="lg:hidden h-1" style={{ background: '#E2EEF1' }}>
          <div className="h-full transition-all duration-300" style={{ width: `${progressPercent}%`, background: '#0891B2' }} />
        </div>

        <div className="max-w-[640px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Form card */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: '#E2EEF1', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            {/* Jharokha arch */}
            <svg width="100%" height="18" viewBox="0 0 400 18" preserveAspectRatio="none" className="block">
              <rect x="8" y="3" width="3" height="15" rx="1" fill="#0891B2" fillOpacity="0.18" />
              <rect x="389" y="3" width="3" height="15" rx="1" fill="#0891B2" fillOpacity="0.18" />
              <path d="M50 18 Q120 18 160 6 Q190 0 200 0 Q210 0 240 6 Q280 18 350 18" fill="none" stroke="#0891B2" strokeOpacity="0.18" strokeWidth="1.5" />
              <circle cx="170" cy="4" r="1.5" fill="#0891B2" fillOpacity="0.14" />
              <circle cx="200" cy="1.5" r="1.5" fill="#0891B2" fillOpacity="0.14" />
              <circle cx="230" cy="4" r="1.5" fill="#0891B2" fillOpacity="0.14" />
            </svg>

            {/* Progress bar */}
            <div className="hidden lg:block h-1" style={{ background: '#E2EEF1' }}>
              <div className="h-full transition-all duration-300" style={{ width: `${progressPercent}%`, background: '#0891B2' }} />
            </div>

            <div className="p-6 sm:p-8">
              {/* Skip link */}
              {canSkip && (
                <div className="flex justify-end mb-2">
                  <button type="button" onClick={skipStep} className="text-xs font-medium hover:underline" style={{ color: '#94A3B8' }}>
                    {t('signup.skipForNow')}
                  </button>
                </div>
              )}

              <form onSubmit={(e) => e.preventDefault()}>
                {renderStep()}

                <div className="flex items-center justify-between mt-8">
                  {step > 1 ? (
                    <button type="button" onClick={back}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border transition-all hover:opacity-80"
                      style={{ borderColor: '#E2EEF1', color: '#64748B', background: 'white' }}>
                      <ArrowLeft className="w-4 h-4" /> {t('signup.back')}
                    </button>
                  ) : (
                    <button type="button" onClick={() => navigate('/')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border transition-all hover:opacity-80"
                      style={{ borderColor: '#E2EEF1', color: '#64748B', background: 'white' }}>
                      <ArrowLeft className="w-4 h-4" /> {t('signup.goHome')}
                    </button>
                  )}

                  {step < PATIENT_STEPS.length ? (
                    <button type="button" onClick={next}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                      style={{ background: '#0891B2' }}>
                      {t('signup.continue')} <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button type="button" onClick={submit} disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ background: '#0891B2' }}>
                      {isSubmitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> {t('signup.creating')}</>
                      ) : (
                        <><UserPlus className="w-4 h-4" /> {t('signup.createProfile')}</>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Bottom link */}
          <p className="text-center text-sm mt-6" style={{ color: '#64748B', fontFamily: 'Inter, sans-serif' }}>
            {t('signup.alreadyHaveAccount')}{' '}
            <button onClick={() => navigate('/patient/login')} className="font-medium hover:underline" style={{ color: '#0891B2' }}>
              {t('signup.logIn')}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};

export default PatientSignup;
