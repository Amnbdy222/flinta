import React, { useState, useEffect } from 'react';
import { Coupon } from '../types/database.types';
import { fetchActiveCoupons } from '../services/couponService';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { Tag, Sparkles } from 'lucide-react';

export const PromoCouponsSection: React.FC = () => {
  const { settings } = useStoreSettings();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveCoupons()
      .then((data) => setCoupons(data))
      .catch((err) => console.error('Error loading homepage coupons:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || coupons.length === 0) return null;

  return (
    <section className="relative py-8 sm:py-10 md:py-12 bg-[#FAF9F6] border-y border-[#0A0A0A]/10 text-[#0A0A0A] overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#0A0A0A_1px,transparent_1px)] [background-size:20px_20px]" />

      <div className="relative container-editorial max-w-5xl mx-auto">
        {/* SECTION HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 sm:pb-5 hairline-b border-b border-[#0A0A0A]/15 gap-2 sm:gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 text-[0.6rem] font-medium tracking-[0.3em] uppercase text-[#736E65] bg-[#0A0A0A]/5 px-2.5 py-0.5 border border-[#0A0A0A]/10">
              <Sparkles size={11} className="text-[#C5A059]" />
              <span>✦ MAISON PRIVILEGES & PROMOTIONS ✦</span>
            </div>
            <h2 className="font-editorial text-xl sm:text-2xl md:text-3xl font-light uppercase tracking-tight text-[#0A0A0A]">
              ACTIVE PROMOTIONAL CODES
            </h2>
          </div>
        </div>

        {/* COUPON CARDS — horizontal scroll on mobile, grid on sm+ */}
        <div className="pt-4 sm:pt-5">
          {/* Mobile: snap horizontal scroll */}
          <div className="flex sm:hidden gap-3 overflow-x-auto snap-x snap-mandatory pb-3 -mx-4 px-4 no-scrollbar">
            {coupons.map((c) => {
              const isPercent = c.discount_type === 'percentage';
              const offerText = isPercent ? `${c.discount_value}% OFF` : `${settings.currency_symbol}${c.discount_value} OFF`;
              return (
                <div
                  key={c.id || c.code}
                  className="relative bg-white border border-[#0A0A0A]/15 flex flex-col overflow-hidden snap-start flex-shrink-0 w-[72vw] max-w-[260px] p-4 space-y-3"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0A0A0A] via-[#C5A059] to-[#0A0A0A]" />
                  <div className="flex items-center justify-between pt-1">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-[#0A0A0A] text-[#FAF9F6] text-[0.6rem] font-medium tracking-[0.2em] uppercase">
                      <Tag size={10} className="text-[#C5A059]" />
                      <span>{offerText}</span>
                    </span>
                    {c.maximum_discount && c.maximum_discount > 0 && (
                      <span className="text-[0.55rem] tracking-wider text-[#736E65] uppercase bg-[#FAF9F6] px-1.5 py-0.5 border border-[#0A0A0A]/10">
                        MAX {settings.currency_symbol}{c.maximum_discount}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[0.55rem] tracking-[0.25em] text-[#736E65] uppercase block font-medium">PROMO CODE</span>
                    <div className="flex items-center justify-between bg-[#FAF9F6] border border-[#0A0A0A]/10 px-3 py-2">
                      <span className="font-brand text-lg font-bold tracking-[0.2em] text-[#0A0A0A]">{c.code}</span>
                      <Sparkles size={13} className="text-[#C5A059] opacity-50" />
                    </div>
                  </div>
                  <p className="text-[0.65rem] text-[#736E65] font-light leading-snug tracking-wide">
                    {c.minimum_order_value > 0 ? `Min. order ${settings.currency_symbol}${c.minimum_order_value.toLocaleString()}` : 'No minimum order required.'}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Tablet / Desktop: standard grid */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map((c) => {
              const isPercent = c.discount_type === 'percentage';
              const offerText = isPercent ? `${c.discount_value}% OFF` : `${settings.currency_symbol}${c.discount_value} OFF`;
              return (
                <div
                  key={c.id || c.code}
                  className="relative bg-white border border-[#0A0A0A]/15 shadow-2xs hover:border-[#0A0A0A] transition-all duration-300 flex flex-col justify-between overflow-hidden group p-4 sm:p-5 space-y-3"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0A0A0A] via-[#C5A059] to-[#0A0A0A]" />
                  <div className="flex items-center justify-between pt-1">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-[#0A0A0A] text-[#FAF9F6] text-[0.6rem] font-medium tracking-[0.2em] uppercase">
                      <Tag size={10} className="text-[#C5A059]" />
                      <span>{offerText}</span>
                    </span>
                    {c.maximum_discount && c.maximum_discount > 0 && (
                      <span className="text-[0.55rem] tracking-wider text-[#736E65] uppercase bg-[#FAF9F6] px-1.5 py-0.5 border border-[#0A0A0A]/10">
                        MAX {settings.currency_symbol}{c.maximum_discount}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[0.55rem] tracking-[0.25em] text-[#736E65] uppercase block font-medium">PROMO CODE</span>
                    <div className="flex items-center justify-between bg-[#FAF9F6] border border-[#0A0A0A]/10 px-3 py-2">
                      <span className="font-brand text-lg sm:text-xl font-bold tracking-[0.2em] text-[#0A0A0A]">{c.code}</span>
                      <Sparkles size={14} className="text-[#C5A059] opacity-50" />
                    </div>
                  </div>
                  <p className="text-[0.7rem] text-[#736E65] font-light leading-snug tracking-wide pt-0.5">
                    {c.minimum_order_value > 0
                      ? `Valid on orders of ${settings.currency_symbol}${c.minimum_order_value.toLocaleString()} or more.`
                      : 'No minimum order value required.'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
