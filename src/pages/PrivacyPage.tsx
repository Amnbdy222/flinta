import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Lock,
  ShieldCheck,
  Eye,
  Database,
  Cookie,
  CreditCard,
  UserCheck,
  Clock,
  Mail,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { SEO } from '../components/SEO';
import { useStoreSettings } from '../context/StoreSettingsContext';

export const PrivacyPage: React.FC = () => {
  const { settings } = useStoreSettings();
  const [activeSection, setActiveSection] = useState<string>('collection');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const sections = [
    { id: 'collection', title: '1. Information We Collect', icon: Eye },
    { id: 'usage', title: '2. Purpose & Processing of Data', icon: Database },
    { id: 'disclosure', title: '3. Zero-Sale Pledge & Sharing', icon: ShieldCheck },
    { id: 'payments', title: '4. Payment Privacy & Gateways', icon: CreditCard },
    { id: 'cookies', title: '5. Cookies & Local Storage', icon: Cookie },
    { id: 'security', title: '6. Defense-in-Depth Security', icon: Lock },
    { id: 'rights', title: '7. Your Rights (DPDP Act)', icon: UserCheck },
    { id: 'retention', title: '8. Data Retention Timeline', icon: Clock },
    { id: 'children', title: '9. Children & Minor Privacy', icon: ShieldAlert },
    { id: 'grievance', title: '10. Grievance & DPO Officer', icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-28 sm:pt-32 md:pt-36 pb-20 md:pb-28 text-[#0A0A0A] font-sans antialiased">
      <SEO
        title="Privacy & Data Protection Policy"
        description={`Learn how ${settings.store_name} protects client privacy, processes transactions securely, and complies with India's Digital Personal Data Protection (DPDP) Act 2023.`}
        canonicalUrl="https://flintaindia.com/privacy"
      />

      <div className="container-editorial max-w-5xl mx-auto px-4 sm:px-6">
        {/* ── Breadcrumb ── */}
        <nav className="flex items-center space-x-2 text-[0.7rem] uppercase tracking-[0.2em] text-[#736E65] pb-6 sm:pb-8">
          <Link to="/" className="hover:text-[#0A0A0A] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#0A0A0A] font-semibold">Privacy Policy</span>
        </nav>

        {/* ── Page Header ── */}
        <header className="border-b border-[#0A0A0A]/10 pb-8 sm:pb-12 mb-10 sm:mb-14">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0A0A0A]/5 border border-[#0A0A0A]/10 text-[0.68rem] font-bold tracking-[0.22em] uppercase text-[#736E65] mb-4">
            <Lock size={12} />
            <span>DPDP ACT 2023 & IT ACT COMPLIANT</span>
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl font-light uppercase tracking-tight text-[#0A0A0A] leading-none mb-4">
            PRIVACY & DATA POLICY
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#5C564E] font-light gap-2">
            <p>
              Operating entity: <strong className="font-medium text-[#0A0A0A]">{settings.store_name} India</strong> · Dedicated to client confidentiality.
            </p>
            <p className="tracking-wider uppercase text-[0.68rem] text-[#736E65]">
              LAST REVISED: OCTOBER 2026 · VERSION 2.4
            </p>
          </div>
        </header>

        {/* ── Content Layout: Sidebar Table of Contents + Main Legal Text ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-14">
          {/* Desktop Sticky Table of Contents */}
          <aside className="lg:col-span-4 hidden lg:block">
            <div className="sticky top-28 bg-[#F8EFE8] border border-[#0A0A0A]/10 p-5 rounded-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#0A0A0A]/10">
                <span className="text-[0.72rem] font-bold tracking-[0.2em] uppercase text-[#0A0A0A]">
                  PRIVACY SECTIONS
                </span>
                <span className="text-[0.62rem] text-[#736E65]">10 CLAUSES</span>
              </div>
              <nav className="space-y-1">
                {sections.map((sec) => {
                  const Icon = sec.icon;
                  const isCurrent = activeSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => scrollToSection(sec.id)}
                      className={`w-full text-left px-2.5 py-2 rounded-xs text-[0.72rem] transition-all flex items-center space-x-2.5 cursor-pointer ${
                        isCurrent
                          ? 'bg-[#0A0A0A] text-[#FAF9F6] font-medium shadow-2xs'
                          : 'text-[#5C564E] hover:text-[#0A0A0A] hover:bg-black/5 font-light'
                      }`}
                    >
                      <Icon size={13} className="shrink-0" />
                      <span className="truncate">{sec.title}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Zero-Sale Pledge Callout */}
              <div className="p-3 bg-white border border-emerald-600/20 rounded-xs space-y-1 text-[0.68rem] text-[#5C564E]">
                <div className="flex items-center space-x-1.5 text-emerald-800 font-bold uppercase tracking-wider text-[0.65rem]">
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  <span>100% ZERO-SALE GUARANTEE</span>
                </div>
                <p className="font-light leading-snug">
                  We never sell, rent, or monetize your contact number or address to third-party telemarketers or ad networks.
                </p>
              </div>

              <div className="pt-3 border-t border-[#0A0A0A]/10 text-[0.7rem] text-[#5C564E] space-y-2">
                <p className="font-light">Questions regarding personal data?</p>
                <Link
                  to="/contact"
                  className="inline-flex items-center space-x-1.5 font-medium text-[#0A0A0A] hover:underline uppercase tracking-wider text-[0.68rem]"
                >
                  <span>Data Protection Officer</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Privacy Clauses */}
          <main className="lg:col-span-8 space-y-12 sm:space-y-14 text-xs sm:text-[0.82rem] font-light text-[#383531] leading-relaxed">

            {/* Privacy Manifesto Callout */}
            <div className="bg-[#FAF4EF] border-l-2 border-[#0A0A0A] p-5 sm:p-6 space-y-2 shadow-2xs">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-[0.16em] text-[#0A0A0A] flex items-center space-x-2">
                <Lock size={15} className="text-[#0A0A0A]" />
                <span>OUR CLIENT PRIVACY COMMITMENT</span>
              </h3>
              <p className="text-[#5C564E] leading-relaxed">
                At <strong>{settings.store_name}</strong>, we consider client privacy as sacred as our garment craftsmanship. We strictly adhere to India's <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong> and the <strong>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</strong>. This document explains transparently what data we collect, why we need it, and how your privacy is protected at every touchpoint.
              </p>
            </div>

            {/* 1. Information We Collect */}
            <section id="collection" className="space-y-4 pt-2">
              <div className="flex items-baseline space-x-3 pb-2 border-b border-[#0A0A0A]/10">
                <span className="text-[0.7rem] font-bold tracking-[0.25em] text-[#736E65]">SECTION 01</span>
                <h2 className="font-editorial text-2xl sm:text-3xl text-[#0A0A0A] uppercase tracking-tight">
                  1. INFORMATION WE COLLECT
                </h2>
              </div>
              <p>
                We only collect data that is strictly necessary to fulfill your garment orders, provide customer assistance, and deliver a personalized storefront experience:
              </p>

              <div className="space-y-3 pt-1">
                <div className="p-4 bg-white border border-[#0A0A0A]/10 rounded-xs space-y-1.5">
                  <span className="font-bold text-[0.72rem] uppercase tracking-wider text-[#0A0A0A] block">
                    A. IDENTITY & CONTACT INFORMATION
                  </span>
                  <p className="text-[#5C564E]">
                    Your full name, delivery address, pincode, state, mobile phone number (used for delivery OTP and status SMS), and email address (used for order confirmations and digital invoices).
                  </p>
                </div>

                <div className="p-4 bg-white border border-[#0A0A0A]/10 rounded-xs space-y-1.5">
                  <span className="font-bold text-[0.72rem] uppercase tracking-wider text-[#0A0A0A] block">
                    B. ORDER & TRANSACTION HISTORY
                  </span>
                  <p className="text-[#5C564E]">
                    Garment styles ordered, sizes selected, quantities, transaction references, return/exchange history, and courier tracking numbers.
                  </p>
                </div>

                <div className="p-4 bg-white border border-[#0A0A0A]/10 rounded-xs space-y-1.5">
                  <span className="font-bold text-[0.72rem] uppercase tracking-wider text-[#0A0A0A] block">
                    C. TECHNICAL & BROWSING METRICS
                  </span>
                  <p className="text-[#5C564E]">
                    Internet Protocol (IP) address, device type, screen resolution, operating system, browser version, and aggregated page loading metrics to ensure optimal performance.
                  </p>
                </div>
              </div>
            </section>

            {/* 2. Purpose & Processing of Data */}
            <section id="usage" className="space-y-4 pt-2">
              <div className="flex items-baseline space-x-3 pb-2 border-b border-[#0A0A0A]/10">
                <span className="text-[0.7rem] font-bold tracking-[0.25em] text-[#736E65]">SECTION 02</span>
                <h2 className="font-editorial text-2xl sm:text-3xl text-[#0A0A0A] uppercase tracking-tight">
                  2. PURPOSE & PROCESSING OF PERSONAL DATA
                </h2>
              </div>
              <p>We process your personal information strictly for legitimate commercial and operational purposes:</p>
              <ul className="list-disc pl-5 space-y-2 text-[#5C564E]">
                <li><strong>Order Fulfillment & Courier Dispatch:</strong> Transmitting recipient names, delivery addresses, and phone numbers to our logistics network (Shiprocket, BlueDart, Delhivery) for safe doorstep dispatch.</li>
                <li><strong>Real-Time Delivery Notifications:</strong> Sending transactional updates, dispatch manifests, out-for-delivery OTPs, and return confirmations via Email, SMS, and WhatsApp.</li>
                <li><strong>Customer Support & Dispute Handling:</strong> Resolving sizing queries, return pickups, and payment inquiries through our dedicated concierge desk.</li>
                <li><strong>Fraud Detection & Risk Prevention:</strong> Detecting fraudulent chargebacks, preventing automated inventory hoovering bots, and verifying Cash on Delivery orders.</li>
                <li><strong>Optional VIP Communications:</strong> Notifying opted-in club members about new drop collections, capsule previews, and private archives (you can unsubscribe with a single click at any time).</li>
              </ul>
            </section>

            {/* 3. Zero-Sale Pledge & Sharing */}
            <section id="disclosure" className="space-y-4 pt-2">
              <div className="flex items-baseline space-x-3 pb-2 border-b border-[#0A0A0A]/10">
                <span className="text-[0.7rem] font-bold tracking-[0.25em] text-[#736E65]">SECTION 03</span>
                <h2 className="font-editorial text-2xl sm:text-3xl text-[#0A0A0A] uppercase tracking-tight">
                  3. ZERO-SALE PLEDGE & CONTROLLED DISCLOSURE
                </h2>
              </div>
              <div className="p-4 bg-emerald-50 border border-emerald-600/30 rounded-xs space-y-2 text-emerald-950">
                <h4 className="font-bold text-xs uppercase tracking-wider flex items-center space-x-2">
                  <ShieldCheck size={16} className="text-emerald-700" />
                  <span>OUR NON-NEGOTIABLE CLIENT PLEDGE</span>
                </h4>
                <p className="text-[0.75rem] leading-relaxed">
                  <strong>We do NOT sell, rent, monetize, or trade your personal data under any circumstance.</strong> Your contact details and order histories are never disclosed to third-party ad brokers, lead generation companies, or telemarketing agencies.
                </p>
              </div>
              <p>We share limited operational data solely with trusted infrastructure partners essential for operating the storefront:</p>
              <ul className="list-disc pl-5 space-y-2 text-[#5C564E]">
                <li><strong>Logistics Partners:</strong> Regulated couriers (e.g., Shiprocket) receive only your shipping name, delivery address, and phone number to fulfill deliveries.</li>
                <li><strong>Transactional Email Services:</strong> Encrypted email relay providers (Resend) receive your email address to deliver order receipts and dispatch tracking links.</li>
                <li><strong>Legal Statutory Compliance:</strong> We may disclose information if mandated by a formal subpoena, court order, or authorized Indian law enforcement agency under the Information Technology Act.</li>
              </ul>
            </section>

            {/* 4. Payment Privacy & Gateways */}
            <section id="payments" className="space-y-4 pt-2">
              <div className="flex items-baseline space-x-3 pb-2 border-b border-[#0A0A0A]/10">
                <span className="text-[0.7rem] font-bold tracking-[0.25em] text-[#736E65]">SECTION 04</span>
                <h2 className="font-editorial text-2xl sm:text-3xl text-[#0A0A0A] uppercase tracking-tight">
                  4. PAYMENT CARD & TRANSACTION SECURITY
                </h2>
              </div>
              <p>
                <strong>Zero-Knowledge Payment Architecture:</strong> All electronic payments on our storefront are processed through <strong>Razorpay Software Private Limited</strong>, an RBI-licensed payment aggregator certified to <strong>PCI-DSS Level 1</strong> (the highest global standard of security).
              </p>
              <ul className="list-disc pl-5 space-y-2 text-[#5C564E]">
                <li>{settings.store_name} servers <strong>never see, log, or store</strong> your raw debit/credit card numbers, CVVs, expiry dates, net banking passwords, or UPI PINs.</li>
                <li>Card transactions use RBI-mandated end-to-end tokenization and mandatory Two-Factor Authentication (OTP verification).</li>
                <li>Payment gateway callbacks are cryptographically verified using HMAC-SHA256 signatures before any order is confirmed as paid in our database.</li>
              </ul>
            </section>

            {/* 5. Cookies & Local Storage */}
            <section id="cookies" className="space-y-4 pt-2">
              <div className="flex items-baseline space-x-3 pb-2 border-b border-[#0A0A0A]/10">
                <span className="text-[0.7rem] font-bold tracking-[0.25em] text-[#736E65]">SECTION 05</span>
                <h2 className="font-editorial text-2xl sm:text-3xl text-[#0A0A0A] uppercase tracking-tight">
                  5. COOKIES & LOCAL CLIENT STORAGE
                </h2>
              </div>
              <p>
                We use small data files (cookies) and browser local storage strictly to ensure our web application functions reliably:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 bg-white border border-[#0A0A0A]/10 rounded-xs space-y-1">
                  <span className="font-bold text-[0.72rem] uppercase tracking-wider text-[#0A0A0A] block">
                    ESSENTIAL STORAGE (REQUIRED)
                  </span>
                  <p className="text-[0.7rem] text-[#5C564E]">
                    Maintains your shopping bag across pages, preserves user authentication tokens, and powers security CSRF protections. Disabling these prevents checkout.
                  </p>
                </div>
                <div className="p-3.5 bg-white border border-[#0A0A0A]/10 rounded-xs space-y-1">
                  <span className="font-bold text-[0.72rem] uppercase tracking-wider text-[#0A0A0A] block">
                    PREFERENCE STORAGE
                  </span>
                  <p className="text-[0.7rem] text-[#5C564E]">
                    Remembers your size preferences, wishlist items, and dismisses banners once acknowledged to prevent repetitive interruptions.
                  </p>
                </div>
              </div>
              <p className="text-[#5C564E] text-[0.75rem]">
                You can configure your web browser to reject cookies. However, doing so will impact features like cart persistence and account login.
              </p>
            </section>

            {/* 6. Defense-in-Depth Security */}
            <section id="security" className="space-y-4 pt-2">
              <div className="flex items-baseline space-x-3 pb-2 border-b border-[#0A0A0A]/10">
                <span className="text-[0.7rem] font-bold tracking-[0.25em] text-[#736E65]">SECTION 06</span>
                <h2 className="font-editorial text-2xl sm:text-3xl text-[#0A0A0A] uppercase tracking-tight">
                  6. DEFENSE-IN-DEPTH TECHNICAL SECURITY
                </h2>
              </div>
              <p>
                We implement multi-layered engineering safeguards to protect your personal information against unauthorized access, loss, or manipulation:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-[#5C564E]">
                <li><strong>Transport Layer Security (TLS/SSL):</strong> All data transmitted between your browser and our servers is encrypted using modern 256-bit TLS encryption.</li>
                <li><strong>Database Row-Level Security (RLS):</strong> Our PostgreSQL database enforces strict access policies at the query level, ensuring users can only read and write their own profile and order records.</li>
                <li><strong>API Origin Restriction:</strong> All serverless endpoints strictly enforce Cross-Origin Resource Sharing (CORS) restricted exclusively to verified domains (<a href="https://flintaindia.com" className="underline font-medium text-[#0A0A0A]">flintaindia.com</a>).</li>
                <li><strong>HTTP Security Headers:</strong> Every response includes strict defense-in-depth headers including <code>X-Content-Type-Options: nosniff</code> and <code>X-Frame-Options: DENY</code> to prevent clickjacking and MIME-type exploits.</li>
              </ul>
            </section>

            {/* 7. Your Rights under DPDP Act */}
            <section id="rights" className="space-y-4 pt-2">
              <div className="flex items-baseline space-x-3 pb-2 border-b border-[#0A0A0A]/10">
                <span className="text-[0.7rem] font-bold tracking-[0.25em] text-[#736E65]">SECTION 07</span>
                <h2 className="font-editorial text-2xl sm:text-3xl text-[#0A0A0A] uppercase tracking-tight">
                  7. YOUR RIGHTS UNDER THE DPDP ACT, 2023
                </h2>
              </div>
              <p>
                As a data principal under the <strong>Digital Personal Data Protection Act, 2023</strong>, you possess full statutory rights over your personal data:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                <div className="p-3 bg-white border border-[#0A0A0A]/10 rounded-xs space-y-1">
                  <strong className="text-[#0A0A0A] uppercase tracking-wider text-[0.7rem] block">RIGHT TO ACCESS & SUMMARY</strong>
                  <p className="text-[#5C564E] text-[0.7rem]">You have the right to obtain a digital summary of all personal data held by us, accessible via your Account Portal.</p>
                </div>
                <div className="p-3 bg-white border border-[#0A0A0A]/10 rounded-xs space-y-1">
                  <strong className="text-[#0A0A0A] uppercase tracking-wider text-[0.7rem] block">RIGHT TO CORRECTION & RECTIFICATION</strong>
                  <p className="text-[#5C564E] text-[0.7rem]">You may update inaccurate addresses, phone numbers, or email credentials at any time in your profile.</p>
                </div>
                <div className="p-3 bg-white border border-[#0A0A0A]/10 rounded-xs space-y-1">
                  <strong className="text-[#0A0A0A] uppercase tracking-wider text-[0.7rem] block">RIGHT TO ERASURE ("BE FORGOTTEN")</strong>
                  <p className="text-[#5C564E] text-[0.7rem]">You can request complete deletion of your account and profile, subject to statutory tax and financial retention laws.</p>
                </div>
                <div className="p-3 bg-white border border-[#0A0A0A]/10 rounded-xs space-y-1">
                  <strong className="text-[#0A0A0A] uppercase tracking-wider text-[0.7rem] block">RIGHT TO WITHDRAW CONSENT</strong>
                  <p className="text-[#5C564E] text-[0.7rem]">You may opt-out of promotional marketing communications instantly with a single click in any newsletter email.</p>
                </div>
              </div>
              <p className="text-[#5C564E] text-[0.75rem]">
                To exercise any of these rights, email our Data Protection team at{' '}
                <a href={`mailto:${settings.support_email || 'support@flintaindia.com'}`} className="underline font-medium text-[#0A0A0A]">
                  {settings.support_email || 'support@flintaindia.com'}
                </a>{' '}
                with the subject line "DPDP Rights Request".
              </p>
            </section>

            {/* 8. Data Retention Timeline */}
            <section id="retention" className="space-y-4 pt-2">
              <div className="flex items-baseline space-x-3 pb-2 border-b border-[#0A0A0A]/10">
                <span className="text-[0.7rem] font-bold tracking-[0.25em] text-[#736E65]">SECTION 08</span>
                <h2 className="font-editorial text-2xl sm:text-3xl text-[#0A0A0A] uppercase tracking-tight">
                  8. DATA RETENTION POLICY
                </h2>
              </div>
              <p>
                We retain personal information only for as long as necessary to fulfill the purposes outlined in this Policy, or as mandated by Indian statutory laws:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-[#5C564E]">
                <li><strong>Account Data:</strong> Maintained for as long as your account remains active or until you request its deletion.</li>
                <li><strong>Financial & Invoice Records:</strong> Retained for a mandatory statutory period of eight (8) years to comply with the <strong>Goods and Services Tax (GST) Act</strong> and Indian Income Tax regulations.</li>
                <li><strong>Logistics Data:</strong> Retained for twelve (12) months following delivery completion to handle warranty claims, returns, or courier dispute reconciliations.</li>
              </ul>
            </section>

            {/* 9. Children & Minor Privacy */}
            <section id="children" className="space-y-4 pt-2">
              <div className="flex items-baseline space-x-3 pb-2 border-b border-[#0A0A0A]/10">
                <span className="text-[0.7rem] font-bold tracking-[0.25em] text-[#736E65]">SECTION 09</span>
                <h2 className="font-editorial text-2xl sm:text-3xl text-[#0A0A0A] uppercase tracking-tight">
                  9. PROTECTION OF MINORS & CHILDREN
                </h2>
              </div>
              <p>
                The Platform is intended for individuals who are at least eighteen (18) years of age. We do not knowingly solicit, collect, or store personal data from children under the age of 18 without verified parental consent. If we become aware that personal data of a minor has been collected without parental consent, we will take prompt steps to delete such data from our databases.
              </p>
            </section>

            {/* 10. Grievance & DPO Officer */}
            <section id="grievance" className="space-y-4 pt-2">
              <div className="flex items-baseline space-x-3 pb-2 border-b border-[#0A0A0A]/10">
                <span className="text-[0.7rem] font-bold tracking-[0.25em] text-[#736E65]">SECTION 10</span>
                <h2 className="font-editorial text-2xl sm:text-3xl text-[#0A0A0A] uppercase tracking-tight">
                  10. DATA PROTECTION & GRIEVANCE REDRESSAL
                </h2>
              </div>
              <p>
                If you have any questions, concerns, or grievances regarding the processing of your personal data under the <strong>DPDP Act, 2023</strong> or <strong>IT Rules, 2011</strong>, you may reach out directly to our appointed officer:
              </p>

              <div className="bg-white border border-[#0A0A0A]/15 p-5 sm:p-6 rounded-xs space-y-3 shadow-2xs">
                <div className="flex items-center space-x-2 pb-2 border-b border-[#0A0A0A]/10">
                  <ShieldCheck size={16} className="text-[#0A0A0A]" />
                  <span className="font-bold text-xs uppercase tracking-wider text-[#0A0A0A]">
                    DATA PROTECTION & GRIEVANCE OFFICER
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-light text-[#5C564E]">
                  <div>
                    <span className="text-[0.68rem] font-semibold text-[#0A0A0A] block uppercase tracking-wider mb-0.5">
                      DESIGNATION
                    </span>
                    <p>Nodal Data Protection & Grievance Officer</p>
                    <p>{settings.store_name} Legal Compliance Cell</p>
                  </div>
                  <div>
                    <span className="text-[0.68rem] font-semibold text-[#0A0A0A] block uppercase tracking-wider mb-0.5">
                      OFFICIAL EMAIL
                    </span>
                    <a
                      href={`mailto:${settings.support_email || 'support@flintaindia.com'}`}
                      className="text-[#0A0A0A] underline hover:text-[#736E65] transition-colors"
                    >
                      {settings.support_email || 'support@flintaindia.com'}
                    </a>
                  </div>
                  {settings.support_phone && (
                    <div>
                      <span className="text-[0.68rem] font-semibold text-[#0A0A0A] block uppercase tracking-wider mb-0.5">
                        CONCIERGE HELPLINE
                      </span>
                      <p>{settings.support_phone} (Mon–Sat, 10 AM – 7 PM IST)</p>
                    </div>
                  )}
                  {settings.company_address && (
                    <div>
                      <span className="text-[0.68rem] font-semibold text-[#0A0A0A] block uppercase tracking-wider mb-0.5">
                        REGISTERED OFFICE
                      </span>
                      <p>{settings.company_address}</p>
                    </div>
                  )}
                </div>
                <p className="text-[0.68rem] text-[#736E65] pt-2 border-t border-[#0A0A0A]/8 leading-relaxed">
                  * All privacy inquiries are formally acknowledged within 48 hours and resolved within 30 days as mandated by Indian statutory regulations.
                </p>
              </div>
            </section>

          </main>
        </div>

        {/* ── Bottom Reassurance Bar ── */}
        <div className="mt-16 sm:mt-20 pt-8 sm:pt-10 border-t border-[#0A0A0A]/10 flex flex-col sm:flex-row items-center justify-between text-xs text-[#5C564E] gap-4">
          <div className="flex items-center space-x-4">
            <Link to="/terms" className="text-[#0A0A0A] font-medium underline uppercase tracking-wider text-[0.7rem] hover:text-[#736E65]">
              Terms & Conditions →
            </Link>
            <span className="text-[#0A0A0A]/20">|</span>
            <Link to="/shipping" className="text-[#0A0A0A] font-medium underline uppercase tracking-wider text-[0.7rem] hover:text-[#736E65]">
              Shipping Policy →
            </Link>
          </div>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-[0.68rem] uppercase font-bold tracking-[0.2em] text-[#0A0A0A] hover:text-[#736E65] transition-colors cursor-pointer"
          >
            ↑ Back to Top of Document
          </button>
        </div>

      </div>
    </div>
  );
};
