import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getOrCreateActiveCart,
  fetchCartItems,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
  formatUserFriendlyError,
} from '../services/cartService';
import { Cart, FormattedCartItem } from '../types/database.types';

import { Coupon } from '../types/database.types';
import { validateAndCalculateCoupon, CouponValidationResult } from '../services/couponService';

interface CartContextType {
  cart: Cart | null;
  items: FormattedCartItem[];
  itemCount: number;
  subtotal: number;
  appliedCoupon: Coupon | null;
  discountAmount: number;
  finalTotal: number;
  isCartOpen: boolean;
  loading: boolean;
  error: string | null;
  openCart: () => void;
  closeCart: () => void;
  addToBag: (variantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, newQuantity: number, maxStock: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<CouponValidationResult>;
  removeCoupon: () => void;
  clearCartLocal: () => void;
  clearError: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [items, setItems] = useState<FormattedCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Calculate itemCount & subtotal from items
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.total_price, 0);

  // Recalculate discount whenever subtotal or appliedCoupon changes
  useEffect(() => {
    if (!appliedCoupon) {
      setDiscountAmount(0);
      return;
    }

    if (subtotal < appliedCoupon.minimum_order_value) {
      setAppliedCoupon(null);
      setDiscountAmount(0);
      return;
    }

    let disc = 0;
    if (appliedCoupon.discount_type === 'percentage') {
      disc = (subtotal * appliedCoupon.discount_value) / 100;
      if (appliedCoupon.maximum_discount && appliedCoupon.maximum_discount > 0) {
        disc = Math.min(disc, appliedCoupon.maximum_discount);
      }
    } else {
      disc = Math.min(appliedCoupon.discount_value, subtotal);
    }
    setDiscountAmount(Math.round(disc * 100) / 100);
  }, [subtotal, appliedCoupon]);

  const finalTotal = Math.max(0, subtotal - discountAmount);

  const applyCoupon = async (code: string): Promise<CouponValidationResult> => {
    const result = await validateAndCalculateCoupon(code, subtotal);
    if (result.valid && result.coupon) {
      setAppliedCoupon(result.coupon);
      setDiscountAmount(result.discountAmount);
    }
    return result;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const clearError = () => setError(null);

  // Initialize cart session and load items on mount
  const refreshCart = useCallback(async () => {
    try {
      setError(null);
      const activeCart = await getOrCreateActiveCart();
      setCart(activeCart);
      const cartItems = await fetchCartItems(activeCart.id);
      setItems(cartItems);
    } catch (err: unknown) {
      console.error('Error initializing cart:', err);
      const msg = err instanceof Error ? err.message : 'Failed to sync shopping bag with server.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  // Add to Bag action
  const addToBag = async (variantId: string, quantity: number = 1) => {
    try {
      setError(null);
      let currentCart = cart;
      if (!currentCart) {
        currentCart = await getOrCreateActiveCart();
        setCart(currentCart);
      }

      await addItemToCart(currentCart.id, variantId, quantity);

      // Refresh items immediately
      const updatedItems = await fetchCartItems(currentCart.id);
      setItems(updatedItems);

      // Open drawer on successful addition
      openCart();
    } catch (err: unknown) {
      console.error('Error adding item to bag:', err);
      const rawMsg = err instanceof Error ? err.message : 'Unable to add garment to bag.';
      const formatted = formatUserFriendlyError(rawMsg);
      setError(formatted);
      throw new Error(formatted);
    }
  };

  // Update item quantity
  const updateQuantity = async (itemId: string, newQuantity: number, maxStock: number) => {
    if (!cart) return;
    try {
      setError(null);
      await updateCartItemQuantity(itemId, newQuantity, maxStock);
      const updatedItems = await fetchCartItems(cart.id);
      setItems(updatedItems);
    } catch (err: unknown) {
      console.error('Error updating cart quantity:', err);
      const msg = err instanceof Error ? err.message : 'Unable to update item quantity.';
      setError(msg);
    }
  };

  // Remove item
  const removeItem = async (itemId: string) => {
    if (!cart) return;
    try {
      setError(null);
      await removeCartItem(itemId);
      const updatedItems = await fetchCartItems(cart.id);
      setItems(updatedItems);
    } catch (err: unknown) {
      console.error('Error removing cart item:', err);
      const msg = err instanceof Error ? err.message : 'Unable to remove item from bag.';
      setError(msg);
    }
  };

  const clearCartLocal = () => {
    setCart(null);
    setItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        items,
        itemCount,
        subtotal,
        appliedCoupon,
        discountAmount,
        finalTotal,
        isCartOpen,
        loading,
        error,
        openCart,
        closeCart,
        addToBag,
        updateQuantity,
        removeItem,
        refreshCart,
        applyCoupon,
        removeCoupon,
        clearCartLocal,
        clearError,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
