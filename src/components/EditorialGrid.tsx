import React from 'react';
import { Link } from 'react-router-dom';
import { StorefrontBanner } from '../types/database.types';

interface EditorialGridProps {
  middleBanner?: StorefrontBanner | null;
}

export const EditorialGrid: React.FC<EditorialGridProps> = ({ middleBanner }) => {
  const mainImage = middleBanner?.image_url || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1600&auto=format&fit=crop";
  const mainTitle = middleBanner?.title || "MONOCHROME ESSENTIALS";
  const mainSubtitle = middleBanner?.subtitle || "CHAPTER I / CAMPAIGN HIGHLIGHT";
  const linkUrl = middleBanner?.link_url || "/shop";

  return (
    <section className="py-10 sm:py-14 md:py-16 bg-[#FAF9F6] hairline-b" aria-label="Middle Campaign Banner">
      <div className="container-editorial space-y-8 sm:space-y-10 md:space-y-12">
        {/* SECTION HEADER */}
        <div className="flex flex-col md:flex-row items-start justify-between pb-6 hairline-b gap-3 md:gap-0">
          <div>
            <span className="editorial-subtitle block mb-2">VOL. 01 / EDITORIAL</span>
            <h2 className="section-title uppercase">{mainTitle}</h2>
          </div>
          <p className="text-[0.7rem] sm:text-xs text-[#736E65] max-w-xs leading-relaxed font-light">
            EXPLORING STRUCTURAL FREEDOM THROUGH TIMELESS ARCHITECTURAL TAILORING AND HIGH-DENSITY ORGANIC WEAVES.
          </p>
        </div>

        {/* FULL-WIDTH BANNER */}
        <div className="w-full">
          <Link
            to={linkUrl}
            className="block w-full relative h-56 sm:h-72 md:h-96 lg:h-[440px] bg-[#F0EFEA] overflow-hidden hairline-all group"
          >
            <picture className="w-full h-full block">
              {middleBanner?.mobile_image_url && (
                <source media="(max-width: 767px)" srcSet={middleBanner.mobile_image_url} />
              )}
              <img
                src={mainImage}
                alt={mainTitle}
                loading="lazy"
                className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105"
              />
            </picture>
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent transition-opacity group-hover:opacity-90" />

            {/* Banner text — stacked on mobile, row on md+ */}
            <div className="absolute bottom-5 left-5 right-5 sm:bottom-8 sm:left-8 sm:right-8 text-white flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
              <div className="space-y-1.5 sm:space-y-2 max-w-xl">
                <span className="text-[0.6rem] sm:text-[0.65rem] tracking-[0.3em] uppercase font-medium text-[#FAF9F6]/80 block">
                  {mainSubtitle}
                </span>
                <h3 className="font-editorial text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-[#FAF9F6]">
                  {mainTitle}
                </h3>
              </div>
              <span className="inline-flex items-center px-5 py-2.5 sm:px-6 sm:py-3 text-[0.65rem] sm:text-xs bg-[#FAF9F6] text-[#0A0A0A] tracking-[0.2em] font-medium uppercase group-hover:bg-[#0A0A0A] group-hover:text-[#FAF9F6] transition-colors flex-shrink-0">
                DISCOVER CAMPAIGN
              </span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};
