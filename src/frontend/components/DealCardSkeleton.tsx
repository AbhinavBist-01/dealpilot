import React from 'react';

export const DealCardSkeleton: React.FC = () => {
  return (
    <div className="bg-[#09090b] border border-zinc-850 rounded-xl overflow-hidden flex flex-col justify-between animate-pulse">
      <div>
        {/* Thumbnail Skeleton */}
        <div className="h-48 w-full bg-zinc-900 border-b border-zinc-850 relative">
          <div className="absolute top-2.5 right-2.5 w-14 h-5 rounded bg-zinc-800" />
          <div className="absolute top-2.5 left-2.5 w-20 h-5 rounded bg-zinc-800" />
        </div>

        <div className="p-4 sm:p-5 space-y-3">
          {/* Brand Row */}
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 bg-zinc-850 rounded" />
            <div className="h-4 w-28 bg-zinc-850 rounded" />
          </div>

          {/* Title Lines */}
          <div className="space-y-1.5">
            <div className="h-4 w-full bg-zinc-800 rounded" />
            <div className="h-4 w-3/4 bg-zinc-800 rounded" />
          </div>

          {/* Price Block Skeleton */}
          <div className="bg-black rounded-lg p-3 border border-zinc-850 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-6 w-24 bg-zinc-800 rounded" />
              <div className="h-7 w-20 bg-zinc-900 rounded" />
            </div>
            <div className="h-3 w-16 bg-zinc-850 rounded" />
          </div>

          {/* Score Factors Strip Skeleton */}
          <div className="bg-[#0b0b0e] rounded-lg p-2.5 border border-zinc-850 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-3 w-28 bg-zinc-850 rounded" />
              <div className="h-3 w-16 bg-zinc-850 rounded" />
            </div>
            <div className="grid grid-cols-5 gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-9 bg-black rounded border border-zinc-850" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Skeleton */}
      <div className="p-4 sm:p-5 pt-0">
        <div className="grid grid-cols-2 gap-2">
          <div className="h-9 bg-zinc-900 rounded-lg border border-zinc-800" />
          <div className="h-9 bg-zinc-800 rounded-lg" />
        </div>
      </div>
    </div>
  );
};
