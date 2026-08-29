import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Star, AlertCircle, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';
import { FormattedProduct } from '../types/database.types';
import { submitReview, checkUserReviewEligibility, ReviewEligibility } from '../services/reviewService';

interface WriteReviewModalProps {
  product: FormattedProduct;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const WriteReviewModal: React.FC<WriteReviewModalProps> = ({
  product,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(true);

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCheckingEligibility(true);
      setError(null);
      setSuccess(false);

      checkUserReviewEligibility(product.id).then((res) => {
        setEligibility(res);
        setCheckingEligibility(false);
      });
    }
  }, [isOpen, product.id]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await submitReview({
        product_id: product.id,
        rating,
        title,
        comment,
      });

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1800);
    } catch (err: unknown) {
      console.error('Review submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  const activeStarRating = hoverRating !== null ? hoverRating : rating;

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

        {checkingEligibility ? (
          <div className="py-16 text-center text-xs tracking-widest uppercase text-[#736E65]">
            VERIFYING PURCHASE HISTORY...
          </div>
        ) : eligibility && !eligibility.canReview ? (
          <div className="py-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 text-amber-900 hairline-all mb-2">
              <Lock size={22} />
            </div>
            <h3 className="font-editorial text-2xl uppercase tracking-wide text-[#0A0A0A]">
              VERIFIED PURCHASER ONLY
            </h3>
            <p className="text-xs font-light text-[#383531] leading-relaxed max-w-sm mx-auto">
              {eligibility.reason || 'Only verified purchasers of this garment can submit a client review.'}
            </p>
            {eligibility.reason?.includes('sign in') ? (
              <Link
                to="/login"
                onClick={onClose}
                className="btn-editorial inline-block text-xs py-2.5 px-6 uppercase tracking-widest mt-2"
              >
                SIGN IN TO ACCOUNT
              </Link>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="btn-editorial-outline text-xs py-2.5 px-6 uppercase tracking-widest mt-2"
              >
                CLOSE
              </button>
            )}
          </div>
        ) : success ? (
          <div className="py-12 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 text-emerald-900 hairline-all mb-2">
              <CheckCircle2 size={30} />
            </div>
            <h3 className="font-editorial text-2xl uppercase tracking-wide text-[#0A0A0A]">
              REVIEW SUBMITTED FOR APPROVAL
            </h3>
            <p className="text-xs font-light text-[#383531] leading-relaxed max-w-sm mx-auto">
              Thank you for sharing your evaluation. Your review has been submitted for admin approval and will appear on {product.name} once verified.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-1 border-b border-[#0A0A0A]/10 pb-4 pr-8">
              <span className="editorial-subtitle text-xs tracking-widest text-[#736E65]">
                CLIENT MAISON REVIEWS
              </span>
              <h2 className="font-editorial text-2xl uppercase tracking-wide text-[#0A0A0A]">
                REVIEW {product.name}
              </h2>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center space-x-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              {/* STAR RATING PICKER */}
              <div className="space-y-2">
                <label className="block font-medium tracking-wider text-[#0A0A0A] uppercase">
                  OVERALL RATING *
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const isFilled = starVal <= activeStarRating;
                    return (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() => setRating(starVal)}
                        onMouseEnter={() => setHoverRating(starVal)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 text-amber-500 hover:scale-125 transition-transform cursor-pointer focus:outline-none"
                      >
                        <Star
                          size={24}
                          className={isFilled ? 'fill-amber-400 text-amber-500' : 'text-[#736E65]/40'}
                        />
                      </button>
                    );
                  })}
                  <span className="text-xs font-medium text-[#0A0A0A] ml-2">
                    {activeStarRating} / 5
                  </span>
                </div>
              </div>

              {/* REVIEW TITLE */}
              <div className="space-y-1.5">
                <label className="block font-medium tracking-wider text-[#0A0A0A] uppercase">
                  REVIEW TITLE (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Impeccable tailoring & premium cotton fabric"
                  className="w-full bg-[#FAF9F6] border border-[#0A0A0A]/20 px-3.5 py-2.5 text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A]"
                />
              </div>

              {/* REVIEW COMMENT */}
              <div className="space-y-1.5">
                <label className="block font-medium tracking-wider text-[#0A0A0A] uppercase">
                  DETAILED COMMENTS (OPTIONAL)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Describe garment fit, drape, texture, stitching, or styling..."
                  rows={4}
                  className="w-full bg-[#FAF9F6] border border-[#0A0A0A]/20 p-3.5 text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] resize-none"
                />
              </div>

              <div className="bg-[#F0EFEA] p-3.5 hairline-all flex items-center space-x-2 text-[0.65rem] text-[#736E65]">
                <ShieldCheck size={16} className="text-[#0A0A0A] shrink-0" />
                <span>
                  All client reviews are verified before publication to preserve community integrity.
                </span>
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
                  className="bg-[#0A0A0A] text-[#FAF9F6] hover:bg-[#383531] text-xs px-6 py-2.5 uppercase tracking-widest transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? 'SUBMITTING...' : 'SUBMIT REVIEW'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
