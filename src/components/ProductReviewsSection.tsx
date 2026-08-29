import React, { useEffect, useState, useCallback } from 'react';
import { Star, ShieldCheck, PenSquare, MessageSquare } from 'lucide-react';
import { FormattedProduct, Review } from '../types/database.types';
import { fetchProductReviews, fetchRatingSummary, RatingSummary } from '../services/reviewService';
import { WriteReviewModal } from './WriteReviewModal';

interface ProductReviewsSectionProps {
  product: FormattedProduct;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({ product }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<RatingSummary>({
    averageRating: 0,
    totalReviews: 0,
    ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [revs, sum] = await Promise.all([
        fetchProductReviews(product.id),
        fetchRatingSummary(product.id),
      ]);
      setReviews(revs);
      setSummary(sum);
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [product.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const renderStars = (ratingNum: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((starIndex) => (
          <Star
            key={starIndex}
            size={14}
            className={
              starIndex <= ratingNum
                ? 'fill-amber-400 text-amber-500'
                : 'text-[#736E65]/30'
            }
          />
        ))}
      </div>
    );
  };

  return (
    <div className="w-full pt-12 sm:pt-16 border-t border-[#0A0A0A]/10 space-y-8 sm:space-y-12">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 pb-5 sm:pb-6 hairline-b">
        <div>
          <span className="editorial-subtitle block">MAISON CLIENT FEEDBACK</span>
          <h2 className="font-editorial text-2xl sm:text-3xl md:text-4xl font-light uppercase tracking-tight text-[#0A0A0A]">
            CLIENT REVIEWS
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="btn-editorial-outline text-xs py-2.5 px-5 sm:px-6 inline-flex items-center space-x-2 self-start sm:self-auto cursor-pointer flex-shrink-0"
        >
          <PenSquare size={13} />
          <span>WRITE A REVIEW</span>
        </button>
      </div>

      {/* RATING SUMMARY — stacks on mobile, 2-col on md */}
      <div className="flex flex-col md:grid md:grid-cols-12 gap-6 sm:gap-8 p-4 sm:p-6 md:p-8 bg-[#FAF9F6] hairline-all items-center">
        {/* LEFT: AVERAGE */}
        <div className="md:col-span-5 flex flex-col items-center md:items-start text-center md:text-left space-y-2 sm:space-y-3 w-full md:border-r md:border-[#0A0A0A]/10 md:pr-8">
          <div className="flex items-baseline space-x-2 sm:space-x-3">
            <span className="font-editorial text-4xl sm:text-5xl font-normal text-[#0A0A0A]">
              {summary.totalReviews > 0 ? summary.averageRating.toFixed(1) : '0.0'}
            </span>
            <span className="text-sm font-light text-[#736E65] uppercase tracking-widest">/ 5.0</span>
          </div>
          <div className="flex items-center space-x-2">
            {renderStars(summary.totalReviews > 0 ? Math.round(summary.averageRating) : 0)}
            <span className="text-xs text-[#736E65] font-light">
              ({summary.totalReviews} {summary.totalReviews === 1 ? 'Review' : 'Reviews'})
            </span>
          </div>
          <p className="text-xs text-[#736E65] font-light leading-relaxed max-w-xs">
            {summary.totalReviews > 0
              ? `Based on verified orders for ${product.name}.`
              : `No reviews yet for ${product.name}.`}
          </p>
        </div>

        {/* RIGHT: BARS */}
        <div className="md:col-span-7 space-y-2 max-w-sm sm:max-w-md w-full mx-auto md:mx-0">
          {[5, 4, 3, 2, 1].map((starNum) => {
            const count = summary.ratingCounts[starNum] || 0;
            const percentage = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;
            return (
              <div key={starNum} className="flex items-center space-x-2 sm:space-x-3 text-xs">
                <span className="w-10 sm:w-12 text-right font-medium text-[#0A0A0A] tracking-wider">{starNum} ★</span>
                <div className="flex-1 h-2 bg-[#E6E4DD] rounded-full overflow-hidden">
                  <div className="h-full bg-[#0A0A0A] transition-all duration-500" style={{ width: `${percentage}%` }} />
                </div>
                <span className="w-6 sm:w-8 text-xs text-[#736E65] font-light text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* REVIEWS LIST */}
      <div className="space-y-4 sm:space-y-6">
        {loading ? (
          <div className="py-10 sm:py-12 text-center text-xs tracking-widest text-[#736E65] uppercase">
            RETRIEVING CLIENT REVIEWS...
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-10 sm:py-12 px-5 sm:px-6 bg-[#FAF9F6] hairline-all text-center space-y-3">
            <MessageSquare size={26} className="mx-auto text-[#736E65]" />
            <h3 className="font-editorial text-lg sm:text-xl font-light text-[#0A0A0A] uppercase">
              BE THE FIRST TO REVIEW
            </h3>
            <p className="text-xs text-[#736E65] font-light max-w-xs sm:max-w-sm mx-auto">
              Share your thoughts on fit, fabric texture, and craftsmanship.
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="btn-editorial-outline text-xs py-2.5 px-6 inline-flex items-center space-x-2 mt-2"
            >
              <span>WRITE THE FIRST REVIEW</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {reviews.map((rev) => {
              const reviewerName = rev.profiles?.full_name || 'Maison Client';
              const reviewDate = new Date(rev.created_at).toLocaleDateString('en-IN', {
                year: 'numeric', month: 'short', day: 'numeric',
              });
              return (
                <div
                  key={rev.id}
                  className="p-4 sm:p-6 md:p-8 bg-[#FAF9F6] hairline-all space-y-3 sm:space-y-4 transition-colors hover:border-[#0A0A0A]"
                >
                  <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1.5 sm:gap-2">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      {renderStars(rev.rating)}
                      {rev.status === 'pending' && (
                        <span className="badge-editorial border-amber-900/30 text-amber-900 bg-amber-50 text-[0.55rem] sm:text-[0.6rem]">
                          PENDING
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#736E65] font-light tracking-wider">{reviewDate}</span>
                  </div>

                  {rev.title && (
                    <h4 className="font-editorial text-lg sm:text-xl font-normal text-[#0A0A0A] tracking-wide">
                      {rev.title}
                    </h4>
                  )}

                  {rev.comment && (
                    <p className="text-xs font-light text-[#383531] leading-relaxed">"{rev.comment}"</p>
                  )}

                  <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-0 sm:space-x-2 text-xs text-[#736E65] hairline-t">
                    <span className="font-medium text-[#0A0A0A] uppercase tracking-wider">{reviewerName}</span>
                    {rev.order_id && (
                      <span className="inline-flex items-center space-x-1 text-emerald-900 text-[0.65rem] uppercase tracking-wider font-medium sm:ml-2">
                        <ShieldCheck size={11} />
                        <span>VERIFIED PURCHASER</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <WriteReviewModal
        product={product}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
