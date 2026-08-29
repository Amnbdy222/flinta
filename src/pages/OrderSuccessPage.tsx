import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { fetchOrderDetail, formatOrderNumber } from '../services/orderService';
import { Order } from '../types/database.types';
import { EmptyState } from '../components/EmptyState';
import { Package, MapPin, ArrowRight } from 'lucide-react';

export const OrderSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const verifyAndLoadOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(false);

      try {
        const data = await fetchOrderDetail(orderId);
        setOrder(data);
      } catch (err) {
        console.error('Error verifying order success:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    verifyAndLoadOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pt-24 sm:pt-28 md:pt-32 pb-16 text-center text-xs tracking-widest uppercase text-[#736E65]">
        VERIFYING ORDER CONFIRMATION...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] pt-24 sm:pt-28 md:pt-32 pb-16 flex items-center justify-center px-4">
        <EmptyState
          title="ORDER RECORD NOT FOUND"
          message="We could not verify this order confirmation record."
          actionText="RETURN TO MY ORDERS"
          actionPath="/account/orders"
        />
      </div>
    );
  }

  const displayOrderNum = formatOrderNumber(order.order_number);

  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-20 sm:pt-24 md:pt-32 pb-16 md:pb-24 text-[#0A0A0A]">
      <div className="container-editorial max-w-3xl mx-auto space-y-8 sm:space-y-10 md:space-y-12">

        {/* SUCCESS BANNER */}
        <div className="text-center space-y-3 sm:space-y-4 pb-6 sm:pb-8 hairline-b animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-900/20 shadow-inner animate-pulse-glow mb-2">
            <svg className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-700" viewBox="0 0 100 100" fill="none">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="4"
                className="animate-circle-draw text-emerald-700/30"
              />
              <path
                d="M28 52 L42 66 L72 34"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-checkmark-draw text-emerald-800"
              />
            </svg>
          </div>
          <span className="editorial-subtitle block">PURCHASE CONFIRMED</span>
          <h1 className="font-editorial text-3xl sm:text-4xl md:text-6xl font-light uppercase tracking-tight">
            ORDER CONFIRMED
          </h1>
          <p className="text-xs sm:text-sm font-light text-[#383531] tracking-wider max-w-sm sm:max-w-none mx-auto">
            Thank you for your purchase with FLINT MAISON. Your order number is{' '}
            <strong className="font-sans font-semibold text-[#0A0A0A] tracking-wider">
              #{displayOrderNum}
            </strong>.
          </p>
        </div>

        {/* ORDER DETAILS */}
        <div className="bg-[#FAF9F6] hairline-all p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">

          {/* Order number + badges */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-0 pb-4 sm:pb-6 hairline-b">
            <div>
              <span className="text-[0.65rem] tracking-widest uppercase text-[#736E65] block mb-1">ORDER NUMBER</span>
              <span className="font-sans text-sm sm:text-base font-semibold text-[#0A0A0A] tracking-wider uppercase">
                #{displayOrderNum}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="badge-editorial border-emerald-900/30 text-emerald-900 bg-emerald-50">
                {order.status.toUpperCase()}
              </span>
              <span className="badge-editorial border-blue-900/30 text-blue-900 bg-blue-50">
                CASH ON DELIVERY
              </span>
            </div>
          </div>

          {/* PURCHASED ITEMS */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="font-editorial text-xl sm:text-2xl uppercase text-[#0A0A0A]">PURCHASED GARMENTS</h3>
            <div className="space-y-0 divide-y divide-[#0A0A0A]/10">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 py-3 text-xs">
                  <div className="space-y-1 min-w-0">
                    <p className="font-editorial text-base sm:text-lg text-[#0A0A0A] leading-tight">{item.product_name_snapshot}</p>
                    <p className="text-[0.6rem] sm:text-[0.65rem] text-[#736E65] uppercase tracking-wider">
                      {item.color_name_snapshot} • SZ {item.size_snapshot} • QTY {item.quantity}
                    </p>
                  </div>
                  <span className="font-light text-[#0A0A0A] tracking-wider whitespace-nowrap flex-shrink-0">
                    ₹{Number(item.total_price).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SHIPPING + TOTALS — stack on mobile, 2-col on md */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8 pt-2 sm:pt-4">
            <div className="space-y-1.5 text-xs font-light text-[#736E65]">
              <div className="flex items-center space-x-2 text-[#0A0A0A] uppercase tracking-wider font-medium mb-2">
                <MapPin size={14} />
                <span>DELIVERY LOCATION</span>
              </div>
              <p className="text-[#0A0A0A] font-normal">{order.shipping_name}</p>
              <p>{order.shipping_phone}</p>
              <p>{order.shipping_address_line_1}</p>
              <p>{order.shipping_city}, {order.shipping_state} {order.shipping_pincode}</p>
            </div>

            <div className="space-y-2 text-xs font-light text-[#383531] bg-white/40 p-3 sm:p-4 hairline-all">
              <div className="flex justify-between">
                <span className="text-[0.65rem] tracking-[0.2em] uppercase text-[#736E65]">SUBTOTAL</span>
                <span>₹{Number(order.subtotal).toFixed(2)}</span>
              </div>
              {Number(order.discount_amount) > 0 && (
                <div className="flex justify-between text-emerald-900 font-medium">
                  <span className="text-[0.65rem] tracking-[0.2em] uppercase">PROMO DISCOUNT</span>
                  <span>-₹{Number(order.discount_amount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[0.65rem] tracking-[0.2em] uppercase text-[#736E65]">DELIVERY</span>
                <span>COMPLIMENTARY</span>
              </div>
              <div className="pt-2 hairline-t flex justify-between items-baseline text-[#0A0A0A]">
                <span className="text-[0.7rem] font-medium tracking-[0.2em] uppercase">TOTAL (COD)</span>
                <span className="text-base sm:text-lg font-normal tracking-wider">₹{Number(order.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA BUTTONS */}
        <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
          <Link
            to={`/account/orders/${order.id}`}
            className="btn-editorial-primary py-3.5 sm:py-4 px-6 sm:px-8 text-xs tracking-[0.25em] flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <Package size={15} />
            <span>VIEW ORDER DETAILS</span>
          </Link>
          <Link
            to="/shop"
            className="btn-editorial-outline py-3.5 sm:py-4 px-6 sm:px-8 text-xs tracking-[0.25em] flex items-center justify-center space-x-2 w-full sm:w-auto"
          >
            <span>CONTINUE SHOPPING</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};
