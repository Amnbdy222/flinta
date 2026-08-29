import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { fetchStorefrontBanners } from '../services/bannerService';
import { StorefrontBanner } from '../types/database.types';

export const PromoBar: React.FC = () => {
  const [promoBanner, setPromoBanner] = useState<StorefrontBanner | null>(null);

  useEffect(() => {
    fetchStorefrontBanners('promo_bar').then((banners) => {
      if (banners && banners.length > 0) {
        setPromoBanner(banners[0]);
      }
    });
  }, []);

  if (!promoBanner || !promoBanner.is_active) return null;

  const hasImage = Boolean(promoBanner.image_url && promoBanner.image_url.trim() !== '');

  const bannerInner = (
    <div className="relative w-full overflow-hidden group hairline-t hairline-b my-6 sm:my-8">
      {hasImage ? (
        /* VISUAL ANNOUNCEMENT BANNER WITH UPLOADED IMAGE */
        <div className="relative w-full h-48 sm:h-56 md:h-64 lg:h-[280px] bg-[#0A0A0A] flex items-center justify-center overflow-hidden">
          <picture className="absolute inset-0 w-full h-full block">
            {promoBanner.mobile_image_url && (
              <source media="(max-width: 767px)" srcSet={promoBanner.mobile_image_url} />
            )}
            <img
              src={promoBanner.image_url}
              alt={promoBanner.title || 'Announcement'}
              className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/80" />

          <div className="relative z-10 container-editorial flex flex-col md:flex-row items-center justify-between gap-5 md:gap-6 px-5 sm:px-6 text-center md:text-left w-full">
            <div className="space-y-1.5 sm:space-y-2 max-w-xl">
              <div className="flex items-center justify-center md:justify-start space-x-2">
                <Sparkles size={13} className="text-[#FAF9F6] animate-pulse" />
                <span className="text-[0.65rem] tracking-[0.3em] font-medium uppercase text-[#FAF9F6]/90 block">
                  EXCLUSIVE ANNOUNCEMENT
                </span>
              </div>
              <h3 className="font-editorial text-xl sm:text-2xl md:text-3xl lg:text-4xl font-light uppercase tracking-tight text-[#FAF9F6] drop-shadow-md">
                {promoBanner.title}
              </h3>
              {promoBanner.subtitle && (
                <p className="text-[0.7rem] sm:text-xs tracking-[0.2em] text-[#FAF9F6]/80 font-light">
                  {promoBanner.subtitle}
                </p>
              )}
            </div>

            {promoBanner.link_url && (
              <span className="btn-editorial-primary text-[0.65rem] sm:text-xs bg-[#FAF9F6] text-[#0A0A0A] px-5 py-2.5 sm:px-6 sm:py-3 tracking-[0.2em] font-medium uppercase group-hover:bg-[#0A0A0A] group-hover:text-[#FAF9F6] transition-colors flex items-center space-x-2 flex-shrink-0 shadow-lg">
                <span>SHOP THIS COLLECTION</span>
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
              </span>
            )}
          </div>
        </div>
      ) : (
        /* MINIMALIST EDITORIAL PROMO STRIP */
        <div className="bg-[#0A0A0A] text-[#FAF9F6] py-4 sm:py-6 px-5 sm:px-6 text-center transition-colors group-hover:bg-[#141414]">
          <div className="container-editorial flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-0 sm:space-x-4 text-[0.7rem] sm:text-xs tracking-[0.25em] sm:tracking-[0.3em] uppercase font-medium">
            <span>{promoBanner.title}</span>
            {promoBanner.subtitle && (
              <span className="text-[#FAF9F6]/70 font-light sm:before:content-['•'] sm:before:mr-4">
                {promoBanner.subtitle}
              </span>
            )}
            {promoBanner.link_url && (
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1 hidden sm:block" />
            )}
          </div>
        </div>
      )}
    </div>
  );

  return promoBanner.link_url ? (
    <Link to={promoBanner.link_url} className="block w-full z-50 relative">
      {bannerInner}
    </Link>
  ) : (
    <div className="z-50 relative">{bannerInner}</div>
  );
};
