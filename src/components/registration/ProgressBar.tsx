import { STEPS } from '@/types/registration';
import { Check } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
}

const ProgressBar = ({ currentStep }: ProgressBarProps) => {
  return (
    <div className="mb-8">
      {/* Mobile step strip */}
      <div className="flex lg:hidden items-center justify-between mb-4">
        {STEPS.map((step, i) => {
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;
          return (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <span
                  className={`flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold mb-1 transition-all ${
                    isCompleted
                      ? 'bg-gold text-gold-foreground'
                      : isActive
                      ? 'bg-gold text-gold-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                  style={(isCompleted || isActive) ? {
                    boxShadow: '0 0 10px hsl(var(--gold) / 0.3)'
                  } : undefined}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.number}
                </span>
                <span className={`text-[10px] text-center font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.title}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-full mx-1 rounded-full mb-4 ${
                  currentStep > step.number ? 'bg-gold' : 'bg-muted'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop connected arch progress */}
      <div className="hidden lg:block">
        <div className="flex items-center gap-1">
          {STEPS.map((step, i) => (
            <div key={step.number} className="flex items-center flex-1">
              <div
                className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                  currentStep > step.number
                    ? 'bg-gradient-to-r from-gold to-gold'
                    : currentStep === step.number
                    ? 'bg-gradient-to-r from-gold to-gold/30'
                    : 'bg-muted'
                }`}
              />
              {i < STEPS.length - 1 && (
                <div className={`w-2 h-2 rounded-full mx-0.5 shrink-0 ${
                  currentStep > step.number ? 'bg-gold' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2.5 tracking-wide">
          Step {currentStep} of {STEPS.length} — <span className="font-medium text-foreground">{STEPS[currentStep - 1].description}</span>
        </p>
      </div>
    </div>
  );
};

export default ProgressBar;
