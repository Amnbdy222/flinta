import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Youtube, Mail, Phone, MapPin, RotateCcw } from 'lucide-react';
import { useStoreSettings } from '../context/StoreSettingsContext';

export const Footer: React.FC = () => {
  const { settings } = useStoreSettings();

  const socialLinks = settings.social_links || {};
  const hasInstagram = Boolean(socialLinks.instagram && socialLinks.instagram.trim() !== '');
  const hasFacebook = Boolean(socialLinks.facebook && socialLinks.facebook.trim() !== '');
  const hasTwitter = Boolean(socialLinks.twitter && socialLinks.twitter.trim() !== '');
  const hasYoutube = Boolean(socialLinks.youtube && socialLinks.youtube.trim() !== '');

  const hasAnySocial = hasInstagram || hasFacebook || hasTwitter || hasYoutube;

  return (
    <footer className="bg-[#F8EFE8] text-[#0A0A0A] pt-14 sm:pt-16 md:pt-20 pb-10 md:pb-12 hairline-t border-t border-[#0A0A0A]/10">
      <div className="container-editorial">
        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 md:gap-12 pb-12 md:pb-16 hairline-b border-b border-[#0A0A0A]/10">

          {/* Brand Column — full width on mobile */}
          <div className="col-span-2 lg:col-span-2 space-y-4 sm:space-y-5">
            <Link to="/" className="inline-flex items-center space-x-2.5">
              <img
                src="/flint.png"
                alt={`${settings.store_name} Logo`}
                className="h-8 sm:h-9 w-auto object-contain shrink-0"
              />
              <span className="font-brand text-xl sm:text-2xl font-bold tracking-[0.25em] text-[#0A0A0A] uppercase">
                {settings.store_name}
              </span>
            </Link>
            
            <p className="text-xs text-[#5C564E] max-w-sm leading-relaxed font-light">
              {settings.tagline ||
                'An architectural exploration of contemporary garments. Engineered with precision, restrained aesthetics, and sustainable luxury textiles.'}
            </p>

            {/* Policy Reassurance Line */}
            {(settings.is_returns_enabled || settings.is_exchanges_enabled) && (
              <div className="flex items-center space-x-2 text-[0.68rem] text-[#0A0A0A] font-medium tracking-wider uppercase pt-1">
                <RotateCcw size={13} className="text-[#736E65]" />
                <span>
                  {settings.is_returns_enabled ? `${settings.return_policy_days}-DAY RETURNS` : ''}
                  {settings.is_returns_enabled && settings.is_exchanges_enabled ? ' · ' : ''}
                  {settings.is_exchanges_enabled ? `${settings.exchange_policy_days}-DAY EXCHANGES` : ''}
                </span>
              </div>
            )}

            {/* Support Contact Info */}
            <div className="space-y-1.5 text-xs text-[#5C564E] font-light pt-1">
              {settings.support_email && (
                <div className="flex items-center space-x-2">
                  <Mail size={13} className="text-[#0A0A0A] shrink-0" />
                  <a href={`mailto:${settings.support_email}`} className="hover:text-[#0A0A0A] transition-colors">
                    {settings.support_email}
                  </a>
                </div>
              )}
              {settings.support_phone && (
                <div className="flex items-center space-x-2">
                  <Phone size={13} className="text-[#0A0A0A] shrink-0" />
                  <a href={`tel:${settings.support_phone}`} className="hover:text-[#0A0A0A] transition-colors">
                    {settings.support_phone}
                  </a>
                </div>
              )}
              {settings.company_address && (
                <div className="flex items-start space-x-2 pt-0.5">
                  <MapPin size={13} className="text-[#0A0A0A] shrink-0 mt-0.5" />
                  <span>{settings.company_address}</span>
                </div>
              )}
            </div>

            {/* Dynamic Social Icons */}
            {hasAnySocial && (
              <div className="pt-2 flex items-center space-x-4">
                {hasInstagram && (
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs text-[#0A0A0A] hover:opacity-75 transition-opacity font-medium tracking-[0.18em] uppercase"
                    title="Instagram"
                  >
                    <Instagram size={16} />
                    <span>INSTAGRAM</span>
                  </a>
                )}
                {hasFacebook && (
                  <a
                    href={socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs text-[#0A0A0A] hover:opacity-75 transition-opacity font-medium tracking-[0.18em] uppercase"
                    title="Facebook"
                  >
                    <Facebook size={16} />
                    <span>FACEBOOK</span>
                  </a>
                )}
                {hasTwitter && (
                  <a
                    href={socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs text-[#0A0A0A] hover:opacity-75 transition-opacity font-medium tracking-[0.18em] uppercase"
                    title="Twitter"
                  >
                    <Twitter size={16} />
                    <span>TWITTER</span>
                  </a>
                )}
                {hasYoutube && (
                  <a
                    href={socialLinks.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs text-[#0A0A0A] hover:opacity-75 transition-opacity font-medium tracking-[0.18em] uppercase"
                    title="YouTube"
                  >
                    <Youtube size={16} />
                    <span>YOUTUBE</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Column 1: Navigation */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-[0.7rem] font-semibold tracking-[0.25em] uppercase text-[#0A0A0A]">
              EXPLORE
            </h4>
            <ul className="space-y-2 sm:space-y-2.5 text-xs text-[#5C564E] font-light">
              <li>
                <Link to="/shop" className="hover:text-[#0A0A0A] transition-colors link-underline">
                  Shop All
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-[#0A0A0A] transition-colors link-underline">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#0A0A0A] transition-colors link-underline">
                  About Brand
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Client Services */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-[0.7rem] font-semibold tracking-[0.25em] uppercase text-[#0A0A0A]">
              CLIENT CARE
            </h4>
            <ul className="space-y-2 sm:space-y-2.5 text-xs text-[#5C564E] font-light">
              <li>
                <Link to="/contact" className="hover:text-[#0A0A0A] transition-colors link-underline">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="hover:text-[#0A0A0A] transition-colors link-underline">
                  Shipping & Delivery
                </Link>
              </li>
              <li>
                <Link to="/returns" className="hover:text-[#0A0A0A] transition-colors link-underline">
                  Returns & Exchanges
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-[0.7rem] font-semibold tracking-[0.25em] uppercase text-[#0A0A0A]">
              LEGAL & PRIVACY
            </h4>
            <ul className="space-y-2 sm:space-y-2.5 text-xs text-[#5C564E] font-light">
              <li>
                <Link to="/privacy" className="hover:text-[#0A0A0A] transition-colors link-underline">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[#0A0A0A] transition-colors link-underline">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between text-[0.65rem] tracking-[0.2em] text-[#736E65] uppercase gap-3 sm:gap-0">
          <p>© {new Date().getFullYear()} {settings.store_name.toUpperCase()}. ALL RIGHTS RESERVED.</p>
          <div className="flex items-center space-x-4 sm:space-x-5 font-medium">
            {hasInstagram && (
              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 text-[#0A0A0A] hover:opacity-70 transition-opacity"
              >
                <Instagram size={14} />
                <span>INSTAGRAM</span>
              </a>
            )}
            <span>•</span>
            <span>PARIS</span>
            <span>TOKYO</span>
            <span>NEW YORK</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
