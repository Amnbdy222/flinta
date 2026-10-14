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

  const [selectedTrendingCategory, setSelectedTrendingCategory] = useState<string>('all');

  // Filter curated products for top deals
  const topDeals = products.filter((p) => p.is_top_deal);

  // Helper to match product categories robustly
  const normalizeCategory = (str: string) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const matchesCategory = (prodCategory: string, selectedSlug: string) => {
    if (!selectedSlug || selectedSlug === 'all') return true;
    const pNorm = normalizeCategory(prodCategory);
    const sNorm = normalizeCategory(selectedSlug);
    if (pNorm === sNorm) return true;
    const isTshirtTarget = sNorm.includes('tshirt') || sNorm.includes('tee');
    const isTshirtProd = pNorm.includes('tshirt') || pNorm.includes('tee');
    if (isTshirtTarget) return isTshirtProd;
    if (sNorm === 'shirt' || sNorm === 'shirts') return (pNorm === 'shirt' || pNorm === 'shirts') && !isTshirtProd;
    if (sNorm.includes('track') || sNorm.includes('jogger')) return pNorm.includes('track') || pNorm.includes('jogger');
    if (sNorm.includes('hoodie') || sNorm.includes('jacket')) return pNorm.includes('hoodie') || pNorm.includes('jacket');
    if (sNorm.includes('jean') || sNorm.includes('denim')) return pNorm.includes('jean') || pNorm.includes('denim');
    if (sNorm.includes('cargo')) return pNorm.includes('cargo');
    return pNorm.includes(sNorm) || sNorm.includes(pNorm);
  };

  // Filter products by selected category tab
  const filteredTrendingProducts = products.filter((p) =>
    matchesCategory(p.category, selectedTrendingCategory)
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0A0A0A] selection:bg-[#0A0A0A] selection:text-[#FAF9F6]">
      <SEO
        title="FLINT A | Luxury Streetwear & Contemporary Designer Fashion India"
        description="Discover FLINT A — Contemporary Indian luxury streetwear, heavyweight oversized t-shirts, minimalist tailored shirts, and architectural garment silhouettes. Free shipping across India."
        keywords="flint a, luxury streetwear india, oversized t-shirts, high fashion brand india, designer shirts, minimalist streetwear, tailored linen pants, flint clothing"
      />
      {/* 1. ANNOUNCEMENT PROMO BAR & HERO SLIDER */}
      <EditorialHero banners={heroBanners} loading={heroLoading} />

      {/* 2. SHOP BY CATEGORY (DEPARTMENTS) */}
      <CategorySection categories={categories} loading={catalogLoading} />

      {/* 3. TRENDING NOW (ALL PRODUCTS WITH CURATED BADGES & CATEGORY TABS) */}
      <section className="py-12 sm:py-16 md:py-20 bg-[#FAF9F6] hairline-b" aria-label="Trending Products">
        <div className="container-editorial">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
            <div>
              <span className="editorial-subtitle block mb-1.5 sm:mb-2">CURATED ARCHIVE // 2026</span>
              <h2 className="section-title uppercase">TRENDING NOW</h2>
            </div>
            <Link
              to={
                selectedTrendingCategory === 'all'
                  ? '/shop'
                  : `/shop?category=${encodeURIComponent(selectedTrendingCategory)}`
              }
              className="text-[0.7rem] sm:text-xs tracking-[0.25em] font-medium uppercase link-underline text-[#0A0A0A] self-start sm:self-auto hover:text-[#D45A45] transition-colors"
            >
              EXPLORE ALL ({filteredTrendingProducts.length})
            </Link>
          </div>

          {/* CATEGORY FILTER TABS (Minimalist underline tabs matching editorial reference) */}
          <div className="flex items-center gap-5 sm:gap-8 md:gap-10 overflow-x-auto no-scrollbar border-b border-[#0A0A0A]/12 mb-8 sm:mb-10 md:mb-12 scroll-smooth">
            <button
              type="button"
              onClick={() => setSelectedTrendingCategory('all')}
              className={`pb-2.5 sm:pb-3.5 text-xs sm:text-[0.8rem] md:text-sm uppercase tracking-[0.18em] transition-all whitespace-nowrap relative font-medium focus-visible:outline-none ${
                selectedTrendingCategory === 'all'
                  ? 'text-[#0A0A0A] font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#0A0A0A]'
                  : 'text-[#736E65] hover:text-[#0A0A0A]'
              }`}
            >
              ALL
            </button>

            {categories
              .filter((c) => c.is_active)
              .map((cat) => {
                const isActive = selectedTrendingCategory === cat.slug;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedTrendingCategory(cat.slug)}
                    className={`pb-2.5 sm:pb-3.5 text-xs sm:text-[0.8rem] md:text-sm uppercase tracking-[0.18em] transition-all whitespace-nowrap relative font-medium focus-visible:outline-none ${
                      isActive
                        ? 'text-[#0A0A0A] font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#0A0A0A]'
                        : 'text-[#736E65] hover:text-[#0A0A0A]'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
          </div>

          {catalogLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              <ProductSkeleton />
              <ProductSkeleton />
              <ProductSkeleton />
              <ProductSkeleton />
            </div>
          ) : filteredTrendingProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 lg:gap-10">
              {filteredTrendingProducts.map((product: FormattedProduct) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="text-xs sm:text-sm text-[#736E65] font-light uppercase tracking-wider mb-3">
                No products found in this category archive.
              </p>
              <button
                type="button"
                onClick={() => setSelectedTrendingCategory('all')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A0A0A] uppercase tracking-widest underline underline-offset-4 hover:text-[#D45A45] transition-colors"
              >
                View All Products
              </button>
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
