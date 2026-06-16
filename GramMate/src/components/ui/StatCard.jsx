export default function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  trendLabel,
  accentColor,
  className = '',
}) {
  const trendColors = {
    up: 'text-success',
    down: 'text-danger',
    neutral: 'text-[var(--gm-text-tertiary)]',
  };

  return (
    <article className={`surface rounded-xl p-5 card-hover ${className}`}>
      <div className="flex items-center justify-between">
        {Icon && (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ background: accentColor ? `${accentColor}15` : 'var(--gm-brand-glow)' }}
          >
            <Icon
              size={20}
              style={{ color: accentColor || 'var(--gm-brand-light)' }}
              aria-hidden="true"
            />
          </div>
        )}
        {trend && (
          <span className={`text-caption font-bold ${trendColors[trend] || trendColors.neutral}`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '–'} {trendLabel}
          </span>
        )}
      </div>
      <p className="mt-4 text-caption text-[var(--gm-text-secondary)]">{label}</p>
      <p className="mt-1 text-h2 text-[var(--gm-text)] animate-count-up">{value}</p>
    </article>
  );
}
