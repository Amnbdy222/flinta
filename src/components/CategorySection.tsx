import React from 'react';
import { Link } from 'react-router-dom';
import { Category } from '../types/database.types';

interface CategorySectionProps {
  categories: Category[];
  loading?: boolean;
}

// Flat-lay apparel defaults matching the clean catalog editorial look
const CATEGORY_FLATLAY_DEFAULTS: Record<string, string> = {
  'shirts': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800&auto=format&fit=crop',
  'trousers': 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=800&auto=format&fit=crop',
  't-shirts': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop',
  'jeans': 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800&auto=format&fit=crop',
  'cargos': 'https://images.unsplash.com/photo-1604176354204-9268737828e4?q=80&w=800&auto=format&fit=crop',
  'joggers': 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?q=80&w=800&auto=format&fit=crop',
  'hoodies': 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=800&auto=format&fit=crop',
  'oversized': 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=800&auto=format&fit=crop',
  'accessories': 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=800&auto=format&fit=crop',
};

const DEFAULT_FLATLAY_FALLBACK =
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop';

export const CategorySection: React.FC<CategorySectionProps> = ({ categories, loading }) => {
  // Only display active categories
  const activeCategories = (categories || []).filter((c) => c.is_active);

  if (loading) {
    return (
      <section className="py-6 sm:py-8 md:py-10 bg-white hairline-b" aria-label="Departments Loading">
        <div className="container-editorial">
          <div className="flex items-end justify-between mb-4 sm:mb-6">
            <div>
              <div className="h-3 w-16 bg-[#EAE8E3] animate-pulse mb-1.5" />
              <div className="h-6 sm:h-8 w-36 bg-[#EAE8E3] animate-pulse mb-2" />
              <div className="h-[2px] w-12 sm:w-16 bg-[#D45A45]" />
            </div>
            <div className="h-4 w-20 bg-[#EAE8E3] animate-pulse" />
          </div>
          <div className="flex sm:grid sm:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[110px] sm:w-auto space-y-1.5">
                <div className="h-3 w-16 bg-[#EAE8E3] animate-pulse rounded-xs" />
                <div className="aspect-square bg-white rounded-lg sm:rounded-xl shadow-xs border border-[#0A0A0A]/5 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (activeCategories.length === 0) {
    return null;
  }

  // Dynamic grid column class based on active categories count
  const getGridColsClass = (count: number) => {
    switch (count) {
      case 1:
        return 'sm:grid-cols-1 max-w-[180px] mx-auto';
      case 2:
        return 'sm:grid-cols-2 max-w-sm mx-auto';
      case 3:
        return 'sm:grid-cols-3 max-w-xl mx-auto';
      case 4:
        return 'sm:grid-cols-4 max-w-3xl mx-auto';
      case 5:
        return 'sm:grid-cols-5';
      case 6:
        return 'sm:grid-cols-6';
      case 7:
        return 'sm:grid-cols-7';
      case 8:
        return 'sm:grid-cols-8';
      default:
        return 'sm:grid-cols-6';
    }
  };

  return (
    <section className="py-6 sm:py-8 md:py-10 bg-white hairline-b" aria-label="Shop by Category">
      <div className="container-editorial">
        {/* 1. HEADER (Editorial Title on left, Action on right) */}
        <div className="flex items-end justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-[0.68rem] sm:text-xs md:text-sm font-light text-[#736E65] uppercase tracking-[0.2em] leading-none">
              SHOP BY
            </h2>
            <div className="text-xl sm:text-2xl md:text-3xl font-black text-[#0A0A0A] uppercase tracking-tight mt-1 leading-none font-sans">
              CATEGORY
            </div>
            {/* Terracotta / Coral Accent Line */}
            <div className="h-[2px] w-12 sm:w-16 md:w-20 bg-[#D45A45] mt-1.5 sm:mt-2" />
          </div>

          <Link
            to="/shop"
            className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0A0A0A] uppercase tracking-wider hover:text-[#D45A45] transition-colors pb-0.5"
          >
            <span>SHOP ALL</span>
            <span className="transform transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {/* 2. CATEGORY ROW (One single continuous row on both mobile and desktop) */}
        <div
          className={`flex overflow-x-auto sm:grid ${getGridColsClass(
            activeCategories.length
          )} w-full gap-2.5 sm:gap-3.5 md:gap-4 no-scrollbar scroll-smooth snap-x snap-mandatory pb-1 sm:pb-0`}
        >
          {activeCategories.map((category) => {
            const normalizedSlug = category.slug.toLowerCase().trim();
            const imageUrl =
              category.image_url ||
              CATEGORY_FLATLAY_DEFAULTS[normalizedSlug] ||
              DEFAULT_FLATLAY_FALLBACK;

            return (
              <Link
                key={category.id}
                to={`/shop?category=${encodeURIComponent(category.slug)}`}
                className="group flex flex-col flex-shrink-0 w-[110px] sm:w-auto snap-start focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0A0A0A] rounded-lg"
                aria-label={`Shop ${category.name}`}
              >
                {/* Category Header (Full name with hover arrow) */}
                <div className="flex items-center justify-between mb-1.5 px-0.5 min-h-[1.25rem]">
                  <span className="font-bold text-[0.62rem] sm:text-[0.7rem] md:text-xs text-[#0A0A0A] tracking-wider uppercase group-hover:text-[#D45A45] transition-colors whitespace-nowrap overflow-hidden text-ellipsis">
                    {category.name}
                  </span>
                  <span className="text-[0.65rem] font-bold text-[#D45A45] opacity-0 group-hover:opacity-100 transition-all transform -translate-x-1 group-hover:translate-x-0 hidden sm:inline-block">
                    →
                  </span>
                </div>

                {/* Ambient Shadow Flat-Lay Garment Card */}
                <div className="relative aspect-square w-full bg-white rounded-lg sm:rounded-xl overflow-hidden border border-[#0A0A0A]/10 shadow-[0_2px_8px_-1px_rgba(0,0,0,0.06)] group-hover:shadow-[0_10px_24px_-4px_rgba(0,0,0,0.12)] group-hover:border-[#D45A45]/40 group-hover:-translate-y-1.5 transition-all duration-300 ease-out flex items-center justify-center p-2.5 sm:p-3.5 md:p-4">
                  <img
                    src={imageUrl}
                    alt={category.name}
                    loading="lazy"
                    className="w-full h-full object-contain object-center transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                  {/* Subtle hover gradient sheen */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
