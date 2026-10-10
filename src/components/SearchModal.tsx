import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Loader2 } from 'lucide-react';
import { fetchPaginatedProducts } from '../services/productService';
import { FormattedProduct } from '../types/database.types';
import { useStoreSettings } from '../context/StoreSettingsContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const { settings } = useStoreSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<FormattedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Debounced search logic (300ms delay)
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);

    const timer = setTimeout(async () => {
      try {
        const res = await fetchPaginatedProducts({
          search: searchTerm,
          limit: 6,
        });
        setResults(res.products);
      } catch (err) {
        console.error('Search error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#FAF9F6] animate-fade-in">
      {/* HEADER BAR */}
      <div className="py-6 px-6 md:px-12 hairline-b flex items-center justify-between">
        <span className="font-editorial text-2xl tracking-[0.25em] text-[#0A0A0A]">
          FLINT SEARCH
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-[#0A0A0A] hover:opacity-60 transition-opacity focus:outline-none"
          aria-label="Close search"
        >
          <X size={24} strokeWidth={1.5} />
        </button>
      </div>

      {/* INPUT AREA */}
      <div className="container-editorial py-8 max-w-4xl mx-auto w-full">
        <div className="relative flex items-center hairline-b pb-4">
          <Search size={22} className="text-[#736E65] mr-4 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by garment name, fabric, or category..."
            className="w-full bg-transparent text-lg md:text-2xl font-editorial tracking-wide text-[#0A0A0A] placeholder-[#A39E93] focus:outline-none"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-xs uppercase tracking-widest text-[#736E65] hover:text-[#0A0A0A] ml-2"
            >
              CLEAR
            </button>
          )}
        </div>

        {/* SEARCH RESULTS CONTAINER */}
        <div className="mt-8 overflow-y-auto max-h-[65vh] pr-2">
          {loading ? (
            <div className="py-16 text-center text-xs tracking-widest uppercase text-[#736E65] flex items-center justify-center space-x-3">
              <Loader2 size={18} className="animate-spin text-[#0A0A0A]" />
              <span>SEARCHING ARCHIVE...</span>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-xs text-[#736E65]">
              An error occurred while searching. Please try again.
            </div>
          ) : searchTerm && results.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <p className="font-editorial text-2xl text-[#0A0A0A]">
                NO GARMENTS MATCHED "{searchTerm.toUpperCase()}"
              </p>
              <p className="text-xs text-[#736E65] font-light">
                Try searching for general terms such as "shirt", "cotton", or "noir".
              </p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center text-[0.65rem] tracking-[0.25em] text-[#736E65] uppercase pb-2 hairline-b">
                <span>FOUND {results.length} MATCHING GARMENTS</span>
                <Link
                  to={`/shop?search=${encodeURIComponent(searchTerm)}`}
                  onClick={onClose}
                  className="hover:text-[#0A0A0A] underline"
                >
                  VIEW ALL RESULTS IN SHOP
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {results.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.slug}`}
                    onClick={onClose}
                    className="group flex space-x-4 p-2 hairline-all bg-white/40 hover:bg-white transition-colors"
                  >
                    <div className="w-16 h-20 bg-[#F0EFEA] flex-shrink-0 overflow-hidden">
                      <img
                        src={product.primaryImage}
                        alt={product.name}
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="flex flex-col justify-center space-y-1">
                      <h4 className="font-editorial text-base text-[#0A0A0A] group-hover:underline">
                        {product.name}
                      </h4>
                      <p className="text-xs font-light text-[#736E65]">
                        {settings.currency_symbol}{product.price ? product.price.toFixed(2) : '0.00'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 space-y-4">
              <span className="text-[0.65rem] tracking-[0.25em] text-[#736E65] uppercase block font-medium">
                SUGGESTED SEARCHES
              </span>
              <div className="flex flex-wrap gap-3">
                {['T-Shirt', 'Cotton', 'Linen', 'Noir', 'Organic'].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setSearchTerm(term)}
                    className="px-4 py-2 text-xs border border-[#0A0A0A]/20 text-[#0A0A0A] hover:border-[#0A0A0A] transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
