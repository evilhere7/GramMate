const colorMap = {
  brand: 'bg-[var(--gm-brand-glow)] text-[var(--gm-brand-light)] border border-[rgba(124,58,237,0.2)]',
  accent: 'bg-[var(--gm-accent-glow)] text-[var(--gm-accent-light)] border border-[rgba(6,182,212,0.2)]',
  success: 'bg-success/10 text-success border border-success/20',
  warning: 'bg-warning/10 text-warning border border-warning/20',
  danger: 'bg-danger/10 text-danger border border-danger/20',
  neutral: 'bg-[var(--gm-surface-elevated)] text-[var(--gm-text-secondary)] border border-[var(--gm-border)]',
};

const sizeMap = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export default function Badge({
  children,
  color = 'neutral',
  size = 'md',
  pulse = false,
  dot = false,
  className = '',
}) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-semibold
        ${colorMap[color] || colorMap.neutral}
        ${sizeMap[size] || sizeMap.md}
        ${pulse ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      {dot && (
        <span className={`h-1.5 w-1.5 rounded-full ${pulse ? 'animate-pulse' : ''} bg-current`} />
      )}
      {children}
    </span>
  );
}
