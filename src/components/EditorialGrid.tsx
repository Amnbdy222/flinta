import React from 'react';
import { Link } from 'react-router-dom';
import { StorefrontBanner } from '../types/database.types';

interface EditorialGridProps {
  middleBanner?: StorefrontBanner | null;
}

export const EditorialGrid: React.FC<EditorialGridProps> = ({ middleBanner }) => {
  // If no banner exists or is inactive, don't render placeholder
  if (!middleBanner?.image_url) {
    return null;
  }

  const mainImage = middleBanner.image_url;
  const mobileImage = middleBanner.mobile_image_url;
  const title = middleBanner.title?.trim();
  const subtitle = middleBanner.subtitle?.trim();
  const linkUrl = middleBanner.link_url || "/shop";
  const hasTextOverlay = Boolean(title || subtitle);

  return (
    <section className="py-8 sm:py-12 md:py-16 bg-[#FAF9F6] hairline-b" aria-label="Campaign Banner">
      <div className="container-editorial space-y-6 sm:space-y-8">
        {/* OPTIONAL SECTION HEADER (Only when a custom title is provided in admin) */}
        {title && (
          <div className="flex flex-col md:flex-row items-start justify-between pb-4 sm:pb-6 hairline-b gap-2 md:gap-0">
            <div>
              <span className="editorial-subtitle block mb-1.5">✦ CAMPAIGN EDITORIAL ✦</span>
              <h2 className="section-title uppercase">{title}</h2>
            </div>
            {subtitle && (
              <p className="text-[0.7rem] sm:text-xs text-[#736E65] max-w-xs leading-relaxed font-light">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* FULL-WIDTH RESPONSIVE BANNER (Zero cropping, natural aspect ratio) */}
        <div className="w-full">
          <Link
            to={linkUrl}
            className="block w-full relative overflow-hidden hairline-all group transition-shadow duration-300 hover:shadow-md"
            aria-label={title || "View Campaign"}
          >
            <picture className="w-full block">
              {mobileImage && (
                <source media="(max-width: 767px)" srcSet={mobileImage} />
              )}
              <img
                src={mainImage}
                alt={title || "Campaign Editorial Banner"}
                loading="lazy"
                className="w-full h-auto block object-contain transition-transform duration-700 ease-out md:group-hover:scale-[1.01]"
              />
            </picture>

            {/* Text overlay & gradient only if title/subtitle is explicitly set */}
            {hasTextOverlay && (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent transition-opacity group-hover:opacity-90 pointer-events-none" />
                <div className="absolute bottom-5 left-5 right-5 sm:bottom-8 sm:left-8 sm:right-8 text-white flex flex-col md:flex-row items-start md:items-end justify-between gap-4 pointer-events-none">
                  <div className="space-y-1.5 sm:space-y-2 max-w-xl">
                    {subtitle && (
                      <span className="text-[0.6rem] sm:text-[0.65rem] tracking-[0.3em] uppercase font-medium text-[#FAF9F6]/80 block">
                        {subtitle}
                      </span>
                    )}
                    {title && (
                      <h3 className="font-editorial text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-[#FAF9F6]">
                        {title}
                      </h3>
                    )}
                  </div>
                  <span className="inline-flex items-center px-5 py-2.5 sm:px-6 sm:py-3 text-[0.65rem] sm:text-xs bg-[#FAF9F6] text-[#0A0A0A] tracking-[0.2em] font-medium uppercase group-hover:bg-[#0A0A0A] group-hover:text-[#FAF9F6] transition-colors flex-shrink-0">
                    DISCOVER CAMPAIGN
                  </span>
                </div>
              </>
            )}
          </Link>
        </div>
      </div>
    </section>
  );
};
