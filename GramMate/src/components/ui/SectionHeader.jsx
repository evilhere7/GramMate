export default function SectionHeader({ overline, title, description, className = '' }) {
  return (
    <div className={`mb-8 ${className}`}>
      {overline && (
        <p className="text-overline gradient-text mb-2">{overline}</p>
      )}
      {title && (
        <h1 className="text-h1 text-[var(--gm-text)]">{title}</h1>
      )}
      {description && (
        <p className="mt-3 max-w-2xl text-body text-[var(--gm-text-secondary)]">{description}</p>
      )}
    </div>
  );
}
