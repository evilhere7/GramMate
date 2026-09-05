import React from 'react';

export function Skeleton({ className = '' }) {
  return (
    <div 
      className={`animate-pulse bg-[var(--gm-surface-elevated)] rounded-md ${className}`} 
    />
  );
}

export function VideoFeedSkeleton() {
  return (
    <div className="w-full max-w-lg mx-auto py-4 space-y-6">
      {[1, 2].map((i) => (
        <div key={i} className="gm-card overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 p-4">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="w-32 h-3.5" />
              <Skeleton className="w-20 h-3" />
            </div>
          </div>
          {/* Video Placeholder */}
          <Skeleton className="w-full aspect-[9/16] max-h-[580px] rounded-none" />
          {/* Footer */}
          <div className="p-4 space-y-2">
            <Skeleton className="w-3/4 h-4" />
            <Skeleton className="w-1/2 h-3.5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-6">
        <Skeleton className="w-24 h-24 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="w-48 h-6" />
          <Skeleton className="w-28 h-4" />
          <Skeleton className="w-72 h-4" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 pt-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="aspect-[9/16] rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr className="border-b border-[var(--gm-border)]">
      {Array.from({ length: cols }).map((_, idx) => (
        <td key={idx} className="p-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}
