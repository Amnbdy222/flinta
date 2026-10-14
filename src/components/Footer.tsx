import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock,
  ArrowUp,
} from 'lucide-react';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { sanitizeEmail } from '../utils/sanitize';

export const Footer: React.FC = () => {
  const { settings } = useStoreSettings();

  // Newsletter subscription state
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Mobile accordion state (expanded by default on desktop via CSS)
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(prev => (prev === section ? null : section));
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = sanitizeEmail(email);
    if (!cleanEmail) return;

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setIsSubscribed(true);
      setEmail('');
    }, 600);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clean social links from settings or high-converting fallbacks
  const socialLinks = settings.social_links || {};
  const instagramUrl =
    socialLinks.instagram ||
    'https://www.instagram.com/flint_a_india?utm_source=ig_web_button_share_sheet&igsi=ZDNlZDc0MzIxNw==';
  const facebookUrl = socialLinks.facebook || 'https://www.facebook.com';
  const twitterUrl = socialLinks.twitter || 'https://x.com';
  const youtubeUrl = socialLinks.youtube || 'https://www.youtube.com';



  return (
    <footer className="bg-[#F8EFE8] text-[#0A0A0A] border-t border-[#0A0A0A]/10 font-sans">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. TOP TRUST & REASSURANCE VALUE RIBBON (Snitch Style 4-Pillars Strip)
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="border-b border-[#0A0A0A]/10 bg-[#FAF4EF]" aria-label="Store Guarantees">
        <div className="container-editorial py-8 sm:py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {/* Pillar 1: Express Shipping */}
            <div className="flex items-start space-x-3.5 group">
              <div className="w-10 h-10 rounded-full bg-[#0A0A0A] text-[#FAF9F6] flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-105">
                <Truck size={18} strokeWidth={1.8} />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-[0.72rem] sm:text-xs font-bold tracking-[0.16em] uppercase text-[#0A0A0A]">
                  EXPRESS DISPATCH
                </h4>
                <p className="text-[0.68rem] sm:text-xs text-[#5C564E] font-light leading-snug">
                  Pan-India prompt delivery. Free shipping on orders over ₹{settings.free_shipping_threshold || 999}.
                </p>
              </div>
            </div>

            {/* Pillar 2: Easy Returns */}
            <div className="flex items-start space-x-3.5 group">
              <div className="w-10 h-10 rounded-full bg-[#0A0A0A] text-[#FAF9F6] flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-105">
                <RotateCcw size={18} strokeWidth={1.8} />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-[0.72rem] sm:text-xs font-bold tracking-[0.16em] uppercase text-[#0A0A0A]">
                  {settings.return_policy_days || 7}-DAY RETURNS
                </h4>
                <p className="text-[0.68rem] sm:text-xs text-[#5C564E] font-light leading-snug">
                  Instant doorstep pickups & size exchanges without hassle.
                </p>
              </div>
            </div>

            {/* Pillar 3: Secure Payments */}
            <div className="flex items-start space-x-3.5 group">
              <div className="w-10 h-10 rounded-full bg-[#0A0A0A] text-[#FAF9F6] flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-105">
                <ShieldCheck size={18} strokeWidth={1.8} />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-[0.72rem] sm:text-xs font-bold tracking-[0.16em] uppercase text-[#0A0A0A]">
                  100% SECURE CHECKOUT
                </h4>
                <p className="text-[0.68rem] sm:text-xs text-[#5C564E] font-light leading-snug">
                  Zero-trust encryption. Cards, UPI, NetBanking & COD supported.
                </p>
              </div>
            </div>

            {/* Pillar 4: Genuine Quality */}
            <div className="flex items-start space-x-3.5 group">
              <div className="w-10 h-10 rounded-full bg-[#0A0A0A] text-[#FAF9F6] flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-105">
                <Sparkles size={18} strokeWidth={1.8} />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-[0.72rem] sm:text-xs font-bold tracking-[0.16em] uppercase text-[#0A0A0A]">
                  ARCHITECTURAL CRAFT
                </h4>
                <p className="text-[0.68rem] sm:text-xs text-[#5C564E] font-light leading-snug">
                  Tailored luxury silhouettes engineered with premium textiles.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. VIP NEWSLETTER & CLUB STRIP (Snitch Style "SIGN UP FOR 10% OFF")
      ───────────────────────────────────────────────────────────────────────────── */}
      <section className="border-b border-[#0A0A0A]/10 bg-[#F4EBE3]" aria-label="Newsletter Signup">
        <div className="container-editorial py-10 sm:py-12">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <span className="inline-block px-3 py-1 bg-[#0A0A0A]/5 border border-[#0A0A0A]/10 rounded-full text-[0.65rem] font-semibold tracking-[0.25em] uppercase text-[#736E65]">
              FLINT PRIVÉ CLUB
            </span>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-editorial font-normal tracking-tight text-[#0A0A0A] uppercase">
              BE THE FIRST TO DROP IN · UNLOCK 10% OFF
            </h3>
            <p className="text-xs sm:text-[0.82rem] text-[#5C564E] font-light max-w-lg mx-auto leading-relaxed">
              Subscribe for private capsule previews, secret mid-season archives, and exclusive editorial drops directly to your inbox.
            </p>

            {isSubscribed ? (
              <div className="inline-flex items-center space-x-2 bg-[#0A0A0A] text-[#FAF9F6] px-5 py-3 rounded-md text-xs font-medium tracking-wider uppercase animate-fade-in">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>WELCOME TO FLINT PRIVÉ. USE CODE <strong className="underline text-amber-300">FLINT10</strong> FOR 10% OFF.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-center justify-center gap-2.5 max-w-md mx-auto pt-2">
                <div className="relative w-full">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address..."
                    required
                    className="w-full h-11 px-4 pr-10 bg-white/90 border border-[#0A0A0A]/20 text-[#0A0A0A] placeholder-[#8F887E] text-xs font-light focus:outline-none focus:border-[#0A0A0A] focus:ring-1 focus:ring-[#0A0A0A] transition-all"
                  />
                  <Mail size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8F887E]" />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto h-11 px-6 bg-[#0A0A0A] text-[#FAF9F6] hover:bg-[#211F1D] text-xs font-semibold tracking-[0.2em] uppercase transition-all flex items-center justify-center space-x-2 shrink-0 group active:scale-95 disabled:opacity-70"
                >
                  <span>{submitting ? 'JOINING...' : 'SUBSCRIBE'}</span>
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────────
          3. MAIN RICH FOOTER NAVIGATION GRID (Snitch Multi-Column Hierarchy)
      ───────────────────────────────────────────────────────────────────────────── */}
      <div className="container-editorial pt-12 sm:pt-16 md:pt-20 pb-12 md:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 md:gap-8 lg:gap-10 pb-12 md:pb-16 border-b border-[#0A0A0A]/10">

          {/* ── Brand & Support Column (Span 4 on Desktop) ── */}
          <div className="lg:col-span-4 space-y-5">
            <Link to="/" className="inline-flex items-center space-x-2.5 group">
              <img
                src="/image.png"
                alt={`${settings.store_name} Logo`}
                className="h-10 sm:h-12 w-auto object-contain shrink-0 rounded-full shadow-xs transition-transform group-hover:scale-105"
              />
              <span className="font-brand text-2xl sm:text-3xl font-bold tracking-[0.25em] text-[#0A0A0A] uppercase">
                {settings.store_name}
              </span>
            </Link>

            <p className="text-xs text-[#5C564E] max-w-sm leading-relaxed font-light">
              {settings.tagline ||
                'An architectural exploration of contemporary garments. Engineered with relaxed silhouettes, restrained aesthetics, and sustainable luxury textiles.'}
            </p>

            {/* Live Client Concierge Card */}
            <div className="bg-white/80 border border-[#0A0A0A]/10 p-4 rounded-xs space-y-3 max-w-sm">
              <div className="flex items-center justify-between pb-2 border-b border-[#0A0A0A]/8">
                <span className="text-[0.68rem] font-bold tracking-[0.2em] uppercase text-[#0A0A0A] flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>CLIENT CARE CONCIERGE</span>
                </span>
                <span className="text-[0.62rem] text-[#736E65] font-light flex items-center space-x-1">
                  <Clock size={11} />
                  <span>10 AM – 7 PM IST</span>
                </span>
              </div>

              <div className="space-y-2 text-xs text-[#5C564E] font-light">


                {/* Email */}
                {settings.support_email && (
                  <div className="flex items-center space-x-2.5 pt-0.5">
                    <Mail size={13} className="text-[#0A0A0A] shrink-0" />
                    <a href={`mailto:${settings.support_email}`} className="hover:text-[#0A0A0A] transition-colors truncate">
                      {settings.support_email}
                    </a>
                  </div>
                )}

                {/* Phone */}
                {settings.support_phone && (
                  <div className="flex items-center space-x-2.5">
                    <Phone size={13} className="text-[#0A0A0A] shrink-0" />
                    <a href={`tel:${settings.support_phone}`} className="hover:text-[#0A0A0A] transition-colors">
                      {settings.support_phone}
                    </a>
                  </div>
                )}

                {/* Location */}
                {settings.company_address && (
                  <div className="flex items-start space-x-2.5 pt-0.5">
                    <MapPin size={13} className="text-[#0A0A0A] shrink-0 mt-0.5" />
                    <span className="text-[0.7rem] leading-snug">{settings.company_address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── HIGH-END SOCIAL MEDIA CHANNELS ── */}
            <div className="space-y-2.5 pt-1">
              <span className="text-[0.68rem] font-bold tracking-[0.25em] uppercase text-[#736E65] block">
                FOLLOW OUR COMMUNITY
              </span>
              <div className="flex items-center flex-wrap gap-2.5">
                {/* Instagram Badge */}
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow Flint on Instagram"
                  title="Instagram @flint_a_india"
                  className="w-9 h-9 rounded-full bg-white border border-[#0A0A0A]/15 text-[#0A0A0A] flex items-center justify-center hover:bg-[#E1306C] hover:text-white hover:border-[#E1306C] transition-all duration-300 hover:-translate-y-1 shadow-xs group"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                  </svg>
                </a>



                {/* X / Twitter Badge */}
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow Flint on X"
                  title="X (Twitter)"
                  className="w-9 h-9 rounded-full bg-white border border-[#0A0A0A]/15 text-[#0A0A0A] flex items-center justify-center hover:bg-[#0A0A0A] hover:text-white hover:border-[#0A0A0A] transition-all duration-300 hover:-translate-y-1 shadow-xs"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>

                {/* Facebook Badge */}
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow Flint on Facebook"
                  title="Facebook"
                  className="w-9 h-9 rounded-full bg-white border border-[#0A0A0A]/15 text-[#0A0A0A] flex items-center justify-center hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] transition-all duration-300 hover:-translate-y-1 shadow-xs"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>

                {/* YouTube Badge */}
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow Flint on YouTube"
                  title="YouTube"
                  className="w-9 h-9 rounded-full bg-white border border-[#0A0A0A]/15 text-[#0A0A0A] flex items-center justify-center hover:bg-[#FF0000] hover:text-white hover:border-[#FF0000] transition-all duration-300 hover:-translate-y-1 shadow-xs"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>

                {/* Pinterest Badge */}
                <a
                  href="https://www.pinterest.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow Flint on Pinterest"
                  title="Pinterest Moodboards"
                  className="w-9 h-9 rounded-full bg-white border border-[#0A0A0A]/15 text-[#0A0A0A] flex items-center justify-center hover:bg-[#E60023] hover:text-white hover:border-[#E60023] transition-all duration-300 hover:-translate-y-1 shadow-xs"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.171-2.911 1.024 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* ── Navigation Columns (Span 8 on Desktop / Accordion on Mobile) ── */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-6">

            {/* Column 1: ONLINE STORE (Snitch Categories) */}
            <div className="border-b sm:border-b-0 border-[#0A0A0A]/10 pb-4 sm:pb-0">
              <button
                type="button"
                onClick={() => toggleSection('shop')}
                className="w-full flex items-center justify-between sm:cursor-default text-left py-1 sm:py-0 focus:outline-none"
              >
                <h4 className="text-[0.72rem] font-bold tracking-[0.25em] uppercase text-[#0A0A0A]">
                  COLLECTIONS
                </h4>
                <span className="sm:hidden text-[#736E65]">
                  {openSection === 'shop' ? <ChevronDown size={16} className="rotate-180 transition-transform" /> : <ChevronDown size={16} />}
                </span>
              </button>

              <ul className={`space-y-2.5 text-xs text-[#5C564E] font-light pt-3 sm:pt-4 ${openSection === 'shop' ? 'block' : 'hidden sm:block'}`}>
                <li>
                  <Link to="/shop?category=t-shirts" className="hover:text-[#0A0A0A] transition-colors link-underline">
                    Oversized T-Shirts
                  </Link>
                </li>
                <li>
                  <Link to="/shop?category=shirts" className="hover:text-[#0A0A0A] transition-colors link-underline">
                    Casual & Linen Shirts
                  </Link>
                </li>
                <li>
                  <Link to="/shop?category=cargos" className="hover:text-[#0A0A0A] transition-colors link-underline">
                    Cargo Pants & Trousers
                  </Link>
                </li>
                <li>
                  <Link to="/shop?category=jeans" className="hover:text-[#0A0A0A] transition-colors link-underline">
                    Baggy & Relaxed Jeans
                  </Link>
                </li>
                <li>
                  <Link to="/shop?category=trousers" className="hover:text-[#0A0A0A] transition-colors link-underline">
                    Korean Fit Trousers
                  </Link>
                </li>
                <li>
                  <Link to="/shop?category=hoodies" className="hover:text-[#0A0A0A] transition-colors link-underline">
                    Hoodies & Sweatshirts
                  </Link>
                </li>
                <li>
                  <Link to="/shop?sort=newest" className="hover:text-[#0A0A0A] transition-colors link-underline flex items-center space-x-1 font-medium text-[#0A0A0A]">
                    <span>New Drops</span>
                    <span className="text-[0.55rem] px-1 bg-[#0A0A0A] text-white rounded-xs">HOT</span>
                  </Link>
                </li>
                <li>
                  <Link to="/shop" className="hover:text-[#0A0A0A] transition-colors link-underline">
                    Shop All Archive
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: CUSTOMER CARE */}
            <div className="border-b sm:border-b-0 border-[#0A0A0A]/10 pb-4 sm:pb-0">
              <button
                type="button"
                onClick={() => toggleSection('care')}
                className="w-full flex items-center justify-between sm:cursor-default text-left py-1 sm:py-0 focus:outline-none"
              >
                <h4 className="text-[0.72rem] font-bold tracking-[0.25em] uppercase text-[#0A0A0A]">
                  CUSTOMER CARE
                </h4>
                <span className="sm:hidden text-[#736E65]">
                  {openSection === 'care' ? <ChevronDown size={16} className="rotate-180 transition-transform" /> : <ChevronDown size={16} />}
                </span>
              </button>

              <ul className={`space-y-2.5 text-xs text-[#5C564E] font-light pt-3 sm:pt-4 ${openSection === 'care' ? 'block' : 'hidden sm:block'}`}>
                <li>
                  <Link to="/account/orders" className="hover:text-[#0A0A0A] transition-colors link-underline font-medium text-[#0A0A0A]">
                    Track Your Order
                  </Link>
                </li>
                <li>
                  <Link to="/returns" className="hover:text-[#0A0A0A] transition-colors link-underline">
                    Returns & Exchanges
                  </Link>
                </li>
                <li>
                  <Link to="/shipping" className="hover:text-[#0A0A0A] transition-colors link-underline">
                    Shipping & Delivery
                  </Link>
                </li>
                <li>
                  <Link to="/account/returns" className="hover:text-[#0A0A0A] transition-colors link-underline">
                    Return Request Portal
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-[#0A0A0A] transition-colors link-underline">
                    Contact Us & Help Desk
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-[#0A0A0A] transition-colors link-underline">
                    Size & Fit Guide
                  </Link>
                </li>
                <li>
                  <Link to="/account" className="hover:text-[#0A0A0A] transition-colors link-underline">
                    My Account Profile
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: ABOUT BRAND */}
            <div className="border-b sm:border-b-0 border-[#0A0A0A]/10 pb-4 sm:pb-0">
              <button
                type="button"
                onClick={() => toggleSection('about')}
                className="w-full flex items-center justify-between sm:cursor-default text-left py-1 sm:py-0 focus:outline-none"
              >
                <h4 className="text-[0.72rem] font-bold tracking-[0.25em] uppercase text-[#0A0A0A]">
                  THE BRAND
                </h4>
                <span className="sm:hidden text-[#736E65]">
                  {openSection === 'about' ? <ChevronDown size={16} className="rotate-180 transition-transform" /> : <ChevronDown size={16} />}
                </span>
              </button>

              <ul className={`space-y-2.5 text-xs text-[#5C564E] font-light pt-3 sm:pt-4 ${openSection === 'about' ? 'block' : 'hidden sm:block'}`}>
                <li>
                  <Link to="/about" className="hover:text-[#0A0A0A] transition-colors link-underline font-medium text-[#0A0A0A]">
                    Our Story & Ethos
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-[#0A0A0A] transition-colors link-underline">
                    Fabric & Craftsmanship
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-[#0A0A0A] transition-colors link-underline">
                    Sustainable Luxury
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-[#0A0A0A] transition-colors link-underline">
                    Store Locations
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-[#0A0A0A] transition-colors link-underline">
                    Press & Features
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-[#0A0A0A] transition-colors link-underline">
                    Careers at Flint
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: LEGAL & POLICIES */}
            <div>
              <button
                type="button"
                onClick={() => toggleSection('legal')}
                className="w-full flex items-center justify-between sm:cursor-default text-left py-1 sm:py-0 focus:outline-none"
              >
                <h4 className="text-[0.72rem] font-bold tracking-[0.25em] uppercase text-[#0A0A0A]">
                  LEGAL & TERMS
                </h4>
                <span className="sm:hidden text-[#736E65]">
                  {openSection === 'legal' ? <ChevronDown size={16} className="rotate-180 transition-transform" /> : <ChevronDown size={16} />}
                </span>
              </button>

              <ul className={`space-y-2.5 text-xs text-[#5C564E] font-light pt-3 sm:pt-4 ${openSection === 'legal' ? 'block' : 'hidden sm:block'}`}>
                <li>
                  <Link to="/privacy" className="hover:text-[#0A0A0A] transition-colors link-underline font-medium text-[#0A0A0A]">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-[#0A0A0A] transition-colors link-underline">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link to="/shipping" className="hover:text-[#0A0A0A] transition-colors link-underline">
                    Shipping Policy
                  </Link>
                </li>
                <li>
                  <Link to="/returns" className="hover:text-[#0A0A0A] transition-colors link-underline">
                    Refund & Cancellation
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-[#0A0A0A] transition-colors link-underline">
                    Security Architecture
                  </Link>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────────────────
            4. POPULAR SEARCHES & SEO CATEGORY TAG CLOUD (Snitch Hallmark)
        ───────────────────────────────────────────────────────────────────────────── */}
        <div className="py-8 border-b border-[#0A0A0A]/10 space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-[0.68rem] font-bold tracking-[0.2em] uppercase text-[#0A0A0A]">
              POPULAR SEARCHES:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.7rem] text-[#736E65] font-light leading-relaxed">
            <Link to="/shop?category=t-shirts" className="hover:text-[#0A0A0A] transition-colors underline-offset-2 hover:underline">
              Oversized T-Shirts for Men
            </Link>
            <span className="text-[#0A0A0A]/20">|</span>
            <Link to="/shop?category=cargos" className="hover:text-[#0A0A0A] transition-colors underline-offset-2 hover:underline">
              Cargo Pants India
            </Link>
            <span className="text-[#0A0A0A]/20">|</span>
            <Link to="/shop?category=shirts" className="hover:text-[#0A0A0A] transition-colors underline-offset-2 hover:underline">
              Casual Linen Shirts
            </Link>
            <span className="text-[#0A0A0A]/20">|</span>
            <Link to="/shop?category=jeans" className="hover:text-[#0A0A0A] transition-colors underline-offset-2 hover:underline">
              Korean Baggy Jeans
            </Link>
            <span className="text-[#0A0A0A]/20">|</span>
            <Link to="/shop?category=trousers" className="hover:text-[#0A0A0A] transition-colors underline-offset-2 hover:underline">
              Tailored Relaxed Trousers
            </Link>
            <span className="text-[#0A0A0A]/20">|</span>
            <Link to="/shop?category=hoodies" className="hover:text-[#0A0A0A] transition-colors underline-offset-2 hover:underline">
              Winter Hoodies & Sweatshirts
            </Link>
            <span className="text-[#0A0A0A]/20">|</span>
            <Link to="/shop?category=t-shirts" className="hover:text-[#0A0A0A] transition-colors underline-offset-2 hover:underline">
              Graphic Streetwear Tees
            </Link>
            <span className="text-[#0A0A0A]/20">|</span>
            <Link to="/shop" className="hover:text-[#0A0A0A] transition-colors underline-offset-2 hover:underline">
              Flint Originals Collection
            </Link>
            <span className="text-[#0A0A0A]/20">|</span>
            <Link to="/shop?sort=newest" className="hover:text-[#0A0A0A] transition-colors underline-offset-2 hover:underline">
              Latest Drops 2026
            </Link>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────────────────
            5. PAYMENT PARTNERS & TRUST BADGES STRIP (Snitch Style Payment Grid)
        ───────────────────────────────────────────────────────────────────────────── */}
        <div className="py-7 border-b border-[#0A0A0A]/10 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-[0.68rem] font-bold tracking-[0.2em] uppercase text-[#0A0A0A] block">
              100% SECURE PAYMENT PARTNERS
            </span>
            <p className="text-[0.65rem] text-[#736E65] font-light">
              Encrypted 256-bit SSL transaction gateway powered by Razorpay.
            </p>
          </div>

          {/* Payment Method Badges */}
          <div className="flex items-center flex-wrap justify-center gap-2 sm:gap-2.5">
            {/* UPI Badge */}
            <div className="h-7 px-2.5 rounded-xs bg-white border border-[#0A0A0A]/12 flex items-center justify-center shadow-2xs" title="UPI (Unified Payments Interface)">
              <span className="text-[0.62rem] font-bold tracking-wider text-[#006A4E]">UPI</span>
            </div>

            {/* Google Pay */}
            <div className="h-7 px-2.5 rounded-xs bg-white border border-[#0A0A0A]/12 flex items-center justify-center shadow-2xs" title="Google Pay">
              <span className="text-[0.62rem] font-bold tracking-tight text-[#4285F4]">G<span className="text-[#EA4335]">P</span><span className="text-[#FBBC05]">a</span><span className="text-[#34A853]">y</span></span>
            </div>

            {/* PhonePe */}
            <div className="h-7 px-2.5 rounded-xs bg-white border border-[#0A0A0A]/12 flex items-center justify-center shadow-2xs" title="PhonePe">
              <span className="text-[0.62rem] font-bold tracking-tight text-[#5F259F]">PhonePe</span>
            </div>

            {/* Paytm */}
            <div className="h-7 px-2.5 rounded-xs bg-white border border-[#0A0A0A]/12 flex items-center justify-center shadow-2xs" title="Paytm">
              <span className="text-[0.62rem] font-bold tracking-tight text-[#002970]">Pay<span className="text-[#00B9F5]">tm</span></span>
            </div>

            {/* Visa */}
            <div className="h-7 px-2.5 rounded-xs bg-white border border-[#0A0A0A]/12 flex items-center justify-center shadow-2xs" title="Visa Card">
              <span className="text-[0.68rem] font-extrabold italic text-[#1A1F71] tracking-tighter">VISA</span>
            </div>

            {/* Mastercard */}
            <div className="h-7 px-2.5 rounded-xs bg-white border border-[#0A0A0A]/12 flex items-center justify-center space-x-1 shadow-2xs" title="Mastercard">
              <div className="flex -space-x-1.5">
                <div className="w-3.5 h-3.5 rounded-full bg-[#EB001B] opacity-90" />
                <div className="w-3.5 h-3.5 rounded-full bg-[#F79E1B] opacity-90" />
              </div>
            </div>

            {/* RuPay */}
            <div className="h-7 px-2.5 rounded-xs bg-white border border-[#0A0A0A]/12 flex items-center justify-center shadow-2xs" title="RuPay">
              <span className="text-[0.62rem] font-bold text-[#097939]">Ru<span className="text-[#F37021]">Pay</span></span>
            </div>

            {/* NetBanking */}
            <div className="h-7 px-2 rounded-xs bg-white border border-[#0A0A0A]/12 flex items-center justify-center shadow-2xs" title="Net Banking">
              <span className="text-[0.58rem] font-medium tracking-wider text-[#383531] uppercase">NET BANKING</span>
            </div>

            {/* Cash on Delivery */}
            <div className="h-7 px-2.5 rounded-xs bg-white border border-[#0A0A0A]/12 flex items-center justify-center shadow-2xs" title="Cash on Delivery Available">
              <span className="text-[0.6rem] font-bold tracking-wider text-[#0A0A0A]">COD AVAILABLE</span>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────────────────────
            6. BOTTOM COPYRIGHT & BACK TO TOP BAR
        ───────────────────────────────────────────────────────────────────────────── */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[0.65rem] tracking-[0.18em] text-[#736E65] uppercase gap-4 sm:gap-0">
          <p>© {new Date().getFullYear()} {settings.store_name.toUpperCase()} INDIA. ALL RIGHTS RESERVED.</p>

          <p className="hidden md:block text-[0.6rem] tracking-[0.22em] text-[#8F887E]">
            ENGINEERED FOR MODERN CONTEMPORARY LUXURY
          </p>

          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex items-center space-x-2 text-[#0A0A0A] hover:text-[#5C564E] font-semibold tracking-[0.2em] transition-colors group cursor-pointer"
            title="Back to Top"
          >
            <span>BACK TO TOP</span>
            <div className="w-6 h-6 rounded-full border border-[#0A0A0A]/20 flex items-center justify-center transition-transform group-hover:-translate-y-0.5">
              <ArrowUp size={12} />
            </div>
          </button>
        </div>

      </div>
    </footer>
  );
};
