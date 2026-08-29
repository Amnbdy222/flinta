import React from 'react';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { Wrench, Mail, Phone } from 'lucide-react';

export const MaintenancePage: React.FC = () => {
  const { settings } = useStoreSettings();

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0A0A0A] flex flex-col justify-between p-6 sm:p-12 font-sans selection:bg-[#0A0A0A] selection:text-[#FAF9F6]">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-[#0A0A0A]/10 pb-6">
        <div className="flex items-center space-x-2.5">
          <img src="/flint.png" alt="FLINT A" className="h-8 w-auto object-contain" />
          <span className="font-brand text-xl sm:text-2xl font-bold tracking-[0.25em] uppercase">
            {settings.store_name}
          </span>
        </div>
        <span className="text-[0.65rem] tracking-[0.25em] uppercase font-medium text-[#736E65]">
          MAINTENANCE MODE
        </span>
      </div>

      {/* CENTER CONTENT */}
      <div className="max-w-xl mx-auto text-center space-y-6 py-16 sm:py-24">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#0A0A0A] text-[#FAF9F6] mb-2 shadow-lg">
          <Wrench size={24} />
        </div>

        <span className="editorial-subtitle block">MAISON UPDATE IN PROGRESS</span>

        <h1 className="font-editorial text-3xl sm:text-5xl font-light uppercase tracking-tight leading-tight">
          CURATING THE NEXT ARCHIVE
        </h1>

        <p className="text-xs sm:text-sm text-[#736E65] font-light leading-relaxed max-w-md mx-auto">
          Our online storefront is currently undergoing scheduled updates to refine your client experience. We will be back shortly.
        </p>

        {/* Contact info during maintenance */}
        <div className="pt-6 border-t border-[#0A0A0A]/10 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-[#383531]">
          {settings.support_email && (
            <a
              href={`mailto:${settings.support_email}`}
              className="inline-flex items-center space-x-2 text-[#736E65] hover:text-[#0A0A0A] transition-colors"
            >
              <Mail size={14} />
              <span>{settings.support_email}</span>
            </a>
          )}
          {settings.support_phone && (
            <a
              href={`tel:${settings.support_phone}`}
              className="inline-flex items-center space-x-2 text-[#736E65] hover:text-[#0A0A0A] transition-colors"
            >
              <Phone size={14} />
              <span>{settings.support_phone}</span>
            </a>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="border-t border-[#0A0A0A]/10 pt-6 text-center text-[0.65rem] tracking-[0.2em] text-[#736E65] uppercase">
        <p>© {new Date().getFullYear()} {settings.store_name.toUpperCase()}. ALL RIGHTS RESERVED.</p>
      </div>
    </div>
  );
};
