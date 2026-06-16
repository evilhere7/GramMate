const variants = {
  default: 'surface card-hover',
  elevated: 'surface-elevated card-hover',
  glass: 'glass card-hover',
  brand: 'surface-brand card-hover',
  accent: 'surface-accent card-hover',
  flat: 'bg-transparent',
};

export default function Card({
  title,
  description,
  children,
  variant = 'default',
  padding = 'p-5',
  className = '',
  ...props
}) {
  return (
    <div
      className={`
        rounded-xl transition-all duration-250
        ${variants[variant] || variants.default}
        ${padding}
        ${className}
      `}
      {...props}
    >
      {(title || description) && (
        <div className="mb-4">
          {title && <h3 className="text-h3 text-[var(--gm-text)]">{title}</h3>}
          {description && <p className="mt-1 text-body text-[var(--gm-text-secondary)]">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}
