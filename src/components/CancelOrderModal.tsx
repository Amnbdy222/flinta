import React, { useState } from 'react';
import { X, Ban, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Order } from '../types/database.types';
import { cancelOrder, formatOrderNumber } from '../services/orderService';

interface CancelOrderModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CANCEL_REASONS = [
  'Changed Mind / No Longer Required',
  'Order Created by Mistake',
  'Want to Change Shipping Address / Phone',
  'Ordered Incorrect Garment Size or Color',
  'Delivery Time is Too Long',
  'Found Better Offer Elsewhere',
];

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  order,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const displayOrderNum = formatOrderNumber(order.order_number);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await cancelOrder(order.id, `${reason}${comments ? `: ${comments}` : ''}`);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1600);
    } catch (err: unknown) {
      console.error('Cancellation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel order.');
    } finally {
      setLoading(false);
    }
  };

  const isPaidRazorpay = order.payment_method === 'razorpay' && order.payment_status === 'paid';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#FAF9F6] w-full max-w-lg hairline-all p-6 sm:p-8 space-y-6 relative shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-[#736E65] hover:text-[#0A0A0A] transition-colors"
        >
          <X size={20} />
        </button>

        {success ? (
          <div className="py-12 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-rose-50 text-rose-900 hairline-all mb-2">
              <CheckCircle2 size={30} />
            </div>
            <h3 className="font-editorial text-2xl uppercase tracking-wide text-[#0A0A0A]">
              {isPaidRazorpay ? 'ORDER CANCELLED & REFUNDED' : 'ORDER CANCELLED'}
            </h3>
            <p className="text-xs font-light text-[#383531] leading-relaxed max-w-sm mx-auto">
              {isPaidRazorpay
                ? `Your order #${displayOrderNum} has been cancelled successfully. A full refund of ₹${order.total_amount.toFixed(2)} has been initiated to your original payment method.`
                : `Your order #${displayOrderNum} has been cancelled successfully and reserved inventory has been released.`}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-1 pr-8 border-b border-[#0A0A0A]/10 pb-4">
              <div className="flex items-center space-x-2 text-rose-900">
                <Ban size={18} />
                <span className="editorial-subtitle text-xs tracking-widest text-rose-900">
                  {isPaidRazorpay ? 'CANCEL & REFUND ORDER' : 'CANCEL ORDER'}
                </span>
              </div>
              <h2 className="font-editorial text-2xl uppercase tracking-wide text-[#0A0A0A]">
                ORDER #{displayOrderNum}
              </h2>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center space-x-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              <div className="space-y-1.5">
                <label className="block font-medium tracking-wider text-[#0A0A0A] uppercase">
                  REASON FOR CANCELLATION *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-[#0A0A0A]/20 px-3 py-2.5 text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                  required
                >
                  {CANCEL_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium tracking-wider text-[#0A0A0A] uppercase">
                  ADDITIONAL COMMENTS (OPTIONAL)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Provide additional details regarding cancellation..."
                  rows={3}
                  className="w-full bg-[#FAF9F6] border border-[#0A0A0A]/20 p-3 text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] resize-none"
                />
              </div>

              <div className="bg-rose-50/70 p-4 hairline-all space-y-1 text-xs text-rose-950">
                <p className="font-medium uppercase tracking-wider">
                  {isPaidRazorpay ? 'REFUND & CANCELLATION NOTICE' : 'CANCELLATION NOTICE'}
                </p>
                <p className="text-[0.65rem] leading-relaxed font-light">
                  {isPaidRazorpay
                    ? `This order has been paid. Cancelling it will initiate a full refund of ₹${order.total_amount.toFixed(2)} to your original payment method.`
                    : 'Order cancellation is permanent. Any reserved items in this order will be released back to active stock immediately.'}
                </p>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-xs tracking-wider uppercase border border-[#0A0A0A]/20 text-[#0A0A0A] hover:border-[#0A0A0A] transition-colors"
                >
                  KEEP ORDER
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-rose-900 text-white hover:bg-rose-950 text-xs px-6 py-2.5 uppercase tracking-widest transition-colors font-medium disabled:opacity-50"
                >
                  {loading
                    ? isPaidRazorpay
                      ? 'PROCESSING REFUND...'
                      : 'CANCELING...'
                    : isPaidRazorpay
                    ? 'CANCEL & REFUND'
                    : 'CONFIRM CANCELLATION'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
