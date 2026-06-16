import { forwardRef } from 'react';

const variants = {
  primary: 'gradient-brand text-white shadow-sm glow-brand',
  secondary: 'bg-[var(--gm-surface-elevated)] text-[var(--gm-text)] border border-[var(--gm-border)] hover:border-[var(--gm-border-strong)]',
  ghost: 'text-[var(--gm-text-secondary)] hover:text-[var(--gm-text)] hover:bg-[var(--gm-surface)]',
  danger: 'bg-danger text-white hover:bg-danger/90 shadow-sm',
  outline: 'border border-[var(--gm-brand)] text-[var(--gm-brand)] hover:bg-[var(--gm-brand-glow)]',
  accent: 'bg-accent text-white hover:bg-accent/90 shadow-sm glow-accent',
};

const sizes = {
  xs: 'px-2.5 py-1.5 text-xs gap-1.5 rounded-md',
  sm: 'px-3 py-2 text-sm gap-2 rounded-lg',
  md: 'px-4 py-2.5 text-sm gap-2 rounded-lg',
  lg: 'px-5 py-3 text-base gap-2.5 rounded-xl',
  xl: 'px-6 py-3.5 text-base gap-3 rounded-xl',
  icon: 'p-2.5 rounded-lg',
};

const Button = forwardRef(function Button(
  { children, variant = 'primary', size = 'md', loading = false, className = '', disabled, ...props },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-semibold
        transition-all duration-200 ease-out
        active:scale-[0.97]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
});

export default Button;
