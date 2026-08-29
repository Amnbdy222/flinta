import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { StorefrontBanner } from '../types/database.types';

interface EditorialHeroProps {
  banners?: StorefrontBanner[] | StorefrontBanner | null;
}

export const EditorialHero: React.FC<EditorialHeroProps> = ({ banners }) => {
  // Normalize input into an array of active banners
  const bannerList = useMemo(() => {
    if (Array.isArray(banners)) {
      return banners.filter((b) => b && b.is_active);
    }
    if (banners && banners.is_active) {
      return [banners];
    }
    return [];
  }, [banners]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const totalBanners = bannerList.length;

  const nextSlide = useCallback(() => {
    if (totalBanners > 1) {
      setCurrentIndex((prev) => (prev + 1) % totalBanners);
    }
  }, [totalBanners]);

  const prevSlide = useCallback(() => {
    if (totalBanners > 1) {
      setCurrentIndex((prev) => (prev - 1 + totalBanners) % totalBanners);
    }
  }, [totalBanners]);

  // Auto-rotate every 3 seconds (3000ms) continuously
  useEffect(() => {
    if (totalBanners <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalBanners);
    }, 3000);

    return () => clearInterval(timer);
  }, [totalBanners]);

  // Reset index if banner list changes
  useEffect(() => {
    if (currentIndex >= totalBanners && totalBanners > 0) {
      setCurrentIndex(0);
    }
  }, [totalBanners, currentIndex]);

  // Touch Swipe Handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    touchStartX.current = null;
  };

  const currentBanner = bannerList[currentIndex] || null;
  const bgImage =
    currentBanner?.image_url ||
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000&auto=format&fit=crop';
  const title = currentBanner?.title || 'PERMANENT FORM & SILHOUETTE';
  const subtitle = currentBanner?.subtitle || 'NEW SEASON';
  const linkUrl = currentBanner?.link_url || '/shop';

  return (
    <section
      className="relative w-full h-[calc(100vh-4rem)] sm:h-[calc(100vh-4.5rem)] flex items-center justify-center bg-[#0A0A0A] overflow-hidden select-none m-0 p-0"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* BACKGROUND IMAGE CAROUSEL WITH 3-SECOND FADE TRANSITION — FULL BLEED */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        {totalBanners > 0 ? (
          bannerList.map((b, idx) => {
            const isActive = idx === currentIndex;
            const bImg =
              b.image_url ||
              'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000&auto=format&fit=crop';

            return (
              <div
                key={b.id || idx}
                className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <picture className="w-full h-full block relative inset-0">
                  {b.mobile_image_url && (
                    <source media="(max-width: 767px)" srcSet={b.mobile_image_url} />
                  )}
                  <img
                    src={bImg}
                    alt={b.title || 'Hero Banner'}
                    className="w-full h-full min-w-full min-h-full object-cover object-center scale-105 transition-transform duration-7000 ease-out"
                    fetchPriority={idx === 0 ? 'high' : 'auto'}
                  />
                </picture>
                {/* DARK GRADIENT OVERLAY FOR HIGH CONTRAST & ZERO WHITE STRIP */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/25 z-10" />
              </div>
            );
          })
        ) : (
          <div className="absolute inset-0 w-full h-full">
            <img
              src={bgImage}
              alt={title}
              className="w-full h-full min-w-full min-h-full object-cover object-center"
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/25 z-10" />
          </div>
        )}
      </div>

      {/* CONTENT AREA */}
      <div className="relative z-20 container-editorial text-center max-w-4xl mx-auto space-y-5 sm:space-y-7 md:space-y-8 animate-fade-in px-5 sm:px-6">
        {/* SUBTITLE BADGE */}
        <div className="inline-block">
          <span className="text-[0.65rem] sm:text-[0.7rem] font-medium tracking-[0.3em] sm:tracking-[0.35em] uppercase border-b border-[#FAF9F6]/60 pb-1 text-[#FAF9F6]">
            {subtitle}
          </span>
        </div>

        {/* HEADLINE */}
        <h1 className="font-editorial text-[2.6rem] leading-[0.92] sm:text-5xl md:text-7xl lg:text-8xl font-light tracking-tight uppercase text-[#FAF9F6] drop-shadow-md">
          {title}
        </h1>

        {/* SHORT DESCRIPTION */}
        <p className="text-[0.8rem] sm:text-sm font-light max-w-xs sm:max-w-sm md:max-w-lg mx-auto leading-relaxed tracking-wide text-[#FAF9F6]/90">
          A study in minimalist tailoring, pristine textiles, and monochrome elegance. Designed for longevity and refined ease.
        </p>

        {/* CTA ROW — on mobile: arrows flank the button inline; on md+: just the button */}
        <div className="pt-4 md:pt-6 flex items-center justify-center gap-3">
          {/* LEFT ARROW — mobile only */}
          {totalBanners > 1 && (
            <button
              type="button"
              onClick={prevSlide}
              className="md:hidden shrink-0 p-3 bg-black/40 text-white hover:bg-white hover:text-black backdrop-blur-sm transition-all duration-300 hairline-all focus:outline-none cursor-pointer"
              aria-label="Previous"
            >
              <ChevronLeft size={18} strokeWidth={1.5} />
            </button>
          )}

          <Link
            to={linkUrl}
            className="inline-flex items-center justify-center px-8 py-4 text-xs font-medium tracking-[0.2em] uppercase transition-colors shrink-0 bg-[#FAF9F6] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#FAF9F6] shadow-lg"
          >
            DISCOVER COLLECTION
          </Link>

          {/* RIGHT ARROW — mobile only */}
          {totalBanners > 1 && (
            <button
              type="button"
              onClick={nextSlide}
              className="md:hidden shrink-0 p-3 bg-black/40 text-white hover:bg-white hover:text-black backdrop-blur-sm transition-all duration-300 hairline-all focus:outline-none cursor-pointer"
              aria-label="Next"
            >
              <ChevronRight size={18} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* CAROUSEL NAVIGATION CHEVRONS — desktop/tablet only (md+) */}
      {totalBanners > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            className="hidden md:block absolute left-8 top-1/2 -translate-y-1/2 z-30 p-3.5 bg-black/40 text-white hover:bg-white hover:text-black backdrop-blur-sm transition-all duration-300 hairline-all focus:outline-none cursor-pointer"
            aria-label="Previous Hero Banner"
          >
            <ChevronLeft size={20} strokeWidth={1.5} />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            className="hidden md:block absolute right-8 top-1/2 -translate-y-1/2 z-30 p-3.5 bg-black/40 text-white hover:bg-white hover:text-black backdrop-blur-sm transition-all duration-300 hairline-all focus:outline-none cursor-pointer"
            aria-label="Next Hero Banner"
          >
            <ChevronRight size={20} strokeWidth={1.5} />
          </button>

          {/* SLIDE INDICATOR PILLS */}
          <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-2.5">
            {bannerList.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                  currentIndex === idx
                    ? 'w-8 bg-[#FAF9F6]'
                    : 'w-2 bg-[#FAF9F6]/40 hover:bg-[#FAF9F6]/80'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* SCROLL INDICATOR — shown when single banner */}
      {totalBanners <= 1 && (
        <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-10 hidden md:flex flex-col items-center space-y-2 text-[#FAF9F6]/80">
          <span className="text-[0.6rem] tracking-[0.3em] uppercase">SCROLL</span>
          <ArrowDown size={14} className="animate-bounce" />
        </div>
      )}
    </section>
  );
};
