import React from 'react';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { ProductCard } from '../components/ProductCard';
import { EmptyState } from '../components/EmptyState';
import { SEO } from '../components/SEO';
import { ProductSkeleton } from '../components/LoadingSkeleton';
import { AccountLayout } from '../components/AccountLayout';
import { Link } from 'react-router-dom';
import { ChevronLeft, ArrowRight } from 'lucide-react';

export const WishlistPage: React.FC = () => {
  const { wishlistProducts, wishlistCount, loading } = useWishlist();
  const { user } = useAuth();

  const content = (
    <div className="space-y-4 sm:space-y-6">
      {/* HEADER */}
      <div className="bg-white border border-[#EAE8E2] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <span className="text-[10px] tracking-widest uppercase font-semibold text-[#736E65] block">
            SAVED SELECTIONS
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-light uppercase tracking-tight text-[#0A0A0A] mt-0.5">
            MY WISHLIST ({wishlistCount})
          </h1>
        </div>
        <Link
          to="/shop"
          className="btn-editorial-outline text-xs py-2 px-4 sm:px-5 inline-flex items-center space-x-2 self-start sm:self-auto shrink-0 cursor-pointer"
        >
          <span>EXPLORE SHOP</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <ProductSkeleton />
          <ProductSkeleton />
          <ProductSkeleton />
        </div>
      ) : wishlistProducts.length === 0 ? (
        <div className="bg-white py-8 sm:py-12 px-4 border border-[#EAE8E2] shadow-xs">
          <EmptyState type="wishlist" actionPath="/shop" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {wishlistProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );

  if (user) {
    return (
      <AccountLayout activeKey="wishlist" title="Saved Wishlist Garments">
        {content}
      </AccountLayout>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#0A0A0A] pt-4 sm:pt-6 pb-16 sm:pb-24">
      <SEO
        title="Saved Garments Wishlist"
        description="Your saved luxury fashion garments and curated pieces."
        noindex
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#EAE8E2] mb-5 sm:mb-6">
          <Link
            to="/shop"
            className="inline-flex items-center text-xs tracking-wider uppercase text-[#736E65] hover:text-[#0A0A0A] transition-colors group"
          >
            <ChevronLeft
              size={16}
              className="mr-1 group-hover:-translate-x-0.5 transition-transform"
            />
            <span>CONTINUE SHOPPING</span>
          </Link>
          <Link
            to="/login"
            className="text-xs tracking-wider uppercase text-[#0A0A0A] hover:underline font-semibold"
          >
            SIGN IN TO SYNC
          </Link>
        </div>
        {content}
      </div>
    </div>
  );
};
