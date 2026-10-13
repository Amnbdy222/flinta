import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  ShieldCheck,
  CreditCard,
  Truck,
  RotateCcw,
  Scale,
  Mail,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { SEO } from '../components/SEO';
import { useStoreSettings } from '../context/StoreSettingsContext';

export const TermsPage: React.FC = () => {
  const { settings } = useStoreSettings();
  const [activeSection, setActiveSection] = useState<string>('intro');

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
    { id: 'intro', title: '1. Introduction & Agreement', icon: FileText },
    { id: 'eligibility', title: '2. User Eligibility & Account', icon: ShieldCheck },
    { id: 'products', title: '3. Products, Pricing & Accuracy', icon: CheckCircle2 },
    { id: 'payments', title: '4. Payments & Billing Security', icon: CreditCard },
    { id: 'shipping', title: '5. Dispatch, Shipping & Risk', icon: Truck },
    { id: 'returns', title: '6. Returns, Exchanges & Refunds', icon: RotateCcw },
    { id: 'intellectual', title: '7. Intellectual Property Rights', icon: Scale },
    { id: 'conduct', title: '8. User Conduct & Abuse Policy', icon: AlertCircle },
    { id: 'liability', title: '9. Limitation of Liability', icon: HelpCircle },
    { id: 'governing', title: '10. Governing Law & Jurisdiction', icon: Scale },
    { id: 'grievance', title: '11. Grievance Officer & Contact', icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-28 sm:pt-32 md:pt-36 pb-20 md:pb-28 text-[#0A0A0A] font-sans antialiased">
      <SEO
        title="Terms & Conditions of Service"
        description={`Comprehensive Terms and Conditions governing orders, transactions, garment purchases, and digital services at ${settings.store_name} India.`}
        canonicalUrl="https://flintaindia.com/terms"
      />

      <div className="container-editorial max-w-5xl mx-auto px-4 sm:px-6">
        {/* ── Breadcrumb ── */}
        <nav className="flex items-center space-x-2 text-[0.7rem] uppercase tracking-[0.2em] text-[#736E65] pb-6 sm:pb-8">
          <Link to="/" className="hover:text-[#0A0A0A] transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-[#0A0A0A] font-semibold">Terms & Conditions</span>
        </nav>

        {/* ── Page Header ── */}
        <header className="border-b border-[#0A0A0A]/10 pb-8 sm:pb-12 mb-10 sm:mb-14">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0A0A0A]/5 border border-[#0A0A0A]/10 text-[0.68rem] font-bold tracking-[0.22em] uppercase text-[#736E65] mb-4">
            <Scale size={12} />
            <span>LEGAL & STATUTORY FRAMEWORK</span>
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl font-light uppercase tracking-tight text-[#0A0A0A] leading-none mb-4">
            TERMS & CONDITIONS
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#5C564E] font-light gap-2">
            <p>
              Operating entity: <strong className="font-medium text-[#0A0A0A]">{settings.store_name} India</strong> · Governed under the laws of the Republic of India.
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
                  TABLE OF CONTENTS
                </span>
                <span className="text-[0.62rem] text-[#736E65]">11 CLAUSES</span>
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

              <div className="pt-3 border-t border-[#0A0A0A]/10 text-[0.7rem] text-[#5C564E] space-y-2">
                <p className="font-light">Need legal clarification regarding your order?</p>
                <Link
                  to="/contact"
                  className="inline-flex items-center space-x-1.5 font-medium text-[#0A0A0A] hover:underline uppercase tracking-wider text-[0.68rem]"
                >
                  <span>Contact Support Concierge</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Legal Clauses */}
          <main className="lg:col-span-8 space-y-12 sm:space-y-14 text-xs sm:text-[0.82rem] font-light text-[#383531] leading-relaxed">

            {/* Quick Summary Alert Box */}
            <div className="bg-[#FAF4EF] border-l-2 border-[#0A0A0A] p-5 sm:p-6 space-y-2 shadow-2xs">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-[0.16em] text-[#0A0A0A] flex items-center space-x-2">
                <AlertCircle size={15} className="text-[#0A0A0A]" />
                <span>CUSTOMER SUMMARY & BINDING NOTICE</span>
              </h3>
              <p className="text-[#5C564E] leading-relaxed">
                Welcome to <strong>{settings.store_name}</strong>. By accessing our platform (<a href="https://flintaindia.com" className="underline font-medium text-[#0A0A0A]">flintaindia.com</a>), browsing our collections, creating an account, or placing an order, you agree to these legally binding Terms and Conditions. These terms comply with the <strong>Information Technology Act, 2000</strong>, the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong>, and all applicable Indian statutory laws.
              </p>
            </div>

            {/* 1. Introduction & Agreement */}
            <section id="intro" className="space-y-4 pt-2">
              <div className="flex items-baseline space-x-3 pb-2 border-b border-[#0A0A0A]/10">
                <span className="text-[0.7rem] font-bold tracking-[0.25em] text-[#736E65]">CLAUSE 01</span>
                <h2 className="font-editorial text-2xl sm:text-3xl text-[#0A0A0A] uppercase tracking-tight">
                  1. INTRODUCTION & DIGITAL AGREEMENT
                </h2>
              </div>
              <p>
                This electronic record is generated by a computer system and does not require physical or digital signatures. This document is published in accordance with the provisions of Rule 3(1) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.
              </p>
              <p>
                The domain <strong>flintaindia.com</strong>, including all associated subdomains, web applications, and mobile interfaces (collectively referred to as the <strong>"Platform"</strong>), is owned and operated by <strong>{settings.store_name} India</strong>, having its principal operational studio at <em>{settings.company_address || 'Studio House, New Delhi, India'}</em>.
              </p>
              <p>
                Throughout these Terms, <strong>"You"</strong>, <strong>"User"</strong>, or <strong>"Customer"</strong> refers to any natural or legal person who accesses the Platform or transacts business with us. <strong>"We"</strong>, <strong>"Us"</strong>, <strong>"Our"</strong>, or <strong>"{settings.store_name}"</strong> refers to the operating brand.
              </p>
            </section>

            {/* 2. User Eligibility & Account */}
            <section id="eligibility" className="space-y-4 pt-2">
              <div className="flex items-baseline space-x-3 pb-2 border-b border-[#0A0A0A]/10">
                <span className="text-[0.7rem] font-bold tracking-[0.25em] text-[#736E65]">CLAUSE 02</span>
                <h2 className="font-editorial text-2xl sm:text-3xl text-[#0A0A0A] uppercase tracking-tight">
                  2. USER ELIGIBILITY & ACCOUNT SECURITY
                </h2>
              </div>
              <p>
                Use of the Platform is available only to persons who can form legally binding contracts under the <strong>Indian Contract Act, 1872</strong>. Persons who are "incompetent to contract" within the meaning of the Act, including un-discharged insolvents and minors under eighteen (18) years of age, are not eligible to register independently. Minors may use the Platform only under the active supervision of a legal parent or guardian.
              </p>
              <p>
                When creating an account or checking out as a guest:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-[#5C564E]">
                <li>You agree to provide true, current, and accurate contact details, including a valid 10-digit Indian mobile number and functional delivery address.</li>
                <li>You are solely responsible for safeguarding your authentication tokens, OTPs, and login sessions. Any transaction initiated through your authenticated session is deemed authorized by you.</li>
                <li>We reserve the right to immediately terminate or suspend accounts that engage in fraudulent chargebacks, fabricated order submissions, or automated inventory locking bots.</li>
              </ul>
            </section>

            {/* 3. Products, Pricing & Accuracy */}
            <section id="products" className="space-y-4 pt-2">
              <div className="flex items-baseline space-x-3 pb-2 border-b border-[#0A0A0A]/10">
                <span className="text-[0.7rem] font-bold tracking-[0.25em] text-[#736E65]">CLAUSE 03</span>
                <h2 className="font-editorial text-2xl sm:text-3xl text-[#0A0A0A] uppercase tracking-tight">
                  3. PRODUCTS, INVENTORY & PRICING
                </h2>
              </div>
              <p>
                <strong>Garment Descriptions & Sizing:</strong> We make every architectural effort to display garment colors, textures, drops, and proportions as accurately as possible. However, the actual visual color may vary slightly based on display calibration, monitor profiles, and ambient lighting conditions. Please refer to our detailed <strong>Size & Fit Guide</strong> on each product page prior to purchasing.
              </p>
              <p>
                <strong>Pricing & Goods and Services Tax (GST):</strong> All prices listed on the Platform are in Indian Rupees (<strong>INR / ₹</strong>) and are inclusive of applicable Goods and Services Tax (GST). Delivery charges, if any, are explicitly calculated and transparently displayed at checkout prior to payment commitment.
              </p>
              <p>
                <strong>Pricing Corrections:</strong> Despite our best verification practices, rare typographical or system synchronization errors may occur. In the event a product is listed at an incorrect price due to an automated glitch, {settings.store_name} reserves the right to cancel the order and issue a full 100% refund to the source account prior to courier dispatch.
              </p>
            </section>

            {/* 4. Payments & Billing Security */}
            <section id="payments" className="space-y-4 pt-2">
              <div className="flex items-baseline space-x-3 pb-2 border-b border-[#0A0A0A]/10">
                <span className="text-[0.7rem] font-bold tracking-[0.25em] text-[#736E65]">CLAUSE 04</span>
                <h2 className="font-editorial text-2xl sm:text-3xl text-[#0A0A0A] uppercase tracking-tight">
                  4. PAYMENT GATEWAY & BILLING PROTECTION
                </h2>
              </div>
              <p>
                {settings.store_name} supports multiple secure digital payment channels to ensure a seamless checkout experience:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 bg-white border border-[#0A0A0A]/10 rounded-xs space-y-1">
                  <span className="font-bold text-[0.72rem] uppercase tracking-wider text-[#0A0A0A] block">
                    ONLINE PAYMENTS (RAZORPAY)
                  </span>
                  <p className="text-[0.7rem] text-[#5C564E]">
                    Unified Payments Interface (UPI - Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards (Visa, Mastercard, RuPay, Maestro), and Net Banking across 50+ Indian banks. Encrypted with RBI-mandated 2FA and PCI-DSS Level 1 tokenization.
                  </p>
                </div>
                <div className="p-3.5 bg-white border border-[#0A0A0A]/10 rounded-xs space-y-1">
                  <span className="font-bold text-[0.72rem] uppercase tracking-wider text-[#0A0A0A] block">
                    CASH ON DELIVERY (COD)
                  </span>
                  <p className="text-[0.7rem] text-[#5C564E]">
                    Available across serviceable Indian pincodes. Payment must be handed over in cash or instant QR scan to the courier personnel at the doorstep prior to opening the archival package.
                  </p>
                </div>
              </div>
              <p className="text-[#5C564E] text-[0.75rem] pt-1">
                <strong>Zero-Trust Payment Rule:</strong> {settings.store_name} does not retain, access, or store your credit/debit card numbers, CVVs, or net banking passwords on our servers. All sensitive cardholder transactions are routed through RBI-licensed payment aggregators.
              </p>
            </section>

            {/* 5. Dispatch, Shipping & Risk */}
            <section id="shipping" className="space-y-4 pt-2">
              <div className="flex items-baseline space-x-3 pb-2 border-b border-[#0A0A0A]/10">
                <span className="text-[0.7rem] font-bold tracking-[0.25em] text-[#736E65]">CLAUSE 05</span>
                <h2 className="font-editorial text-2xl sm:text-3xl text-[#0A0A0A] uppercase tracking-tight">
                  5. SHIPPING, DISPATCH TIMELINES & PASSING OF RISK
                </h2>
              </div>
              <p>
                Orders placed before 2:00 PM IST on working days are processed and dispatched within 24–48 hours from our fulfillment hub. Deliveries are carried out in partnership with premier logistics providers (Shiprocket, BlueDart, Delhivery).
              </p>
              <ul className="list-disc pl-5 space-y-2 text-[#5C564E]">
                <li><strong>Estimated Delivery Timeline:</strong> Metro cities typically receive packages within 2–4 business days; Tier 2/3 cities and remote regions receive deliveries within 4–7 business days.</li>
                <li><strong>Free Shipping Threshold:</strong> Orders of <strong>{settings.currency_symbol}{settings.free_shipping_threshold || 999}</strong> or more qualify for complimentary standard shipping. Orders below this threshold incur a flat delivery charge of {settings.currency_symbol}{settings.flat_shipping_rate || 50}.</li>
                <li><strong>Passing of Title & Risk:</strong> Risk of damage or loss passes to you upon delivery and physical acceptance at your registered delivery address. Please do not accept parcels with broken seals or damaged outer packaging.</li>
              </ul>
              <p>
                For complete details on courier tracking and logistics timelines, visit our dedicated{' '}
                <Link to="/shipping" className="underline font-medium text-[#0A0A0A]">
                  Shipping & Delivery Policy
                </Link>.
              </p>
            </section>

            {/* 6. Returns, Exchanges & Refunds */}
            <section id="returns" className="space-y-4 pt-2">
              <div className="flex items-baseline space-x-3 pb-2 border-b border-[#0A0A0A]/10">
                <span className="text-[0.7rem] font-bold tracking-[0.25em] text-[#736E65]">CLAUSE 06</span>
                <h2 className="font-editorial text-2xl sm:text-3xl text-[#0A0A0A] uppercase tracking-tight">
                  6. RETURNS, EXCHANGES & REFUND POLICY
                </h2>
              </div>
              <p>
                Client satisfaction is paramount. Under our policy, you may request a return or size exchange within{' '}
                <strong>{settings.return_policy_days || 7} calendar days</strong> of confirmed delivery through your account portal.
              </p>
              <div className="p-4 bg-white border border-[#0A0A0A]/10 rounded-xs space-y-2">
                <span className="font-bold text-[0.72rem] tracking-wider uppercase text-[#0A0A0A] block">
                  ELIGIBILITY CRITERIA FOR RETURN / EXCHANGE:
                </span>
                <ul className="list-disc pl-5 space-y-1.5 text-[#5C564E]">
                  <li>Garments must be in pristine, unworn, unwashed condition with no perfume odors or deodorant marks.</li>
                  <li>Original brand hangtags, wash care labels, and packaging must remain intact.</li>
                  <li>Clearance items explicitly marked "Final Archive Sale" are not eligible for cash refunds but may be exchanged for store credit if stock permits.</li>
                </ul>
              </div>
              <p>
                <strong>Refund Processing:</strong> Approved refunds for online payments are credited back to the original payment source within 5–7 business days of physical receipt and quality inspection at our warehouse. For Cash on Delivery orders, refunds are disbursed via secure UPI or direct NEFT bank transfer.
              </p>
              <p>
                For full details, please review our{' '}
                <Link to="/returns" className="underline font-medium text-[#0A0A0A]">
                  Returns & Exchanges Policy
                </Link>.
              </p>
            </section>

            {/* 7. Intellectual Property Rights */}
            <section id="intellectual" className="space-y-4 pt-2">
              <div className="flex items-baseline space-x-3 pb-2 border-b border-[#0A0A0A]/10">
                <span className="text-[0.7rem] font-bold tracking-[0.25em] text-[#736E65]">CLAUSE 07</span>
                <h2 className="font-editorial text-2xl sm:text-3xl text-[#0A0A0A] uppercase tracking-tight">
                  7. INTELLECTUAL PROPERTY & TRADEMARKS
                </h2>
              </div>
              <p>
                All content published on this Platform—including trademarks, logo typography, garment designs, custom graphics, campaign lookbooks, product descriptions, interface code, and editorial photography—is the exclusive intellectual property of <strong>{settings.store_name} India</strong> and is protected under the <strong>Indian Copyright Act, 1957</strong>, the <strong>Trade Marks Act, 1999</strong>, and international IP conventions.
              </p>
              <p>
                You may not download, scrape, reproduce, republish, distribute, or create derivative works from our content without prior express written authorization from our corporate office.
              </p>
            </section>

            {/* 8. User Conduct & Abuse Policy */}
            <section id="conduct" className="space-y-4 pt-2">
              <div className="flex items-baseline space-x-3 pb-2 border-b border-[#0A0A0A]/10">
                <span className="text-[0.7rem] font-bold tracking-[0.25em] text-[#736E65]">CLAUSE 08</span>
                <h2 className="font-editorial text-2xl sm:text-3xl text-[#0A0A0A] uppercase tracking-tight">
                  8. PROHIBITED CONDUCT & ABUSE RESTRICTIONS
                </h2>
              </div>
              <p>You agree not to host, display, upload, modify, publish, or transmit any information that:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-[#5C564E]">
                <li>Belongs to another person and to which you do not have any right.</li>
                <li>Is defamatory, obscene, harassing, invasive of another's privacy, or racially offensive.</li>
                <li>Interferes with or disrupts the security architecture of the Platform via SQL injection, automated scraping bots, or denial-of-service (DDoS) attempts.</li>
                <li>Places fraudulent Cash on Delivery orders with deliberate intent to reject parcels at the doorstep (repeated return-to-origin abuse).</li>
              </ul>
            </section>

            {/* 9. Limitation of Liability */}
            <section id="liability" className="space-y-4 pt-2">
              <div className="flex items-baseline space-x-3 pb-2 border-b border-[#0A0A0A]/10">
                <span className="text-[0.7rem] font-bold tracking-[0.25em] text-[#736E65]">CLAUSE 09</span>
                <h2 className="font-editorial text-2xl sm:text-3xl text-[#0A0A0A] uppercase tracking-tight">
                  9. LIMITATION OF LIABILITY & INDEMNIFICATION
                </h2>
              </div>
              <p>
                In no event shall {settings.store_name}, its founders, directors, employees, or logistics affiliates be liable for any indirect, punitive, incidental, special, or consequential damages resulting from the use or inability to use the Platform.
              </p>
              <p>
                In any circumstance, our maximum aggregate liability arising out of or in connection with any garment purchase or transaction shall not exceed the actual invoice amount paid by you for that specific order.
              </p>
            </section>

            {/* 10. Governing Law & Jurisdiction */}
            <section id="governing" className="space-y-4 pt-2">
              <div className="flex items-baseline space-x-3 pb-2 border-b border-[#0A0A0A]/10">
                <span className="text-[0.7rem] font-bold tracking-[0.25em] text-[#736E65]">CLAUSE 10</span>
                <h2 className="font-editorial text-2xl sm:text-3xl text-[#0A0A0A] uppercase tracking-tight">
                  10. GOVERNING LAW & JURISDICTION
                </h2>
              </div>
              <p>
                These Terms and Conditions shall be governed by, construed, and enforced in accordance with the substantive laws of the <strong>Republic of India</strong>, without regard to conflict of law principles.
              </p>
              <p>
                Any dispute, controversy, or claim arising out of or relating to these Terms, transactions, or garments shall be subject to the exclusive jurisdiction of the competent courts located at <strong>New Delhi, India</strong>.
              </p>
            </section>

            {/* 11. Grievance Officer & Contact */}
            <section id="grievance" className="space-y-4 pt-2">
              <div className="flex items-baseline space-x-3 pb-2 border-b border-[#0A0A0A]/10">
                <span className="text-[0.7rem] font-bold tracking-[0.25em] text-[#736E65]">CLAUSE 11</span>
                <h2 className="font-editorial text-2xl sm:text-3xl text-[#0A0A0A] uppercase tracking-tight">
                  11. STATUTORY GRIEVANCE REDRESSAL MECHANISM
                </h2>
              </div>
              <p>
                In accordance with the <strong>Information Technology Act, 2000</strong> and the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong>, the details of the designated Grievance Officer for consumer complaints and dispute resolution are provided below:
              </p>

              <div className="bg-white border border-[#0A0A0A]/15 p-5 sm:p-6 rounded-xs space-y-3 shadow-2xs">
                <div className="flex items-center space-x-2 pb-2 border-b border-[#0A0A0A]/10">
                  <ShieldCheck size={16} className="text-[#0A0A0A]" />
                  <span className="font-bold text-xs uppercase tracking-wider text-[#0A0A0A]">
                    GRIEVANCE & REDRESSAL DESK
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-light text-[#5C564E]">
                  <div>
                    <span className="text-[0.68rem] font-semibold text-[#0A0A0A] block uppercase tracking-wider mb-0.5">
                      OFFICER IN CHARGE
                    </span>
                    <p>Nodal Grievance Officer</p>
                    <p>{settings.store_name} Legal & Compliance Cell</p>
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
                  <div>
                    <span className="text-[0.68rem] font-semibold text-[#0A0A0A] block uppercase tracking-wider mb-0.5">
                      HELPLINE ASSISTANCE
                    </span>
                    <p>{settings.support_phone || '+91 98765 43210'} (Mon–Sat, 10 AM – 7 PM IST)</p>
                  </div>
                  <div>
                    <span className="text-[0.68rem] font-semibold text-[#0A0A0A] block uppercase tracking-wider mb-0.5">
                      REGISTERED STUDIO
                    </span>
                    <p>{settings.company_address || 'FLINT A India, Studio House, New Delhi, India'}</p>
                  </div>
                </div>
                <p className="text-[0.68rem] text-[#736E65] pt-2 border-t border-[#0A0A0A]/8 leading-relaxed">
                  * All consumer complaints are formally acknowledged within forty-eight (48) hours of receipt and addressed within thirty (30) business days in accordance with statutory requirements.
                </p>
              </div>
            </section>

          </main>
        </div>

        {/* ── Bottom Reassurance Bar ── */}
        <div className="mt-16 sm:mt-20 pt-8 sm:pt-10 border-t border-[#0A0A0A]/10 flex flex-col sm:flex-row items-center justify-between text-xs text-[#5C564E] gap-4">
          <div className="flex items-center space-x-4">
            <Link to="/privacy" className="text-[#0A0A0A] font-medium underline uppercase tracking-wider text-[0.7rem] hover:text-[#736E65]">
              Privacy & Data Policy →
            </Link>
            <span className="text-[#0A0A0A]/20">|</span>
            <Link to="/returns" className="text-[#0A0A0A] font-medium underline uppercase tracking-wider text-[0.7rem] hover:text-[#736E65]">
              Return & Refund Policy →
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
