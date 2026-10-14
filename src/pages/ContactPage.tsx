import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { submitContactInquiry } from '../services/contactService';
import { AccountLayout } from '../components/AccountLayout';
import { SEO } from '../components/SEO';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  ChevronLeft,
} from 'lucide-react';
import { sanitizeText, sanitizeEmail } from '../utils/sanitize';

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

    const cleanName = sanitizeText(fullName, 100);
    const cleanEmail = sanitizeEmail(email);
    const cleanMessage = sanitizeText(message, 2000);

    if (!cleanName || !cleanEmail || !cleanMessage) {
      setError('Please provide a valid name, email address, and message.');
      return;
    }

    setSubmitting(true);
    try {
      await submitContactInquiry({
        fullName: cleanName,
        email: cleanEmail,
        topic: sanitizeText(topic, 50),
        message: cleanMessage,
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
    <div className="space-y-4 sm:space-y-6">
      {/* HEADER CARD */}
      <div className="bg-white border border-[#EAE8E2] p-5 sm:p-6 shadow-xs text-center space-y-2">
        <span className="text-[10px] tracking-widest uppercase font-semibold text-[#736E65] block">
          CLIENT SERVICES &amp; CARE
        </span>
        <h1 className="font-editorial text-2xl sm:text-4xl font-light uppercase tracking-tight text-[#0A0A0A]">
          HELP &amp; SUPPORT
        </h1>
        <p className="text-xs sm:text-sm text-[#736E65] font-light leading-relaxed max-w-lg mx-auto">
          For personal styling inquiries, sizing assistance, orders, or client care, our advisors are at your service.
        </p>
      </div>

      {/* MAISON CONCIERGE CONTACT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
        {settings.support_email && (
          <div className="p-4 sm:p-5 bg-white border border-[#EAE8E2] shadow-xs space-y-1.5">
            <Mail size={18} className="mx-auto text-[#0A0A0A]" />
            <span className="text-[10px] tracking-widest font-semibold text-[#736E65] uppercase block">
              EMAIL SUPPORT
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
          <div className="p-4 sm:p-5 bg-white border border-[#EAE8E2] shadow-xs space-y-1.5">
            <Phone size={18} className="mx-auto text-[#0A0A0A]" />
            <span className="text-[10px] tracking-widest font-semibold text-[#736E65] uppercase block">
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
          <div className="p-4 sm:p-5 bg-white border border-[#EAE8E2] shadow-xs space-y-1.5">
            <MapPin size={18} className="mx-auto text-[#0A0A0A]" />
            <span className="text-[10px] tracking-widest font-semibold text-[#736E65] uppercase block">
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
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {submitted ? (
        <div className="text-center py-10 sm:py-16 p-6 sm:p-12 border border-[#EAE8E2] shadow-xs space-y-4 bg-white animate-fade-in">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 mb-2">
            <CheckCircle2 size={24} />
          </div>
          <span className="text-[10px] tracking-widest uppercase text-[#736E65] block font-semibold">
            INQUIRY LOGGED SUCCESSFULLY
          </span>
          <h2 className="font-editorial text-2xl sm:text-3xl font-light uppercase text-[#0A0A0A]">
            THANK YOU
          </h2>
          <p className="text-xs sm:text-sm text-[#736E65] font-light max-w-md mx-auto leading-relaxed">
            Your inquiry has been logged in our system. A client concierge advisor will respond to{' '}
            <strong className="text-[#0A0A0A] font-medium">{email}</strong> within 24 business hours.
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
        <form
          onSubmit={handleSubmit}
          className="space-y-4 sm:space-y-5 bg-white border border-[#EAE8E2] p-5 sm:p-8 shadow-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div className="space-y-1.5">
              <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">
                FULL NAME *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name"
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
                placeholder="client@domain.com"
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
              <option value="orders">ORDERS &amp; DISPATCH</option>
              <option value="returns">RETURNS &amp; REFUNDS</option>
              <option value="sizing">SIZING &amp; FIT CONSULTATION</option>
              <option value="press">PRESS &amp; PARTNERSHIPS</option>
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
              placeholder="Describe your inquiry or order details..."
              className="w-full bg-[#FAF9F6] border border-[#0A0A0A]/20 px-4 py-3 text-xs tracking-wider text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] transition-colors"
            ></textarea>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-editorial-primary w-full py-3.5 text-xs tracking-[0.25em] flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>TRANSMITTING INQUIRY...</span>
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

  if (user) {
    return (
      <AccountLayout activeKey="contact" title="Help & Support — FLINT A">
        {formContent}
      </AccountLayout>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0A0A0A] pt-4 sm:pt-6 pb-16 sm:pb-24">
      <SEO
        title="Contact & Client Support"
        description="Connect with FLINT A customer support and client concierge advisors."
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#EAE8E2] mb-5 sm:mb-6">
          <Link
            to="/shop"
            className="inline-flex items-center text-xs tracking-wider uppercase text-[#736E65] hover:text-[#0A0A0A] transition-colors group"
          >
            <ChevronLeft
              size={16}
              className="mr-1 group-hover:-translate-x-0.5 transition-transform"
            />
            <span>CONTINUE SHOPPING</span>
          </Link>
          <Link
            to="/login"
            className="text-xs tracking-wider uppercase text-[#0A0A0A] hover:underline font-semibold"
          >
            SIGN IN
          </Link>
        </div>
        {formContent}
      </div>
    </div>
  );
};
