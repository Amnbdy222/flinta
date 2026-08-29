import React, { useState } from 'react';
import { X, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Order } from '../types/database.types';
import { createReturnRequest } from '../services/returnExchangeService';

interface ReturnModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const RETURN_REASONS = [
  'Size Mismatch / Fit Issue',
  'Defective or Damaged Garment',
  'Wrong Item Delivered',
  'Garment Quality Not as Expected',
  'Color Differs from Website Image',
  'Changed Mind / No Longer Required',
];

export const ReturnModal: React.FC<ReturnModalProps> = ({
  order,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState(RETURN_REASONS[0]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createReturnRequest({
        order_id: order.id,
        reason,
        description,
        refund_amount: Number(order.total_amount),
      });

      setSubmitted(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1800);
    } catch (err: unknown) {
      console.error('Return request submission failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit return request.');
    } finally {
      setLoading(false);
    }
  };

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

        {submitted ? (
          <div className="py-12 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 text-emerald-900 hairline-all mb-2">
              <CheckCircle2 size={30} />
            </div>
            <h3 className="font-editorial text-2xl uppercase tracking-wide text-[#0A0A0A]">
              RETURN REQUEST SUBMITTED
            </h3>
            <p className="text-xs font-light text-[#383531] leading-relaxed max-w-sm mx-auto">
              We have received your return request. Our logistics team will review and schedule a pickup shortly.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-1 pr-8 border-b border-[#0A0A0A]/10 pb-4">
              <div className="flex items-center space-x-2 text-[#0A0A0A]">
                <RotateCcw size={18} />
                <span className="editorial-subtitle text-xs tracking-widest">REQUEST RETURN & REFUND</span>
              </div>
              <h2 className="font-editorial text-2xl uppercase tracking-wide text-[#0A0A0A]">
                ORDER #{order.order_number}
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
                  REASON FOR RETURN *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-[#0A0A0A]/20 px-3 py-2.5 text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                  required
                >
                  {RETURN_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium tracking-wider text-[#0A0A0A] uppercase">
                  ADDITIONAL DETAILS / REMARKS (OPTIONAL)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe any defect or specific reason for return..."
                  rows={3}
                  className="w-full bg-[#FAF9F6] border border-[#0A0A0A]/20 p-3 text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] resize-none"
                />
              </div>

              <div className="bg-[#F0EFEA] p-4 hairline-all space-y-1 text-xs">
                <div className="flex justify-between font-medium text-[#0A0A0A]">
                  <span>ESTIMATED REFUND AMOUNT</span>
                  <span>₹{Number(order.total_amount).toFixed(2)}</span>
                </div>
                <p className="text-[0.65rem] text-[#736E65] font-light">
                  Refund will be initiated to your original payment method or bank account upon quality inspection.
                </p>
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-xs tracking-wider uppercase border border-[#0A0A0A]/20 text-[#0A0A0A] hover:border-[#0A0A0A] transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary text-xs px-6 py-2.5 uppercase tracking-widest disabled:opacity-50"
                >
                  {loading ? 'SUBMITTING...' : 'SUBMIT RETURN REQUEST'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
