import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order } from '../types/database.types';
import { formatOrderNumber } from '../services/orderService';
import { ArrowRight, Package, Sparkles } from 'lucide-react';

interface OrderSuccessModalProps {
  order: Order;
  isOpen: boolean;
  onClose?: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({ order, isOpen }) => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(4);

  const displayOrderNum = formatOrderNumber(order.order_number);

  useEffect(() => {
    if (!isOpen) return;

    // Timer countdown to automatically navigate to the specific order page
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(`/account/orders/${order.id}`, { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, order.id, navigate]);

  if (!isOpen) return null;

  const handleGoToOrder = () => {
    navigate(`/account/orders/${order.id}`, { replace: true });
  };

  return (
    <div className="fixed inset-0 bg-[#0A0A0A]/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#FAF9F6] border border-[#0A0A0A] p-6 sm:p-10 max-w-lg w-full text-center space-y-6 shadow-2xl relative overflow-hidden animate-modal-scale-in">
        {/* Top Decorative Gold/Emerald Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-700 via-amber-500 to-emerald-700" />

        {/* Animated Checkmark Circle */}
        <div className="relative inline-flex items-center justify-center mt-2">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-900/20 shadow-inner animate-pulse-glow">
            <svg className="w-12 h-12 text-emerald-700" viewBox="0 0 100 100" fill="none">
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
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 text-[0.65rem] font-medium tracking-[0.25em] text-emerald-900 uppercase bg-emerald-50 px-3 py-1 border border-emerald-900/20">
            <Sparkles size={12} className="text-emerald-700" />
            <span>ORDER CONFIRMED & RESERVED</span>
          </div>
          <h2 className="font-editorial text-3xl sm:text-4xl font-light uppercase tracking-tight text-[#0A0A0A]">
            PURCHASE SUCCESSFUL
          </h2>
          <p className="text-xs text-[#736E65] font-light leading-relaxed max-w-xs mx-auto">
            Your order has been recorded and garments reserved in our maison inventory.
          </p>
        </div>

        {/* Order Card Breakdown */}
        <div className="bg-white/60 hairline-all p-4 sm:p-5 text-left space-y-3">
          <div className="flex justify-between items-center pb-3 hairline-b">
            <div>
              <span className="text-[0.6rem] tracking-widest text-[#736E65] uppercase block">ORDER NUMBER</span>
              <span className="font-sans text-sm font-semibold text-[#0A0A0A] tracking-wider uppercase">
                #{displayOrderNum}
              </span>
            </div>
            <span className="badge-editorial border-emerald-900/30 text-emerald-900 bg-emerald-50">
              COD CONFIRMED
            </span>
          </div>

          <div className="space-y-1.5 text-xs font-light text-[#383531]">
            <div className="flex justify-between">
              <span className="text-[0.65rem] tracking-wider uppercase text-[#736E65]">SUBTOTAL</span>
              <span className="tracking-wider">₹{Number(order.subtotal).toFixed(2)}</span>
            </div>

            {Number(order.discount_amount) > 0 && (
              <div className="flex justify-between text-emerald-800 font-medium">
                <span className="text-[0.65rem] tracking-wider uppercase">PROMO DISCOUNT APPLIED</span>
                <span className="tracking-wider">-₹{Number(order.discount_amount).toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-[0.65rem] tracking-wider uppercase text-[#736E65]">DELIVERY</span>
              <span className="tracking-wider text-[#0A0A0A]">COMPLIMENTARY</span>
            </div>

            <div className="pt-2 hairline-t flex justify-between items-baseline text-[#0A0A0A] font-medium">
              <span className="text-[0.7rem] tracking-[0.2em] uppercase">TOTAL AMOUNT (COD)</span>
              <span className="text-base font-normal tracking-wider">₹{Number(order.total_amount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Redirect Notice & Progress Bar */}
        <div className="space-y-2 pt-1">
          <p className="text-[0.65rem] tracking-widest text-[#736E65] uppercase">
            OPENING YOUR ORDER DASHBOARD IN <strong className="text-[#0A0A0A]">{timeLeft}s</strong>...
          </p>
          <div className="w-full bg-[#0A0A0A]/10 h-1 overflow-hidden">
            <div className="h-full bg-emerald-700 animate-countdown-bar" />
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={handleGoToOrder}
            className="btn-editorial-primary w-full py-4 text-xs tracking-[0.25em] flex items-center justify-center space-x-2 cursor-pointer shadow-md"
          >
            <Package size={15} />
            <span>VIEW ORDER DETAILS NOW</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
