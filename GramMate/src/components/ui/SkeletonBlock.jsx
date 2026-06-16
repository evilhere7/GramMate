const shapeMap = {
  text: 'h-4 w-full rounded-md',
  'text-sm': 'h-3 w-3/4 rounded-md',
  'text-xs': 'h-2.5 w-1/2 rounded-md',
  heading: 'h-6 w-2/3 rounded-lg',
  circle: 'rounded-full',
  card: 'h-32 w-full rounded-xl',
  avatar: 'h-10 w-10 rounded-full',
  'avatar-lg': 'h-16 w-16 rounded-full',
  button: 'h-10 w-24 rounded-lg',
  image: 'aspect-video w-full rounded-xl',
};

export default function SkeletonBlock({
  shape = 'text',
  width,
  height,
  className = '',
  count = 1,
}) {
  const shapeClass = shapeMap[shape] || shapeMap.text;

  if (count > 1) {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`animate-shimmer bg-[var(--gm-surface-elevated)] ${shapeClass}`}
            style={{ width, height }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`animate-shimmer bg-[var(--gm-surface-elevated)] ${shapeClass} ${className}`}
      style={{ width, height }}
    />
  );
}

/** Prebuilt skeleton for stat card grids */
export function StatCardSkeleton({ count = 4 }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surface rounded-xl p-5 space-y-4">
          <SkeletonBlock shape="avatar" />
          <SkeletonBlock shape="text-xs" />
          <SkeletonBlock shape="heading" />
        </div>
      ))}
    </div>
  );
}

/** Prebuilt skeleton for list items */
export function ListSkeleton({ count = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surface rounded-xl p-4 flex items-center gap-4">
          <SkeletonBlock shape="avatar" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock shape="text" width="60%" />
            <SkeletonBlock shape="text-sm" width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
}
