import React from 'react';

export const ProductSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse space-y-4">
      <div className="bg-[#E6E4DD]/60 aspect-editorial w-full"></div>
      <div className="space-y-2 pt-2">
        <div className="h-3 bg-[#E6E4DD]/60 w-3/4"></div>
        <div className="h-3 bg-[#E6E4DD]/40 w-1/4"></div>
      </div>
    </div>
  );
};

export const HeroSkeleton: React.FC = () => {
  return (
    <div className="w-full h-[85vh] bg-[#E6E4DD]/40 animate-pulse flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md px-6">
        <div className="h-3 bg-[#D4D0C7] w-24 mx-auto"></div>
        <div className="h-10 bg-[#D4D0C7] w-64 mx-auto"></div>
        <div className="h-4 bg-[#D4D0C7] w-48 mx-auto"></div>
      </div>
    </div>
  );
};
