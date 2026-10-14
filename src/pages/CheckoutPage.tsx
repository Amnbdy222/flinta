import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { placeOrderCOD, createRazorpayPendingOrder, PaymentMethodType, ShippingDetails } from '../services/checkoutService';
import { openRazorpayCheckoutFlow } from '../services/razorpayService';
import { fetchOrderDetail } from '../services/orderService';
import { Order } from '../types/database.types';
import { OrderSuccessModal } from '../components/OrderSuccessModal';
import { lookupPincode } from '../services/pincodeService';
import { SEO } from '../components/SEO';
import { AlertCircle, ArrowLeft, ArrowRight, CreditCard, ShieldCheck, Truck, Loader2, CheckCircle2, MapPin } from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { cart, items, subtotal, appliedCoupon, discountAmount, finalTotal, clearCartLocal, refreshCart, loading: cartLoading } = useCart();
  const { user, profile, loading: authLoading } = useAuth();
  const { settings } = useStoreSettings();
  const navigate = useNavigate();

  const isTestMode = (import.meta.env.VITE_RAZORPAY_KEY_ID || '').startsWith('rzp_test_');

  // Selected Payment Method state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('razorpay');

  // Customer & Shipping Form State
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Auto-fetch Pincode state
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [pincodeSuccess, setPincodeSuccess] = useState(false);
  const [detectedAreas, setDetectedAreas] = useState<string[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>('');

  const handlePincodeChange = async (newVal: string) => {
    const cleaned = newVal.replace(/[^0-9]/g, '').slice(0, 6);
    setPincode(cleaned);
    setPincodeSuccess(false);

    if (errors.pincode) {
      setErrors((p) => ({ ...p, pincode: '' }));
    }

    if (cleaned.length === 6) {
      setIsPincodeLoading(true);
      try {
        const details = await lookupPincode(cleaned);
        if (details) {
          if (details.city) {
            setCity(details.city);
            if (errors.city) setErrors((p) => ({ ...p, city: '' }));
          }
          if (details.state) {
            setState(details.state);
            if (errors.state) setErrors((p) => ({ ...p, state: '' }));
          }
          setDetectedAreas(details.areas || []);
          setPincodeSuccess(true);
          if (details.areas?.length === 1 && !line2) {
            setLine2(details.areas[0]);
            setSelectedArea(details.areas[0]);
          }
        } else {
          setDetectedAreas([]);
        }
      } catch (err) {
        console.warn('Pincode lookup error:', err);
      } finally {
        setIsPincodeLoading(false);
      }
    } else {
      setDetectedAreas([]);
    }
  };

  const handleSelectArea = (areaName: string) => {
    setSelectedArea(areaName);
    if (!line2.trim()) {
      setLine2(areaName);
    } else if (!line2.toLowerCase().includes(areaName.toLowerCase())) {
      setLine2(`${line2}, ${areaName}`);
    }
  };

  // Inline Validation & Error States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [orderError, setOrderError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Double-order submission ref lock
  const isPlacingOrderRef = useRef(false);
  const pendingRazorpayOrderRef = useRef<Order | null>(null);

  // Sync user profile data if loaded
  useEffect(() => {
    if (profile?.full_name && !fullName) setFullName(profile.full_name);
    if (profile?.phone && !phone) setPhone(profile.phone);
    if (user?.email && !email) setEmail(user.email);
  }, [profile, user, fullName, phone, email]);

  // Handle empty or converted cart redirect
  useEffect(() => {
    if (!completedOrder && !pendingRazorpayOrderRef.current && !isSubmitting && !cartLoading && (items.length === 0 || cart?.status === 'converted')) {
      navigate('/cart', { replace: true });
    }
  }, [items, cart, cartLoading, completedOrder, isSubmitting, navigate]);

  // Calculate dynamic shipping & COD fee based on DB store settings
  const isFreeShipping = subtotal >= settings.free_shipping_threshold;
  const shippingAmount = isFreeShipping ? 0 : settings.flat_shipping_rate;
  const codFee = (paymentMethod === 'cod' && settings.cod_enabled) ? settings.cod_extra_charge : 0;
  const checkoutGrandTotal = finalTotal + shippingAmount + codFee;

  // Form Validation Handler
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) newErrors.fullName = 'FULL NAME IS REQUIRED';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) newErrors.email = 'VALID EMAIL IS REQUIRED';

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      newErrors.phone = 'ENTER A VALID 10-DIGIT PHONE NUMBER';
    }

    if (!line1.trim()) newErrors.line1 = 'ADDRESS LINE 1 IS REQUIRED';
    if (!city.trim()) newErrors.city = 'CITY IS REQUIRED';
    if (!state.trim()) newErrors.state = 'STATE IS REQUIRED';

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

    if (isPlacingOrderRef.current || isSubmitting) return;

    if (!validateForm()) {
      return;
    }

    if (paymentMethod === 'cod' && !settings.cod_enabled) {
      setOrderError('Cash on delivery is currently unavailable. Please select another payment method.');
      return;
    }

    if (!cart || (cart.status === 'converted' && !pendingRazorpayOrderRef.current)) {
      setOrderError('Your cart has already been processed. Redirecting to your orders...');
      setTimeout(() => navigate('/account/orders', { replace: true }), 1500);
      return;
    }

    isPlacingOrderRef.current = true;
    setIsSubmitting(true);

    const shippingData: ShippingDetails = {
      full_name: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address_line_1: line1.trim(),
      address_line_2: line2.trim() || undefined,
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
    };

    try {
      // COD uses placeOrderCOD (deducts stock, sends COD email, converts cart).
      // Razorpay uses createRazorpayPendingOrder (DOES NOT deduct stock, DOES NOT send email, DOES NOT convert cart).
      const isRazorpay = paymentMethod === 'razorpay';
      let createdOrder: Order;

      if (isRazorpay && pendingRazorpayOrderRef.current) {
        createdOrder = pendingRazorpayOrderRef.current;
      } else if (isRazorpay) {
        createdOrder = await createRazorpayPendingOrder(cart.id, shippingData, appliedCoupon?.code);
        pendingRazorpayOrderRef.current = createdOrder;
      } else {
        createdOrder = await placeOrderCOD(cart.id, shippingData, appliedCoupon?.code);
      }

      // Handle Razorpay Payment flow
      if (isRazorpay) {
        try {
          await openRazorpayCheckoutFlow(
            createdOrder.id,
            settings.store_name || 'FLINT Apparel Co.',
            createdOrder.order_number,
            {
              name: shippingData.full_name,
              email: shippingData.email,
              contact: shippingData.phone,
            },
            (paymentId) => {
              // PAYMENT SUCCESS: Server has verified HMAC-SHA256 signature, updated database order to PAID & PROCESSING!
              pendingRazorpayOrderRef.current = null;
              createdOrder.payment_method = 'razorpay';
              createdOrder.payment_status = 'paid';
              createdOrder.status = 'processing';
              createdOrder.razorpay_payment_id = paymentId;
              // Note: Confirmation email and Shiprocket shipment are already triggered authoritatively server-side by _payment-finalizer.ts
              clearCartLocal();
              void refreshCart();
              setCompletedOrder(createdOrder);
            },
            async () => {
              // CHECKOUT DISMISSED: Check if payment was already verified by server/webhook
              try {
                const latestOrder = await fetchOrderDetail(createdOrder.id);
                if (latestOrder && (latestOrder.payment_status === 'paid' || latestOrder.status === 'processing')) {
                  pendingRazorpayOrderRef.current = null;
                  clearCartLocal();
                  void refreshCart();
                  setCompletedOrder(latestOrder);
                  return;
                }
              } catch (dErr) {
                console.warn('Order state check error on dismiss:', dErr);
              }
              pendingRazorpayOrderRef.current = null;
              setIsSubmitting(false);
              isPlacingOrderRef.current = false;
              setOrderError('Payment checkout was closed without completing. You can retry or select Cash on Delivery.');
            },
            async (errorMsg) => {
              // PAYMENT ERROR / DISMISS: Check if payment was actually verified/paid on server
              try {
                const latestOrder = await fetchOrderDetail(createdOrder.id);
                if (latestOrder && (latestOrder.payment_status === 'paid' || latestOrder.status === 'processing')) {
                  pendingRazorpayOrderRef.current = null;
                  clearCartLocal();
                  void refreshCart();
                  setCompletedOrder(latestOrder);
                  return;
                }
              } catch (cErr) {
                console.warn('Order state check warning:', cErr);
              }
              setIsSubmitting(false);
              isPlacingOrderRef.current = false;
              setOrderError(errorMsg || 'Payment not completed. Your order is pending payment.');
            }
          );
        } catch (rzpErr: unknown) {
          const msg = rzpErr instanceof Error ? rzpErr.message : 'Razorpay checkout initialization failed.';
          setOrderError(msg);
          setIsSubmitting(false);
          isPlacingOrderRef.current = false;
        }
        return;
      }

      // Local optimistic state reset for COD
      clearCartLocal();
      void refreshCart();

      // Launch success modal
      setCompletedOrder(createdOrder);
    } catch (err: unknown) {
      console.error('Order placement failed:', err);
      const message = err instanceof Error ? err.message : 'An unexpected error occurred while processing your order.';
      setOrderError(message);
      isPlacingOrderRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (cartLoading || authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pt-32 pb-24 text-center text-xs tracking-widest uppercase text-[#736E65]">
        INITIALIZING CHECKOUT...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-20 sm:pt-24 md:pt-28 pb-16 md:pb-24 text-[#0A0A0A]">
      <SEO
        title="Secure Checkout"
        description="Complete your order securely with encrypted checkout and express delivery."
        canonicalUrl="https://flintaindia.com/checkout"
        noindex
      />
      <div className="container-editorial">
        {/* CHECKOUT HEADER */}
        <div className="pb-6 sm:pb-8 flex items-center justify-between hairline-b">
          <Link
            to="/cart"
            className="text-xs font-medium tracking-[0.2em] uppercase text-[#0A0A0A] hover:opacity-75 flex items-center space-x-2"
          >
            <ArrowLeft size={14} />
            <span>RETURN TO BAG</span>
          </Link>
          <span className="text-[0.65rem] tracking-[0.3em] font-semibold text-[#736E65] uppercase">
            SECURE CHECKOUT
          </span>
        </div>

        {/* ORDER LEVEL ERROR BANNER */}
        {orderError && (
          <div className="mt-6 bg-red-50 text-red-900 border border-red-900/20 p-4 text-xs flex items-start space-x-3 animate-fade-in">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold uppercase tracking-wider block">CHECKOUT NOTIFICATION</span>
              <p>{orderError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="pt-6 sm:pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          {/* LEFT: SHIPPING & PAYMENT FORM */}
          <div className="lg:col-span-8 space-y-8 sm:space-y-10">
            {/* 1. CUSTOMER IDENTITY */}
            <div className="bg-[#FAF9F6] hairline-all p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
              <h2 className="font-editorial text-lg sm:text-2xl uppercase tracking-wide text-[#0A0A0A] pb-2 sm:pb-3 hairline-b">
                1. CLIENT CONTACT
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1.5">
                  <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">FULL NAME *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value); if (errors.fullName) setErrors((p) => ({ ...p, fullName: '' })); }}
                    placeholder="Full Name"
                    className={`w-full bg-transparent border px-4 py-3 text-xs tracking-wider focus:outline-none ${errors.fullName ? 'border-red-600' : 'border-[#0A0A0A]/20 focus:border-[#0A0A0A]'}`}
                  />
                  {errors.fullName && <p className="text-[0.65rem] text-red-600 font-medium">{errors.fullName}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">EMAIL ADDRESS *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: '' })); }}
                    placeholder="elena@domain.com"
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

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                <div className="col-span-2 md:col-span-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#0A0A0A] block">PINCODE *</label>
                    {isPincodeLoading && (
                      <span className="text-[0.6rem] text-[#736E65] flex items-center gap-1 font-light">
                        <Loader2 size={10} className="animate-spin text-[#0A0A0A]" />
                        <span>Detecting...</span>
                      </span>
                    )}
                    {!isPincodeLoading && pincodeSuccess && (
                      <span className="text-[0.6rem] text-emerald-700 flex items-center gap-1 font-medium">
                        <CheckCircle2 size={10} className="text-emerald-700" />
                        <span>Auto-filled</span>
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    placeholder="6-digit PIN"
                    className={`w-full bg-transparent border px-4 py-3 text-xs tracking-wider focus:outline-none ${errors.pincode ? 'border-red-600' : 'border-[#0A0A0A]/20 focus:border-[#0A0A0A]'}`}
                  />
                  {errors.pincode && <p className="text-[0.65rem] text-red-600 font-medium">{errors.pincode}</p>}
                </div>
                <div className="space-y-1.5">
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
              </div>

              {/* Detected Area / Locality selector */}
              {detectedAreas.length > 0 && (
                <div className="pt-1 p-3 bg-white border border-[#0A0A0A]/10 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-[0.6rem] font-bold tracking-[0.15em] uppercase text-[#0A0A0A] flex items-center gap-1.5">
                      <MapPin size={11} className="text-[#D45A45]" />
                      <span>SELECT AREA / LOCALITY FOR {pincode}:</span>
                    </span>
                    <span className="text-[0.55rem] text-[#736E65] font-light">
                      Tap to add to Address Line 2
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {detectedAreas.map((area) => {
                      const isSelected = selectedArea === area || line2.toLowerCase().includes(area.toLowerCase());
                      return (
                        <button
                          key={area}
                          type="button"
                          onClick={() => handleSelectArea(area)}
                          className={`text-[0.65rem] px-2.5 py-1 border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-xs'
                              : 'bg-[#FAF9F6] text-[#0A0A0A] border-[#0A0A0A]/15 hover:border-[#0A0A0A] hover:bg-white'
                          }`}
                        >
                          {area}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 3. PAYMENT METHOD */}
            <div className="bg-[#FAF9F6] hairline-all p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
              <h2 className="font-editorial text-lg sm:text-2xl uppercase tracking-wide text-[#0A0A0A] pb-2 sm:pb-3 hairline-b">
                3. PAYMENT METHOD
              </h2>

              <div className="space-y-3">
                {/* RAZORPAY TEST MODE OPTION */}
                <label
                  className={`flex items-start p-4 border transition-colors cursor-pointer space-x-4 ${
                    paymentMethod === 'razorpay'
                      ? 'border-[#0A0A0A] bg-white shadow-2xs'
                      : 'border-[#0A0A0A]/20 bg-white/40 hover:border-[#0A0A0A]/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                    className="mt-1 accent-[#0A0A0A] cursor-pointer"
                  />
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-semibold tracking-wider uppercase text-[#0A0A0A] flex items-center space-x-2">
                        <CreditCard size={14} className="text-[#0A0A0A]" />
                        <span>ONLINE PAYMENT (RAZORPAY)</span>
                      </span>
                      {isTestMode ? (
                        <span className="text-[0.55rem] font-bold tracking-widest text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 uppercase">
                          TEST MODE ENABLED
                        </span>
                      ) : (
                        <span className="text-[0.55rem] font-bold tracking-widest text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 uppercase">
                          100% SECURE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#736E65] font-light leading-relaxed">
                      {isTestMode
                        ? 'Instant payment via UPI (Google Pay, PhonePe, Paytm), Credit / Debit Cards, NetBanking, or Wallets in Razorpay Test Mode.'
                        : 'Instant payment via UPI (Google Pay, PhonePe, Paytm), Credit / Debit Cards, NetBanking, or Wallets.'}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1 text-[0.6rem] font-medium tracking-wider text-[#736E65] uppercase">
                      <span className="bg-[#FAF9F6] border border-[#0A0A0A]/10 px-2 py-0.5">UPI</span>
                      <span className="bg-[#FAF9F6] border border-[#0A0A0A]/10 px-2 py-0.5">CARDS</span>
                      <span className="bg-[#FAF9F6] border border-[#0A0A0A]/10 px-2 py-0.5">NETBANKING</span>
                      <span className="bg-[#FAF9F6] border border-[#0A0A0A]/10 px-2 py-0.5">WALLETS</span>
                    </div>
                  </div>
                </label>

                {/* CASH ON DELIVERY OPTION */}
                {settings.cod_enabled ? (
                  <label
                    className={`flex items-start p-4 border transition-colors cursor-pointer space-x-4 ${
                      paymentMethod === 'cod'
                        ? 'border-[#0A0A0A] bg-white shadow-2xs'
                        : 'border-[#0A0A0A]/20 bg-white/40 hover:border-[#0A0A0A]/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="mt-1 accent-[#0A0A0A] cursor-pointer"
                    />
                    <div className="space-y-1">
                      <span className="text-xs font-medium tracking-wider uppercase text-[#0A0A0A] block">
                        CASH ON DELIVERY (COD)
                      </span>
                      <p className="text-xs text-[#736E65] font-light leading-relaxed">
                        Pay in cash or digital scan when your order is delivered.
                        {settings.cod_extra_charge > 0 && ` (${settings.currency_symbol}${settings.cod_extra_charge.toFixed(2)} COD Handling Fee)`}
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="p-4 border border-amber-900/20 bg-amber-50 text-amber-900 text-xs">
                    Cash on delivery is currently disabled. Please contact concierge for alternative payment methods.
                  </div>
                )}
              </div>
            </div>

            {/* MOBILE: Place order CTA */}
            <div className="lg:hidden space-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-editorial-primary w-full py-4 text-xs tracking-[0.25em] flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                <span>
                  {isSubmitting
                    ? 'PROCESSING PAYMENT...'
                    : paymentMethod === 'razorpay'
                    ? 'PROCEED TO RAZORPAY TEST PAYMENT'
                    : 'PLACE ORDER'}
                </span>
                <ArrowRight size={14} />
              </button>
              <div className="flex flex-col gap-1.5 text-[0.65rem] text-[#736E65] uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <ShieldCheck size={13} className="text-[#0A0A0A]" />
                  <span>256-BIT ENCRYPTED CHECKOUT</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Truck size={13} className="text-[#0A0A0A]" />
                  <span>COMPLIMENTARY EXPRESS DELIVERY</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: ORDER SUMMARY */}
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
                    className="w-12 h-16 object-cover object-top bg-[#F0EFEA] hairline-all flex-shrink-0"
                  />
                  <div className="space-y-0.5 text-xs flex-1 min-w-0">
                    <h4 className="font-editorial text-sm text-[#0A0A0A] line-clamp-1">{item.product_name}</h4>
                    <p className="text-[0.65rem] text-[#736E65] uppercase tracking-wider">{item.color_name} • {item.size} • QTY {item.quantity}</p>
                    <p className="text-xs text-[#0A0A0A] tracking-wider">{settings.currency_symbol}{item.total_price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-2 text-xs font-light text-[#383531]">
              <div className="flex justify-between">
                <span className="text-[0.65rem] tracking-[0.2em] uppercase text-[#736E65]">SUBTOTAL</span>
                <span className="tracking-wider text-[#0A0A0A]">{settings.currency_symbol}{subtotal.toFixed(2)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-800 font-medium">
                  <span className="text-[0.65rem] tracking-[0.2em] uppercase">
                    PROMO DISCOUNT ({appliedCoupon?.code})
                  </span>
                  <span className="tracking-wider">-{settings.currency_symbol}{discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-[0.65rem] tracking-[0.2em] uppercase text-[#736E65]">SHIPPING</span>
                <span className="tracking-wider text-[#0A0A0A]">
                  {shippingAmount === 0 ? 'COMPLIMENTARY' : `${settings.currency_symbol}${shippingAmount.toFixed(2)}`}
                </span>
              </div>

              {codFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-[0.65rem] tracking-[0.2em] uppercase text-[#736E65]">COD HANDLING FEE</span>
                  <span className="tracking-wider text-[#0A0A0A]">{settings.currency_symbol}{codFee.toFixed(2)}</span>
                </div>
              )}

              <div className="pt-3 sm:pt-4 hairline-t flex justify-between items-baseline">
                <span className="text-[0.7rem] font-medium tracking-[0.25em] uppercase text-[#0A0A0A]">FINAL TOTAL</span>
                <span className="text-lg sm:text-xl font-normal text-[#0A0A0A] tracking-wider">{settings.currency_symbol}{checkoutGrandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-editorial-primary w-full py-4 text-xs tracking-[0.25em] flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              <span>
                {isSubmitting
                  ? 'PROCESSING PAYMENT...'
                  : paymentMethod === 'razorpay'
                  ? 'PROCEED TO RAZORPAY TEST PAYMENT'
                  : 'PLACE ORDER'}
              </span>
              <ArrowRight size={14} />
            </button>

            <div className="pt-3 hairline-t space-y-2 text-[0.65rem] text-[#736E65] uppercase tracking-wider">
              <div className="flex items-center space-x-2">
                <ShieldCheck size={13} className="text-[#0A0A0A]" />
                <span>256-BIT ENCRYPTED CHECKOUT</span>
              </div>
              <div className="flex items-center space-x-2">
                <Truck size={13} className="text-[#0A0A0A]" />
                <span>EXPRESS DISPATCH</span>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* ORDER SUCCESS MODAL */}
      {completedOrder && (
        <OrderSuccessModal
          order={completedOrder}
          isOpen={Boolean(completedOrder)}
          onClose={() => {
            setCompletedOrder(null);
            navigate('/account/orders', { replace: true });
          }}
        />
      )}
    </div>
  );
};
