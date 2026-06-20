import React from 'react';

export const LoadingSpinner = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'h-4 w-4 border-2',
    medium: 'h-8 w-8 border-3',
    large: 'h-12 w-12 border-4',
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-slate-700 border-t-brand-500`}
      />
    </div>
  );
};

export const SkeletonCard = () => {
  return (
    <div className="animate-pulse rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-5 w-24 rounded-md bg-slate-800" />
        <div className="h-4 w-16 rounded-md bg-slate-800" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-slate-800" />
        <div className="h-4 w-5/6 rounded bg-slate-800" />
      </div>
    </div>
  );
};

export default LoadingSpinner;
