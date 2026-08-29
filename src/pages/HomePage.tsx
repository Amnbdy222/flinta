import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EditorialHero } from '../components/EditorialHero';
import { EditorialGrid } from '../components/EditorialGrid';
import { ProductCard } from '../components/ProductCard';
import { PromoBar } from '../components/PromoBar';
import { ProductSkeleton } from '../components/LoadingSkeleton';
import { PromoCouponsSection } from '../components/PromoCouponsSection';
import { BrandStatement } from '../components/BrandStatement';
import { SEO } from '../components/SEO';
import { fetchActiveProducts } from '../services/productService';
import { fetchStorefrontBanners } from '../services/bannerService';
import { FormattedProduct, StorefrontBanner } from '../types/database.types';

export const HomePage: React.FC = () => {
  const [products, setProducts] = useState<FormattedProduct[]>([]);
  const [heroBanners, setHeroBanners] = useState<StorefrontBanner[]>([]);
  const [middleBanner, setMiddleBanner] = useState<StorefrontBanner | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const [prodsData, heroBannersData, middleBanners] = await Promise.all([
        fetchActiveProducts(),
        fetchStorefrontBanners('hero'),
        fetchStorefrontBanners('middle_banner'),
      ]);
      setProducts(prodsData);
      setHeroBanners(heroBannersData || []);
      if (middleBanners && middleBanners.length > 0) {
        setMiddleBanner(middleBanners[0]);
      }
    } catch (err) {
      console.error('Failed to load homepage catalog/banners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  // Filter curated products for badge sections
  const newArrivals = products.filter((p) => p.is_new_arrival);
  const bestSellers = products.filter((p) => p.is_best_seller);
  const topDeals = products.filter((p) => p.is_top_deal);

  const newArrivalsList = newArrivals.length > 0 ? newArrivals : products;
  const bestSellersList = bestSellers.length > 0 ? bestSellers : products;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0A0A0A] selection:bg-[#0A0A0A] selection:text-[#FAF9F6]">
      <SEO
        title="Permanent Form & Silhouette"
        description="FLINT — High fashion editorial storefront. Minimalist organic textiles, precision tailoring, and timeless garment archives."
      />
      {/* 1. ANNOUNCEMENT PROMO BAR & HERO SLIDER */}
      <EditorialHero banners={heroBanners} />

      {/* 2. CURATED NEW ARRIVALS */}
      <section className="py-14 sm:py-16 md:py-24 bg-[#FAF9F6] hairline-b" aria-label="New Arrivals">
        <div className="container-editorial">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-8 sm:mb-10 md:mb-12 pb-5 sm:pb-6 hairline-b gap-2 sm:gap-0">
            <div>
              <span className="editorial-subtitle block mb-1.5 sm:mb-2">ARCHIVE SELECTION</span>
              <h2 className="section-title uppercase">NEW ARRIVALS</h2>
            </div>
            <Link
              to="/shop?sort=newest"
              className="text-[0.7rem] sm:text-xs tracking-[0.25em] font-medium uppercase link-underline text-[#0A0A0A] self-start sm:self-auto"
            >
              VIEW ALL ({newArrivalsList.length})
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              <ProductSkeleton />
              <ProductSkeleton />
              <ProductSkeleton />
              <ProductSkeleton />
            </div>
          ) : newArrivalsList.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 lg:gap-10">
              {newArrivalsList.slice(0, 4).map((product: FormattedProduct) => (
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

      {/* 3. BEST SELLERS CURATED SECTION */}
      {bestSellersList.length > 0 && (
        <section className="py-14 sm:py-16 md:py-24 bg-[#F0EFEA] hairline-b" aria-label="Best Sellers">
          <div className="container-editorial">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mb-8 sm:mb-10 md:mb-12 pb-5 sm:pb-6 hairline-b border-[#0A0A0A]/20 gap-2 sm:gap-0">
              <div>
                <span className="editorial-subtitle block mb-1.5 sm:mb-2">MOST COVETED</span>
                <h2 className="section-title uppercase">BEST SELLERS</h2>
              </div>
              <Link
                to="/shop"
                className="text-[0.7rem] sm:text-xs tracking-[0.25em] font-medium uppercase link-underline text-[#0A0A0A] self-start sm:self-auto"
              >
                EXPLORE CATALOG ({bestSellersList.length})
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 lg:gap-10">
              {bestSellersList.slice(0, 4).map((product: FormattedProduct) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

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

      {/* 7. BRAND STATEMENT */}
      <BrandStatement />
    </div>
  );
};
