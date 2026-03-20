import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, Mail, Phone, X } from 'lucide-react';

interface OTPVerificationModalProps {
  type: 'email' | 'phone';
  target: string; // email address or phone number
  onVerify: (token: string) => Promise<void>;
  onResend: () => Promise<void>;
  onSkip?: () => void; // optional skip for phone if Twilio not configured
  onClose?: () => void; // optional close button handler
}

const OTPVerificationModal = ({ type, target, onVerify, onResend, onSkip, onClose }: OTPVerificationModalProps) => {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(type === 'email' ? 60 : 90);
  const [canResend, setCanResend] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    text.split('').forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    const nextIndex = Math.min(text.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async () => {
    const token = otp.join('');
    if (token.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    setIsVerifying(true);
    setError('');
    try {
      await onVerify(token);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired code. Try again.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      await onResend();
      setCountdown(type === 'email' ? 60 : 90);
      setCanResend(false);
      setOtp(Array(6).fill(''));
      setError('');
      inputRefs.current[0]?.focus();
    } catch {}
  };

  const Icon = type === 'email' ? Mail : Phone;
  const maskedTarget = type === 'email'
    ? target.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    : `+91 XXXXXX${target.slice(-4)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-fade-up overflow-hidden relative">
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {/* Element 8 — Jharokha arch at top of modal */}
        <svg width="100%" height="20" viewBox="0 0 400 20" preserveAspectRatio="none">
          <rect x="8" y="4" width="3" height="16" rx="1" fill="#E8A820" fillOpacity="0.2"/>
          <rect x="389" y="4" width="3" height="16" rx="1" fill="#E8A820" fillOpacity="0.2"/>
          <path d="M50 20 Q120 20 160 6 Q190 0 200 0 Q210 0 240 6 Q280 20 350 20" fill="none" stroke="#E8A820" strokeOpacity="0.2" strokeWidth="1.5"/>
        </svg>

        {/* Inner dashed amber frame */}
        <div className="mx-3 mb-3 p-5 rounded-lg" style={{ border: '1px dashed rgba(232,168,32,0.4)', margin: '0 12px 12px' }}>
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(var(--gold) / 0.15), hsl(var(--teal) / 0.15))' }}>
              <Icon className="w-8 h-8 text-gold" />
            </div>
          </div>

        <h2 className="font-heading text-2xl font-bold text-center text-foreground mb-2">
          {type === 'email' ? 'Verify Your Email' : 'Verify Your Mobile Number'}
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-8">
          A 6-digit code has been sent to{' '}
          <span className="font-medium text-foreground">{maskedTarget}</span>
        </p>

        {/* OTP Inputs */}
        <div className={`flex justify-center gap-3 mb-6 ${shake ? 'otp-shake' : ''}`} onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`w-12 h-14 text-center text-xl font-bold rounded-lg border-2 transition-all focus:outline-none ${
                error
                  ? 'border-destructive bg-destructive/5'
                  : digit
                  ? 'border-gold bg-gold/5 text-foreground'
                  : 'border-border bg-background text-foreground focus:border-gold focus:ring-2 focus:ring-gold/20'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-destructive text-sm text-center mb-4 font-medium">{error}</p>
        )}

        {/* Verify button */}
        <button
          onClick={handleVerify}
          disabled={isVerifying || otp.join('').length !== 6}
          className="btn-primary w-full mb-4"
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
            </>
          ) : (
            'Verify Code'
          )}
        </button>

        {/* Resend */}
        <div className="text-center">
          {canResend ? (
            <button onClick={handleResend} className="text-sm text-gold hover:text-gold/80 font-medium">
              Resend Code
            </button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Resend code in <span className="font-medium text-foreground">{countdown}s</span>
            </p>
          )}
        </div>

        {/* Skip phone verification if Twilio not set up */}
        {type === 'phone' && onSkip && (
          <div className="mt-4 pt-4 border-t border-border text-center">
            <button onClick={onSkip} className="text-xs text-muted-foreground hover:text-foreground">
              Skip phone verification (proceed without SMS)
            </button>
          </div>
        )}
        </div>{/* close inner dashed frame */}
      </div>
    </div>
  );
};

export default OTPVerificationModal;
