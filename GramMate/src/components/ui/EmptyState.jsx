import React from 'react';

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  className = '' 
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto ${className}`}>
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-[var(--gm-surface-elevated)] border border-[var(--gm-border)] flex items-center justify-center text-[var(--gm-text-secondary)] mb-4 shadow-sm">
          <Icon size={26} strokeWidth={1.75} />
        </div>
      )}
      <h3 className="text-base font-bold text-[var(--gm-text)] tracking-tight mb-1.5">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[var(--gm-text-secondary)] leading-relaxed mb-5 max-w-sm">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="gm-btn-primary text-xs px-4 py-2"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
