import React from 'react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'UNABLE TO LOAD DATA',
  message = 'A connection error occurred while querying the catalog. Please try refreshing.',
  onRetry,
}) => {
  return (
    <div className="py-20 px-6 text-center space-y-6 max-w-md mx-auto hairline-all p-8 bg-[#FAF9F6]">
      <span className="text-[0.65rem] tracking-[0.3em] text-[#736E65] uppercase block">
        SYSTEM STATEMENT
      </span>
      <h3 className="font-editorial text-2xl tracking-wide uppercase text-[#0A0A0A]">
        {title}
      </h3>
      <p className="text-xs text-[#736E65] leading-relaxed font-light">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn-editorial-outline"
        >
          RETRY CONNECTION
        </button>
      )}
    </div>
  );
};
