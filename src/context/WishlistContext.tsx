import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  fetchWishlistIds,
  addWishlistItem,
  removeWishlistItem,
  fetchWishlistProducts,
  mergeGuestWishlist,
} from '../services/wishlistService';
import { FormattedProduct } from '../types/database.types';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  wishlistIds: string[];
  wishlistProducts: FormattedProduct[];
  wishlistCount: number;
  loading: boolean;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<FormattedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshWishlist = useCallback(async () => {
    try {
      if (user?.id) {
        await mergeGuestWishlist(user.id);
      }
      const ids = await fetchWishlistIds(user?.id);
      setWishlistIds(ids);

      const prods = await fetchWishlistProducts(user?.id);
      setWishlistProducts(prods);
    } catch (err) {
      console.error('Error refreshing wishlist:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const isWishlisted = (productId: string): boolean => {
    return wishlistIds.includes(productId);
  };

  const toggleWishlist = async (productId: string) => {
    const exists = isWishlisted(productId);

    // Optimistic UI update
    if (exists) {
      setWishlistIds((prev) => prev.filter((id) => id !== productId));
      setWishlistProducts((prev) => prev.filter((p) => p.id !== productId));
      await removeWishlistItem(productId, user?.id);
    } else {
      setWishlistIds((prev) => [...prev, productId]);
      await addWishlistItem(productId, user?.id);
      // Fetch updated full product list
      const prods = await fetchWishlistProducts(user?.id);
      setWishlistProducts(prods);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistProducts,
        wishlistCount: wishlistIds.length,
        loading,
        isWishlisted,
        toggleWishlist,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    return {
      wishlistIds: [],
      wishlistProducts: [],
      wishlistCount: 0,
      loading: false,
      isWishlisted: () => false,
      toggleWishlist: async () => {},
      refreshWishlist: async () => {},
    };
  }
  return context;
};
