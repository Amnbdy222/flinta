import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye } from 'lucide-react';
import { FormattedProduct } from '../types/database.types';
import { useWishlist } from '../context/WishlistContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { QuickViewModal } from './QuickViewModal';

interface ProductCardProps {
  product: FormattedProduct;
  aspectRatio?: 'editorial' | 'portrait' | 'square';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  aspectRatio = 'editorial',
}) => {
  const { settings } = useStoreSettings();
  const [selectedColorIndex, setSelectedColorIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const { isWishlisted, toggleWishlist } = useWishlist();

  const targetId = product.parentProductId || product.id;
  const wishlisted = isWishlisted(targetId);

  // Aspect ratio class selection (aspect-[3/4] preserves full model silhouette and headroom)
  const aspectClass =
    aspectRatio === 'portrait'
      ? 'aspect-[3/4]'
      : aspectRatio === 'square'
      ? 'aspect-square'
      : 'aspect-[3/4]';

  // Determine active swatch color & matching image
  const selectedColor = product.colors?.[selectedColorIndex];

  const matchingVariant = product.variants?.find(
    (v) => v.color_name?.toLowerCase() === selectedColor?.color_name?.toLowerCase()
  );

  const matchingImageObj = product.images?.find(
    (img) => matchingVariant && img.variant_id === matchingVariant.id
  );

  const swatchImage =
    matchingImageObj?.public_url ||
    product.images?.[selectedColorIndex]?.public_url ||
    product.primaryImage;

  // Secondary hover image fallback if available
  const hoverImage =
    product.images && product.images.length > 1
      ? product.images[1].public_url
      : swatchImage;

  const currentDisplayImage = isHovered && product.images && product.images.length > 1 && selectedColorIndex === 0
    ? hoverImage
    : swatchImage;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(targetId);
  };

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewOpen(true);
  };

  const handleSwatchClick = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedColorIndex(idx);
  };

  const productUrl = `/product/${product.slug}${
    selectedColor ? `?color=${encodeURIComponent(selectedColor.color_name)}` : ''
  }`;

  return (
    <>
      <div
        className="group relative flex flex-col space-y-3"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* IMAGE CONTAINER */}
        <div className={`relative overflow-hidden bg-[#F0EFEA] ${aspectClass} w-full hairline-all transition-all duration-500`}>
          <Link
            to={productUrl}
            className="block w-full h-full"
            aria-label={`View details for ${product.name}`}
          >
            <img
              src={currentDisplayImage}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-cover object-top transition-transform duration-700 ease-out md:group-hover:scale-105"
            />
          </Link>

          {/* EDITORIAL FEATURE BADGES */}
          <div className="absolute top-3 left-3 z-10 flex flex-col items-start space-y-1.5 pointer-events-none">
            {product.is_best_seller && (
              <span className="bg-[#0A0A0A] text-[#FAF9F6] text-[0.55rem] font-bold tracking-[0.2em] uppercase px-2 py-0.5 shadow-sm">
                BEST SELLER
              </span>
            )}
            {product.is_new_arrival && (
              <span className="bg-[#FAF9F6] text-[#0A0A0A] border border-[#0A0A0A]/40 text-[0.55rem] font-bold tracking-[0.2em] uppercase px-2 py-0.5 shadow-sm">
                NEW ARRIVAL
              </span>
            )}
            {product.is_top_deal && (
              <span className="bg-[#736E65] text-[#FAF9F6] text-[0.55rem] font-medium tracking-[0.2em] uppercase px-2 py-0.5 shadow-sm">
                TOP DEAL
              </span>
            )}
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="bg-[#FAF9F6]/95 backdrop-blur-sm text-[#0A0A0A] border border-[#0A0A0A]/30 text-[0.55rem] font-semibold tracking-[0.2em] uppercase px-2 py-0.5 shadow-sm">
                ARCHIVE PRICE
              </span>
            )}
          </div>

          {/* TOP RIGHT WISHLIST BUTTON */}
          <button
            type="button"
            onClick={handleWishlistClick}
            className="absolute top-3 right-3 z-20 p-2 rounded-full bg-[#FAF9F6]/80 backdrop-blur-sm text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#FAF9F6] transition-all duration-300 focus:outline-none"
            aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          >
            <Heart
              size={15}
              strokeWidth={1.5}
              className={`${wishlisted ? 'fill-[#0A0A0A] text-[#0A0A0A] animate-heart-pop' : 'text-current'}`}
            />
          </button>

          {/* DESKTOP HOVER QUICK VIEW BUTTON OVERLAY */}
          <div className="absolute inset-x-3 bottom-3 hidden md:block opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
            <button
              type="button"
              onClick={handleQuickViewClick}
              className="w-full py-2.5 bg-[#FAF9F6]/90 backdrop-blur-sm text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#FAF9F6] text-[0.65rem] font-medium tracking-[0.2em] uppercase hairline-all transition-colors flex items-center justify-center space-x-2"
            >
              <Eye size={14} />
              <span>QUICK VIEW</span>
            </button>
          </div>
        </div>

        {/* DETAILS */}
        <div className="flex flex-col space-y-1 sm:space-y-1.5 pt-1">
          <div className="flex items-start justify-between gap-2">
            <Link
              to={productUrl}
              className="font-editorial text-sm sm:text-base md:text-lg font-normal text-[#0A0A0A] hover:opacity-75 transition-opacity line-clamp-1 leading-snug"
            >
              {product.name}
            </Link>
            <span className="text-[0.7rem] sm:text-xs font-light text-[#0A0A0A] tracking-wider whitespace-nowrap flex-shrink-0">
              {settings.currency_symbol}{product.price ? product.price.toFixed(2) : '0.00'}
            </span>
          </div>

          {/* CATEGORY / FABRIC */}
          <p className="text-[0.6rem] sm:text-[0.65rem] tracking-[0.2em] text-[#736E65] uppercase line-clamp-1">
            {selectedColor ? `${selectedColor.color_name} • ` : ''}{product.fabric || product.category || 'COTTON LINEN ARCHIVE'}
          </p>

          {/* COLOR SWATCHES */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center space-x-2 pt-1 sm:pt-1.5 z-20">
              <div className="flex items-center space-x-1.5">
                {product.colors.map((col, idx) => {
                  const isActive = selectedColorIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => handleSwatchClick(e, idx)}
                      onMouseEnter={() => setSelectedColorIndex(idx)}
                      className={`w-4 h-4 sm:w-3.5 sm:h-3.5 rounded-full border border-[#0A0A0A]/30 transition-all cursor-pointer relative flex items-center justify-center ${
                        isActive
                          ? 'ring-2 ring-offset-1 ring-[#0A0A0A] scale-110 opacity-100'
                          : 'opacity-70 hover:opacity-100 hover:scale-110'
                      }`}
                      style={{ backgroundColor: col.color_hex }}
                      title={col.color_name}
                      aria-label={`Select ${col.color_name} color`}
                    />
                  );
                })}
              </div>
              <span className="text-[0.55rem] sm:text-[0.6rem] text-[#736E65] font-light uppercase tracking-widest pl-1 line-clamp-1 hidden xs:block">
                {product.colors[selectedColorIndex]?.color_name || `${product.colors.length} COLORS`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* QUICK VIEW MODAL */}
      <QuickViewModal
        product={product}
        isOpen={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
      />
    </>
  );
};
