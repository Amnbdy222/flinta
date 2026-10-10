import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FormattedProduct, ProductVariant } from '../types/database.types';
import { useCart } from '../context/CartContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { X, Check, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface QuickViewModalProps {
  product: FormattedProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, isOpen, onClose }) => {
  const { addToBag } = useCart();
  const { settings } = useStoreSettings();

  const [selectedColor, setSelectedColor] = useState<string>(
    product?.colors[0]?.color_name || ''
  );
  const [selectedSize, setSelectedSize] = useState<string>(
    product?.sizes[0] || ''
  );
  const [btnState, setBtnState] = useState<'idle' | 'adding' | 'added'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Sync state if product changes
  React.useEffect(() => {
    if (product) {
      const initialColor = product.colors[0]?.color_name || '';
      setSelectedColor(initialColor);

      const colorVars = product.variants.filter(
        (v) => v.color_name.toLowerCase() === initialColor.toLowerCase()
      );
      const initialSize = colorVars.find((v) => v.stock > 0)?.size || colorVars[0]?.size || '';
      setSelectedSize(initialSize);
      setError(null);
    }
  }, [product]);

  const colorVariants = useMemo(() => {
    if (!product || !selectedColor) return [];
    return product.variants.filter(
      (v) => v.color_name.toLowerCase() === selectedColor.toLowerCase()
    );
  }, [product, selectedColor]);

  const selectedVariant: ProductVariant | undefined = useMemo(() => {
    if (!selectedColor || !selectedSize) return undefined;
    return colorVariants.find(
      (v) => v.size.toUpperCase() === selectedSize.toUpperCase()
    );
  }, [colorVariants, selectedColor, selectedSize]);

  const displayPrice = selectedVariant ? Number(selectedVariant.price) : product?.price || 0;

  const stockState = useMemo(() => {
    if (!selectedVariant) return 'UNKNOWN';
    if (selectedVariant.stock <= 0 || selectedVariant.status !== 'active') return 'OUT_OF_STOCK';
    if (selectedVariant.stock <= (selectedVariant.low_stock_threshold || 5)) return 'LOW_STOCK';
    return 'IN_STOCK';
  }, [selectedVariant]);

  const handleColorChange = (colorName: string) => {
    setSelectedColor(colorName);
    setError(null);

    const newColorVars = product?.variants.filter(
      (v) => v.color_name.toLowerCase() === colorName.toLowerCase()
    ) || [];

    const firstInStockSize = newColorVars.find((v) => v.stock > 0)?.size;
    const newSize = firstInStockSize || newColorVars[0]?.size || '';
    setSelectedSize(newSize);
  };

  const handleAddToBag = async () => {
    if (!selectedVariant) {
      setError('PLEASE SELECT AN AVAILABLE SIZE');
      return;
    }

    if (stockState === 'OUT_OF_STOCK') {
      setError('THIS VARIANT IS CURRENTLY OUT OF STOCK');
      return;
    }

    setBtnState('adding');
    setError(null);

    try {
      await addToBag(selectedVariant.id, 1);
      setBtnState('added');
      setTimeout(() => {
        setBtnState('idle');
        onClose();
      }, 1500);
    } catch (err: unknown) {
      console.error('Quick view error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to add item to bag.';
      setError(msg);
      setBtnState('idle');
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0A0A0A]/50 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-3xl bg-[#FAF9F6] shadow-2xl hairline-all overflow-hidden max-h-[90vh] flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-[#0A0A0A] hover:opacity-60 transition-opacity bg-[#FAF9F6]/80 rounded-full backdrop-blur-sm"
          aria-label="Close Quick View"
        >
          <X size={20} />
        </button>

        {/* IMAGE SIDE */}
        <Link
          to={`/products/${product.slug}`}
          onClick={onClose}
          className="w-full md:w-1/2 aspect-[3/4] bg-[#F0EFEA] relative overflow-hidden flex-shrink-0 group cursor-pointer block"
        >
          <img
            src={product.primaryImage}
            alt={product.name}
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {/* DETAILS SIDE */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-[0.65rem] tracking-[0.3em] uppercase text-[#736E65] font-medium block">
                {product.category || 'QUICK PREVIEW'}
              </span>
              <Link
                to={`/products/${product.slug}`}
                onClick={onClose}
                className="font-editorial text-3xl font-normal text-[#0A0A0A] hover:opacity-75 transition-opacity block"
              >
                {product.name}
              </Link>
              <p className="text-lg font-light text-[#0A0A0A] tracking-wider">
                {settings.currency_symbol}{displayPrice.toFixed(2)}
              </p>
            </div>

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2">
                <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">
                  COLOR: <span className="text-[#736E65]">{selectedColor}</span>
                </label>
                <div className="flex items-center space-x-2">
                  {product.colors.map((c, idx) => {
                    const isSelected = selectedColor.toLowerCase() === c.color_name.toLowerCase();
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleColorChange(c.color_name)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          isSelected ? 'ring-1 ring-offset-2 ring-[#0A0A0A]' : 'opacity-70'
                        }`}
                        style={{ backgroundColor: c.color_hex }}
                      >
                        {isSelected && (
                          <Check
                            size={10}
                            className={
                              c.color_hex.toLowerCase() === '#ffffff' ||
                              c.color_hex.toLowerCase() === '#f0efea'
                                ? 'text-[#0A0A0A]'
                                : 'text-white'
                            }
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2">
                <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">
                  SIZE: <span className="text-[#736E65]">{selectedSize || 'SELECT'}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((sz) => {
                    const vForSize = colorVariants.find(
                      (v) => v.size.toUpperCase() === sz.toUpperCase()
                    );
                    const isAvail =
                      vForSize !== undefined && vForSize.stock > 0 && vForSize.status === 'active';
                    const isSelected = selectedSize.toUpperCase() === sz.toUpperCase();

                    return (
                      <button
                        key={sz}
                        type="button"
                        disabled={!isAvail}
                        onClick={() => {
                          if (isAvail) setSelectedSize(sz);
                        }}
                        className={`px-3 py-1.5 text-xs font-medium uppercase border ${
                          isSelected
                            ? 'bg-[#0A0A0A] text-[#FAF9F6] border-[#0A0A0A]'
                            : isAvail
                            ? 'bg-transparent text-[#0A0A0A] border-[#0A0A0A]/20'
                            : 'opacity-30 line-through cursor-not-allowed border-[#0A0A0A]/10'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 text-xs text-red-700">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4 hairline-t">
            <button
              type="button"
              disabled={btnState !== 'idle' || stockState === 'OUT_OF_STOCK'}
              onClick={handleAddToBag}
              className="btn-editorial-primary w-full py-3.5 text-xs tracking-[0.25em] flex items-center justify-center space-x-2"
            >
              <span>
                {btnState === 'adding'
                  ? 'ADDING...'
                  : btnState === 'added'
                  ? 'ADDED TO BAG'
                  : 'ADD TO BAG'}
              </span>
              <ArrowRight size={14} />
            </button>

            <div className="flex items-center justify-center space-x-2 text-[0.65rem] text-[#736E65] uppercase">
              <ShieldCheck size={14} />
              <span>{product.fabric || '100% ORGANIC COTTON'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
