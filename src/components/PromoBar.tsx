import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { fetchStorefrontBanners } from '../services/bannerService';
import { StorefrontBanner } from '../types/database.types';
import { useStoreSettings } from '../context/StoreSettingsContext';

export const PromoBar: React.FC = () => {
  const { settings } = useStoreSettings();
  const [promoBanner, setPromoBanner] = useState<StorefrontBanner | null>(null);

  useEffect(() => {
    fetchStorefrontBanners('promo_bar').then((banners) => {
      if (banners && banners.length > 0) {
        setPromoBanner(banners[0]);
      }
    });
  }, []);

  // Check store settings announcement bar switch
  if (!settings.announcement_bar_enabled) return null;

  const announcementText =
    settings.announcement_bar_text ||
    `Free shipping on all orders over ${settings.currency_symbol}${settings.free_shipping_threshold}!`;

  const hasImage = Boolean(promoBanner?.image_url && promoBanner.image_url.trim() !== '');

  const hasCustomOverlayText = Boolean(
    promoBanner?.title && promoBanner.title.trim() !== ''
  );

  const bannerInner = (
    <div className="relative w-full overflow-hidden group border-y border-[#0A0A0A]/10 bg-[#FAF9F6] my-4 sm:my-8">
      {hasImage && promoBanner ? (
        /* VISUAL ANNOUNCEMENT BANNER WITH UPLOADED IMAGE */
        <div className="relative w-full h-36 xs:h-44 sm:h-56 md:h-64 lg:h-72 bg-[#FAF9F6] flex items-center justify-center overflow-hidden">
          <picture className="w-full h-full block">
            {promoBanner.mobile_image_url && (
              <source media="(max-width: 767px)" srcSet={promoBanner.mobile_image_url} />
            )}
            <img
              src={promoBanner.image_url}
              alt={promoBanner.title || 'Maison Announcement'}
              className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.015]"
            />
          </picture>

          {/* Subtly overlay custom title only if explicitly provided */}
          {hasCustomOverlayText ? (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 z-10 container-editorial pb-4 sm:pb-6 px-4 sm:px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
                <div className="space-y-1 max-w-lg text-left">
                  <h3 className="font-editorial text-lg sm:text-2xl md:text-3xl font-light uppercase tracking-tight text-[#FAF9F6] drop-shadow-md">
                    {promoBanner.title}
                  </h3>
                  {promoBanner.subtitle && (
                    <p className="text-[0.65rem] sm:text-xs tracking-[0.2em] text-[#FAF9F6]/80 font-light uppercase">
                      {promoBanner.subtitle}
                    </p>
                  )}
                </div>

                {promoBanner.link_url && (
                  <span className="btn-editorial-primary text-[0.6rem] sm:text-xs bg-[#FAF9F6] text-[#0A0A0A] px-4 py-2 sm:px-6 sm:py-3 tracking-[0.2em] font-medium uppercase group-hover:bg-[#0A0A0A] group-hover:text-[#FAF9F6] transition-colors flex items-center space-x-1.5 sm:space-x-2 shrink-0 shadow-xl">
                    <span>EXPLORE COLLECTION</span>
                    <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </div>
            </>
          ) : (
            /* Floating CTA button for clean image banners */
            promoBanner.link_url && (
              <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10">
                <span className="btn-editorial-primary text-[0.6rem] sm:text-xs bg-[#0A0A0A]/90 backdrop-blur-md text-[#FAF9F6] px-3.5 py-1.5 sm:px-5 sm:py-2.5 tracking-[0.2em] font-medium uppercase group-hover:bg-[#0A0A0A] transition-colors flex items-center space-x-1.5 shadow-lg border border-white/20">
                  <span>SHOP NOW</span>
                  <ArrowRight size={11} className="transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            )
          )}
        </div>
      ) : (
        /* MINIMALIST EDITORIAL PROMO STRIP */
        <div className="bg-[#0A0A0A] text-[#FAF9F6] py-3.5 sm:py-4 px-5 sm:px-6 text-center transition-colors group-hover:bg-[#141414]">
          <div className="container-editorial flex items-center justify-center space-x-3 text-[0.68rem] sm:text-xs tracking-[0.25em] sm:tracking-[0.3em] uppercase font-medium">
            <Sparkles size={12} className="text-amber-300 shrink-0" />
            <span>{announcementText}</span>
          </div>
        </div>
      )}
    </div>
  );

  return promoBanner?.link_url ? (
    <Link to={promoBanner.link_url} className="block w-full z-20 relative">
      {bannerInner}
    </Link>
  ) : (
    <div className="z-20 relative">{bannerInner}</div>
  );
};
