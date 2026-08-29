import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram } from 'lucide-react';

export const Footer: React.FC = () => {
  const instagramUrl = "https://www.instagram.com/flint_a_india?utm_source=ig_web_button_share_sheet&igsi=ZDNlZDc0MzIxNw==";

  return (
    <footer className="bg-[#F8EFE8] text-[#0A0A0A] pt-14 sm:pt-16 md:pt-20 pb-10 md:pb-12 hairline-t border-t border-[#0A0A0A]/10">
      <div className="container-editorial">
        {/* Main grid: 2-col on mobile (brand + one col), then full on lg */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 md:gap-12 pb-12 md:pb-16 hairline-b border-b border-[#0A0A0A]/10">

          {/* Brand Column — full width on mobile */}
          <div className="col-span-2 lg:col-span-2 space-y-4 sm:space-y-6">
            <Link to="/" className="inline-flex items-center space-x-2.5">
              <img
                src="/flint.png"
                alt="FLINT A Logo"
                className="h-8 sm:h-9 w-auto object-contain shrink-0"
              />
              <span className="font-brand text-xl sm:text-2xl font-bold tracking-[0.25em] text-[#0A0A0A] uppercase">
                FLINT A
              </span>
            </Link>
            <p className="text-xs text-[#5C564E] max-w-sm leading-relaxed font-light">
              An architectural exploration of contemporary garments. Engineered with precision, restrained aesthetics, and sustainable luxury textiles.
            </p>
            <div className="pt-1 flex items-center space-x-4">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-xs text-[#0A0A0A] hover:opacity-75 transition-opacity font-medium tracking-[0.2em] uppercase"
              >
                <Instagram size={16} />
                <span>INSTAGRAM @FLINT_A_INDIA</span>
              </a>
            </div>
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
          <p>© {new Date().getFullYear()} FLINT STUDIO. ALL RIGHTS RESERVED.</p>
          <div className="flex items-center space-x-4 sm:space-x-5 font-medium">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 text-[#0A0A0A] hover:opacity-70 transition-opacity"
            >
              <Instagram size={14} />
              <span>@FLINT_A_INDIA</span>
            </a>
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
