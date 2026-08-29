import React from 'react';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-32 pb-24 text-[#0A0A0A]">
      <div className="container-editorial max-w-3xl mx-auto space-y-12">
        <div className="text-center space-y-4 pb-12 hairline-b">
          <span className="editorial-subtitle block">TERMS OF SERVICE</span>
          <h1 className="font-editorial text-4xl md:text-6xl font-light uppercase tracking-tight">
            TERMS & CONDITIONS
          </h1>
        </div>

        <div className="space-y-6 text-xs font-light text-[#383531] leading-relaxed">
          <p>
            By accessing and utilizing the FLINT storefront, you agree to abide by our digital terms of service. All imagery, garment designs, and editorial texts remain the exclusive property of FLINT Studio.
          </p>
          <p>
            All products are subject to inventory availability. FLINT reserves the right to modify pricing, garment descriptions, and campaign visual assets without prior notification.
          </p>
        </div>
      </div>
    </div>
  );
};
