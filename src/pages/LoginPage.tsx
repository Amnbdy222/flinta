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

  // Smart OTP input change handler (supports typing single digit & full 6-digit paste / SMS auto-fill)
  const handleOtpChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '');

    // Handle full 6-digit paste or SMS auto-fill into any box
    if (cleaned.length > 1) {
      const digits = cleaned.slice(0, 6).split('');
      const newOtp = [...otpCode];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = digits[i] || '';
      }
      setOtpCode(newOtp);
      const nextFocus = Math.min(cleaned.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    // Single digit entry
    const newOtp = [...otpCode];
    newOtp[index] = cleaned;
    setOtpCode(newOtp);

    // Auto-advance focus to next box
    if (cleaned && index < 5) {
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
      const digits = pasted.split('');
      const newOtp = [...otpCode];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = digits[i] || '';
      }
      setOtpCode(newOtp);
      const nextFocus = Math.min(pasted.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-16 sm:pt-24 md:pt-28 pb-16 md:pb-24 text-[#0A0A0A]">
      <div className="container-editorial max-w-4xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 bg-white hairline-all shadow-2xl overflow-hidden rounded-none sm:rounded-sm">
          {/* LEFT EDITORIAL IMAGE PANEL (VISIBLE ON BOTH MOBILE AND DESKTOP) */}
          <div className="col-span-1 md:col-span-5 relative bg-[#0A0A0A] overflow-hidden select-none h-40 xs:h-48 md:h-auto">
            <img
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop"
              alt="FLINT Editorial"
              className="w-full h-full object-cover opacity-85 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent flex flex-col justify-between p-5 sm:p-7 text-[#FAF9F6]">
              <div className="flex items-center space-x-2">
                <img src="/flintlogo_white.png" alt="FLINT A" className="h-5 sm:h-6 w-auto object-contain shrink-0" />
                <span className="font-brand text-base sm:text-lg font-bold tracking-[0.25em] uppercase">
                  FLINT A
                </span>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <span className="text-[0.6rem] sm:text-[0.65rem] tracking-[0.3em] font-medium uppercase text-[#D4D0C7] block">
                  MAISON MEMBERSHIP
                </span>
                <h3 className="font-editorial text-lg sm:text-2xl font-light uppercase leading-snug tracking-tight">
                  CURATED ARCHIVES & PERSONALIZED CHECKOUT
                </h3>
              </div>
            </div>
          </div>

          {/* RIGHT FORM CONTAINER */}
          <div className="col-span-1 md:col-span-7 p-6 sm:p-8 md:p-10 flex flex-col justify-between bg-[#FAF9F6]">
            {/* HEADER */}
            <div className="space-y-2 pb-4 hairline-b">
              <span className="editorial-subtitle block">CLIENT ACCESS</span>
              <h1 className="font-editorial text-2xl sm:text-3xl md:text-4xl font-light uppercase tracking-tight">
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
              <div className="my-3 bg-red-50 text-red-900 border border-red-900/20 p-3 sm:p-4 text-xs flex items-start space-x-2 sm:space-x-3 animate-fade-in">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="my-3 bg-emerald-50 text-emerald-900 border border-emerald-900/20 p-3 sm:p-4 text-xs flex items-start space-x-2 sm:space-x-3 animate-fade-in">
                <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* STEP 1: EMAIL INPUT */}
            {step === 'email' && (
              <form onSubmit={handleSendOtp} className="space-y-5 my-4 animate-fade-in">
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
                      className="w-full bg-white border border-[#0A0A0A]/20 px-4 py-3 text-xs tracking-wider text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                    />
                    <Mail size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#736E65]" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-editorial-primary w-full py-4 text-xs tracking-[0.25em] flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
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
              <form onSubmit={handleVerifyOtp} className="space-y-6 my-4 animate-fade-in">
                {/* OTP Input Boxes (Supports 1-tap full 6-digit paste / SMS auto-fill) */}
                <div className="flex justify-center space-x-2 sm:space-x-3" onPaste={handleOtpPaste}>
                  {otpCode.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpInputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={handleOtpPaste}
                      className="w-11 h-14 sm:w-12 sm:h-16 text-center text-lg sm:text-xl font-semibold tracking-widest bg-white border border-[#0A0A0A]/20 focus:border-[#0A0A0A] focus:outline-none transition-colors"
                      autoComplete="one-time-code"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || otpCode.join('').length !== 6}
                  className="btn-editorial-primary w-full py-4 text-xs tracking-[0.25em] flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
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
                    className="flex items-center space-x-1.5 text-[#736E65] hover:text-[#0A0A0A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
                    className="link-underline font-medium text-[#0A0A0A] tracking-wider uppercase text-[0.7rem] cursor-pointer"
                  >
                    CHANGE EMAIL
                  </button>
                </div>
              </form>
            )}

            {/* FOOTER */}
            {step === 'email' && (
              <div className="pt-4 hairline-t border-t border-[#0A0A0A]/10 text-center text-xs space-y-2">
                <p className="text-[#736E65] font-light">NEW HERE? JUST ENTER YOUR EMAIL ABOVE.</p>
                <p className="text-[#A39E93] font-light text-[0.65rem]">
                  We'll create your account automatically when you verify the code.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
