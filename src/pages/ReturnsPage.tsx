import React from 'react';

export const ReturnsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-32 pb-24 text-[#0A0A0A]">
      <div className="container-editorial max-w-3xl mx-auto space-y-12">
        <div className="text-center space-y-4 pb-12 hairline-b">
          <span className="editorial-subtitle block">CLIENT GUARANTEE</span>
          <h1 className="font-editorial text-4xl md:text-6xl font-light uppercase tracking-tight">
            RETURNS & EXCHANGES
          </h1>
        </div>

        <div className="space-y-8 text-xs font-light text-[#383531] leading-relaxed">
          <div className="space-y-2">
            <h2 className="font-editorial text-2xl text-[#0A0A0A]">14-DAY COMPLIMENTARY RETURN WINDOW</h2>
            <p>
              If a garment does not meet your expectations, FLINT accepts return requests submitted within 14 calendar days from the date of delivery.
            </p>
          </div>

          <div className="space-y-2 pt-4 hairline-t">
            <h2 className="font-editorial text-2xl text-[#0A0A0A]">RETURN CONDITIONS</h2>
            <p>To qualify for a full refund or size exchange:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Garments must be unworn, unwashed, and unaltered.</li>
              <li>All original security tags and fabric labels must remain intact.</li>
              <li>Items must be returned inside the original protective packaging.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
