import React from 'react';

export const ShippingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-32 pb-24 text-[#0A0A0A]">
      <div className="container-editorial max-w-3xl mx-auto space-y-12">
        <div className="text-center space-y-4 pb-12 hairline-b">
          <span className="editorial-subtitle block">LOGISTICS POLICY</span>
          <h1 className="font-editorial text-4xl md:text-6xl font-light uppercase tracking-tight">
            SHIPPING & DELIVERY
          </h1>
        </div>

        <div className="space-y-8 text-xs font-light text-[#383531] leading-relaxed">
          <div className="space-y-2">
            <h2 className="font-editorial text-2xl text-[#0A0A0A]">EXPRESS GLOBAL DISPATCH</h2>
            <p>
              All FLINT garments are packed in eco-conscious, recyclable archival boxes. Orders placed before 14:00 CET are dispatched on the same business day from our distribution facility.
            </p>
          </div>

          <div className="space-y-2 pt-4 hairline-t">
            <h2 className="font-editorial text-2xl text-[#0A0A0A]">DELIVERY TIMELINES</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Standard Domestic Courier (3-5 Business Days): Complimentary</li>
              <li>Express Priority Air (1-2 Business Days): $25.00 USD</li>
              <li>International Express Air (2-4 Business Days): $35.00 USD</li>
            </ul>
          </div>

          <div className="space-y-2 pt-4 hairline-t">
            <h2 className="font-editorial text-2xl text-[#0A0A0A]">DUTIES & TAXES</h2>
            <p>
              All international shipments are sent Delivery Duty Paid (DDP). All relevant import duties and local taxes are calculated and included at checkout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
