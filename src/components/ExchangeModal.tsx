import React, { useState, useEffect } from 'react';
import { X, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Order, OrderItem, ProductVariant } from '../types/database.types';
import { createExchangeRequest, fetchAvailableVariantsForProduct } from '../services/returnExchangeService';

interface ExchangeModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EXCHANGE_REASONS = [
  'Size Too Small / Need Larger Size',
  'Size Too Large / Need Smaller Size',
  'Prefer Different Color Variant',
  'Defective or Damaged Garment',
  'Style / Fit Mismatch',
];

export const ExchangeModal: React.FC<ExchangeModalProps> = ({
  order,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const items = order.order_items || [];
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(items[0] || null);
  const [availableVariants, setAvailableVariants] = useState<ProductVariant[]>([]);
  const [requestedVariantId, setRequestedVariantId] = useState<string>('');
  const [reason, setReason] = useState(EXCHANGE_REASONS[0]);
  const [description, setDescription] = useState('');
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Load available size/color variants whenever selected item changes
  useEffect(() => {
    if (!selectedItem?.product_id) return;

    const loadVariants = async () => {
      setLoadingVariants(true);
      try {
        const variants = await fetchAvailableVariantsForProduct(selectedItem.product_id);
        // Exclude original variant from replacement options if desired, or keep all active variants
        setAvailableVariants(variants);
        const replacement = variants.find((v) => v.id !== selectedItem.variant_id) || variants[0];
        if (replacement) {
          setRequestedVariantId(replacement.id);
        }
      } catch (err) {
        console.error('Error loading variants for exchange:', err);
      } finally {
        setLoadingVariants(false);
      }
    };

    loadVariants();
  }, [selectedItem]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      setError('Please select an item to exchange.');
      return;
    }
    if (!requestedVariantId) {
      setError('Please select a replacement size or color variant.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createExchangeRequest({
        order_id: order.id,
        original_variant_id: selectedItem.variant_id,
        requested_variant_id: requestedVariantId,
        quantity: selectedItem.quantity || 1,
        reason,
        description,
      });

      setSubmitted(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1800);
    } catch (err: unknown) {
      console.error('Exchange request submission failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit exchange request.');
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
              EXCHANGE REQUEST SUBMITTED
            </h3>
            <p className="text-xs font-light text-[#383531] leading-relaxed max-w-sm mx-auto">
              Your size/color replacement request has been registered. Our fulfillment team will process your exchange pickup and dispatch shortly.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-1 pr-8 border-b border-[#0A0A0A]/10 pb-4">
              <div className="flex items-center space-x-2 text-[#0A0A0A]">
                <RefreshCw size={18} />
                <span className="editorial-subtitle text-xs tracking-widest">GARMENT EXCHANGE REQUEST</span>
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
              {/* SELECT ITEM TO EXCHANGE */}
              <div className="space-y-1.5">
                <label className="block font-medium tracking-wider text-[#0A0A0A] uppercase">
                  SELECT ITEM TO EXCHANGE *
                </label>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <label
                      key={item.id}
                      className={`flex items-center space-x-3 p-2.5 border cursor-pointer transition-all ${
                        selectedItem?.id === item.id
                          ? 'border-[#0A0A0A] bg-[#F0EFEA]'
                          : 'border-[#0A0A0A]/15 hover:border-[#0A0A0A]/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="original_item"
                        checked={selectedItem?.id === item.id}
                        onChange={() => setSelectedItem(item)}
                        className="accent-[#0A0A0A]"
                      />
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.product_name_snapshot}
                          className="w-10 h-12 object-cover object-top border border-[#0A0A0A]/10"
                        />
                      )}
                      <div className="flex-1 text-xs">
                        <p className="font-normal text-[#0A0A0A] line-clamp-1">
                          {item.product_name_snapshot}
                        </p>
                        <p className="text-[0.65rem] text-[#736E65] uppercase">
                          CURRENT: {item.color_name_snapshot} • SIZE {item.size_snapshot}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* SELECT REPLACEMENT SIZE / COLOR VARIANT */}
              <div className="space-y-1.5">
                <label className="block font-medium tracking-wider text-[#0A0A0A] uppercase">
                  REQUESTED REPLACEMENT SIZE / COLOR *
                </label>
                {loadingVariants ? (
                  <div className="p-3 text-center text-[#736E65] text-xs">
                    Loading available garment sizes...
                  </div>
                ) : availableVariants.length === 0 ? (
                  <div className="p-3 text-center text-rose-800 text-xs">
                    No replacement variants available for this garment.
                  </div>
                ) : (
                  <select
                    value={requestedVariantId}
                    onChange={(e) => setRequestedVariantId(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-[#0A0A0A]/20 px-3 py-2.5 text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                    required
                  >
                    {availableVariants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.color_name} — SIZE {v.size} {v.stock <= 0 ? '(Out of Stock)' : `(In Stock: ${v.stock})`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* REASON */}
              <div className="space-y-1.5">
                <label className="block font-medium tracking-wider text-[#0A0A0A] uppercase">
                  REASON FOR EXCHANGE *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-[#0A0A0A]/20 px-3 py-2.5 text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                  required
                >
                  {EXCHANGE_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* NOTES */}
              <div className="space-y-1.5">
                <label className="block font-medium tracking-wider text-[#0A0A0A] uppercase">
                  REMARKS / FIT INSTRUCTIONS (OPTIONAL)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Specify any fit notes or preferences..."
                  rows={2}
                  className="w-full bg-[#FAF9F6] border border-[#0A0A0A]/20 p-3 text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] resize-none"
                />
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
                  disabled={loading || availableVariants.length === 0}
                  className="btn-primary text-xs px-6 py-2.5 uppercase tracking-widest disabled:opacity-50"
                >
                  {loading ? 'SUBMITTING...' : 'SUBMIT EXCHANGE REQUEST'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
