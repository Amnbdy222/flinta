import React from 'react';
import { SEO } from '../components/SEO';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-32 pb-24 text-[#0A0A0A]">
      <SEO
        title="Privacy Policy"
        description="Review the FLINT privacy policy, data protection, and secure transaction handling standards."
        canonicalUrl="https://flintaindia.com/privacy"
      />
      <div className="container-editorial max-w-3xl mx-auto space-y-12">
        <div className="text-center space-y-4 pb-12 hairline-b">
          <span className="editorial-subtitle block">LEGAL PROTOCOL</span>
          <h1 className="font-editorial text-4xl md:text-6xl font-light uppercase tracking-tight">
            PRIVACY POLICY
          </h1>
        </div>

        <div className="space-y-6 text-xs font-light text-[#383531] leading-relaxed">
          <p>
            FLINT values client privacy. We collect minimal personal data required to fulfill orders, process secure transactions, and maintain your account archives.
          </p>
          <p>
            We do not sell, rent, or trade client information with third-party marketing entities under any circumstances. All payment processing is encrypted with enterprise-grade SSL protocols.
          </p>
        </div>
      </div>
    </div>
  );
};
