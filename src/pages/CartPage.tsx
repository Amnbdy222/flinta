import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowRight, ShieldCheck, Truck, Tag, X, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
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
  const { settings } = useStoreSettings();
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
          navigate('/checkout', { replace: true });
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

  const isFreeShipping = subtotal >= settings.free_shipping_threshold;
  const amountNeeded = settings.free_shipping_threshold - subtotal;
  const shippingFee = isFreeShipping ? 0 : settings.flat_shipping_rate;

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-20 sm:pt-24 md:pt-28 pb-16 md:pb-24 text-[#0A0A0A]">
      <SEO
        title="Shopping Bag"
        description="Review your selected luxury garments and proceed to secure checkout."
      />
      <div className="container-editorial">
        {/* PAGE TITLE */}
        <div className="pb-7 sm:pb-10 text-center max-w-2xl mx-auto space-y-2 sm:space-y-4 hairline-b">
          <span className="editorial-subtitle block">YOUR SELECTION</span>
          <h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-light uppercase tracking-tight">
            SHOPPING BAG ({itemCount})
          </h1>
        </div>

        {/* FREE SHIPPING PROGRESS BANNER */}
        <div className="mt-6 mb-8 bg-[#F0EFEA] p-4 text-center text-xs tracking-wider uppercase font-medium text-[#0A0A0A] hairline-all max-w-4xl mx-auto">
          {isFreeShipping ? (
            <span className="text-emerald-800 font-semibold flex items-center justify-center space-x-1.5">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>YOU'VE UNLOCKED COMPLIMENTARY SHIPPING</span>
            </span>
          ) : (
            <span>
              ADD {settings.currency_symbol}{amountNeeded.toFixed(2)} MORE TO UNLOCK COMPLIMENTARY SHIPPING
            </span>
          )}
        </div>

        {/* GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 pt-2 sm:pt-4">
          {/* LEFT: BAG ITEM TABLE */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-6">
            {/* Desktop Table Headers */}
            <div className="hidden md:grid grid-cols-12 text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-[#736E65] pb-3 hairline-b">
              <span className="col-span-6">GARMENT</span>
              <span className="col-span-3 text-center">QUANTITY</span>
              <span className="col-span-3 text-right">TOTAL</span>
            </div>

            {/* Item Rows */}
            <div className="space-y-4 sm:space-y-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pb-5 sm:pb-6 hairline-b"
                >
                  {/* Garment Details & Image */}
                  <div className="md:col-span-6 flex space-x-4">
                    <Link to={`/product/${item.product_slug}`} className="shrink-0">
                      <img
                        src={item.image_url}
                        alt={item.product_name}
                        className="w-20 h-24 sm:w-24 sm:h-32 object-cover object-top bg-[#F0EFEA] hairline-all"
                      />
                    </Link>
                    <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0">
                      <Link
                        to={`/product/${item.product_slug}`}
                        className="font-editorial text-base sm:text-lg font-normal text-[#0A0A0A] hover:underline line-clamp-1"
                      >
                        {item.product_name}
                      </Link>
                      <div className="flex items-center space-x-2 text-[0.65rem] tracking-wider text-[#736E65] uppercase">
                        <span>COLOR: {item.color_name}</span>
                        <span>•</span>
                        <span>SIZE: {item.size}</span>
                      </div>
                      <p className="text-xs font-light text-[#0A0A0A] tracking-wider pt-0.5">
                        {settings.currency_symbol}{item.unit_price.toFixed(2)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-[0.65rem] tracking-wider uppercase text-red-900/80 hover:text-red-950 flex items-center space-x-1 pt-2 transition-colors cursor-pointer"
                      >
                        <Trash2 size={12} />
                        <span>REMOVE</span>
                      </button>
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="md:col-span-3 flex md:justify-center items-center">
                    <div className="flex items-center border border-[#0A0A0A]/20 bg-white">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1, item.max_stock)}
                        className="px-3 py-1.5 text-[#0A0A0A] hover:bg-[#0A0A0A]/5 transition-colors cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="px-4 text-xs font-medium text-[#0A0A0A]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        disabled={item.quantity >= item.max_stock}
                        onClick={() => updateQuantity(item.id, item.quantity + 1, item.max_stock)}
                        className="px-3 py-1.5 text-[#0A0A0A] hover:bg-[#0A0A0A]/5 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Total price for line item */}
                  <div className="md:col-span-3 text-right">
                    <span className="text-sm sm:text-base font-light text-[#0A0A0A] tracking-wider">
                      {settings.currency_symbol}{item.total_price.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Back to Shop Link */}
            <div className="pt-2">
              <Link
                to="/shop"
                className="text-xs font-medium tracking-[0.2em] uppercase text-[#0A0A0A] hover:opacity-70 transition-opacity inline-flex items-center space-x-2"
              >
                <span>CONTINUE SHOPPING</span>
              </Link>
            </div>
          </div>

          {/* RIGHT: ORDER SUMMARY */}
          <div className="lg:col-span-4">
            <div className="bg-[#FAF9F6] hairline-all p-6 sm:p-8 space-y-5 sm:space-y-6 sticky top-28">
              <h2 className="font-editorial text-xl sm:text-2xl uppercase tracking-wide text-[#0A0A0A] pb-3 sm:pb-4 hairline-b">
                ORDER SUMMARY
              </h2>

              {/* PROMO CODE SECTION */}
              <div className="space-y-2 pb-4 hairline-b">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-800/20 p-3 text-xs text-emerald-900">
                    <div className="flex items-center space-x-2">
                      <Tag size={14} className="text-emerald-800" />
                      <span className="font-bold tracking-wider">{appliedCoupon.code}</span>
                      <span className="text-[0.65rem] font-light">({appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}% OFF` : `${settings.currency_symbol}${appliedCoupon.discount_value} OFF`})</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-emerald-800 hover:text-emerald-950 p-1 transition-colors cursor-pointer"
                      title="Remove coupon"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCouponSubmit} className="flex space-x-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="PROMO CODE"
                      className="w-full bg-white border border-[#0A0A0A]/20 px-3 py-2 text-xs tracking-wider uppercase text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                    />
                    <button
                      type="submit"
                      className="btn-editorial-primary px-4 py-2 text-xs tracking-widest shrink-0 cursor-pointer"
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
                                {ac.discount_type === 'percentage' ? `${ac.discount_value}% OFF` : `${settings.currency_symbol}${ac.discount_value} OFF`} (MIN {settings.currency_symbol}{ac.minimum_order_value})
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
                  <span className="tracking-wider text-[#0A0A0A]">{settings.currency_symbol}{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-800 font-medium">
                    <span className="text-[0.65rem] tracking-[0.2em] uppercase">PROMO DISCOUNT</span>
                    <span className="tracking-wider">-{settings.currency_symbol}{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[0.65rem] tracking-[0.2em] uppercase text-[#736E65]">SHIPPING</span>
                  <span className="tracking-wider text-[#0A0A0A]">
                    {shippingFee === 0 ? 'COMPLIMENTARY' : `${settings.currency_symbol}${shippingFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="pt-3 sm:pt-4 hairline-t flex justify-between items-baseline">
                  <span className="text-[0.7rem] font-medium tracking-[0.25em] uppercase text-[#0A0A0A]">ESTIMATED TOTAL</span>
                  <span className="text-lg sm:text-xl font-normal text-[#0A0A0A] tracking-wider">{settings.currency_symbol}{(finalTotal + (isFreeShipping ? 0 : shippingFee)).toFixed(2)}</span>
                </div>
              </div>

              <p className="text-[0.65rem] text-[#736E65] font-light leading-relaxed">
                Taxes and duties are included during checkout.
              </p>

              <button
                type="button"
                onClick={handleCheckoutClick}
                className="btn-editorial-primary w-full py-4 text-xs tracking-[0.25em] flex items-center justify-center space-x-2"
              >
                <span>PROCEED TO CHECKOUT</span>
                <ArrowRight size={14} />
              </button>

              <div className="pt-4 hairline-t space-y-2 text-[0.65rem] text-[#736E65] uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <ShieldCheck size={14} className="text-[#0A0A0A]" />
                  <span>SECURE SSL CHECKOUT</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Truck size={14} className="text-[#0A0A0A]" />
                  <span>COMPLIMENTARY EXPRESS DELIVERY</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
