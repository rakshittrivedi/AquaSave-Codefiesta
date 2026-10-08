import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div
      className="rounded-xl border border-[#30363D] bg-[#161B22] p-5 flex flex-col justify-between animate-pulse"
      aria-hidden="true"
    >
      {/* Header Skeleton */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="space-y-1.5 flex-1">
          <div className="h-4 bg-[#21262D] rounded w-28" />
          <div className="h-3 bg-[#21262D]/60 rounded w-40" />
        </div>
        <div className="h-5 bg-[#21262D] rounded-full w-16" />
      </div>

      {/* Body Skeleton */}
      <div className="flex items-center justify-between my-2">
        <div className="flex-1 pr-4 space-y-3">
          <div className="h-3 bg-[#21262D] rounded w-20" />
          <div className="h-9 bg-[#21262D] rounded w-24" />
          <div className="pt-3 border-t border-[#21262D] space-y-2">
            <div className="h-3 bg-[#21262D] rounded w-32" />
            <div className="h-3 bg-[#21262D] rounded w-28" />
          </div>
        </div>

        {/* Cylinder Skeleton */}
        <div className="w-[120px] h-[160px] bg-[#21262D]/40 rounded-xl border border-[#30363D]/60" />
      </div>

      {/* Footer Skeleton */}
      <div className="mt-4 pt-3 border-t border-[#21262D] flex items-center justify-between">
        <div className="h-3 bg-[#21262D] rounded w-16" />
        <div className="h-3 bg-[#21262D] rounded w-24" />
      </div>
    </div>
  );
};

export default SkeletonCard;
