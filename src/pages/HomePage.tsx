import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EditorialHero } from '../components/EditorialHero';
import { CategorySection } from '../components/CategorySection';
import { EditorialGrid } from '../components/EditorialGrid';
import { ProductCard } from '../components/ProductCard';
import { PromoBar } from '../components/PromoBar';
import { ProductSkeleton } from '../components/LoadingSkeleton';
import { PromoCouponsSection } from '../components/PromoCouponsSection';
import { SEO } from '../components/SEO';
import { fetchActiveProducts } from '../services/productService';
import { fetchStorefrontBanners } from '../services/bannerService';
import { fetchActiveCategories } from '../services/categoryService';
import { FormattedProduct, StorefrontBanner, Category } from '../types/database.types';

export const HomePage: React.FC = () => {
  const [products, setProducts] = useState<FormattedProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [heroBanners, setHeroBanners] = useState<StorefrontBanner[]>([]);
  const [middleBanner, setMiddleBanner] = useState<StorefrontBanner | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [heroLoading, setHeroLoading] = useState(true);

  // 1. Fetch hero banners immediately with highest priority so hero renders ASAP
  const loadHeroBanners = async () => {
    try {
      const heroData = await fetchStorefrontBanners('hero');
      setHeroBanners(heroData || []);
    } catch (err) {
      console.error('Failed to load hero banners:', err);
    } finally {
      setHeroLoading(false);
    }
  };

  // 2. Fetch the rest of the catalog in parallel
  const loadCatalog = async () => {
    setCatalogLoading(true);
    try {
      const [prodsData, middleBanners, categoriesData] = await Promise.all([
        fetchActiveProducts(),
        fetchStorefrontBanners('middle_banner'),
        fetchActiveCategories(),
      ]);
      setProducts(prodsData);
      setCategories(categoriesData || []);
      if (middleBanners && middleBanners.length > 0) {
        setMiddleBanner(middleBanners[0]);
      }
    } catch (err) {
      console.error('Failed to load homepage catalog:', err);
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    loadHeroBanners();
    loadCatalog();
  }, []);

  // Filter curated products for top deals
  const topDeals = products.filter((p) => p.is_top_deal);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0A0A0A] selection:bg-[#0A0A0A] selection:text-[#FAF9F6]">
      <SEO
        title="Permanent Form & Silhouette"
        description="FLINT — High fashion editorial storefront. Minimalist organic textiles, precision tailoring, and timeless garment archives."
      />
      {/* 1. ANNOUNCEMENT PROMO BAR & HERO SLIDER */}
      <EditorialHero banners={heroBanners} loading={heroLoading} />

      {/* 2. SHOP BY CATEGORY (DEPARTMENTS) */}
      <CategorySection categories={categories} loading={catalogLoading} />

      {/* 3. TRENDING NOW (ALL PRODUCTS WITH CURATED BADGES) */}
      <section className="py-14 sm:py-16 md:py-24 bg-[#FAF9F6] hairline-b" aria-label="Trending Products">
        <div className="container-editorial">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-8 sm:mb-10 md:mb-12 pb-5 sm:pb-6 hairline-b gap-2 sm:gap-0">
            <div>
              <span className="editorial-subtitle block mb-1.5 sm:mb-2">CURATED ARCHIVE // 2026</span>
              <h2 className="section-title uppercase">TRENDING NOW</h2>
            </div>
            <Link
              to="/shop"
              className="text-[0.7rem] sm:text-xs tracking-[0.25em] font-medium uppercase link-underline text-[#0A0A0A] self-start sm:self-auto"
            >
              EXPLORE ALL ({products.length})
            </Link>
          </div>

          {catalogLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              <ProductSkeleton />
              <ProductSkeleton />
              <ProductSkeleton />
              <ProductSkeleton />
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 lg:gap-10">
              {products.map((product: FormattedProduct) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[#736E65] font-light">
              No products found in the active catalog.
            </div>
          )}
        </div>
      </section>

      {/* 4. EDITORIAL MIDDLE BANNER SECTION */}
      <EditorialGrid middleBanner={middleBanner} />

      {/* 5. ACTIVE PROMOTIONS & COUPON CODES SECTION */}
      <PromoCouponsSection />

      {/* 5. TOP DEALS CURATED SECTION */}
      {topDeals.length > 0 && (
        <section className="py-14 sm:py-16 md:py-24 bg-[#FAF9F6] hairline-b" aria-label="Top Deals">
          <div className="container-editorial">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-8 sm:mb-10 md:mb-12 pb-5 sm:pb-6 hairline-b gap-2 sm:gap-0">
              <div>
                <span className="editorial-subtitle block mb-1.5 sm:mb-2">LIMITED TIME ARCHIVE</span>
                <h2 className="section-title uppercase">TOP DEALS</h2>
              </div>
              <Link
                to="/shop"
                className="text-[0.7rem] sm:text-xs tracking-[0.25em] font-medium uppercase link-underline text-[#0A0A0A] self-start sm:self-auto"
              >
                VIEW ALL DEALS ({topDeals.length})
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 lg:gap-10">
              {topDeals.slice(0, 4).map((product: FormattedProduct) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. CAMPAIGN ANNOUNCEMENT BANNER */}
      <PromoBar />
    </div>
  );
};
