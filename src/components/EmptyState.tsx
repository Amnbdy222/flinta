import React from 'react';
import { Link } from 'react-router-dom';

export interface EmptyStateProps {
  type?: 'wishlist' | 'cart' | 'orders' | 'returns' | 'generic';
  categoryBadge?: string;
  title?: string;
  message?: string;
  actionText?: string;
  actionPath?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'generic',
  categoryBadge,
  title,
  message,
  actionText,
  actionPath = '/shop',
}) => {
  let displayCategory = categoryBadge;
  let displayTitle = title;
  let displayMessage = message;
  let displayActionText = actionText;

  if (type === 'wishlist') {
    displayCategory = displayCategory || 'WISHLIST';
    displayTitle = displayTitle || 'YOUR WISHLIST IS EMPTY';
    displayMessage =
      displayMessage ||
      "Your style radar's primed and ready, but the wishlist whispers for some fashionable company.";
    displayActionText = displayActionText || 'START WISHLISTING';
  } else if (type === 'cart') {
    displayCategory = displayCategory || 'SHOPPING BAG';
    displayTitle = displayTitle || 'YOUR BAG IS EMPTY';
    displayMessage =
      displayMessage ||
      'Your shopping bag is waiting for some premium garments. Discover timeless tailoring and archival pieces.';
    displayActionText = displayActionText || 'START SHOPPING';
  } else if (type === 'orders') {
    displayCategory = displayCategory || 'MY ORDERS';
    displayTitle = displayTitle || 'YOU HAVE NO ORDERS YET';
    displayMessage =
      displayMessage ||
      "You haven't placed any garment orders yet. Explore our current season collection to build your wardrobe.";
    displayActionText = displayActionText || 'EXPLORE COLLECTION';
  } else if (type === 'returns') {
    displayCategory = displayCategory || 'RETURNS & REFUNDS';
    displayTitle = displayTitle || 'NO RETURN REQUESTS FOUND';
    displayMessage =
      displayMessage ||
      'You currently have no active returns or refund requests on file.';
    displayActionText = displayActionText || 'VIEW MY ORDERS';
  } else {
    displayCategory = displayCategory || 'SELECTION';
    displayTitle = displayTitle || 'NO GARMENTS FOUND';
    displayMessage =
      displayMessage ||
      'The requested collection or items are currently unavailable. Explore our full catalog.';
    displayActionText = displayActionText || 'EXPLORE ALL PRODUCTS';
  }

  return (
    <div className="py-8 sm:py-12 md:py-14 px-4 sm:px-6 text-center max-w-xl mx-auto space-y-5 sm:space-y-6 animate-fade-in">
      {/* TOP CATEGORY BADGE */}
      {displayCategory && (
        <div className="text-[0.7rem] sm:text-xs font-bold tracking-[0.25em] text-[#0A0A0A] uppercase">
          {displayCategory}
        </div>
      )}

      {/* CENTER ILLUSTRATION (PRECISE HIGH-RES VECTOR MATCHING SPEC) */}
      <div className="flex justify-center pt-1 pb-1">
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {/* Light Grey Background Circle */}
            <circle cx="100" cy="100" r="80" fill="#EBEBEB" />

            {/* CLIPBOARD BACKGROUND */}
            <rect x="70" y="38" width="60" height="96" rx="5" fill="#3A3A3C" />
            {/* CLIPBOARD TOP CLIP */}
            <path
              d="M87 34 h26 a3 3 0 0 1 3 3 v6 h-32 v-6 a3 3 0 0 1 3-3 z"
              fill="#68686C"
            />
            <circle cx="100" cy="38" r="3" fill="#FFFFFF" />

            {/* WHITE PAPER */}
            <rect x="75" y="48" width="50" height="80" rx="2" fill="#FFFFFF" />

            {/* PAPER CHECKLIST LINES */}
            <line x1="82" y1="60" x2="118" y2="60" stroke="#D1D1D6" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="82" y1="72" x2="114" y2="72" stroke="#E5E5EA" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="82" y1="84" x2="116" y2="84" stroke="#E5E5EA" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="82" y1="96" x2="110" y2="96" stroke="#E5E5EA" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="82" y1="108" x2="115" y2="108" stroke="#E5E5EA" strokeWidth="2.5" strokeLinecap="round" />

            {/* SHOPPING BAG (LEFT FRONT) */}
            <path
              d="M40 96 L50 144 H88 L96 96 Z"
              fill="#C7C7CC"
            />
            <path
              d="M48 96 L56 144 H88 L96 96 Z"
              fill="#AEAEB2"
            />
            {/* BAG HANDLES */}
            <path
              d="M56 96 C56 80, 80 80, 80 96"
              fill="none"
              stroke="#48484A"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* MINIMAL FIGURE (RIGHT FRONT) */}
            {/* Head */}
            <circle cx="136" cy="74" r="6.5" fill="#F3C3B2" />
            {/* Hair */}
            <path
              d="M130 73 C130 66, 143 66, 143 73 Z"
              fill="#1C1C1E"
            />
            {/* Torso Shirt */}
            <path
              d="M127 86 L145 86 L143 108 L130 108 Z"
              fill="#FFFFFF"
              stroke="#1C1C1E"
              strokeWidth="1.5"
            />
            {/* Legs */}
            <line x1="133" y1="108" x2="131" y2="145" stroke="#1C1C1E" strokeWidth="4" strokeLinecap="round" />
            <line x1="140" y1="108" x2="143" y2="145" stroke="#1C1C1E" strokeWidth="4" strokeLinecap="round" />
            {/* Arm with Tablet */}
            <path
              d="M129 91 L116 96 L121 104"
              fill="none"
              stroke="#F3C3B2"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <rect x="111" y="93" width="11" height="15" rx="1.5" fill="#1C1C1E" transform="rotate(-15 116 100)" />
          </svg>
        </div>
      </div>

      {/* HEADLINE TITLE */}
      <h2 className="font-editorial text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#0A0A0A] leading-tight">
        {displayTitle}
      </h2>

      {/* SUBTITLE DESCRIPTION */}
      <p className="text-xs sm:text-sm text-[#636366] font-light leading-relaxed max-w-md mx-auto">
        {displayMessage}
      </p>

      {/* FULL-WIDTH BLACK CTA BUTTON */}
      {actionPath && (
        <div className="pt-2 sm:pt-4">
          <Link
            to={actionPath}
            className="w-full sm:max-w-md mx-auto inline-flex items-center justify-center px-8 py-4 bg-[#000000] text-[#FFFFFF] hover:bg-[#222222] text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 shadow-sm focus:outline-none cursor-pointer"
          >
            {displayActionText}
          </Link>
        </div>
      )}
    </div>
  );
};
