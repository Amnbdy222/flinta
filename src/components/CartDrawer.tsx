import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Minus, Plus, Trash2, ShoppingBag, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { EmptyState } from './EmptyState';

import { Tag, X as XIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchActiveCoupons } from '../services/couponService';
import { Coupon } from '../types/database.types';

export const CartDrawer: React.FC = () => {
  const {
    items,
    itemCount,
    subtotal,
    appliedCoupon,
    discountAmount,
    finalTotal,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeItem,
    error,
    clearError,
    loading,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const navigate = useNavigate();

  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ text: string; success: boolean } | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [showCouponList, setShowCouponList] = useState(false);

  useEffect(() => {
    fetchActiveCoupons().then(setAvailableCoupons).catch(() => {});
  }, []);

  const handleApplyCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = await applyCoupon(couponInput);
    setCouponFeedback({ text: res.message, success: res.valid });
    if (res.valid) {
      setCouponInput('');
    }
  };

  const handleApplySpecific = async (code: string) => {
    const res = await applyCoupon(code);
    setCouponFeedback({ text: res.message, success: res.valid });
  };

  const handleCheckoutClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      openAuthModal({
        title: 'SIGN IN TO CHECKOUT',
        showGuestOption: true,
        onSuccess: () => {
          closeCart();
          // Go to cart page after auth — user clicks "Proceed to Checkout" again
          navigate('/cart');
        },
      });
    } else {
      closeCart();
      navigate('/checkout');
    }
  };

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* GLASSMORPHISM BACKDROP */}
      <div
        className="fixed inset-0 bg-[#0A0A0A]/50 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* DRAWER CONTAINER */}
      <div className="relative w-full max-w-md bg-[#FAF9F6] h-full shadow-2xl flex flex-col justify-between z-10 animate-fade-in">
        {/* DRAWER HEADER */}
        <div className="py-5 px-5 sm:px-6 md:px-8 hairline-b flex items-center justify-between bg-[#FAF9F6]">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <ShoppingBag size={17} strokeWidth={1.5} className="text-[#0A0A0A]" />
            <span className="font-editorial text-lg sm:text-xl tracking-[0.2em] uppercase text-[#0A0A0A]">
              YOUR BAG ({itemCount})
            </span>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="p-2 -mr-1 text-[#0A0A0A] hover:opacity-60 transition-opacity focus:outline-none"
            aria-label="Close cart drawer"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* ERROR NOTIFICATION BANNER */}
        {error && (
          <div className="bg-red-50 text-red-900 px-6 py-3 text-xs flex items-center justify-between hairline-b">
            <div className="flex items-center space-x-2">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button type="button" onClick={clearError} className="hover:opacity-75">
              <X size={14} />
            </button>
          </div>
        )}

        {/* DRAWER CONTENT */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 md:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6">
          {loading ? (
            <div className="py-20 text-center text-xs tracking-widest uppercase text-[#736E65]">
              LOADING SELECTION...
            </div>
          ) : items.length === 0 ? (
            <div className="py-6">
              <EmptyState
                type="cart"
                actionPath="/shop"
              />
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex space-x-4 pb-6 hairline-b relative group"
              >
                {/* Image */}
                <Link
                  to={`/product/${item.product_slug}`}
                  onClick={closeCart}
                  className="w-20 h-24 bg-[#F0EFEA] overflow-hidden flex-shrink-0 hairline-all"
                >
                  <img
                    src={item.image_url}
                    alt={item.product_name}
                    className="w-full h-full object-cover object-center"
                  />
                </Link>

                {/* Info & Controls */}
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <Link
                        to={`/product/${item.product_slug}`}
                        onClick={closeCart}
                        className="font-editorial text-base font-normal text-[#0A0A0A] hover:underline line-clamp-1"
                      >
                        {item.product_name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-[#736E65] hover:text-[#0A0A0A] p-1 transition-colors"
                        aria-label={`Remove ${item.product_name}`}
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>

                    <div className="flex items-center space-x-2 text-[0.65rem] tracking-wider text-[#736E65] uppercase">
                      <span>COLOR: {item.color_name}</span>
                      <span>•</span>
                      <span>SIZE: {item.size}</span>
                    </div>
                  </div>

                  {/* Quantity & Total Price */}
                  <div className="flex justify-between items-center pt-2">
                    {/* - / + Controls */}
                    <div className="flex items-center border border-[#0A0A0A]/20">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1, item.max_stock)}
                        className="px-2 py-1 text-[#0A0A0A] hover:bg-[#0A0A0A]/5 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="px-3 text-xs font-medium text-[#0A0A0A]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={item.quantity >= item.max_stock}
                        onClick={() => updateQuantity(item.id, item.quantity + 1, item.max_stock)}
                        className="px-2 py-1 text-[#0A0A0A] hover:bg-[#0A0A0A]/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Unit Total Price */}
                    <span className="text-xs font-light tracking-wider text-[#0A0A0A]">
                      ₹{item.total_price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-5 sm:p-6 bg-[#FAF9F6] hairline-t space-y-3 sm:space-y-4">
            {/* COUPON SECTION */}
            <div className="space-y-2 border-b border-[#0A0A0A]/10 pb-3">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-900/20 px-3 py-2 text-xs">
                  <div className="flex items-center space-x-2 text-emerald-900">
                    <Tag size={13} />
                    <span className="font-bold tracking-wider">{appliedCoupon.code}</span>
                    <span className="text-[0.65rem] text-emerald-800">(-₹{discountAmount.toFixed(2)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-emerald-900 hover:opacity-60 p-0.5"
                    aria-label="Remove coupon"
                  >
                    <XIcon size={14} />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCouponSubmit} className="flex space-x-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="PROMO CODE"
                    className="flex-grow bg-white border border-[#0A0A0A]/20 px-3 py-1.5 text-xs uppercase tracking-wider text-[#0A0A0A] focus:border-[#0A0A0A] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="btn-editorial-primary px-3 py-1.5 text-[0.65rem] tracking-widest shrink-0 cursor-pointer"
                  >
                    APPLY
                  </button>
                </form>
              )}

              {/* COUPON FEEDBACK MESSAGE */}
              {couponFeedback && (
                <p
                  className={`text-[0.65rem] font-medium tracking-wide ${
                    couponFeedback.success ? 'text-emerald-800' : 'text-red-800'
                  }`}
                >
                  {couponFeedback.text}
                </p>
              )}

              {/* AVAILABLE COUPONS DROPDOWN */}
              {availableCoupons.length > 0 && !appliedCoupon && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowCouponList(!showCouponList)}
                    className="text-[0.65rem] font-medium tracking-wider text-[#736E65] hover:text-[#0A0A0A] flex items-center justify-between w-full py-1"
                  >
                    <span>AVAILABLE OFFERS ({availableCoupons.length})</span>
                    {showCouponList ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                  {showCouponList && (
                    <div className="space-y-1.5 pt-1.5">
                      {availableCoupons.map((ac: Coupon) => (
                        <div
                          key={ac.id || ac.code}
                          className="flex items-center justify-between bg-white border border-[#0A0A0A]/10 p-2 text-xs"
                        >
                          <div>
                            <span className="font-bold tracking-wider text-[#0A0A0A] block">{ac.code}</span>
                            <span className="text-[0.6rem] text-[#736E65]">
                              {ac.discount_type === 'percentage' ? `${ac.discount_value}% OFF` : `₹${ac.discount_value} OFF`} (MIN ₹{ac.minimum_order_value})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleApplySpecific(ac.code)}
                            className="text-[0.6rem] font-bold tracking-widest text-[#0A0A0A] underline hover:opacity-60 cursor-pointer"
                          >
                            APPLY
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SUBTOTAL & DISCOUNT BREAKDOWN */}
            <div className="space-y-1.5 text-xs font-light">
              <div className="flex justify-between items-baseline">
                <span className="text-[0.65rem] tracking-[0.2em] uppercase text-[#736E65]">BAG SUBTOTAL</span>
                <span className="tracking-wider text-[#0A0A0A]">₹{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between items-baseline text-emerald-800 font-medium">
                  <span className="text-[0.65rem] tracking-[0.2em] uppercase">PROMO DISCOUNT</span>
                  <span className="tracking-wider">-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-[#0A0A0A]/10 flex justify-between items-baseline font-normal">
                <span className="text-[0.7rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A]">TOTAL</span>
                <span className="text-lg font-normal text-[#0A0A0A] tracking-wider">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-[0.6rem] text-[#736E65] font-light tracking-wide uppercase text-center">
              COMPLIMENTARY SHIPPING & DUTIES INCLUDED AT CHECKOUT
            </p>

            <div className="space-y-2 pt-1 sm:pt-2">
              <Link to="/cart" onClick={closeCart} className="btn-editorial-outline w-full py-3 text-xs text-center block">
                VIEW FULL BAG
              </Link>
              <Link to="/checkout" onClick={handleCheckoutClick} className="btn-editorial-primary w-full py-3.5 text-xs text-center block tracking-[0.25em]">
                PROCEED TO CHECKOUT
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
