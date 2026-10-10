import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { StorefrontBanner } from '../types/database.types';

interface EditorialHeroProps {
  banners?: StorefrontBanner[] | StorefrontBanner | null;
  loading?: boolean;
}

export const EditorialHero: React.FC<EditorialHeroProps> = ({ banners, loading = false }) => {
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
  const [isInitialImageReady, setIsInitialImageReady] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const firstImgRef = useRef<HTMLImageElement | null>(null);
  const totalBanners = bannerList.length;

  // The hero is ready when data fetching is complete AND (we have no banners OR the first image has loaded)
  const isReady = !loading && (totalBanners === 0 || isInitialImageReady);

  // Check if first image is already cached / completed
  useEffect(() => {
    if (firstImgRef.current && firstImgRef.current.complete && firstImgRef.current.naturalWidth > 0) {
      setIsInitialImageReady(true);
    }
  }, [bannerList]);

  // Safety fallback so skeleton never hangs forever if image fails or network is slow
  useEffect(() => {
    if (bannerList.length > 0 && !isInitialImageReady) {
      const timer = setTimeout(() => {
        setIsInitialImageReady(true);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [bannerList, isInitialImageReady]);

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

  // Auto-rotate every 3 seconds (3000ms) continuously once ready
  useEffect(() => {
    if (!isReady || totalBanners <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalBanners);
    }, 3000);

    return () => clearInterval(timer);
  }, [totalBanners, isReady]);

  // Reset index if banner list changes
  useEffect(() => {
    if (currentIndex >= totalBanners && totalBanners > 0) {
      setCurrentIndex(0);
    }
  }, [totalBanners, currentIndex]);

  // Touch Swipe Handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isReady) return;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isReady || touchStartX.current === null) return;
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
  const bgImage = currentBanner?.image_url || '';
  const title = currentBanner?.title || 'PERMANENT FORM & SILHOUETTE';
  const subtitle = currentBanner?.subtitle || 'NEW SEASON';
  const linkUrl = currentBanner?.link_url || '/shop';

  return (
    <section
      className="relative w-full h-[calc(100vh-4rem)] sm:h-[calc(100vh-4.5rem)] flex items-center justify-center bg-[#0D0D0D] overflow-hidden select-none m-0 p-0"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 1. EDITORIAL SKELETON LOADER OVERLAY (Active during data fetch & initial image decoding) */}
      <div
        className={`absolute inset-0 z-30 flex items-center justify-center bg-[#0D0D0D] transition-opacity duration-700 ease-out ${
          isReady ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        aria-hidden={isReady}
        aria-label="Loading Hero Banner"
      >
        {/* Subtle shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-pulse pointer-events-none" />

        {/* Content Skeleton */}
        <div className="relative z-10 text-center max-w-4xl mx-auto space-y-3 sm:space-y-5 md:space-y-6 px-4 sm:px-6 w-full flex flex-col items-center">
          {/* Subtitle badge skeleton */}
          <div className="h-2.5 sm:h-3 w-20 sm:w-28 bg-white/10 rounded-full animate-pulse" />

          {/* Main Headline skeleton */}
          <div className="space-y-2 w-full flex flex-col items-center">
            <div className="h-6 sm:h-10 md:h-14 w-52 sm:w-80 md:w-96 bg-white/10 rounded-sm animate-pulse" />
            <div className="h-5 sm:h-8 md:h-10 w-40 sm:w-64 md:w-80 bg-white/10 rounded-sm animate-pulse" />
          </div>

          {/* Short description skeleton */}
          <div className="h-2.5 sm:h-3 w-44 sm:w-72 bg-white/5 rounded-full animate-pulse" />

          {/* Button skeleton */}
          <div className="pt-2 sm:pt-4">
            <div className="h-9 sm:h-11 w-36 sm:w-48 bg-white/10 rounded-sm animate-pulse" />
          </div>
        </div>

        {/* Bottom slide pills skeleton */}
        <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-2">
          <div className="h-1 sm:h-1.5 w-6 bg-white/20 rounded-full animate-pulse" />
          <div className="h-1 sm:h-1.5 w-2 bg-white/10 rounded-full animate-pulse" />
          <div className="h-1 sm:h-1.5 w-2 bg-white/10 rounded-full animate-pulse" />
        </div>
      </div>

      {/* 2. REAL HERO BANNER CAROUSEL & CONTENT (Smoothly fades in once initial image is ready) */}
      <div
        className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-out ${
          isReady ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* BACKGROUND IMAGE CAROUSEL WITH 3-SECOND FADE TRANSITION — FULL BLEED */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
          {totalBanners > 0 ? (
            bannerList.map((b, idx) => {
              const isActive = idx === currentIndex;
              const bImg = b.image_url;

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
                      ref={idx === 0 ? firstImgRef : undefined}
                      src={bImg}
                      alt={b.title || 'Hero Banner'}
                      className="w-full h-full min-w-full min-h-full object-cover object-center scale-105 transition-transform duration-7000 ease-out"
                      fetchPriority={idx === 0 ? 'high' : 'auto'}
                      loading={idx === 0 ? 'eager' : 'lazy'}
                      onLoad={idx === 0 ? () => setIsInitialImageReady(true) : undefined}
                    />
                  </picture>
                  {/* DARK GRADIENT OVERLAY FOR HIGH CONTRAST & ZERO WHITE STRIP */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20 z-10" />
                </div>
              );
            })
          ) : (
            <div className="absolute inset-0 w-full h-full bg-[#0D0D0D]">
              {bgImage && (
                <img
                  src={bgImage}
                  alt={title}
                  className="w-full h-full min-w-full min-h-full object-cover object-center"
                  fetchPriority="high"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20 z-10" />
            </div>
          )}
        </div>

        {/* CONTENT AREA */}
        <div className="relative z-20 container-editorial text-center max-w-4xl mx-auto space-y-2.5 sm:space-y-5 md:space-y-7 animate-fade-in px-4 sm:px-6 h-full flex flex-col justify-center items-center">
          {/* SUBTITLE BADGE */}
          <div className="inline-block">
            <span className="text-[0.58rem] sm:text-[0.7rem] font-medium tracking-[0.25em] sm:tracking-[0.35em] uppercase border-b border-[#FAF9F6]/50 pb-0.5 sm:pb-1 text-[#FAF9F6]">
              {subtitle}
            </span>
          </div>

          {/* HEADLINE */}
          <h1 className="font-editorial text-xl sm:text-4xl md:text-6xl lg:text-7xl leading-tight sm:leading-none font-light tracking-wide sm:tracking-tight uppercase text-[#FAF9F6] drop-shadow-md">
            {title}
          </h1>

          {/* SHORT DESCRIPTION */}
          <p className="text-[0.68rem] sm:text-xs md:text-sm font-light max-w-[260px] sm:max-w-md md:max-w-lg mx-auto leading-snug sm:leading-relaxed tracking-normal sm:tracking-wide text-[#FAF9F6]/80">
            A study in minimalist tailoring, pristine textiles, and monochrome elegance. Designed for longevity and refined ease.
          </p>

          {/* CTA ROW */}
          <div className="pt-2 sm:pt-4 md:pt-6 flex items-center justify-center">
            <Link
              to={linkUrl}
              className="inline-flex items-center justify-center px-6 py-2.5 sm:px-8 sm:py-3.5 text-[0.68rem] sm:text-xs font-medium tracking-[0.18em] sm:tracking-[0.2em] uppercase transition-colors shrink-0 bg-[#FAF9F6] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#FAF9F6] shadow-md"
            >
              DISCOVER COLLECTION
            </Link>
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
            <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-2 sm:space-x-2.5">
              {bannerList.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1 sm:h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                    currentIndex === idx
                      ? 'w-6 sm:w-8 bg-[#FAF9F6]'
                      : 'w-1.5 sm:w-2 bg-[#FAF9F6]/40 hover:bg-[#FAF9F6]/80'
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
      </div>
    </section>
  );
};
