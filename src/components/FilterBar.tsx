import React, { useState } from 'react';
import { SlidersHorizontal, ArrowUpDown, X, Check } from 'lucide-react';
import { DynamicFilterOptions } from '../services/productService';

interface FilterBarProps {
  filterOptions: DynamicFilterOptions;
  selectedColors?: string[];
  selectedSizes?: string[];
  selectedColor?: string;
  selectedSize?: string;
  selectedMinPrice?: number;
  selectedMaxPrice?: number;
  inStockOnly?: boolean;
  selectedSort?: string;
  totalResults: number;
  onFilterChange: (updates: {
    colors?: string[];
    sizes?: string[];
    color?: string;
    size?: string;
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: boolean;
  }) => void;
  onSortChange: (sort: string) => void;
  onClearAll: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filterOptions,
  selectedColors,
  selectedSizes,
  selectedColor,
  selectedSize,
  selectedMinPrice,
  selectedMaxPrice,
  inStockOnly,
  selectedSort = 'recommended',
  totalResults,
  onFilterChange,
  onSortChange,
  onClearAll,
}) => {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileSortOpen, setMobileSortOpen] = useState(false);
  const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(false);

  // Normalize colors & sizes into arrays for multi-select
  const colors: string[] = selectedColors
    ? selectedColors
    : selectedColor
    ? selectedColor.split(',').filter(Boolean)
    : [];

  const sizes: string[] = selectedSizes
    ? selectedSizes
    : selectedSize
    ? selectedSize.split(',').filter(Boolean)
    : [];

  const handleToggleColor = (colorName: string) => {
    const isSelected = colors.includes(colorName);
    const updated = isSelected
      ? colors.filter((c) => c !== colorName)
      : [...colors, colorName];

    onFilterChange({
      colors: updated,
      color: updated.length > 0 ? updated.join(',') : undefined,
    });
  };

  const handleToggleSize = (sizeName: string) => {
    const isSelected = sizes.includes(sizeName);
    const updated = isSelected
      ? sizes.filter((s) => s !== sizeName)
      : [...sizes, sizeName];

    onFilterChange({
      sizes: updated,
      size: updated.length > 0 ? updated.join(',') : undefined,
    });
  };

  const activeFilterCount =
    colors.length +
    sizes.length +
    (selectedMinPrice !== undefined || selectedMaxPrice !== undefined ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  const sortLabels: Record<string, string> = {
    recommended: 'RECOMMENDED',
    newest: 'NEWEST ARRIVALS',
    price_asc: 'PRICE: LOW TO HIGH',
    price_desc: 'PRICE: HIGH TO LOW',
  };

  return (
    <div className="w-full pb-8">
      {/* ACTION BAR (DESKTOP & MOBILE) */}
      <div className="flex items-center justify-between py-4 hairline-b text-xs font-medium tracking-[0.2em] uppercase text-[#0A0A0A]">
        {/* LEFT: DESKTOP FILTER TOGGLE & MOBILE FILTER/SORT BUTTONS */}
        <div className="flex items-center space-x-4">
          {/* Desktop Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setDesktopFiltersOpen(!desktopFiltersOpen)}
            className="hidden md:flex items-center space-x-2 py-2 px-4 border border-[#0A0A0A]/20 hover:border-[#0A0A0A] transition-colors cursor-pointer"
          >
            <SlidersHorizontal size={14} />
            <span>FILTERS</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#0A0A0A] text-[#FAF9F6] text-[0.6rem] flex items-center justify-center ml-1">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Mobile Filter Button */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="flex md:hidden items-center space-x-2 py-2 px-3 border border-[#0A0A0A]/20 cursor-pointer"
          >
            <SlidersHorizontal size={14} />
            <span>FILTER</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#0A0A0A] text-[#FAF9F6] text-[0.6rem] flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Mobile Sort Button */}
          <button
            type="button"
            onClick={() => setMobileSortOpen(true)}
            className="flex md:hidden items-center space-x-2 py-2 px-3 border border-[#0A0A0A]/20 cursor-pointer"
          >
            <ArrowUpDown size={14} />
            <span>SORT</span>
          </button>
        </div>

        {/* CENTER: TOTAL ITEM COUNT */}
        <div className="text-[0.65rem] tracking-[0.25em] text-[#736E65]">
          {totalResults} {totalResults === 1 ? 'GARMENT' : 'GARMENTS'} AVAILABLE
        </div>

        {/* RIGHT: DESKTOP SORT DROPDOWN */}
        <div className="hidden md:flex items-center space-x-3">
          <span className="text-[#736E65]">SORT BY:</span>
          <select
            value={selectedSort}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-transparent border border-[#0A0A0A]/20 py-2 px-3 text-xs tracking-wider text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] uppercase cursor-pointer"
          >
            <option value="recommended">RECOMMENDED</option>
            <option value="newest">NEWEST ARRIVALS</option>
            <option value="price_asc">PRICE: LOW TO HIGH</option>
            <option value="price_desc">PRICE: HIGH TO LOW</option>
          </select>
        </div>
      </div>

      {/* ACTIVE FILTER TAGS */}
      {activeFilterCount > 0 && (
        <div className="pt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[0.65rem] tracking-widest text-[#736E65] uppercase mr-2">
            ACTIVE FILTERS:
          </span>

          {colors.map((cName) => (
            <span
              key={`col-${cName}`}
              className="inline-flex items-center px-3 py-1 bg-[#E6E4DD]/60 text-[#0A0A0A] border border-[#0A0A0A]/10 font-medium"
            >
              Color: {cName}
              <button
                type="button"
                onClick={() => handleToggleColor(cName)}
                className="ml-2 hover:opacity-60 cursor-pointer"
              >
                <X size={12} />
              </button>
            </span>
          ))}

          {sizes.map((sName) => (
            <span
              key={`sz-${sName}`}
              className="inline-flex items-center px-3 py-1 bg-[#E6E4DD]/60 text-[#0A0A0A] border border-[#0A0A0A]/10 font-medium"
            >
              Size: {sName}
              <button
                type="button"
                onClick={() => handleToggleSize(sName)}
                className="ml-2 hover:opacity-60 cursor-pointer"
              >
                <X size={12} />
              </button>
            </span>
          ))}

          {(selectedMinPrice !== undefined || selectedMaxPrice !== undefined) && (
            <span className="inline-flex items-center px-3 py-1 bg-[#E6E4DD]/60 text-[#0A0A0A] border border-[#0A0A0A]/10">
              Price: ₹{selectedMinPrice || 0} - ₹{selectedMaxPrice || filterOptions.maxPrice}
              <button
                type="button"
                onClick={() => onFilterChange({ minPrice: undefined, maxPrice: undefined })}
                className="ml-2 hover:opacity-60 cursor-pointer"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {inStockOnly && (
            <span className="inline-flex items-center px-3 py-1 bg-[#E6E4DD]/60 text-[#0A0A0A] border border-[#0A0A0A]/10">
              In Stock Only
              <button
                type="button"
                onClick={() => onFilterChange({ inStockOnly: false })}
                className="ml-2 hover:opacity-60 cursor-pointer"
              >
                <X size={12} />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={onClearAll}
            className="text-[0.65rem] tracking-wider uppercase text-[#736E65] hover:text-[#0A0A0A] underline ml-2 cursor-pointer"
          >
            Clear All
          </button>
        </div>
      )}

      {/* DESKTOP EXPANDABLE FILTER PANEL */}
      {desktopFiltersOpen && (
        <div className="hidden md:grid grid-cols-4 gap-8 py-6 my-4 bg-[#FAF9F6] hairline-all p-6 animate-fade-in">
          {/* Color Filter */}
          <div className="space-y-3">
            <h4 className="text-[0.65rem] font-medium tracking-[0.2em] text-[#0A0A0A] uppercase">
              COLOR (MULTI-SELECT)
            </h4>
            <div className="flex flex-wrap gap-2">
              {filterOptions.colors.map((c) => {
                const isSelected = colors.includes(c.color_name);
                return (
                  <button
                    key={c.color_name}
                    type="button"
                    onClick={() => handleToggleColor(c.color_name)}
                    className={`flex items-center space-x-2 px-3 py-1.5 border text-xs tracking-wider uppercase transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#0A0A0A] bg-[#0A0A0A] text-[#FAF9F6]'
                        : 'border-[#0A0A0A]/20 bg-transparent text-[#0A0A0A] hover:border-[#0A0A0A]'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/20"
                      style={{ backgroundColor: c.color_hex }}
                    />
                    <span>{c.color_name}</span>
                    {isSelected && <Check size={12} className="ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Filter */}
          <div className="space-y-3">
            <h4 className="text-[0.65rem] font-medium tracking-[0.2em] text-[#0A0A0A] uppercase">
              SIZE (MULTI-SELECT)
            </h4>
            <div className="flex flex-wrap gap-2">
              {filterOptions.sizes.map((s) => {
                const isSelected = sizes.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleToggleSize(s)}
                    className={`px-3 py-1.5 text-xs font-medium tracking-wider uppercase border transition-all cursor-pointer flex items-center space-x-1 ${
                      isSelected
                        ? 'border-[#0A0A0A] bg-[#0A0A0A] text-[#FAF9F6]'
                        : 'border-[#0A0A0A]/20 bg-transparent text-[#0A0A0A] hover:border-[#0A0A0A]'
                    }`}
                  >
                    <span>{s}</span>
                    {isSelected && <Check size={12} className="ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Filter */}
          <div className="space-y-3">
            <h4 className="text-[0.65rem] font-medium tracking-[0.2em] text-[#0A0A0A] uppercase">
              PRICE RANGE (₹)
            </h4>
            <div className="flex items-center space-x-2 text-xs">
              <input
                type="number"
                placeholder="Min ₹"
                value={selectedMinPrice !== undefined ? selectedMinPrice : ''}
                onChange={(e) =>
                  onFilterChange({
                    minPrice: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-20 bg-transparent border border-[#0A0A0A]/20 px-2 py-1 focus:outline-none focus:border-[#0A0A0A]"
              />
              <span className="text-[#736E65]">-</span>
              <input
                type="number"
                placeholder="Max ₹"
                value={selectedMaxPrice !== undefined ? selectedMaxPrice : ''}
                onChange={(e) =>
                  onFilterChange({
                    maxPrice: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-20 bg-transparent border border-[#0A0A0A]/20 px-2 py-1 focus:outline-none focus:border-[#0A0A0A]"
              />
            </div>
          </div>

          {/* Availability Filter */}
          <div className="space-y-3">
            <h4 className="text-[0.65rem] font-medium tracking-[0.2em] text-[#0A0A0A] uppercase">
              AVAILABILITY
            </h4>
            <label className="flex items-center space-x-3 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={!!inStockOnly}
                onChange={(e) => onFilterChange({ inStockOnly: e.target.checked })}
                className="w-4 h-4 accent-[#0A0A0A]"
              />
              <span>In Stock Only</span>
            </label>
          </div>
        </div>
      )}

      {/* MOBILE FULL-SCREEN FILTER DRAWER */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#FAF9F6] animate-fade-in overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 hairline-b flex-shrink-0">
            <div className="flex items-center space-x-2">
              <span className="font-editorial text-xl tracking-[0.2em] uppercase text-[#0A0A0A]">FILTERS</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#0A0A0A] text-[#FAF9F6] text-[0.6rem] flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setMobileFilterOpen(false)}
              className="p-2 -mr-2 text-[#0A0A0A]"
              aria-label="Close filters"
            >
              <X size={22} />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto py-5 px-5 space-y-7">
            {/* Color */}
            <div className="space-y-3">
              <h4 className="text-[0.7rem] font-semibold tracking-[0.25em] uppercase text-[#0A0A0A]">COLOR</h4>
              <div className="flex flex-wrap gap-2">
                {filterOptions.colors.map((c) => {
                  const isSelected = colors.includes(c.color_name);
                  return (
                    <button
                      key={c.color_name}
                      type="button"
                      onClick={() => handleToggleColor(c.color_name)}
                      className={`flex items-center space-x-2 px-3 py-2.5 border text-xs tracking-wider uppercase min-h-[40px] ${
                        isSelected
                          ? 'border-[#0A0A0A] bg-[#0A0A0A] text-[#FAF9F6]'
                          : 'border-[#0A0A0A]/20 text-[#0A0A0A]'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full border border-black/20 flex-shrink-0" style={{ backgroundColor: c.color_hex }} />
                      <span>{c.color_name}</span>
                      {isSelected && <Check size={12} className="ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size */}
            <div className="space-y-3 hairline-t pt-5">
              <h4 className="text-[0.7rem] font-semibold tracking-[0.25em] uppercase text-[#0A0A0A]">SIZE</h4>
              <div className="flex flex-wrap gap-2">
                {filterOptions.sizes.map((s) => {
                  const isSelected = sizes.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleToggleSize(s)}
                      className={`px-4 py-2.5 text-xs font-medium tracking-wider uppercase border flex items-center space-x-1 min-h-[40px] min-w-[48px] justify-center ${
                        isSelected
                          ? 'border-[#0A0A0A] bg-[#0A0A0A] text-[#FAF9F6]'
                          : 'border-[#0A0A0A]/20 text-[#0A0A0A]'
                      }`}
                    >
                      <span>{s}</span>
                      {isSelected && <Check size={12} className="ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price */}
            <div className="space-y-3 hairline-t pt-5">
              <h4 className="text-[0.7rem] font-semibold tracking-[0.25em] uppercase text-[#0A0A0A]">PRICE RANGE (₹)</h4>
              <div className="flex items-center space-x-3 text-xs">
                <input
                  type="number"
                  placeholder="Min"
                  inputMode="numeric"
                  value={selectedMinPrice !== undefined ? selectedMinPrice : ''}
                  onChange={(e) => onFilterChange({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full bg-transparent border border-[#0A0A0A]/20 px-3 py-2.5 focus:outline-none focus:border-[#0A0A0A] text-sm"
                />
                <span className="text-[#736E65] flex-shrink-0">–</span>
                <input
                  type="number"
                  placeholder="Max"
                  inputMode="numeric"
                  value={selectedMaxPrice !== undefined ? selectedMaxPrice : ''}
                  onChange={(e) => onFilterChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full bg-transparent border border-[#0A0A0A]/20 px-3 py-2.5 focus:outline-none focus:border-[#0A0A0A] text-sm"
                />
              </div>
            </div>

            {/* Availability */}
            <div className="space-y-3 hairline-t pt-5">
              <h4 className="text-[0.7rem] font-semibold tracking-[0.25em] uppercase text-[#0A0A0A]">AVAILABILITY</h4>
              <label className="flex items-center space-x-3 cursor-pointer text-sm min-h-[44px]">
                <input
                  type="checkbox"
                  checked={!!inStockOnly}
                  onChange={(e) => onFilterChange({ inStockOnly: e.target.checked })}
                  className="w-5 h-5 accent-[#0A0A0A]"
                />
                <span className="text-xs tracking-wider">In-Stock Garments Only</span>
              </label>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="px-5 py-4 hairline-t flex gap-3 flex-shrink-0 pb-safe">
            <button type="button" onClick={onClearAll} className="btn-editorial-outline flex-1 py-3 text-xs">
              CLEAR ALL
            </button>
            <button type="button" onClick={() => setMobileFilterOpen(false)} className="btn-editorial-primary flex-1 py-3 text-xs">
              VIEW RESULTS
            </button>
          </div>
        </div>
      )}

      {/* MOBILE SORT BOTTOM SHEET */}
      {mobileSortOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileSortOpen(false)}
            aria-hidden="true"
          />
          <div className="relative bg-[#FAF9F6] rounded-t-2xl shadow-2xl animate-slide-up overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 hairline-b">
              <span className="font-editorial text-lg tracking-[0.2em] uppercase text-[#0A0A0A]">SORT BY</span>
              <button type="button" onClick={() => setMobileSortOpen(false)} className="p-2 -mr-2 text-[#0A0A0A]" aria-label="Close sort">
                <X size={20} />
              </button>
            </div>
            <div className="px-2 py-2 pb-safe-or-4">
              {Object.entries(sortLabels).map(([key, label]) => {
                const isSelected = selectedSort === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { onSortChange(key); setMobileSortOpen(false); }}
                    className={`w-full text-left py-3.5 px-4 flex justify-between items-center text-xs tracking-[0.2em] uppercase font-medium rounded-lg transition-colors ${
                      isSelected ? 'font-semibold text-[#0A0A0A] bg-[#E6E4DD]/50' : 'text-[#736E65] hover:bg-[#F0EFEA]'
                    }`}
                  >
                    <span>{label}</span>
                    {isSelected && <Check size={15} className="text-[#0A0A0A]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
