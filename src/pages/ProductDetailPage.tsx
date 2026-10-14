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
import { useStoreSettings } from '../context/StoreSettingsContext';
import { useCart } from '../context/CartContext';
import { formatUserFriendlyError } from '../services/cartService';
import { ArrowLeft, Check, Heart, ShieldCheck, RefreshCw, Truck, AlertCircle, ChevronDown, ChevronUp, FileText, Ruler, Sparkles, X } from 'lucide-react';

interface SizingRow {
  size: string;
  primaryIn: string;
  primaryCm: string;
  lengthIn: string;
  lengthCm: string;
  secondaryIn: string;
  secondaryCm: string;
}

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings } = useStoreSettings();
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

  // Full Product Story & Sizing Details States
  const [isStoryOpen, setIsStoryOpen] = useState(true);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [sizeUnit, setSizeUnit] = useState<'in' | 'cm'>('in');

  // Parse full product story and sizing / bullet details
  const parsedStory = useMemo(() => {
    if (!product?.description) return { specs: [], bullets: [], paragraphs: [] };
    const rawLines = product.description.split('\n').map((l) => l.trim()).filter(Boolean);
    const specs: { label: string; value: string }[] = [];
    const bullets: string[] = [];
    const paragraphs: string[] = [];

    rawLines.forEach((line) => {
      if (line.includes(':') && line.indexOf(':') < 25) {
        const [label, ...valParts] = line.split(':');
        const val = valParts.join(':').trim();
        if (label && val) {
          specs.push({ label: label.trim(), value: val });
          return;
        }
      }
      if (line.length < 75 && !line.endsWith('.')) {
        bullets.push(line.replace(/^[•\-*]\s*/, ''));
      } else {
        paragraphs.push(line);
      }
    });

    return { specs, bullets, paragraphs };
  }, [product?.description]);

  const isBottoms = useMemo(() => {
    const cat = (product?.category || '').toLowerCase();
    const name = (product?.name || '').toLowerCase();
    return (
      cat.includes('jean') ||
      cat.includes('pant') ||
      cat.includes('jogger') ||
      cat.includes('cargo') ||
      cat.includes('trouser') ||
      name.includes('pant') ||
      name.includes('jean') ||
      name.includes('cargo') ||
      name.includes('jogger')
    );
  }, [product?.category, product?.name]);

  const sizingChartData: SizingRow[] = useMemo(() => {
    if (isBottoms) {
      return [
        { size: 'S (28-30)', primaryIn: '28 - 30"', primaryCm: '71 - 76 cm', lengthIn: '40"', lengthCm: '101 cm', secondaryIn: '38"', secondaryCm: '96 cm' },
        { size: 'M (31-32)', primaryIn: '31 - 32"', primaryCm: '78 - 81 cm', lengthIn: '41"', lengthCm: '104 cm', secondaryIn: '40"', secondaryCm: '101 cm' },
        { size: 'L (33-34)', primaryIn: '33 - 34"', primaryCm: '83 - 86 cm', lengthIn: '41.5"', lengthCm: '105 cm', secondaryIn: '42"', secondaryCm: '106 cm' },
        { size: 'XL (35-36)', primaryIn: '35 - 36"', primaryCm: '88 - 91 cm', lengthIn: '42"', lengthCm: '107 cm', secondaryIn: '44"', secondaryCm: '112 cm' },
        { size: 'XXL (37-38)', primaryIn: '37 - 38"', primaryCm: '94 - 97 cm', lengthIn: '42.5"', lengthCm: '108 cm', secondaryIn: '46"', secondaryCm: '117 cm' },
      ];
    }
    return [
      { size: 'XS', primaryIn: '36"', primaryCm: '91 cm', lengthIn: '26.5"', lengthCm: '67 cm', secondaryIn: '16.5"', secondaryCm: '42 cm' },
      { size: 'S', primaryIn: '38"', primaryCm: '96 cm', lengthIn: '27.5"', lengthCm: '70 cm', secondaryIn: '17.5"', secondaryCm: '44 cm' },
      { size: 'M', primaryIn: '40"', primaryCm: '101 cm', lengthIn: '28.5"', lengthCm: '72 cm', secondaryIn: '18.5"', secondaryCm: '47 cm' },
      { size: 'L', primaryIn: '42"', primaryCm: '106 cm', lengthIn: '29.5"', lengthCm: '75 cm', secondaryIn: '19.5"', secondaryCm: '49 cm' },
      { size: 'XL', primaryIn: '44"', primaryCm: '112 cm', lengthIn: '30.5"', lengthCm: '77 cm', secondaryIn: '20.5"', secondaryCm: '52 cm' },
      { size: 'XXL', primaryIn: '46"', primaryCm: '117 cm', lengthIn: '31.5"', lengthCm: '80 cm', secondaryIn: '21.5"', secondaryCm: '54 cm' },
    ];
  }, [isBottoms]);

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

          const catalog = await fetchActiveProducts();
          setRelatedProducts(
            catalog.filter((p) => p.slug !== slug && p.parentProductId !== item.id).slice(0, 4)
          );
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
        breadcrumbs={[
          { name: 'Home', url: '/' },
          { name: 'Catalogue', url: '/shop' },
          { name: product.category, url: `/shop?category=${encodeURIComponent(product.category)}` },
          { name: product.name, url: `/products/${product.slug}` },
        ]}
        productData={{
          name: product.name,
          description: product.description || product.short_description,
          image: galleryImages[0] || product.primaryImage,
          price: displayPrice,
          currency: 'INR',
          inStock: stockState !== 'OUT_OF_STOCK',
          category: product.category,
          sku: selectedVariant?.sku || product.variants?.[0]?.sku,
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
                  {settings.currency_symbol}{displayPrice ? displayPrice.toFixed(2) : '0.00'}
                </span>
                {displayComparePrice && displayComparePrice > displayPrice && (
                  <span className="text-sm font-light text-[#736E65] line-through">
                    {settings.currency_symbol}{displayComparePrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* SHORT DESCRIPTION / SUBTITLE */}
            {(product.short_description || product.description) && (
              <p className="text-xs sm:text-sm text-[#383531] font-light leading-relaxed">
                {product.short_description || (parsedStory.paragraphs[0] || parsedStory.bullets[0] || product.description)}
              </p>
            )}

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
                <div className="flex items-center justify-between text-[0.65rem] tracking-[0.2em] uppercase">
                  <span className="font-medium text-[#0A0A0A]">
                    SIZE: <span className="text-[#736E65]">{selectedSize || 'SELECT'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSizeModal(true)}
                    className="inline-flex items-center gap-1 text-[0.62rem] text-[#736E65] hover:text-[#0A0A0A] font-medium underline underline-offset-2 tracking-wider transition-colors"
                  >
                    <Ruler size={11} className="text-[#C5A059]" />
                    <span>SIZING GUIDE</span>
                  </button>
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
                <span>
                  COMPLIMENTARY SHIPPING OVER {settings.currency_symbol}{settings.free_shipping_threshold}
                  {settings.is_returns_enabled ? ` · EASY ${settings.return_policy_days}-DAY RETURNS` : ''}
                  {settings.is_exchanges_enabled ? ` · ${settings.exchange_policy_days}-DAY EXCHANGES` : ''}
                </span>
              </div>
            </div>

            {/* FULL PRODUCT STORY & SIZING DETAILS (SIDEBAR ACCORDION) */}
            {(product.description || product.short_description) && (
              <div className="pt-4 sm:pt-6 hairline-t">
                <button
                  type="button"
                  onClick={() => setIsStoryOpen(!isStoryOpen)}
                  className="w-full flex items-center justify-between py-1.5 text-left group focus:outline-none"
                  aria-expanded={isStoryOpen}
                >
                  <div className="flex items-center space-x-2">
                    <FileText size={14} className="text-[#C5A059]" />
                    <span className="text-[0.68rem] sm:text-xs font-bold tracking-[0.18em] uppercase text-[#0A0A0A] group-hover:text-[#D45A45] transition-colors">
                      FULL PRODUCT STORY & SIZING DETAILS
                    </span>
                  </div>
                  <div className="text-[#0A0A0A] group-hover:text-[#D45A45] transition-colors">
                    {isStoryOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </div>
                </button>

                {isStoryOpen && (
                  <div className="pt-3 pb-1 space-y-3.5 text-xs font-light text-[#383531] animate-fade-in">
                    {/* Paragraphs if any */}
                    {parsedStory.paragraphs.map((p, idx) => (
                      <p key={idx} className="leading-relaxed text-[#383531]">
                        {p}
                      </p>
                    ))}

                    {/* Bullet points if any */}
                    {parsedStory.bullets.length > 0 && (
                      <ul className="space-y-1.5 pl-0.5">
                        {parsedStory.bullets.map((b, idx) => (
                          <li key={idx} className="flex items-start space-x-2 text-[0.72rem] text-[#383531]">
                            <span className="text-[#D45A45] text-xs font-bold leading-none mt-0.5">•</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Key-Value specs if any */}
                    {parsedStory.specs.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#0A0A0A]/5">
                        {parsedStory.specs.map((s, idx) => (
                          <div key={idx} className="bg-[#FAF9F6] p-2 border border-[#0A0A0A]/8">
                            <span className="text-[0.58rem] tracking-wider uppercase text-[#736E65] block font-medium">
                              {s.label}
                            </span>
                            <span className="text-[0.7rem] font-semibold text-[#0A0A0A] block truncate">
                              {s.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Fallback if raw description was plain text */}
                    {parsedStory.paragraphs.length === 0 &&
                      parsedStory.bullets.length === 0 &&
                      parsedStory.specs.length === 0 &&
                      product.description && (
                        <p className="whitespace-pre-line leading-relaxed text-[#383531]">
                          {product.description}
                        </p>
                      )}

                    {/* Sizing Details Quick Link */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setShowSizeModal(true)}
                        className="inline-flex items-center gap-1.5 text-[0.65rem] font-bold tracking-[0.15em] uppercase text-[#0A0A0A] hover:text-[#D45A45] transition-colors underline underline-offset-4"
                      >
                        <Ruler size={12} />
                        <span>OPEN COMPLETE SIZING & FIT GUIDE →</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* FULL PRODUCT STORY & SIZING DETAILS — DEDICATED EDITORIAL SHOWCASE */}
        <div className="pt-12 sm:pt-16 md:pt-20 mt-10 sm:mt-14 hairline-t">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8 sm:mb-10 text-center sm:text-left">
              <div className="inline-flex items-center space-x-1.5 text-[0.6rem] font-medium tracking-[0.3em] uppercase text-[#736E65] bg-[#0A0A0A]/5 px-2.5 py-0.5 border border-[#0A0A0A]/10 mb-2">
                <Sparkles size={11} className="text-[#C5A059]" />
                <span>✦ ARCHIVE SPECIFICATIONS & FIT ✦</span>
              </div>
              <h2 className="font-editorial text-2xl sm:text-3xl md:text-4xl font-normal uppercase tracking-tight text-[#0A0A0A]">
                Full Product Story & Sizing Details
              </h2>
              <div className="h-[2px] w-24 sm:w-32 bg-[#D45A45] mt-2.5 mx-auto sm:mx-0" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Left Column: Product Story, Design Philosophy & Key Highlights */}
              <div className="lg:col-span-6 space-y-6">
                <div>
                  <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[#0A0A0A] mb-3">
                    DESIGN STORY & HIGHLIGHTS
                  </h3>
                  {product.short_description && (
                    <p className="text-sm font-light text-[#0A0A0A] leading-relaxed mb-4 pb-3 hairline-b">
                      {product.short_description}
                    </p>
                  )}
                  {parsedStory.paragraphs.map((p, idx) => (
                    <p key={idx} className="text-xs text-[#383531] font-light leading-relaxed mb-3">
                      {p}
                    </p>
                  ))}
                  {parsedStory.bullets.length > 0 && (
                    <div className="space-y-2 mt-4 pt-3 hairline-t">
                      <span className="text-[0.62rem] tracking-[0.2em] uppercase text-[#736E65] font-semibold block">
                        SILHOUETTE & FUNCTIONALITY
                      </span>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {parsedStory.bullets.map((b, idx) => (
                          <li key={idx} className="flex items-center space-x-2 text-xs text-[#383531] bg-[#FAF9F6] p-2.5 border border-[#0A0A0A]/8">
                            <span className="text-[#D45A45] font-bold">✓</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {parsedStory.specs.length > 0 && (
                    <div className="mt-4 pt-3 hairline-t">
                      <span className="text-[0.62rem] tracking-[0.2em] uppercase text-[#736E65] font-semibold block mb-2">
                        GARMENT SPECIFICATIONS
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {parsedStory.specs.map((s, idx) => (
                          <div key={idx} className="bg-[#FAF9F6] p-2.5 border border-[#0A0A0A]/8">
                            <span className="text-[0.58rem] tracking-wider uppercase text-[#736E65] block">
                              {s.label}
                            </span>
                            <span className="text-xs font-bold text-[#0A0A0A] block">
                              {s.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {parsedStory.paragraphs.length === 0 &&
                    parsedStory.bullets.length === 0 &&
                    parsedStory.specs.length === 0 &&
                    product.description && (
                      <p className="whitespace-pre-line text-xs text-[#383531] font-light leading-relaxed">
                        {product.description}
                      </p>
                    )}
                </div>

                {/* Material & Care Card */}
                <div className="bg-[#FAF9F6] border border-[#0A0A0A]/10 p-4 sm:p-5 space-y-2">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck size={16} className="text-[#0A0A0A]" />
                    <span className="text-xs font-bold tracking-wider uppercase text-[#0A0A0A]">
                      COMPOSITION & CARE
                    </span>
                  </div>
                  <p className="text-xs text-[#736E65] font-light">
                    <strong className="text-[#0A0A0A] font-medium">Fabric:</strong> {product.fabric || '100% Premium Heavyweight Cotton'}
                  </p>
                  <p className="text-xs text-[#736E65] font-light">
                    <strong className="text-[#0A0A0A] font-medium">Care:</strong> {product.care_instructions || 'Machine wash cold inside out, tumble dry low.'}
                  </p>
                </div>
              </div>

              {/* Right Column: Sizing Details & Fit Table */}
              <div className="lg:col-span-6 bg-white border border-[#0A0A0A]/12 shadow-sm p-5 sm:p-7 space-y-5">
                <div className="flex items-center justify-between pb-3 hairline-b">
                  <div className="flex items-center space-x-2">
                    <Ruler size={16} className="text-[#C5A059]" />
                    <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-[#0A0A0A]">
                      SIZING DETAILS & MEASUREMENTS
                    </h3>
                  </div>
                  {/* Unit toggle (IN / CM) */}
                  <div className="flex items-center border border-[#0A0A0A]/20 text-[0.6rem] font-bold">
                    <button
                      type="button"
                      onClick={() => setSizeUnit('in')}
                      className={`px-2 py-0.5 ${sizeUnit === 'in' ? 'bg-[#0A0A0A] text-[#FAF9F6]' : 'text-[#736E65] hover:text-[#0A0A0A]'}`}
                    >
                      IN
                    </button>
                    <button
                      type="button"
                      onClick={() => setSizeUnit('cm')}
                      className={`px-2 py-0.5 ${sizeUnit === 'cm' ? 'bg-[#0A0A0A] text-[#FAF9F6]' : 'text-[#736E65] hover:text-[#0A0A0A]'}`}
                    >
                      CM
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#0A0A0A]/15 text-[0.6rem] uppercase tracking-wider text-[#736E65]">
                        <th className="py-2.5 font-bold">SIZE</th>
                        <th className="py-2.5 font-bold">{isBottoms ? 'WAIST' : 'CHEST'}</th>
                        <th className="py-2.5 font-bold">LENGTH</th>
                        <th className="py-2.5 font-bold">{isBottoms ? 'HIP' : 'SHOULDER'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#0A0A0A]/8 font-light">
                      {sizingChartData.map((row) => {
                        const isCurrent = (selectedSize || '').toUpperCase().startsWith(row.size.split(' ')[0].toUpperCase());
                        return (
                          <tr key={row.size} className={isCurrent ? 'bg-[#FAF9F6] font-medium' : ''}>
                            <td className="py-2.5 font-bold text-[#0A0A0A]">
                              {row.size}
                              {isCurrent && <span className="ml-1 text-[0.55rem] text-[#D45A45] font-semibold">(Selected)</span>}
                            </td>
                            <td className="py-2.5 text-[#383531]">
                              {sizeUnit === 'in' ? row.primaryIn : row.primaryCm}
                            </td>
                            <td className="py-2.5 text-[#383531]">
                              {sizeUnit === 'in' ? row.lengthIn : row.lengthCm}
                            </td>
                            <td className="py-2.5 text-[#383531]">
                              {sizeUnit === 'in' ? row.secondaryIn : row.secondaryCm}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="text-[0.68rem] text-[#736E65] font-light leading-relaxed pt-2 border-t border-[#0A0A0A]/8 space-y-1">
                  <p>
                    <strong className="text-[#0A0A0A] font-medium">Fit Advice:</strong>{' '}
                    {isBottoms
                      ? 'Designed for a relaxed wide-leg drape. Take your regular waist size for the intended streetwear silhouette.'
                      : 'Regular relaxed fit. Fits true to size. Take your normal size for a comfortable modern drape.'}
                  </p>
                  <p>
                    Measurements may vary by ±0.5 inches due to manual cutting and finishing.
                  </p>
                </div>
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

      {/* SIZING GUIDE MODAL */}
      {showSizeModal && (
        <div className="fixed inset-0 z-50 bg-[#0A0A0A]/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white max-w-lg w-full p-6 sm:p-8 space-y-5 relative border border-[#0A0A0A]/20 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowSizeModal(false)}
              className="absolute top-4 right-4 p-2 text-[#736E65] hover:text-[#0A0A0A] transition-colors focus:outline-none"
              aria-label="Close Size Guide"
            >
              <X size={20} />
            </button>

            <div className="space-y-1 pr-8">
              <div className="inline-flex items-center space-x-1.5 text-[0.6rem] font-medium tracking-[0.25em] uppercase text-[#736E65] bg-[#0A0A0A]/5 px-2 py-0.5 border border-[#0A0A0A]/10">
                <Ruler size={10} className="text-[#C5A059]" />
                <span>FLINT ARCHIVE FIT GUIDE</span>
              </div>
              <h3 className="font-editorial text-2xl font-normal text-[#0A0A0A] uppercase tracking-tight">
                Sizing Details & Measurements
              </h3>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[0.65rem] uppercase tracking-wider text-[#736E65] font-medium">
                Standard {isBottoms ? 'Bottoms / Trousers' : 'Tops / Shirts'} Matrix
              </span>
              <div className="flex items-center border border-[#0A0A0A]/20 text-[0.6rem] font-bold">
                <button
                  type="button"
                  onClick={() => setSizeUnit('in')}
                  className={`px-2.5 py-0.5 ${sizeUnit === 'in' ? 'bg-[#0A0A0A] text-[#FAF9F6]' : 'text-[#736E65] hover:text-[#0A0A0A]'}`}
                >
                  IN
                </button>
                <button
                  type="button"
                  onClick={() => setSizeUnit('cm')}
                  className={`px-2.5 py-0.5 ${sizeUnit === 'cm' ? 'bg-[#0A0A0A] text-[#FAF9F6]' : 'text-[#736E65] hover:text-[#0A0A0A]'}`}
                >
                  CM
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-[#0A0A0A]/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F6]">
                  <tr className="border-b border-[#0A0A0A]/15 text-[0.6rem] uppercase tracking-wider text-[#736E65]">
                    <th className="py-2.5 px-3 font-bold">SIZE</th>
                    <th className="py-2.5 px-3 font-bold">{isBottoms ? 'WAIST' : 'CHEST'}</th>
                    <th className="py-2.5 px-3 font-bold">LENGTH</th>
                    <th className="py-2.5 px-3 font-bold">{isBottoms ? 'HIP' : 'SHOULDER'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0A0A0A]/8 font-light">
                  {sizingChartData.map((row) => {
                    const isCurrent = (selectedSize || '').toUpperCase().startsWith(row.size.split(' ')[0].toUpperCase());
                    return (
                      <tr key={row.size} className={isCurrent ? 'bg-[#FAF9F6] font-medium' : ''}>
                        <td className="py-2.5 px-3 font-bold text-[#0A0A0A]">
                          {row.size}
                          {isCurrent && <span className="ml-1 text-[0.55rem] text-[#D45A45] font-semibold">(Selected)</span>}
                        </td>
                        <td className="py-2.5 px-3 text-[#383531]">
                          {sizeUnit === 'in' ? row.primaryIn : row.primaryCm}
                        </td>
                        <td className="py-2.5 px-3 text-[#383531]">
                          {sizeUnit === 'in' ? row.lengthIn : row.lengthCm}
                        </td>
                        <td className="py-2.5 px-3 text-[#383531]">
                          {sizeUnit === 'in' ? row.secondaryIn : row.secondaryCm}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="text-[0.68rem] text-[#736E65] font-light leading-relaxed space-y-1">
              <p>
                <strong className="text-[#0A0A0A] font-medium">Measurement Tip:</strong> For waist measurements, measure around your natural waistline where trousers normally sit.
              </p>
              <p>Need custom styling advice? Reach our client care desk anytime.</p>
            </div>

            <button
              type="button"
              onClick={() => setShowSizeModal(false)}
              className="btn-editorial-primary w-full py-3 text-xs tracking-[0.2em]"
            >
              CLOSE SIZING GUIDE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
