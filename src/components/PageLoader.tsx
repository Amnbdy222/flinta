import React from 'react';

export const PageLoader: React.FC = () => {
  return (
    <div
      className="min-h-[50vh] flex flex-col items-center justify-center py-24 px-4 bg-[#FAF9F6]"
      role="status"
      aria-live="polite"
      aria-label="Loading page content"
    >
      <div className="flex flex-col items-center space-y-4">
        {/* Editorial Minimalist Loader */}
        <span className="font-editorial text-2xl tracking-[0.25em] text-[#0A0A0A] uppercase select-none animate-pulse">
          FLINT
        </span>
        <div className="w-16 h-[1.5px] bg-[#0A0A0A]/10 overflow-hidden relative">
          <div className="w-8 h-full bg-[#0A0A0A] animate-pulse" />
        </div>
        <span className="text-[0.6rem] tracking-[0.3em] uppercase text-[#736E65] font-light">
          LOADING VIEW
        </span>
      </div>
    </div>
  );
};
