import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ArrowRight, Mail, Shield, RotateCw, CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

type OtpStep = 'email' | 'verify';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<OtpStep>('email');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { sendOtp, verifyOtp, resendOtp } = useAuth();
  const { refreshCart } = useCart();
  const { refreshWishlist } = useWishlist();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Auto-focus first OTP input when entering verify step
  useEffect(() => {
    if (step === 'verify') {
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !/\S+@\S+\.\S+/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendOtp(cleanEmail);
      setStep('verify');
      setCooldown(60);
      setSuccessMsg('A 6-digit code has been sent to your email.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const code = otpCode.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyOtp(email.trim(), code);
      await Promise.all([refreshCart(), refreshWishlist()]);
      navigate(redirectPath, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid code. Please try again.';
      setError(msg);
      setOtpCode(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError(null);
    setSuccessMsg(null);

    try {
      await resendOtp(email.trim());
      setCooldown(60);
      setOtpCode(['', '', '', '', '', '']);
      setSuccessMsg('A new code has been sent to your email.');
      otpInputRefs.current[0]?.focus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend code.';
      setError(msg);
    }
  };

  // OTP input handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1); // single digit
    setOtpCode(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newOtp = [...otpCode];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pasted[i] || '';
      }
      setOtpCode(newOtp);
      const nextEmpty = newOtp.findIndex((d) => !d);
      otpInputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-24 sm:pt-28 md:pt-32 pb-16 md:pb-24 text-[#0A0A0A]">
      <div className="container-editorial max-w-sm sm:max-w-md mx-auto space-y-8 sm:space-y-10 px-4 sm:px-0">
        {/* HEADER */}
        <div className="text-center space-y-3 sm:space-y-4 pb-6 sm:pb-8 hairline-b">
          <span className="editorial-subtitle block">CLIENT ACCESS</span>
          <h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-light uppercase tracking-tight">
            {step === 'email' ? 'SIGN IN TO FLINT' : 'ENTER CODE'}
          </h1>
          <p className="text-xs text-[#736E65] font-light leading-relaxed">
            {step === 'email'
              ? 'Enter your email to receive a secure one-time login code.'
              : (
                <>
                  We sent a 6-digit code to{' '}
                  <span className="font-medium text-[#0A0A0A]">{email}</span>
                </>
              )}
          </p>
        </div>

        {/* NOTIFICATIONS */}
        {error && (
          <div className="bg-red-50 text-red-900 border border-red-900/20 p-3 sm:p-4 text-xs flex items-start space-x-2 sm:space-x-3 animate-fade-in">
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 text-emerald-900 border border-emerald-900/20 p-3 sm:p-4 text-xs flex items-start space-x-2 sm:space-x-3 animate-fade-in">
            <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: EMAIL INPUT */}
        {step === 'email' && (
          <form onSubmit={handleSendOtp} className="space-y-5 sm:space-y-6 animate-fade-in">
            <div className="space-y-1.5">
              <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">EMAIL ADDRESS *</label>
              <div className="relative">
                <input
                  type="email"
                  inputMode="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. client@domain.com"
                  className="w-full bg-transparent border border-[#0A0A0A]/20 px-4 py-3 text-xs tracking-wider text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                />
                <Mail size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#736E65]" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-editorial-primary w-full py-4 text-xs tracking-[0.25em] flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'SENDING CODE...' : 'SEND LOGIN CODE'}</span>
              {!isSubmitting && <ArrowRight size={14} />}
            </button>

            <div className="flex items-center space-x-2 justify-center text-[0.65rem] text-[#736E65]">
              <Shield size={12} />
              <span>Passwordless · Secure · No password needed</span>
            </div>
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 'verify' && (
          <form onSubmit={handleVerifyOtp} className="space-y-6 sm:space-y-8 animate-fade-in">
            {/* OTP Input Boxes */}
            <div className="flex justify-center space-x-2 sm:space-x-3" onPaste={handleOtpPaste}>
              {otpCode.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpInputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-11 h-14 sm:w-12 sm:h-16 text-center text-lg sm:text-xl font-semibold tracking-widest bg-white border border-[#0A0A0A]/20 focus:border-[#0A0A0A] focus:outline-none transition-colors"
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || otpCode.join('').length !== 6}
              className="btn-editorial-primary w-full py-4 text-xs tracking-[0.25em] flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'VERIFYING...' : 'VERIFY & SIGN IN'}</span>
              {!isSubmitting && <ArrowRight size={14} />}
            </button>

            {/* Resend + Change Email */}
            <div className="flex flex-col items-center space-y-3 text-xs">
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0}
                className="flex items-center space-x-1.5 text-[#736E65] hover:text-[#0A0A0A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <RotateCw size={12} />
                <span>
                  {cooldown > 0
                    ? `RESEND CODE IN ${cooldown}s`
                    : 'RESEND CODE'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setOtpCode(['', '', '', '', '', '']);
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="link-underline font-medium text-[#0A0A0A] tracking-wider uppercase text-[0.7rem]"
              >
                CHANGE EMAIL
              </button>
            </div>
          </form>
        )}

        {/* FOOTER */}
        {step === 'email' && (
          <div className="pt-4 sm:pt-6 hairline-t text-center text-xs space-y-2 sm:space-y-3">
            <p className="text-[#736E65] font-light">NEW HERE? JUST ENTER YOUR EMAIL ABOVE.</p>
            <p className="text-[#A39E93] font-light text-[0.65rem]">
              We'll create your account automatically when you verify the code.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
