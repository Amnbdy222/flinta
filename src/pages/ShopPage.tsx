import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  fetchPaginatedProducts,
  fetchFilterOptions,
  DynamicFilterOptions,
  PaginatedResult,
} from '../services/productService';
import { fetchStorefrontBanners } from '../services/bannerService';
import { StorefrontBanner } from '../types/database.types';
import { ProductCard } from '../components/ProductCard';
import { FilterBar } from '../components/FilterBar';
import { ProductSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { SEO } from '../components/SEO';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Category Banner state
  const [categoryBanner, setCategoryBanner] = useState<StorefrontBanner | null>(null);

  // Extract filter state from URL parameters
  const category = searchParams.get('category') || undefined;
  const color = searchParams.get('color') || undefined;
  const size = searchParams.get('size') || undefined;
  const minPriceParam = searchParams.get('minPrice');
  const maxPriceParam = searchParams.get('maxPrice');
  const minPrice = minPriceParam ? Number(minPriceParam) : undefined;
  const maxPrice = maxPriceParam ? Number(maxPriceParam) : undefined;
  const inStockOnly = searchParams.get('inStock') === 'true';
  const sort = searchParams.get('sort') || 'recommended';
  const searchQuery = searchParams.get('search') || undefined;
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? Math.max(1, Number(pageParam)) : 1;

  // Component State
  const [filterOptions, setFilterOptions] = useState<DynamicFilterOptions>({
    colors: [],
    sizes: [],
    minPrice: 0,
    maxPrice: 1000,
  });
  const [result, setResult] = useState<PaginatedResult>({
    products: [],
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Load dynamic filter options & category banner once on mount
  useEffect(() => {
    fetchFilterOptions().then((opts) => setFilterOptions(opts));
    fetchStorefrontBanners('category_banner').then((banners) => {
      if (banners && banners.length > 0) {
        setCategoryBanner(banners[0]);
      }
    });
  }, []);

  // Fetch paginated products whenever URL params change
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(false);

    fetchPaginatedProducts({
      page: currentPage,
      limit: 12,
      category,
      color,
      size,
      minPrice,
      maxPrice,
      inStockOnly,
      sort,
      search: searchQuery,
    })
      .then((res) => {
        if (isMounted) {
          setResult(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching shop products:', err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentPage, category, color, size, minPrice, maxPrice, inStockOnly, sort, searchQuery]);

  // Helper to update search params while preserving unrelated keys
  const updateUrlParams = (newParams: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 whenever filters or search change (unless page is explicitly updated)
    if (!('page' in newParams)) {
      params.set('page', '1');
    }

    setSearchParams(params);
  };

  // Filter change handler
  const handleFilterChange = (updates: {
    colors?: string[];
    sizes?: string[];
    color?: string;
    size?: string;
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: boolean;
  }) => {
    let colorVal: string | undefined = color;
    if ('colors' in updates) {
      colorVal = updates.colors && updates.colors.length > 0 ? updates.colors.join(',') : undefined;
    } else if ('color' in updates) {
      colorVal = updates.color;
    }

    let sizeVal: string | undefined = size;
    if ('sizes' in updates) {
      sizeVal = updates.sizes && updates.sizes.length > 0 ? updates.sizes.join(',') : undefined;
    } else if ('size' in updates) {
      sizeVal = updates.size;
    }

    updateUrlParams({
      color: colorVal,
      size: sizeVal,
      minPrice: 'minPrice' in updates
        ? updates.minPrice !== undefined
          ? String(updates.minPrice)
          : undefined
        : minPriceParam || undefined,
      maxPrice: 'maxPrice' in updates
        ? updates.maxPrice !== undefined
          ? String(updates.maxPrice)
          : undefined
        : maxPriceParam || undefined,
      inStock: 'inStockOnly' in updates
        ? updates.inStockOnly
          ? 'true'
          : undefined
        : inStockOnly
        ? 'true'
        : undefined,
    });
  };

  // Sort change handler
  const handleSortChange = (newSort: string) => {
    updateUrlParams({ sort: newSort });
  };

  // Clear all filters handler
  const handleClearAll = () => {
    setSearchParams(new URLSearchParams());
  };

  // Page change handler
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > result.totalPages) return;
    updateUrlParams({ page: String(newPage) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dynamic SEO based on active Category or Search query
  const getShopSeo = () => {
    if (searchQuery) {
      return {
        title: `Search: "${searchQuery}"`,
        description: `Browse luxury garment search results for "${searchQuery}" in the FLINT A archive.`,
        breadcrumbs: [
          { name: 'Home', url: '/' },
          { name: 'Shop', url: '/shop' },
          { name: `Search: ${searchQuery}`, url: `/shop?q=${encodeURIComponent(searchQuery)}` },
        ],
      };
    }
    if (category) {
      const formattedCat = category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      return {
        title: `${formattedCat} Collection — Designer Men's ${formattedCat}`,
        description: `Explore the FLINT A luxury ${formattedCat} collection. Precision tailoring, premium heavyweight textiles, and minimalist silhouettes. Complimentary shipping across India.`,
        breadcrumbs: [
          { name: 'Home', url: '/' },
          { name: 'Shop', url: '/shop' },
          { name: formattedCat, url: `/shop?category=${encodeURIComponent(category)}` },
        ],
      };
    }
    return {
      title: 'Shop All Luxury Streetwear & Designer Apparel',
      description: 'Explore the full FLINT A garment archive catalog. Premium heavyweight cotton, tailored trousers, and minimalist silhouettes. Free shipping across India.',
      breadcrumbs: [
        { name: 'Home', url: '/' },
        { name: 'Shop', url: '/shop' },
      ],
    };
  };

  const seoData = getShopSeo();

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-6 sm:pt-8 pb-16 md:pb-24 text-[#0A0A0A]">
      <SEO
        title={seoData.title}
        description={seoData.description}
        breadcrumbs={seoData.breadcrumbs}
      />

      {/* CATEGORY BANNER HEADER */}
      {categoryBanner ? (
        <div className="w-full relative bg-[#0A0A0A] text-[#FAF9F6] mb-8 sm:mb-10 md:mb-12 overflow-hidden hairline-b">
          <div className="h-64 sm:h-72 md:h-80 lg:h-[400px] w-full relative">
            <picture className="w-full h-full block">
              {categoryBanner.mobile_image_url && (
                <source media="(max-width: 767px)" srcSet={categoryBanner.mobile_image_url} />
              )}
              <img
                src={categoryBanner.image_url}
                alt={categoryBanner.title || 'Category Banner'}
                className="w-full h-full object-cover object-top opacity-90"
              />
            </picture>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/90 via-[#0A0A0A]/40 to-[#0A0A0A]/20" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-6 space-y-1.5 sm:space-y-3">
              <span className="editorial-subtitle text-[#FAF9F6]/85 block text-[0.65rem] sm:text-xs tracking-[0.25em] drop-shadow-sm">
                {categoryBanner.subtitle || 'GARMENT CATALOGUE'}
              </span>
              <h1 className="font-editorial text-[1.15rem] min-[375px]:text-[1.35rem] min-[420px]:text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light uppercase tracking-tight text-[#FAF9F6] max-w-4xl px-2 drop-shadow-md">
                {categoryBanner.title || (searchQuery ? `"${searchQuery.toUpperCase()}"` : 'SHOP ALL GARMENTS')}
              </h1>
            </div>
          </div>
        </div>
      ) : (
        <div className="container-editorial">
          <div className="pb-8 sm:pb-10 text-center max-w-2xl mx-auto space-y-3 hairline-b px-4 sm:px-0">
            <span className="editorial-subtitle block">GARMENT CATALOGUE</span>
            <h1 className="font-editorial text-3xl sm:text-4xl md:text-6xl font-light uppercase tracking-tight">
              {searchQuery ? `"${searchQuery.toUpperCase()}"` : 'SHOP ALL GARMENTS'}
            </h1>
            <p className="text-xs text-[#736E65] font-light leading-relaxed">
              Architectural tailoring, pristine organic textiles, and timeless monochrome garments.
            </p>
          </div>
        </div>
      )}

      <div className="container-editorial">
        {/* FILTER & SORT BAR */}
        <div className="pt-4 sm:pt-6">
          <FilterBar
            filterOptions={filterOptions}
            selectedColor={color}
            selectedSize={size}
            selectedMinPrice={minPrice}
            selectedMaxPrice={maxPrice}
            inStockOnly={inStockOnly}
            selectedSort={sort}
            totalResults={result.total}
            onFilterChange={handleFilterChange}
            onSortChange={handleSortChange}
            onClearAll={handleClearAll}
          />
          {category && (
            <div className="pt-3 flex items-center gap-2 flex-wrap">
              <span className="text-[0.65rem] tracking-[0.2em] uppercase text-[#736E65]">CATEGORY:</span>
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-[#0A0A0A] text-[#FAF9F6] text-[0.7rem] uppercase tracking-wider font-medium">
                {category}
                <button
                  type="button"
                  onClick={() => updateUrlParams({ category: undefined, page: '1' })}
                  className="hover:text-red-400 font-bold ml-1 transition-colors"
                  aria-label="Remove category filter"
                >
                  ✕
                </button>
              </span>
            </div>
          )}
        </div>

        {/* PRODUCT GRID */}
        <div className="pt-4 sm:pt-6">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorState onRetry={() => updateUrlParams({ page: '1' })} />
          ) : result.products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
                {result.products.map((product, idx) => (
                  <ProductCard key={product.id} product={product} priority={idx < 4} />
                ))}
              </div>

              {/* PAGINATION */}
              {result.totalPages > 1 && (
                <div className="pt-12 md:pt-16 hairline-t mt-10 md:mt-16 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 text-xs font-medium tracking-[0.2em] uppercase">
                  <span className="text-[0.65rem] text-[#736E65] order-2 sm:order-1">
                    {(result.page - 1) * result.limit + 1}–{Math.min(result.page * result.limit, result.total)} OF {result.total} GARMENTS
                  </span>

                  <div className="flex items-center space-x-1.5 sm:space-x-2 order-1 sm:order-2">
                    <button
                      type="button"
                      disabled={result.page <= 1}
                      onClick={() => handlePageChange(result.page - 1)}
                      className="p-2.5 sm:p-2 border border-[#0A0A0A]/20 hover:border-[#0A0A0A] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {Array.from({ length: result.totalPages }, (_, i) => i + 1)
                      .filter((pNum) =>
                        pNum === 1 ||
                        pNum === result.totalPages ||
                        Math.abs(pNum - result.page) <= 1
                      )
                      .reduce<(number | '...')[]>((acc, pNum, idx, arr) => {
                        if (idx > 0 && typeof arr[idx - 1] === 'number' && (pNum as number) - (arr[idx - 1] as number) > 1) {
                          acc.push('...');
                        }
                        acc.push(pNum);
                        return acc;
                      }, [])
                      .map((item, idx) =>
                        item === '...' ? (
                          <span key={`ellipsis-${idx}`} className="px-1 text-[#736E65]">…</span>
                        ) : (
                          <button
                            key={item}
                            type="button"
                            onClick={() => handlePageChange(item as number)}
                            className={`w-9 h-9 sm:w-9 sm:h-9 text-xs flex items-center justify-center border transition-colors ${
                              result.page === item
                                ? 'border-[#0A0A0A] bg-[#0A0A0A] text-[#FAF9F6]'
                                : 'border-[#0A0A0A]/20 bg-transparent text-[#0A0A0A] hover:border-[#0A0A0A]'
                            }`}
                          >
                            {item}
                          </button>
                        )
                      )}

                    <button
                      type="button"
                      disabled={result.page >= result.totalPages}
                      onClick={() => handlePageChange(result.page + 1)}
                      className="p-2.5 sm:p-2 border border-[#0A0A0A]/20 hover:border-[#0A0A0A] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      aria-label="Next page"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              title="NO GARMENTS FOUND"
              message="No items match your active filter selections. Try clearing filters or refining your search."
              actionText="RESET ALL FILTERS"
              actionPath="#"
            />
          )}
        </div>
      </div>
    </div>
  );
};
