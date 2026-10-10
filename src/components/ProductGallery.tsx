import React, { useState, useRef } from 'react';
import { Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  altText: string;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({ images, altText }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const safeImages = images && images.length > 0 ? images : [
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop"
  ];

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
        // Swipe Left -> Next
        setActiveIndex((prev) => (prev < safeImages.length - 1 ? prev + 1 : prev));
      } else {
        // Swipe Right -> Prev
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }
    }
    touchStartX.current = null;
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      {/* DESKTOP & MOBILE MAIN GALLERY CONTAINER */}
      <div
        className="relative w-full aspect-[3/4] sm:aspect-[2/3] max-h-[680px] md:max-h-[740px] bg-[#F0EFEA] overflow-hidden hairline-all group select-none cursor-pointer flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => setIsLightboxOpen(true)}
      >
        <img
          src={safeImages[activeIndex] || safeImages[0]}
          alt={`${altText} - Image ${activeIndex + 1}`}
          loading="lazy"
          className="w-full h-full object-cover object-top transition-all duration-500 group-hover:scale-105"
        />

        {/* LIGHTBOX EXPAND ICON */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsLightboxOpen(true);
          }}
          className="absolute bottom-4 right-4 p-2.5 bg-[#FAF9F6]/90 backdrop-blur-sm text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#FAF9F6] transition-all opacity-80 group-hover:opacity-100 focus:outline-none"
          aria-label="Expand image fullscreen"
        >
          <Maximize2 size={16} strokeWidth={1.5} />
        </button>

        {/* MOBILE PAGINATION COUNTER BADGE */}
        <div className="absolute top-4 right-4 md:hidden">
          <span className="badge-editorial bg-[#FAF9F6]/90 backdrop-blur-sm">
            {activeIndex + 1} / {safeImages.length}
          </span>
        </div>
      </div>

      {/* THUMBNAILS (DESKTOP & TABLET STRIP) */}
      {safeImages.length > 1 && (
        <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-none">
          {safeImages.map((imgUrl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`relative w-20 h-24 bg-[#F0EFEA] flex-shrink-0 overflow-hidden hairline-all transition-all duration-300 ${
                activeIndex === idx
                  ? 'ring-1 ring-[#0A0A0A] opacity-100'
                  : 'opacity-50 hover:opacity-100'
              }`}
              aria-label={`View thumbnail ${idx + 1}`}
            >
              <img
                src={imgUrl}
                alt={`Thumbnail ${idx + 1}`}
                loading="lazy"
                className="w-full h-full object-cover object-top"
              />
            </button>
          ))}
        </div>
      )}

      {/* MOBILE DOT INDICATORS */}
      {safeImages.length > 1 && (
        <div className="flex md:hidden items-center justify-center space-x-2 pt-2">
          {safeImages.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                activeIndex === idx ? 'w-6 bg-[#0A0A0A]' : 'w-1.5 bg-[#0A0A0A]/30'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          {/* Close button */}
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 p-3 text-[#FAF9F6] hover:opacity-60 transition-opacity"
            aria-label="Close fullscreen view"
          >
            <X size={28} />
          </button>

          {/* Prev Button */}
          {safeImages.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setActiveIndex((prev) => (prev > 0 ? prev - 1 : safeImages.length - 1))
              }
              className="absolute left-6 p-3 text-[#FAF9F6] hover:opacity-60 transition-opacity"
              aria-label="Previous image"
            >
              <ChevronLeft size={36} />
            </button>
          )}

          {/* Lightbox Image */}
          <div className="max-w-4xl max-h-[85vh] overflow-hidden">
            <img
              src={safeImages[activeIndex]}
              alt={`${altText} Fullscreen`}
              className="max-w-full max-h-[85vh] object-contain mx-auto"
            />
          </div>

          {/* Next Button */}
          {safeImages.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setActiveIndex((prev) => (prev < safeImages.length - 1 ? prev + 1 : 0))
              }
              className="absolute right-6 p-3 text-[#FAF9F6] hover:opacity-60 transition-opacity"
              aria-label="Next image"
            >
              <ChevronRight size={36} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
