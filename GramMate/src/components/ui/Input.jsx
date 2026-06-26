import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { label, icon: Icon, error, className = '', ...props },
  ref
) {
  return (
    <label className="block">
      {label && (
        <span className="mb-2 block text-caption font-semibold text-[var(--gm-text-secondary)]">
          {label}
        </span>
      )}
      <span className="relative flex items-center">
        {Icon && (
          <Icon
            className="absolute left-3.5 text-[var(--gm-text-tertiary)]"
            size={18}
            aria-hidden="true"
          />
        )}
        <input
          ref={ref}
          className={`
            w-full rounded-lg border border-[var(--gm-border)]
            bg-[var(--gm-surface)] text-[var(--gm-text)]
            placeholder:text-[var(--gm-text-tertiary)]
            transition-all duration-200
            focus:border-[var(--gm-brand)] focus:ring-1 focus:ring-[var(--gm-brand)] focus:outline-none
            ${Icon ? 'py-3 pl-11 pr-3.5' : 'px-3.5 py-3'}
            ${error ? 'border-danger' : ''}
            ${className}
          `}
          {...props}
        />
      </span>
      {error && (
        <p className="mt-1.5 text-caption text-danger">{error}</p>
      )}
    </label>
  );
});

export default Input;
