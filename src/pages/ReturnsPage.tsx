import React from 'react';
import { useStoreSettings } from '../context/StoreSettingsContext';

export const ReturnsPage: React.FC = () => {
  const { settings } = useStoreSettings();

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
          {settings.is_returns_enabled && (
            <div className="space-y-2">
              <h2 className="font-editorial text-2xl text-[#0A0A0A]">
                {settings.return_policy_days}-DAY COMPLIMENTARY RETURN WINDOW
              </h2>
              <p>
                If a garment does not meet your expectations, {settings.store_name} accepts return requests submitted within {settings.return_policy_days} calendar days from the date of delivery.
              </p>
            </div>
          )}

          {settings.is_exchanges_enabled && (
            <div className="space-y-2 pt-4 hairline-t">
              <h2 className="font-editorial text-2xl text-[#0A0A0A]">
                {settings.exchange_policy_days}-DAY SIZE & GARMENT EXCHANGE
              </h2>
              <p>
                Size or garment exchange requests are processed complimentary within {settings.exchange_policy_days} calendar days of delivery, subject to inventory availability.
              </p>
            </div>
          )}

          <div className="space-y-2 pt-4 hairline-t">
            <h2 className="font-editorial text-2xl text-[#0A0A0A]">RETURN CONDITIONS</h2>
            <p>To qualify for a refund or size exchange:</p>
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
