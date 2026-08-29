import React from 'react';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { ProductCard } from '../components/ProductCard';
import { EmptyState } from '../components/EmptyState';
import { SEO } from '../components/SEO';
import { ProductSkeleton } from '../components/LoadingSkeleton';
import { AccountLayout } from '../components/AccountLayout';

export const WishlistPage: React.FC = () => {
  const { wishlistProducts, wishlistCount, loading } = useWishlist();
  const { user } = useAuth();

  const content = (
    <div className="space-y-6">
      {/* HEADER — Only shown when items exist */}
      {wishlistProducts.length > 0 && (
        <div className="pb-6 hairline-b flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 hairline-all">
          <div>
            <span className="editorial-subtitle block">SAVED SELECTIONS</span>
            <h1 className="font-editorial text-2xl sm:text-3xl font-light uppercase tracking-tight mt-0.5">
              MY WISHLIST ({wishlistCount})
            </h1>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <ProductSkeleton />
          <ProductSkeleton />
          <ProductSkeleton />
        </div>
      ) : wishlistProducts.length === 0 ? (
        <div className="bg-white py-6 sm:py-10 px-4 hairline-all">
          <EmptyState
            type="wishlist"
            actionPath="/shop"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
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
    <div className="min-h-screen bg-[#FAF9F6] pt-10 pb-24 text-[#0A0A0A]">
      <SEO
        title="Saved Garments Wishlist"
        description="Your saved luxury fashion garments and curated pieces."
      />
      <div className="container-editorial max-w-6xl mx-auto">{content}</div>
    </div>
  );
};
