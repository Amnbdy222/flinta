import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { submitContactInquiry } from '../services/contactService';
import { AccountLayout } from '../components/AccountLayout';
import { AlertCircle, CheckCircle2, Loader2, ArrowRight, Mail, Phone, MapPin } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { settings } = useStoreSettings();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('general');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill form if user is logged in
  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
    if (profile?.full_name && !fullName) {
      setFullName(profile.full_name);
    }
  }, [user, profile, email, fullName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await submitContactInquiry({
        fullName,
        email,
        topic,
        message,
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send inquiry. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const formContent = (
    <div className="space-y-6 sm:space-y-8">
      {/* HEADER */}
      <div className="text-center space-y-2 sm:space-y-3 pb-6 hairline-b">
        <span className="editorial-subtitle block">CLIENT SERVICES</span>
        <h2 className="font-editorial text-2xl sm:text-4xl font-light uppercase tracking-tight">
          CONTACT MAISON
        </h2>
        <p className="text-xs sm:text-sm text-[#736E65] font-light leading-relaxed max-w-lg mx-auto">
          For personal styling inquiries, sizing assistance, or client care, our advisors are at your service.
        </p>
      </div>

      {/* MAISON CONCIERGE CONTACT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-center">
        {settings.support_email && (
          <div className="p-4 bg-white hairline-all space-y-1.5 shadow-2xs">
            <Mail size={18} className="mx-auto text-[#0A0A0A]" />
            <span className="text-[0.6rem] tracking-[0.2em] font-semibold text-[#736E65] uppercase block">
              ELECTRONIC MAIL
            </span>
            <a
              href={`mailto:${settings.support_email}`}
              className="text-xs text-[#0A0A0A] font-medium hover:underline block truncate"
            >
              {settings.support_email}
            </a>
          </div>
        )}

        {settings.support_phone && (
          <div className="p-4 bg-white hairline-all space-y-1.5 shadow-2xs">
            <Phone size={18} className="mx-auto text-[#0A0A0A]" />
            <span className="text-[0.6rem] tracking-[0.2em] font-semibold text-[#736E65] uppercase block">
              CONCIERGE DESK
            </span>
            <a
              href={`tel:${settings.support_phone}`}
              className="text-xs text-[#0A0A0A] font-medium hover:underline block"
            >
              {settings.support_phone}
            </a>
          </div>
        )}

        {settings.company_address && (
          <div className="p-4 bg-white hairline-all space-y-1.5 shadow-2xs">
            <MapPin size={18} className="mx-auto text-[#0A0A0A]" />
            <span className="text-[0.6rem] tracking-[0.2em] font-semibold text-[#736E65] uppercase block">
              HEADQUARTERS
            </span>
            <p className="text-xs text-[#0A0A0A] font-medium leading-tight">
              {settings.company_address}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-900 border border-red-900/20 p-3.5 sm:p-4 text-xs flex items-start space-x-2.5 animate-fade-in">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {submitted ? (
        <div className="text-center py-10 sm:py-16 hairline-all p-6 sm:p-12 space-y-4 bg-white animate-fade-in">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 mb-2">
            <CheckCircle2 size={24} />
          </div>
          <span className="text-[0.65rem] tracking-[0.3em] uppercase text-[#736E65] block font-medium">
            INQUIRY LOGGED SUCCESSFULLY
          </span>
          <h3 className="font-editorial text-2xl sm:text-3xl font-light uppercase">THANK YOU</h3>
          <p className="text-xs sm:text-sm text-[#736E65] font-light max-w-md mx-auto leading-relaxed">
            Your inquiry has been logged in our system. A client concierge will respond to <strong className="text-[#0A0A0A] font-medium">{email}</strong> within 24 business hours.
          </p>
          <div className="pt-4">
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setMessage('');
              }}
              className="btn-editorial-outline text-xs py-3 px-8 tracking-[0.2em] uppercase cursor-pointer"
            >
              SUBMIT ANOTHER INQUIRY
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 bg-white hairline-all p-5 sm:p-8 shadow-2xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            <div className="space-y-1.5">
              <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">
                FULL NAME *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Elena Rostova"
                className="w-full bg-[#FAF9F6] border border-[#0A0A0A]/20 px-4 py-3 text-xs tracking-wider text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">
                EMAIL ADDRESS *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. elena@domain.com"
                className="w-full bg-[#FAF9F6] border border-[#0A0A0A]/20 px-4 py-3 text-xs tracking-wider text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">
              INQUIRY TOPIC
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-[#FAF9F6] border border-[#0A0A0A]/20 px-4 py-3 text-xs tracking-wider text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] transition-colors uppercase cursor-pointer"
            >
              <option value="general">GENERAL INQUIRY</option>
              <option value="sizing">SIZING & FIT ASSISTANCE</option>
              <option value="shipping">SHIPPING & DISPATCH</option>
              <option value="returns">RETURNS & EXCHANGES</option>
              <option value="press">PRESS & EDITORIAL</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">
              MESSAGE *
            </label>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your inquiry here..."
              className="w-full bg-[#FAF9F6] border border-[#0A0A0A]/20 px-4 py-3 text-xs tracking-wider text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] transition-colors"
            ></textarea>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-editorial-primary w-full py-4 text-xs tracking-[0.25em] flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>SENDING INQUIRY...</span>
                </>
              ) : (
                <>
                  <span>SEND INQUIRY</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );

  return (
    <AccountLayout activeKey="contact" title="Client Help & Concierge">
      {formContent}
    </AccountLayout>
  );
};
