import React, { useState, useEffect, useRef } from 'react';
import { useAuthModal } from '../context/AuthModalContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { X, Mail, ArrowRight, Loader2, AlertCircle, CheckCircle2, Shield, RotateCw } from 'lucide-react';

type OtpStep = 'email' | 'verify';

export const AuthModal: React.FC = () => {
  const {
    isOpen,
    title: customTitle,
    subtitle: customSubtitle,
    showGuestOption,
    closeAuthModal,
    onSuccessCallback,
  } = useAuthModal();

  const { sendOtp, verifyOtp, resendOtp } = useAuth();
  const { refreshCart } = useCart();
  const { refreshWishlist } = useWishlist();

  // Form State
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<OtpStep>('email');

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
      setEmail('');
      setOtpCode(['', '', '', '', '', '']);
      setStep('email');
      setCooldown(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) closeAuthModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeAuthModal]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Auto-focus first OTP input
  useEffect(() => {
    if (step === 'verify' && isOpen) {
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    }
  }, [step, isOpen]);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !/\S+@\S+\.\S+/.test(cleanEmail)) {
      setError('PLEASE ENTER A VALID EMAIL ADDRESS');
      return;
    }

    setLoading(true);
    try {
      await sendOtp(cleanEmail);
      setStep('verify');
      setCooldown(60);
      setSuccessMsg('A 6-DIGIT CODE HAS BEEN SENT TO YOUR EMAIL');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send code.';
      setError(msg.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const code = otpCode.join('');
    if (code.length !== 6) {
      setError('PLEASE ENTER THE COMPLETE 6-DIGIT CODE');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(email.trim(), code);
      await Promise.all([refreshCart(), refreshWishlist()]);
      setLoading(false);
      closeAuthModal();
      if (onSuccessCallback) onSuccessCallback();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid code.';
      setError(msg.toUpperCase());
      setOtpCode(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
      setLoading(false);
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
      setSuccessMsg('A NEW CODE HAS BEEN SENT');
      otpInputRefs.current[0]?.focus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend code.';
      setError(msg.toUpperCase());
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* GLASSMORPHISM BACKDROP WITH EDITORIAL BACKGROUND IMAGE ON MOBILE & DESKTOP */}
      <div
        className="fixed inset-0 bg-[#0A0A0A]/60 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={closeAuthModal}
        aria-hidden="true"
      />

      {/* MODAL CARD */}
      <div className="relative w-full max-w-4xl bg-[#FAF9F6] border border-[#0A0A0A]/15 shadow-2xl z-10 overflow-hidden animate-fade-in my-auto rounded-none sm:rounded-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
          {/* EDITORIAL IMAGE PANEL (VISIBLE ON BOTH MOBILE AND DESKTOP) */}
          <div className="col-span-1 md:col-span-5 relative bg-[#0A0A0A] overflow-hidden select-none h-36 xs:h-44 md:h-auto">
            <img
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop"
              alt="FLINT Editorial"
              className="w-full h-full object-cover opacity-85 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent flex flex-col justify-between p-4 sm:p-6 text-[#FAF9F6]">
              <div className="flex items-center space-x-2">
                <img src="/image.png" alt="FLINT A" className="h-6 sm:h-7 w-auto object-contain shrink-0 rounded-full" />
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
          <div className="col-span-1 md:col-span-7 p-5 sm:p-8 md:p-10 flex flex-col justify-between relative bg-[#FAF9F6]">
            {/* CLOSE BUTTON */}
            <button
              type="button"
              onClick={closeAuthModal}
              className="absolute top-3 right-3 sm:top-5 sm:right-5 p-1.5 text-[#736E65] hover:text-[#0A0A0A] transition-colors focus:outline-none cursor-pointer z-20"
              aria-label="Close authentication modal"
            >
              <X size={20} strokeWidth={1.5} />
            </button>

            {/* HEADER AREA */}
            <div className="space-y-1.5 sm:space-y-2">
              <span className="text-[0.6rem] sm:text-[0.65rem] font-medium tracking-[0.3em] uppercase text-[#736E65]">
                {customSubtitle || 'SECURE LOGIN'}
              </span>
              <h2 className="font-editorial text-xl sm:text-3xl font-light uppercase tracking-tight text-[#0A0A0A]">
                {customTitle || (step === 'email' ? 'CLIENT PORTAL ACCESS' : 'ENTER YOUR CODE')}
              </h2>
              <p className="text-xs text-[#736E65] font-light leading-relaxed">
                {step === 'email'
                  ? 'Enter your email to receive a secure one-time login code.'
                  : `We sent a 6-digit code to ${email}`}
              </p>
            </div>

            {/* ERROR / SUCCESS BANNERS */}
            {error && (
              <div className="my-3 p-3 bg-red-50 border border-red-900/20 text-red-900 text-xs flex items-start space-x-2 animate-fade-in">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-800" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="my-3 p-3 bg-emerald-50 border border-emerald-900/20 text-emerald-900 text-xs flex items-start space-x-2 animate-fade-in">
                <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-800" />
                <span className="font-medium">{successMsg}</span>
              </div>
            )}

            {/* STEP 1: EMAIL */}
            {step === 'email' && (
              <form onSubmit={handleSendOtp} className="space-y-4 my-3 sm:my-4">
                <div className="space-y-1">
                  <label className="text-[0.65rem] font-medium tracking-[0.2em] text-[#736E65] uppercase block">
                    EMAIL ADDRESS *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. client@domain.com"
                      required
                      className="w-full bg-white border border-[#0A0A0A]/20 px-3.5 py-3 text-xs text-[#0A0A0A] focus:border-[#0A0A0A] focus:outline-none transition-colors"
                    />
                    <Mail size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#736E65]" />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-editorial-primary py-3.5 text-xs tracking-[0.25em] flex items-center justify-center space-x-2 focus:outline-none cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>SENDING CODE...</span>
                      </>
                    ) : (
                      <>
                        <span>SEND LOGIN CODE</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-center space-x-1.5 text-[0.6rem] text-[#A39E93]">
                  <Shield size={11} />
                  <span>Passwordless · Secure · No password needed</span>
                </div>
              </form>
            )}

            {/* STEP 2: OTP VERIFY */}
            {step === 'verify' && (
              <form onSubmit={handleVerifyOtp} className="space-y-5 my-3 sm:my-4">
                {/* OTP boxes (Supports 1-tap full 6-digit paste / SMS auto-fill) */}
                <div className="flex justify-center space-x-2" onPaste={handleOtpPaste}>
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
                      className="w-10 h-13 sm:w-11 sm:h-14 text-center text-lg font-semibold tracking-widest bg-white border border-[#0A0A0A]/20 focus:border-[#0A0A0A] focus:outline-none transition-colors"
                      autoComplete="one-time-code"
                    />
                  ))}
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading || otpCode.join('').length !== 6}
                    className="w-full btn-editorial-primary py-3.5 text-xs tracking-[0.25em] flex items-center justify-center space-x-2 focus:outline-none cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>VERIFYING...</span>
                      </>
                    ) : (
                      <>
                        <span>VERIFY & SIGN IN</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>

                {/* Resend + Change Email */}
                <div className="flex flex-col items-center space-y-2 text-xs">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={cooldown > 0}
                    className="flex items-center space-x-1.5 text-[#736E65] hover:text-[#0A0A0A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <RotateCw size={12} />
                    <span>{cooldown > 0 ? `RESEND IN ${cooldown}s` : 'RESEND CODE'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setOtpCode(['', '', '', '', '', '']);
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[0.7rem] font-medium tracking-wider text-[#0A0A0A] underline hover:opacity-75 cursor-pointer"
                  >
                    CHANGE EMAIL
                  </button>
                </div>
              </form>
            )}

            {/* FOOTER — GUEST OPTION */}
            <div className="space-y-2.5 pt-2 hairline-t border-t border-[#0A0A0A]/10 text-center">
              <p className="text-[0.65rem] text-[#A39E93] font-light">
                New here? Just enter your email — we'll create your account automatically.
              </p>

              {showGuestOption && (
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={closeAuthModal}
                    className="text-[0.7rem] font-medium tracking-[0.2em] uppercase text-[#736E65] hover:text-[#0A0A0A] underline focus:outline-none cursor-pointer"
                  >
                    CONTINUE AS GUEST / RETURN TO BAG
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
