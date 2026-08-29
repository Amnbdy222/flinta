import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { placeOrderCOD, PaymentMethodType, ShippingDetails } from '../services/checkoutService';
import { Order } from '../types/database.types';
import { OrderSuccessModal } from '../components/OrderSuccessModal';
import { AlertCircle, ArrowLeft, ArrowRight, ShieldCheck, Truck } from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { cart, items, subtotal, appliedCoupon, discountAmount, finalTotal, clearCartLocal, refreshCart, loading: cartLoading } = useCart();
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Selected Payment Method state (Architected for COD now, Razorpay in future)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('cod');

  // Customer & Shipping Form State
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Inline Validation & Error States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [orderError, setOrderError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Double-order submission ref lock
  const isPlacingOrderRef = useRef(false);

  // Sync user profile data if loaded
  useEffect(() => {
    if (profile?.full_name && !fullName) setFullName(profile.full_name);
    if (profile?.phone && !phone) setPhone(profile.phone);
    if (user?.email && !email) setEmail(user.email);
  }, [profile, user, fullName, phone, email]);

  // Handle empty or converted cart redirect (do not redirect if completedOrder modal is active)
  useEffect(() => {
    if (!completedOrder && !cartLoading && (items.length === 0 || cart?.status === 'converted')) {
      navigate('/cart', { replace: true });
    }
  }, [items, cart, cartLoading, completedOrder, navigate]);

  // Form Validation Handler
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) newErrors.fullName = 'FULL NAME IS REQUIRED';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) newErrors.email = 'VALID EMAIL IS REQUIRED';

    // Phone validation (Indian 10-digit or valid standard phone)
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      newErrors.phone = 'ENTER A VALID 10-DIGIT PHONE NUMBER';
    }

    if (!line1.trim()) newErrors.line1 = 'ADDRESS LINE 1 IS REQUIRED';
    if (!city.trim()) newErrors.city = 'CITY IS REQUIRED';
    if (!state.trim()) newErrors.state = 'STATE IS REQUIRED';

    // Pincode validation (6 digits)
    const cleanPincode = pincode.replace(/[^0-9]/g, '');
    if (!cleanPincode || cleanPincode.length !== 6) {
      newErrors.pincode = 'ENTER A VALID 6-DIGIT PINCODE';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Submit Order
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError(null);

    // Double-click & retry protection
    if (isPlacingOrderRef.current || isSubmitting) return;

    if (!validateForm()) {
      return;
    }

    if (!cart || cart.status === 'converted') {
      setOrderError('Your cart has already been processed. Redirecting to your orders...');
      setTimeout(() => navigate('/account/orders', { replace: true }), 1500);
      return;
    }

    // Lock submission immediately
    isPlacingOrderRef.current = true;
    setIsSubmitting(true);

    const shippingData: ShippingDetails = {
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address_line_1: line1.trim(),
      address_line_2: line2.trim() || undefined,
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
    };

    try {
      if (paymentMethod === 'cod') {
        const createdOrder = await placeOrderCOD(cart.id, shippingData, appliedCoupon?.code || null);
        clearCartLocal();
        refreshCart(); // Reset cart context to a clean active cart
        setCompletedOrder(createdOrder);
      } else {
        throw new Error('Selected payment method is currently unavailable.');
      }
    } catch (err: unknown) {
      console.error('Order creation failure:', err);
      const msg = err instanceof Error ? err.message : 'Unable to place your order.';

      if (
        msg.includes('already been converted') ||
        msg.includes('no longer active') ||
        msg.includes('already been processed')
      ) {
        clearCartLocal();
        refreshCart();
        setOrderError('Your order has already been placed! Redirecting to your orders...');
        setTimeout(() => navigate('/account/orders', { replace: true }), 1500);
      } else if (msg.includes('Insufficient stock') || msg.includes('no longer available')) {
        setOrderError(`${msg} Redirecting to cart...`);
        setTimeout(() => navigate('/cart'), 2500);
      } else if (msg === 'Please sign in to continue checkout.') {
        setOrderError('Please sign in to continue checkout.');
        setTimeout(() => navigate('/login?redirect=/checkout'), 2000);
      } else {
        setOrderError(msg);
      }

      // Unlock for retry on error
      isPlacingOrderRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (authLoading || cartLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pt-24 sm:pt-28 md:pt-32 pb-16 text-center text-xs tracking-widest uppercase text-[#736E65]">
        LOADING CHECKOUT SESSION...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pt-24 sm:pt-28 md:pt-32 pb-16 flex items-center justify-center px-4">
        <div className="text-center max-w-sm w-full space-y-5 p-6 sm:p-8 bg-[#FAF9F6] hairline-all">
          <span className="editorial-subtitle block">CLIENT AUTHENTICATION REQUIRED</span>
          <h2 className="font-editorial text-2xl sm:text-3xl font-light uppercase">
            SIGN IN TO CONTINUE
          </h2>
          <p className="text-xs text-[#736E65] font-light leading-relaxed">
            Authentication is required to link your purchase to your account portal.
          </p>
          <Link
            to="/login?redirect=/checkout"
            className="btn-editorial-primary w-full py-3.5 sm:py-4 text-xs tracking-[0.25em] flex items-center justify-center space-x-2"
          >
            <span>SIGN IN TO CHECKOUT</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-20 sm:pt-24 md:pt-28 pb-16 md:pb-24 text-[#0A0A0A]">
      <div className="container-editorial">
        {/* BREADCRUMB */}
        <div className="py-3 sm:py-4">
          <Link
            to="/cart"
            className="inline-flex items-center text-xs tracking-[0.25em] text-[#736E65] hover:text-[#0A0A0A] uppercase transition-colors"
          >
            <ArrowLeft size={14} className="mr-2" />
            RETURN TO BAG
          </Link>
        </div>

        {/* PAGE TITLE */}
        <div className="pb-6 sm:pb-8 text-center max-w-2xl mx-auto space-y-2 hairline-b">
          <span className="editorial-subtitle block">EXPRESS CHECKOUT</span>
          <h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-light uppercase tracking-tight">
            SECURE COD CHECKOUT
          </h1>
        </div>

        {/* ORDER ERROR */}
        {orderError && (
          <div className="mt-5 sm:mt-6 bg-red-50 text-red-900 border border-red-900/20 p-3 sm:p-4 text-xs flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{orderError}</span>
            </div>
            <Link to="/cart" className="link-underline font-medium uppercase text-[0.65rem] tracking-widest sm:ml-auto">
              BACK TO CART
            </Link>
          </div>
        )}

        {/* CHECKOUT FORM — stacks on mobile, 2-col on lg */}
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 pt-6 sm:pt-8 items-start">

          {/* LEFT: FORM SECTIONS */}
          <div className="lg:col-span-8 space-y-5 sm:space-y-6 md:space-y-8 lg:space-y-10">

            {/* 1. CUSTOMER INFORMATION */}
            <div className="bg-[#FAF9F6] hairline-all p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
              <h2 className="font-editorial text-lg sm:text-2xl uppercase tracking-wide text-[#0A0A0A] pb-2 sm:pb-3 hairline-b">
                1. CUSTOMER INFORMATION
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1.5">
                  <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">FULL NAME *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value); if (errors.fullName) setErrors((p) => ({ ...p, fullName: '' })); }}
                    placeholder="e.g. Elena Rostova"
                    className={`w-full bg-transparent border px-4 py-3 text-xs tracking-wider focus:outline-none ${errors.fullName ? 'border-red-600' : 'border-[#0A0A0A]/20 focus:border-[#0A0A0A]'}`}
                  />
                  {errors.fullName && <p className="text-[0.65rem] text-red-600 font-medium">{errors.fullName}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">EMAIL ADDRESS *</label>
                  <input
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: '' })); }}
                    placeholder="client@domain.com"
                    className={`w-full bg-transparent border px-4 py-3 text-xs tracking-wider focus:outline-none ${errors.email ? 'border-red-600' : 'border-[#0A0A0A]/20 focus:border-[#0A0A0A]'}`}
                  />
                  {errors.email && <p className="text-[0.65rem] text-red-600 font-medium">{errors.email}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">PHONE NUMBER *</label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); if (errors.phone) setErrors((p) => ({ ...p, phone: '' })); }}
                  placeholder="10-digit mobile number"
                  className={`w-full bg-transparent border px-4 py-3 text-xs tracking-wider focus:outline-none ${errors.phone ? 'border-red-600' : 'border-[#0A0A0A]/20 focus:border-[#0A0A0A]'}`}
                />
                {errors.phone && <p className="text-[0.65rem] text-red-600 font-medium">{errors.phone}</p>}
              </div>
            </div>

            {/* 2. SHIPPING ADDRESS */}
            <div className="bg-[#FAF9F6] hairline-all p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
              <h2 className="font-editorial text-lg sm:text-2xl uppercase tracking-wide text-[#0A0A0A] pb-2 sm:pb-3 hairline-b">
                2. SHIPPING LOCATION
              </h2>

              <div className="space-y-1.5">
                <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">STREET ADDRESS LINE 1 *</label>
                <input
                  type="text"
                  value={line1}
                  onChange={(e) => { setLine1(e.target.value); if (errors.line1) setErrors((p) => ({ ...p, line1: '' })); }}
                  placeholder="House / Apartment number and Street"
                  className={`w-full bg-transparent border px-4 py-3 text-xs tracking-wider focus:outline-none ${errors.line1 ? 'border-red-600' : 'border-[#0A0A0A]/20 focus:border-[#0A0A0A]'}`}
                />
                {errors.line1 && <p className="text-[0.65rem] text-red-600 font-medium">{errors.line1}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">ADDRESS LINE 2 <span className="text-[#736E65] normal-case tracking-normal">(optional)</span></label>
                <input
                  type="text"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  placeholder="Suite, building, landmark"
                  className="w-full bg-transparent border border-[#0A0A0A]/20 px-4 py-3 text-xs tracking-wider focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>

              {/* City / State / Pincode: 2-col on mobile (city spans full), 3-col on md */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                <div className="col-span-2 md:col-span-1 space-y-1.5">
                  <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">CITY *</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => { setCity(e.target.value); if (errors.city) setErrors((p) => ({ ...p, city: '' })); }}
                    placeholder="City"
                    className={`w-full bg-transparent border px-4 py-3 text-xs tracking-wider focus:outline-none ${errors.city ? 'border-red-600' : 'border-[#0A0A0A]/20 focus:border-[#0A0A0A]'}`}
                  />
                  {errors.city && <p className="text-[0.65rem] text-red-600 font-medium">{errors.city}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">STATE *</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => { setState(e.target.value); if (errors.state) setErrors((p) => ({ ...p, state: '' })); }}
                    placeholder="State"
                    className={`w-full bg-transparent border px-4 py-3 text-xs tracking-wider focus:outline-none ${errors.state ? 'border-red-600' : 'border-[#0A0A0A]/20 focus:border-[#0A0A0A]'}`}
                  />
                  {errors.state && <p className="text-[0.65rem] text-red-600 font-medium">{errors.state}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">PINCODE *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={pincode}
                    onChange={(e) => { setPincode(e.target.value); if (errors.pincode) setErrors((p) => ({ ...p, pincode: '' })); }}
                    placeholder="6-digit"
                    className={`w-full bg-transparent border px-4 py-3 text-xs tracking-wider focus:outline-none ${errors.pincode ? 'border-red-600' : 'border-[#0A0A0A]/20 focus:border-[#0A0A0A]'}`}
                  />
                  {errors.pincode && <p className="text-[0.65rem] text-red-600 font-medium">{errors.pincode}</p>}
                </div>
              </div>
            </div>

            {/* 3. PAYMENT METHOD */}
            <div className="bg-[#FAF9F6] hairline-all p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
              <h2 className="font-editorial text-lg sm:text-2xl uppercase tracking-wide text-[#0A0A0A] pb-2 sm:pb-3 hairline-b">
                3. PAYMENT METHOD
              </h2>
              <label className="flex items-start p-4 border border-[#0A0A0A] bg-white/40 cursor-pointer space-x-4">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="mt-1 accent-[#0A0A0A]"
                />
                <div className="space-y-1">
                  <span className="text-xs font-medium tracking-wider uppercase text-[#0A0A0A] block">CASH ON DELIVERY (COD)</span>
                  <p className="text-xs text-[#736E65] font-light leading-relaxed">
                    Pay in cash or by digital scan when your order is delivered.
                  </p>
                </div>
              </label>
            </div>

            {/* MOBILE: Place order CTA at bottom of form */}
            <div className="lg:hidden space-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-editorial-primary w-full py-4 text-xs tracking-[0.25em] flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'PLACING ORDER...' : 'PLACE ORDER'}</span>
                <ArrowRight size={14} />
              </button>
              <div className="flex flex-col gap-1.5 text-[0.65rem] text-[#736E65] uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <ShieldCheck size={13} className="text-[#0A0A0A]" />
                  <span>SECURE CHECKOUT</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Truck size={13} className="text-[#0A0A0A]" />
                  <span>COMPLIMENTARY EXPRESS DELIVERY</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: ORDER SUMMARY — sticky on desktop, hidden on mobile (shown above) */}
          <div className="hidden lg:block lg:col-span-4 bg-[#FAF9F6] hairline-all p-6 md:p-8 space-y-5 sm:space-y-6 sticky top-28">
            <h2 className="font-editorial text-xl sm:text-2xl uppercase tracking-wide text-[#0A0A0A] pb-3 sm:pb-4 hairline-b">
              ORDER SUMMARY ({items.length})
            </h2>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex space-x-3 items-center pb-3 hairline-b">
                  <img
                    src={item.image_url}
                    alt={item.product_name}
                    className="w-12 h-16 object-cover bg-[#F0EFEA] hairline-all flex-shrink-0"
                  />
                  <div className="space-y-0.5 text-xs flex-1 min-w-0">
                    <h4 className="font-editorial text-sm text-[#0A0A0A] line-clamp-1">{item.product_name}</h4>
                    <p className="text-[0.65rem] text-[#736E65] uppercase tracking-wider">{item.color_name} • {item.size} • QTY {item.quantity}</p>
                    <p className="text-xs text-[#0A0A0A] tracking-wider">₹{item.total_price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-2 text-xs font-light text-[#383531]">
              <div className="flex justify-between">
                <span className="text-[0.65rem] tracking-[0.2em] uppercase text-[#736E65]">SUBTOTAL</span>
                <span className="tracking-wider text-[#0A0A0A]">₹{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-800 font-medium">
                  <span className="text-[0.65rem] tracking-[0.2em] uppercase">
                    PROMO DISCOUNT ({appliedCoupon?.code})
                  </span>
                  <span className="tracking-wider">-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[0.65rem] tracking-[0.2em] uppercase text-[#736E65]">EXPRESS DELIVERY</span>
                <span className="tracking-wider text-[#0A0A0A]">COMPLIMENTARY</span>
              </div>
              <div className="pt-3 sm:pt-4 hairline-t flex justify-between items-baseline">
                <span className="text-[0.7rem] font-medium tracking-[0.25em] uppercase text-[#0A0A0A]">FINAL TOTAL</span>
                <span className="text-lg sm:text-xl font-normal text-[#0A0A0A] tracking-wider">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-editorial-primary w-full py-4 text-xs tracking-[0.25em] flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'PLACING ORDER...' : 'PLACE ORDER'}</span>
              <ArrowRight size={14} />
            </button>

            <div className="pt-3 hairline-t space-y-2 text-[0.65rem] text-[#736E65] uppercase tracking-wider">
              <div className="flex items-center space-x-2">
                <ShieldCheck size={13} className="text-[#0A0A0A]" />
                <span>SERVER-AUTHENTICATED SECURE CHECKOUT</span>
              </div>
              <div className="flex items-center space-x-2">
                <Truck size={13} className="text-[#0A0A0A]" />
                <span>COMPLIMENTARY EXPRESS WORLDWIDE DELIVERY</span>
              </div>
            </div>
          </div>
        </form>
      </div>

      {completedOrder && (
        <OrderSuccessModal order={completedOrder} isOpen={true} />
      )}
    </div>
  );
};
