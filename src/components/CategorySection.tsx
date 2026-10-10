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
      <section className="py-5 sm:py-8 md:py-10 bg-white" aria-label="Departments Loading">
        <div className="container-editorial">
          <div className="mb-3 sm:mb-6">
            <div className="h-3.5 sm:h-4 w-16 sm:w-20 bg-[#EAE8E3] animate-pulse mb-1" />
            <div className="h-5 sm:h-7 w-28 sm:w-36 bg-[#EAE8E3] animate-pulse mb-1.5 sm:mb-2" />
            <div className="h-[2px] w-12 sm:w-20 bg-[#D45A45]" />
          </div>
          <div className="grid grid-cols-4 gap-1.5 sm:gap-3 md:gap-4 w-full max-w-sm sm:max-w-xl md:max-w-3xl mx-auto">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1 sm:space-y-1.5">
                <div className="h-2.5 sm:h-3 w-10 sm:w-16 bg-[#EAE8E3] animate-pulse rounded-xs mx-auto sm:mx-0" />
                <div className="aspect-square bg-white rounded-md sm:rounded-lg shadow-sm border border-[#0A0A0A]/5 animate-pulse" />
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

  return (
    <section className="py-5 sm:py-8 md:py-10 bg-white hairline-b" aria-label="Shop by Category">
      <div className="container-editorial">
        {/* 1. HEADER (Compact, refined editorial title) */}
        <div className="mb-3 sm:mb-6">
          <h2 className="text-xs sm:text-base md:text-xl font-light text-[#0A0A0A] uppercase tracking-wide leading-none">
            SHOP BY
          </h2>
          <div className="text-base sm:text-2xl md:text-3xl font-black text-[#0A0A0A] uppercase tracking-tight mt-1 leading-none">
            CATEGORY
          </div>
          {/* Terracotta / Coral Accent Line */}
          <div className="h-[2px] w-12 sm:w-20 md:w-24 bg-[#D45A45] mt-1.5 sm:mt-2" />
        </div>

        {/* 2. CATEGORY COLUMNS (Compact on mobile & desktop, elevated shadow cards) */}
        <div
          className={`grid w-full gap-1.5 sm:gap-3 md:gap-4 ${
            activeCategories.length === 1
              ? 'grid-cols-1 max-w-[140px] sm:max-w-[180px] mx-auto'
              : activeCategories.length === 2
              ? 'grid-cols-2 max-w-[200px] sm:max-w-sm mx-auto'
              : activeCategories.length === 3
              ? 'grid-cols-3 max-w-xs sm:max-w-xl mx-auto'
              : activeCategories.length === 4
              ? 'grid-cols-4 max-w-sm sm:max-w-xl md:max-w-3xl mx-auto'
              : 'grid-cols-4 sm:grid-cols-5 max-w-sm sm:max-w-2xl md:max-w-4xl mx-auto'
          }`}
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
                className="group flex flex-col focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0A0A0A] rounded-md"
                aria-label={`Shop ${category.name}`}
              >
                {/* Category Header */}
                <div className="flex items-center justify-center sm:justify-between mb-1 sm:mb-1.5 px-0.5">
                  <span className="font-bold text-[0.55rem] sm:text-xs text-[#0A0A0A] tracking-wider uppercase group-hover:text-[#D45A45] transition-colors truncate text-center sm:text-left">
                    {category.name}
                  </span>
                  <span className="text-[0.58rem] font-semibold tracking-wider text-[#736E65] opacity-0 group-hover:opacity-100 group-hover:text-[#D45A45] transition-all transform -translate-x-1 group-hover:translate-x-0 hidden sm:inline-block">
                    EXPLORE →
                  </span>
                </div>

                {/* Shady Box (Compact, Elevated Ambient Shadow Card) */}
                <div className="relative aspect-square w-full bg-white rounded-md sm:rounded-lg overflow-hidden border border-[#0A0A0A]/8 shadow-[0_2px_8px_-1px_rgba(0,0,0,0.06)] sm:shadow-[0_3px_12px_-2px_rgba(0,0,0,0.06),0_1px_3px_-1px_rgba(0,0,0,0.03)] sm:group-hover:shadow-[0_10px_22px_-4px_rgba(0,0,0,0.11),0_3px_8px_-2px_rgba(0,0,0,0.04)] sm:group-hover:-translate-y-1 transition-all duration-300 ease-out flex items-center justify-center p-1.5 sm:p-2.5 md:p-3">
                  <img
                    src={imageUrl}
                    alt={category.name}
                    loading="lazy"
                    className="w-full h-full object-contain object-center transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                  {/* Subtle hover gradient sheen */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* 3. SHOP ALL LINK */}
        <div className="mt-3 sm:mt-6">
          <Link
            to="/shop"
            className="group inline-flex items-center gap-1.5 text-[0.62rem] sm:text-xs font-bold text-[#0A0A0A] uppercase tracking-[0.2em] underline underline-offset-4 decoration-1 hover:text-[#D45A45] hover:decoration-[#D45A45] transition-all"
          >
            <span>SHOP ALL</span>
            <span className="transform transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
};
