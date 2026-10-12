import React from 'react';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { SEO } from '../components/SEO';

export const ShippingPage: React.FC = () => {
  const { settings } = useStoreSettings();

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-32 pb-24 text-[#0A0A0A]">
      <SEO
        title="Shipping & Delivery Policy"
        description={`Learn about ${settings.store_name} shipping rates, delivery timelines, and complimentary dispatch.`}
        canonicalUrl="https://flintaindia.com/shipping"
      />
      <div className="container-editorial max-w-3xl mx-auto space-y-12">
        <div className="text-center space-y-4 pb-12 hairline-b">
          <span className="editorial-subtitle block">LOGISTICS POLICY</span>
          <h1 className="font-editorial text-4xl md:text-6xl font-light uppercase tracking-tight">
            SHIPPING & DELIVERY
          </h1>
        </div>

        <div className="space-y-8 text-xs font-light text-[#383531] leading-relaxed">
          <div className="space-y-2">
            <h2 className="font-editorial text-2xl text-[#0A0A0A]">EXPRESS DISPATCH</h2>
            <p>
              All {settings.store_name} garments are packed in eco-conscious, recyclable archival boxes. Orders placed before 14:00 are dispatched on the same business day from our main fulfillment center.
            </p>
          </div>

          <div className="space-y-2 pt-4 hairline-t">
            <h2 className="font-editorial text-2xl text-[#0A0A0A]">DELIVERY RATES & THRESHOLDS</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Orders of {settings.currency_symbol}{settings.free_shipping_threshold} or more:{' '}
                <strong className="font-medium text-[#0A0A0A]">COMPLIMENTARY FREE SHIPPING</strong>
              </li>
              <li>
                Standard Shipping (Below {settings.currency_symbol}{settings.free_shipping_threshold}):{' '}
                <strong className="font-medium text-[#0A0A0A]">{settings.currency_symbol}{settings.flat_shipping_rate.toFixed(2)}</strong>
              </li>
              {settings.cod_enabled && (
                <li>
                  Cash on Delivery (COD): Available
                  {settings.cod_extra_charge > 0 && ` (${settings.currency_symbol}${settings.cod_extra_charge.toFixed(2)} handling fee)`}
                </li>
              )}
            </ul>
          </div>

          <div className="space-y-2 pt-4 hairline-t">
            <h2 className="font-editorial text-2xl text-[#0A0A0A]">DUTIES & TAXES</h2>
            <p>
              All shipments are sent fully insured. GST and applicable local taxes are calculated and included at checkout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
