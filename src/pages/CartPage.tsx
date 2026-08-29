import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowRight, ShieldCheck, Truck, Tag, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { EmptyState } from '../components/EmptyState';
import { SEO } from '../components/SEO';
import { fetchActiveCoupons } from '../services/couponService';
import { Coupon } from '../types/database.types';

export const CartPage: React.FC = () => {
  const {
    items,
    itemCount,
    subtotal,
    appliedCoupon,
    discountAmount,
    finalTotal,
    updateQuantity,
    removeItem,
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
          // Stay on cart after auth — user clicks "Proceed to Checkout" again
          navigate('/cart', { replace: true });
        },
      });
    } else {
      navigate('/checkout');
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pt-24 sm:pt-28 md:pt-32 pb-16 md:pb-24 container-editorial text-center text-xs tracking-widest uppercase text-[#736E65]">
        LOADING BAG SELECTION...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pt-16 sm:pt-20 pb-16 md:pb-24 flex items-center justify-center px-4">
        <EmptyState
          type="cart"
          actionPath="/shop"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-20 sm:pt-24 md:pt-28 pb-16 md:pb-24 text-[#0A0A0A]">
      <SEO
        title="Shopping Bag"
        description="Review your selected luxury garments and proceed to secure checkout."
      />
      <div className="container-editorial">
        {/* PAGE TITLE */}
        <div className="pb-7 sm:pb-10 text-center max-w-2xl mx-auto space-y-2 sm:space-y-4 hairline-b">
          <span className="editorial-subtitle block">SHOPPING SELECTION</span>
          <h1 className="font-editorial text-3xl sm:text-4xl md:text-6xl font-light uppercase tracking-tight">
            YOUR BAG ({itemCount})
          </h1>
        </div>

        {/* 2-COLUMN LAYOUT — stacks on mobile, side-by-side on lg */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 pt-7 sm:pt-10 items-start">

          {/* LEFT: CART ITEMS */}
          <div className="lg:col-span-8 space-y-0">
            {/* Desktop header row */}
            <div className="hidden md:flex justify-between pb-4 hairline-b text-[0.65rem] font-medium tracking-[0.25em] text-[#736E65] uppercase">
              <span>GARMENT</span>
              <div className="flex space-x-16 pr-4">
                <span>QUANTITY</span>
                <span>SUBTOTAL</span>
              </div>
            </div>

            <div className="divide-y divide-[#0A0A0A]/10">
              {items.map((item) => (
                <div key={item.id} className="py-5 sm:py-6 flex gap-4 sm:gap-5 md:gap-6">
                  {/* Thumbnail */}
                  <Link
                    to={`/product/${item.product_slug}`}
                    className="w-20 h-28 sm:w-24 sm:h-32 bg-[#F0EFEA] overflow-hidden flex-shrink-0 hairline-all"
                  >
                    <img
                      src={item.image_url}
                      alt={item.product_name}
                      className="w-full h-full object-cover object-center"
                    />
                  </Link>

                  {/* Details + controls */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <Link
                        to={`/product/${item.product_slug}`}
                        className="font-editorial text-base sm:text-lg md:text-xl text-[#0A0A0A] hover:opacity-75 transition-opacity line-clamp-2 leading-tight"
                      >
                        {item.product_name}
                      </Link>
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[0.6rem] sm:text-[0.65rem] tracking-widest text-[#736E65] uppercase">
                        <span>{item.color_name}</span>
                        <span>•</span>
                        <span>SIZE {item.size}</span>
                      </div>
                      <p className="text-xs font-light text-[#0A0A0A] tracking-wider">
                        ₹{item.unit_price.toFixed(2)}
                      </p>
                    </div>

                    {/* Quantity + price row */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center border border-[#0A0A0A]/20">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.max_stock)}
                          className="w-9 h-9 flex items-center justify-center text-[#0A0A0A] hover:bg-[#0A0A0A]/5 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-3 text-xs font-medium text-[#0A0A0A] min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={item.quantity >= item.max_stock}
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.max_stock)}
                          className="w-9 h-9 flex items-center justify-center text-[#0A0A0A] hover:bg-[#0A0A0A]/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-sm font-light tracking-wider text-[#0A0A0A]">
                          ₹{item.total_price.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-[#736E65] hover:text-[#0A0A0A] p-1 transition-colors"
                          aria-label={`Remove ${item.product_name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 sm:pt-6 hairline-t">
              <Link to="/shop" className="link-underline text-[#0A0A0A] text-xs tracking-widest uppercase">
                ← CONTINUE SHOPPING
              </Link>
            </div>
          </div>

          {/* RIGHT: ORDER SUMMARY */}
          <div className="lg:col-span-4 bg-[#FAF9F6] hairline-all p-5 sm:p-6 md:p-8 space-y-5 sm:space-y-6 lg:sticky lg:top-28">
            <h2 className="font-editorial text-xl sm:text-2xl uppercase tracking-wide text-[#0A0A0A] pb-3 sm:pb-4 hairline-b">
              ORDER SUMMARY
            </h2>

            {/* PROMO COUPON FORM */}
            <div className="space-y-2 border-b border-[#0A0A0A]/10 pb-4">
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-900/20 px-3.5 py-2.5 text-xs">
                  <div className="flex items-center space-x-2 text-emerald-900">
                    <Tag size={14} />
                    <span className="font-bold tracking-wider">{appliedCoupon.code}</span>
                    <span className="text-[0.65rem] text-emerald-800">(-₹{discountAmount.toFixed(2)})</span>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="text-emerald-900 hover:opacity-60 p-0.5 cursor-pointer"
                    aria-label="Remove coupon"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCouponSubmit} className="flex space-x-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="PROMO CODE"
                    className="flex-grow bg-white border border-[#0A0A0A]/20 px-3.5 py-2 text-xs uppercase tracking-wider text-[#0A0A0A] focus:border-[#0A0A0A] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="btn-editorial-primary px-4 py-2 text-[0.65rem] tracking-widest shrink-0 cursor-pointer"
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

              {/* AVAILABLE OFFERS DROPDOWN */}
              {availableCoupons.length > 0 && !appliedCoupon && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowCouponList(!showCouponList)}
                    className="text-[0.65rem] font-medium tracking-wider text-[#736E65] hover:text-[#0A0A0A] flex items-center justify-between w-full py-1 cursor-pointer"
                  >
                    <span>AVAILABLE PROMOTIONS ({availableCoupons.length})</span>
                    {showCouponList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {showCouponList && (
                    <div className="space-y-2 pt-2">
                      {availableCoupons.map((ac) => (
                        <div
                          key={ac.id || ac.code}
                          className="flex items-center justify-between bg-white border border-[#0A0A0A]/10 p-2.5 text-xs"
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
                            className="text-[0.65rem] font-bold tracking-widest text-[#0A0A0A] underline hover:opacity-60 cursor-pointer"
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

            <div className="space-y-3 sm:space-y-4 text-xs font-light text-[#383531]">
              <div className="flex justify-between">
                <span className="text-[0.65rem] tracking-[0.2em] uppercase text-[#736E65]">SUBTOTAL</span>
                <span className="tracking-wider text-[#0A0A0A]">₹{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-800 font-medium">
                  <span className="text-[0.65rem] tracking-[0.2em] uppercase">PROMO DISCOUNT</span>
                  <span className="tracking-wider">-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[0.65rem] tracking-[0.2em] uppercase text-[#736E65]">EXPRESS SHIPPING</span>
                <span className="tracking-wider text-[#0A0A0A]">COMPLIMENTARY</span>
              </div>
              <div className="pt-3 sm:pt-4 hairline-t flex justify-between items-baseline">
                <span className="text-[0.7rem] font-medium tracking-[0.25em] uppercase text-[#0A0A0A]">ESTIMATED TOTAL</span>
                <span className="text-lg sm:text-xl font-normal text-[#0A0A0A] tracking-wider">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-[0.65rem] text-[#736E65] font-light leading-relaxed">
              Taxes and duties are included during checkout.
            </p>

            <Link
              to="/checkout"
              onClick={handleCheckoutClick}
              className="btn-editorial-primary w-full py-3.5 sm:py-4 text-xs tracking-[0.25em] flex items-center justify-center space-x-2"
            >
              <span>PROCEED TO CHECKOUT</span>
              <ArrowRight size={14} />
            </Link>

            <div className="pt-3 sm:pt-4 hairline-t space-y-2 sm:space-y-3 text-[0.65rem] text-[#736E65] uppercase tracking-wider">
              <div className="flex items-center space-x-2">
                <ShieldCheck size={13} className="text-[#0A0A0A]" />
                <span>ENCRYPTED SECURE CHECKOUT</span>
              </div>
              <div className="flex items-center space-x-2">
                <Truck size={13} className="text-[#0A0A0A]" />
                <span>COMPLIMENTARY WORLDWIDE DELIVERY</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
