import React from 'react';

export function SkeletonCard({ count = 6 }) {
  return (
    <>
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className="min-w-[160px] md:min-w-[180px] rounded-xl overflow-hidden glass-card animate-pulse border border-white/5 bg-white/5"
          >
            <div className="aspect-[2/3] bg-gradient-to-tr from-white/5 via-white/10 to-white/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
            </div>
            <div className="p-3 space-y-2">
              <div className="h-4 bg-white/10 rounded w-3/4" />
              <div className="flex items-center gap-2">
                <div className="h-3 bg-white/10 rounded w-1/4" />
                <div className="h-3 bg-white/10 rounded w-1/3" />
              </div>
            </div>
          </div>
        ))}
    </>
  );
}

export default SkeletonCard;
