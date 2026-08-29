import React from 'react';
import { EmptyState } from '../components/EmptyState';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-32 pb-24 flex items-center justify-center">
      <EmptyState
        title="404 — PAGE NOT FOUND"
        message="The requested architectural URL does not exist or has been moved."
        actionText="RETURN TO HOMEPAGE"
        actionPath="/"
      />
    </div>
  );
};
