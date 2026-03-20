import RegistrationSidebar from '@/components/registration/RegistrationSidebar';
import ProgressBar from '@/components/registration/ProgressBar';
import StepBasicInfo from '@/components/registration/StepBasicInfo';
import StepLocation from '@/components/registration/StepLocation';
import StepInfrastructure from '@/components/registration/StepInfrastructure';
import StepSpecializations from '@/components/registration/StepSpecializations';
import StepAdminAccount from '@/components/registration/StepAdminAccount';
import SuccessScreen from '@/components/registration/SuccessScreen';
import JharokhaFrame from '@/components/registration/JharokhaFrame';
import { useRegistrationForm } from '@/hooks/useRegistrationForm';

import { STEPS } from '@/types/registration';
import { ArrowLeft, ArrowRight, Send, Loader2 } from 'lucide-react';
import sanjeevaniLogo from '@/assets/sanjeevani-logo.png';

const HospitalRegistration = () => {
  const {
    step, formData, errors, phase, hospitalId, isSubmitting,
    licenseIdStatus, adminEmailStatus,
    updateForm, next, back, submit,
    checkLicenseId, checkAdminEmail,
  } = useRegistrationForm();

  const renderStep = () => {
    switch (step) {
      case 1: return <StepBasicInfo data={formData} onChange={updateForm} errors={errors} licenseIdStatus={licenseIdStatus} onCheckLicenseId={checkLicenseId} />;
      case 2: return <StepLocation data={formData} onChange={updateForm} errors={errors} />;
      case 3: return <StepInfrastructure data={formData} onChange={updateForm} errors={errors} />;
      case 4: return <StepSpecializations data={formData} onChange={updateForm} errors={errors} />;
      case 5: return <StepAdminAccount data={formData} onChange={updateForm} errors={errors} adminEmailStatus={adminEmailStatus} onCheckAdminEmail={checkAdminEmail} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex">
      <RegistrationSidebar currentStep={step} />

      <main className="flex-1 lg:ml-80 pt-[4px]">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 p-4 border-b border-border bg-primary text-primary-foreground">
          <img src={sanjeevaniLogo} alt="Sanjeevani" className="w-10 h-10 rounded-lg" />
          <div>
            <h1 className="font-heading text-lg font-bold">Sanjeevani</h1>
            <p className="text-xs opacity-70">Hospital Registration</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {phase === 'success' ? (
            <SuccessScreen hospitalId={hospitalId} formData={formData} />
          ) : phase === 'submitting' ? (
            <div className="step-card flex flex-col items-center justify-center py-20 animate-fade-up">
              <Loader2 className="w-12 h-12 animate-spin text-gold mb-4" />
              <p className="font-heading text-lg text-foreground">Registering your hospital...</p>
              <p className="text-sm text-muted-foreground mt-1">Uploading documents and saving records</p>
            </div>
          ) : (
            <>
              <div className="mb-2 animate-fade-up">
                <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                  Register Your Hospital
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Join India's emergency health network. Fill in your hospital details below.
                </p>
              </div>

              <ProgressBar currentStep={step} />

              <JharokhaFrame>
                <form onSubmit={(e) => e.preventDefault()}>
                  {renderStep()}

                  <div className="flex items-center justify-between mt-6 pb-8">
                    {step > 1 ? (
                      <button type="button" onClick={back} className="btn-outline">
                        <ArrowLeft className="w-4 h-4" /> Back
                      </button>
                    ) : (
                      <div />
                    )}

                    {step < STEPS.length ? (
                      <button type="button" onClick={next} className="btn-primary">
                        Next <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={submit}
                        disabled={isSubmitting}
                        className="btn-secondary"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Creating Account...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" /> Submit Registration
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </form>
              </JharokhaFrame>
            </>
          )}
        </div>

        <footer className="text-center py-6 border-t border-border">
          <p className="font-heading italic text-sm text-muted-foreground">
            "Powered by <span className="text-gold">Sanjeevani</span>"
          </p>
          <p className="text-xs text-muted-foreground/60 mt-0.5 tracking-widest">
            BUILDING INDIA'S EMERGENCY HEALTH BACKBONE
          </p>
        </footer>
      </main>

    </div>
  );
};

export default HospitalRegistration;
