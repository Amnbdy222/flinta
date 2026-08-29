import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { fetchProductBySlug, fetchActiveProducts } from '../services/productService';
import { FormattedProduct, ProductVariant } from '../types/database.types';
import { ProductGallery } from '../components/ProductGallery';
import { ProductCard } from '../components/ProductCard';
import { ProductReviewsSection } from '../components/ProductReviewsSection';
import { SEO } from '../components/SEO';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { HeroSkeleton } from '../components/LoadingSkeleton';
import { useCart } from '../context/CartContext';
import { formatUserFriendlyError } from '../services/cartService';
import { ArrowLeft, Check, Heart, ShieldCheck, RefreshCw, Truck, AlertCircle } from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToBag } = useCart();

  // Primary Component States
  const [product, setProduct] = useState<FormattedProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<FormattedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Variant Selection States
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [btnState, setBtnState] = useState<'idle' | 'adding' | 'added'>('idle');
  const [selectionError, setSelectionError] = useState<string | null>(null);

  // Load Product Data from Supabase
  useEffect(() => {
    const loadProductData = async () => {
      if (!slug) return;
      setLoading(true);
      setError(false);
      try {
        const item = await fetchProductBySlug(slug);

        if (item) {
          setProduct(item);

          // Determine initial color from URL parameter or first available variant color
          const urlColor = searchParams.get('color');
          const matchedColorObj = item.colors.find(
            (c) => c.color_name.toLowerCase() === (urlColor || '').toLowerCase()
          );
          const initialColor = matchedColorObj
            ? matchedColorObj.color_name
            : item.colors[0]?.color_name || '';

          setSelectedColor(initialColor);

          // Find available sizes for initial color
          const colorVariants = item.variants.filter(
            (v) => v.color_name.toLowerCase() === initialColor.toLowerCase()
          );
          const initialSize = colorVariants.find((v) => v.stock > 0)?.size || colorVariants[0]?.size || '';
          setSelectedSize(initialSize);

          // Fetch related active products
          const catalog = await fetchActiveProducts();
          setRelatedProducts(catalog.filter((p) => p.slug !== slug).slice(0, 4));
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error('Error loading product detail:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadProductData();
  }, [slug, searchParams]);

  // Derived: Variants for currently selected color
  const colorVariants = useMemo(() => {
    if (!product || !selectedColor) return [];
    return product.variants.filter(
      (v) => v.color_name.toLowerCase() === selectedColor.toLowerCase()
    );
  }, [product, selectedColor]);

  // Derived: Filter gallery images matching selected color variant or product images
  const galleryImages = useMemo(() => {
    if (!product) return [];
    if (colorVariants.length > 0) {
      const variantIds = colorVariants.map((v) => v.id);
      const matchingImgs = product.images.filter(
        (img) => img.variant_id && variantIds.includes(img.variant_id)
      );
      if (matchingImgs.length > 0) {
        return matchingImgs.map((img) => img.public_url);
      }
    }
    return product.images.map((img) => img.public_url);
  }, [product, colorVariants]);

  // Derived: Exact resolved ProductVariant record
  const selectedVariant: ProductVariant | undefined = useMemo(() => {
    if (!selectedColor || !selectedSize) return undefined;
    return colorVariants.find(
      (v) => v.size.toUpperCase() === selectedSize.toUpperCase()
    );
  }, [colorVariants, selectedColor, selectedSize]);

  // Dynamic Price from selected variant or product starting price
  const displayPrice = selectedVariant ? Number(selectedVariant.price) : product?.price || 0;
  const displayComparePrice = selectedVariant?.compare_at_price
    ? Number(selectedVariant.compare_at_price)
    : product?.compareAtPrice || null;

  // Stock status calculation
  const stockState = useMemo(() => {
    if (!selectedVariant) return 'UNKNOWN';
    if (selectedVariant.stock <= 0 || selectedVariant.status !== 'active') return 'OUT_OF_STOCK';
    if (selectedVariant.stock <= (selectedVariant.low_stock_threshold || 5)) return 'LOW_STOCK';
    return 'IN_STOCK';
  }, [selectedVariant]);

  // Handle Color Change
  const handleColorSelect = (colorName: string) => {
    setSelectedColor(colorName);
    setSelectionError(null);

    // Update URL parameter without page reload
    const newParams = new URLSearchParams(searchParams);
    newParams.set('color', colorName.toLowerCase());
    setSearchParams(newParams, { replace: true });

    // Recalculate available sizes for new color
    const newColorVariants = product?.variants.filter(
      (v) => v.color_name.toLowerCase() === colorName.toLowerCase()
    ) || [];

    const firstInStockSize = newColorVariants.find((v) => v.stock > 0)?.size;
    const newSize = firstInStockSize || newColorVariants[0]?.size || '';
    setSelectedSize(newSize);
  };

  // Handle Size Select
  const handleSizeSelect = (sizeName: string, isAvailable: boolean) => {
    if (!isAvailable) return;
    setSelectedSize(sizeName);
    setSelectionError(null);
  };

  // Handle Add to Bag
  const handleAddToBagAction = async () => {
    if (!selectedSize || !selectedVariant) {
      setSelectionError('PLEASE SELECT AN AVAILABLE SIZE');
      return;
    }

    if (stockState === 'OUT_OF_STOCK') {
      setSelectionError('THIS VARIANT IS CURRENTLY OUT OF STOCK');
      return;
    }

    setBtnState('adding');
    setSelectionError(null);

    try {
      await addToBag(selectedVariant.id, 1);
      setBtnState('added');
      setTimeout(() => setBtnState('idle'), 2000);
    } catch (err: unknown) {
      console.error('Add to bag error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to add garment to bag.';
      setSelectionError(msg);
      setBtnState('idle');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pt-32 pb-24 container-editorial">
        <HeroSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pt-32 pb-24 flex items-center justify-center">
        <ErrorState title="GARMENT NOT FOUND" message="An error occurred while querying the catalog." />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pt-32 pb-24 flex items-center justify-center">
        <EmptyState
          title="404 — GARMENT UNAVAILABLE"
          message="The requested garment is inactive or does not exist in our archive."
          actionText="RETURN TO CATALOGUE"
          actionPath="/shop"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-16 sm:pt-18 md:pt-20 pb-16 md:pb-24 text-[#0A0A0A]">
      <SEO
        title={product.name}
        description={product.description || product.short_description || undefined}
        image={galleryImages[0] || product.primaryImage}
        type="product"
        productData={{
          name: product.name,
          description: product.description || product.short_description,
          image: galleryImages[0] || product.primaryImage,
          price: displayPrice,
          currency: 'INR',
          inStock: stockState !== 'OUT_OF_STOCK',
          category: product.category,
        }}
      />
      <div className="container-editorial">
        {/* BREADCRUMB */}
        <div className="py-4 sm:py-5 md:py-6">
          <Link
            to="/shop"
            className="inline-flex items-center text-xs tracking-[0.25em] text-[#736E65] hover:text-[#0A0A0A] uppercase transition-colors"
          >
            <ArrowLeft size={14} className="mr-2" />
            BACK TO CATALOGUE
          </Link>
        </div>

        {/* MAIN PRODUCT GRID — single col on mobile, 2-col on lg */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-14 pt-1 sm:pt-2 items-start">

          {/* LEFT: GALLERY */}
          <div className="lg:col-span-6 w-full">
            <ProductGallery images={galleryImages} altText={product.name} />
          </div>

          {/* RIGHT: PRODUCT INFO — sticky on desktop, natural flow on mobile */}
          <div className="lg:col-span-6 lg:sticky lg:top-24 space-y-5 sm:space-y-6 md:space-y-8">

            {/* TITLE & PRICE */}
            <div className="space-y-2 sm:space-y-3 pb-5 sm:pb-6 hairline-b">
              <span className="text-[0.65rem] tracking-[0.3em] uppercase text-[#736E65] font-medium block">
                {product.category || 'PERMANENT ARCHIVE'}
              </span>
              <h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-normal text-[#0A0A0A] leading-tight">
                {product.name}
              </h1>
              <div className="flex items-baseline space-x-3 sm:space-x-4 pt-1">
                <span className="text-xl sm:text-2xl font-light text-[#0A0A0A] tracking-wider">
                  ₹{displayPrice ? displayPrice.toFixed(2) : '0.00'}
                </span>
                {displayComparePrice && displayComparePrice > displayPrice && (
                  <span className="text-sm font-light text-[#736E65] line-through">
                    ₹{displayComparePrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* DESCRIPTION */}
            <p className="text-xs text-[#383531] font-light leading-relaxed">
              {product.description || product.short_description ||
                'Architectural silhouette cut from high-density organic textiles. Precision tailored with reinforced hand-finished seams.'}
            </p>

            {/* COLOR SELECTION */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2 sm:space-y-3 pt-1 sm:pt-2">
                <label className="text-[0.65rem] font-medium tracking-[0.2em] text-[#0A0A0A] uppercase block">
                  COLOR: <span className="text-[#736E65]">{selectedColor}</span>
                </label>
                <div className="flex items-center flex-wrap gap-2 sm:space-x-3">
                  {product.colors.map((col, idx) => {
                    const isSelected = selectedColor.toLowerCase() === col.color_name.toLowerCase();
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleColorSelect(col.color_name)}
                        className={`w-8 h-8 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all ${
                          isSelected ? 'ring-1 ring-offset-2 ring-[#0A0A0A]' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: col.color_hex }}
                        aria-label={`Select color ${col.color_name}`}
                      >
                        {isSelected && (
                          <Check
                            size={12}
                            className={
                              col.color_hex.toLowerCase() === '#ffffff' ||
                              col.color_hex.toLowerCase() === '#f0efea'
                                ? 'text-[#0A0A0A]' : 'text-white'
                            }
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SIZE SELECTION */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2 sm:space-y-3">
                <div className="text-[0.65rem] tracking-[0.2em] uppercase">
                  <span className="font-medium text-[#0A0A0A]">
                    SIZE: <span className="text-[#736E65]">{selectedSize || 'SELECT'}</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((sz) => {
                    const variantForSize = colorVariants.find(
                      (v) => v.size.toUpperCase() === sz.toUpperCase()
                    );
                    const isAvailable = variantForSize !== undefined &&
                      variantForSize.stock > 0 && variantForSize.status === 'active';
                    const isSelected = selectedSize.toUpperCase() === sz.toUpperCase();
                    return (
                      <button
                        key={sz}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => handleSizeSelect(sz, isAvailable)}
                        className={`px-4 sm:px-5 py-2.5 text-xs font-medium tracking-wider uppercase transition-all min-w-[48px] ${
                          isSelected
                            ? 'bg-[#0A0A0A] text-[#FAF9F6]'
                            : isAvailable
                            ? 'bg-transparent text-[#0A0A0A] border border-[#0A0A0A]/20 hover:border-[#0A0A0A]'
                            : 'bg-transparent text-[#736E65]/40 border border-[#0A0A0A]/10 cursor-not-allowed line-through opacity-40'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STOCK BADGE */}
            <div className="pt-1">
              {stockState === 'OUT_OF_STOCK' && (
                <span className="badge-editorial border-red-900/30 text-red-900 bg-red-50">OUT OF STOCK</span>
              )}
              {stockState === 'LOW_STOCK' && (
                <span className="badge-editorial border-amber-900/30 text-amber-900 bg-amber-50">
                  LOW STOCK — ONLY {selectedVariant?.stock} LEFT
                </span>
              )}
              {stockState === 'IN_STOCK' && (
                <span className="badge-editorial border-emerald-900/30 text-emerald-900 bg-emerald-50">IN STOCK</span>
              )}
            </div>

            {/* SELECTION / AUTH ERROR */}
            {selectionError && (
              <div className="p-3.5 bg-red-50 border border-red-900/20 text-red-900 text-xs flex items-start space-x-2.5 rounded-none animate-fade-in">
                <AlertCircle size={16} className="text-red-800 shrink-0 mt-0.5" />
                <div className="flex-1 font-light leading-relaxed">
                  <span>{formatUserFriendlyError(selectionError)}</span>
                  {selectionError.toLowerCase().includes('sign in') && (
                    <div className="pt-1.5">
                      <Link to="/login" className="font-semibold underline hover:text-black">
                        Sign In to your Account &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ADD TO BAG + WISHLIST */}
            <div className="pt-1 sm:pt-2 flex items-center gap-3">
              <button
                type="button"
                disabled={btnState !== 'idle' || stockState === 'OUT_OF_STOCK'}
                onClick={handleAddToBagAction}
                className="btn-editorial-primary flex-1 py-4 text-xs tracking-[0.25em] disabled:opacity-50"
              >
                {btnState === 'adding' ? 'ADDING...' :
                  btnState === 'added' ? 'ADDED TO BAG' :
                  stockState === 'OUT_OF_STOCK' ? 'OUT OF STOCK' : 'ADD TO BAG'}
              </button>
              <button
                type="button"
                onClick={() => setIsWishlisted(!isWishlisted)}
                className="p-4 border border-[#0A0A0A]/20 hover:border-[#0A0A0A] transition-colors focus:outline-none flex-shrink-0"
                aria-label="Add to wishlist"
              >
                <Heart size={18} className={isWishlisted ? 'fill-[#0A0A0A] text-[#0A0A0A]' : 'text-[#0A0A0A]'} />
              </button>
            </div>

            {/* GARMENT DETAILS */}
            <div className="pt-4 sm:pt-6 hairline-t space-y-3 text-xs font-light text-[#736E65]">
              <div className="flex items-start space-x-3">
                <ShieldCheck size={15} className="text-[#0A0A0A] flex-shrink-0 mt-0.5" />
                <span>FABRIC: {product.fabric || '100% Organic Heavyweight Cotton'}</span>
              </div>
              <div className="flex items-start space-x-3">
                <RefreshCw size={15} className="text-[#0A0A0A] flex-shrink-0 mt-0.5" />
                <span>CARE: {product.care_instructions || 'Dry clean or machine wash cold 30°C.'}</span>
              </div>
              <div className="flex items-start space-x-3">
                <Truck size={15} className="text-[#0A0A0A] flex-shrink-0 mt-0.5" />
                <span>EXPRESS COMPLIMENTARY SHIPPING & 14-DAY RETURNS</span>
              </div>
            </div>
          </div>
        </div>

        {/* REVIEWS SECTION */}
        <ProductReviewsSection product={product} />

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <div className="pt-16 sm:pt-20 md:pt-24 mt-12 sm:mt-16 md:mt-20 hairline-t">
            <div className="text-center mb-8 sm:mb-10 md:mb-12">
              <span className="editorial-subtitle block mb-2">COMPLEMENTARY ARCHIVE</span>
              <h2 className="section-title uppercase">YOU MAY ALSO LIKE</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-8">
              {relatedProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
