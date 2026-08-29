import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FormattedProduct } from '../types/database.types';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { ArrowRight, Check } from 'lucide-react';

interface FeaturedProductSectionProps {
  product: FormattedProduct;
}

export const FeaturedProductSection: React.FC<FeaturedProductSectionProps> = ({ product }) => {
  const { settings } = useStoreSettings();
  const [selectedColor, setSelectedColor] = useState(
    product.colors[0]?.color_name || 'Primary'
  );
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'M');

  return (
    <section className="py-24 bg-[#FAF9F6] hairline-b" aria-label="Featured Product Showcase">
      <div className="container-editorial">
        <div className="text-center mb-16 space-y-3">
          <span className="text-xs font-medium tracking-[0.3em] text-[#736E65] uppercase block">
            CURATED PIECE
          </span>
          <h2 className="font-editorial text-4xl md:text-6xl font-light uppercase tracking-tight text-[#0A0A0A]">
            SPOTLIGHT GARMENT
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* IMAGE SIDE */}
          <div className="lg:col-span-7 relative">
            <div className="aspect-[4/5] bg-white overflow-hidden hairline-all relative group shadow-sm">
              <img
                src={product.primaryImage}
                alt={product.name}
                loading="lazy"
                className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute top-6 left-6">
                <span className="badge-editorial bg-[#FAF9F6]/90 backdrop-blur-sm">FEATURED SELECTION</span>
              </div>
            </div>
          </div>

          {/* DETAILS & CTA SIDE */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <span className="text-[0.65rem] tracking-[0.3em] uppercase text-[#736E65] block font-medium">
                {product.category || 'PERMANENT COLLECTION'}
              </span>
              <h3 className="font-editorial text-3xl md:text-5xl font-normal text-[#0A0A0A] leading-tight">
                {product.name}
              </h3>
              <div className="flex items-baseline space-x-4 pt-1">
                <span className="text-xl font-light text-[#0A0A0A] tracking-wider">
                  {settings.currency_symbol}{product.price ? product.price.toFixed(2) : '0.00'}
                </span>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span className="text-sm font-light text-[#736E65] line-through">
                    {settings.currency_symbol}{product.compareAtPrice.toFixed(2)}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#736E65] font-light leading-relaxed pt-2">
                {product.short_description ||
                  product.description ||
                  'Architectural silhouette cut from premium long-staple organic cotton. Hand-finished seams with tailored structural drape.'}
              </p>
            </div>

            {/* COLOR OPTIONS */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-3 pt-2">
                <label className="text-[0.65rem] font-medium tracking-[0.2em] text-[#0A0A0A] uppercase block">
                  COLOR: <span className="text-[#736E65]">{selectedColor}</span>
                </label>
                <div className="flex items-center space-x-3">
                  {product.colors.map((col, idx) => {
                    const isSelected = selectedColor === col.color_name;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedColor(col.color_name)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                          isSelected ? 'ring-1 ring-offset-2 ring-[#0A0A0A]' : 'opacity-80 hover:opacity-100'
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

            {/* SIZE OPTIONS */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[0.65rem] tracking-[0.2em] uppercase">
                  <span className="font-medium text-[#0A0A0A]">
                    SIZE: <span className="text-[#736E65]">{selectedSize}</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((sz) => {
                    const isSelected = selectedSize === sz;
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`px-4 py-2 text-xs font-medium tracking-wider uppercase transition-all ${
                          isSelected
                            ? 'bg-[#0A0A0A] text-[#FAF9F6]'
                            : 'bg-transparent text-[#0A0A0A] border border-[#0A0A0A]/20 hover:border-[#0A0A0A]'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CTA BUTTON */}
            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <Link
                to={`/product/${product.slug}`}
                className="btn-editorial-primary flex-1 group"
              >
                <span>VIEW GARMENT DETAILS</span>
                <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
