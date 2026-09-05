import PropTypes from 'prop-types';

export const LogoIcon = ({ className = '', size = 40 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="gmLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="84" height="84" rx="20" fill="url(#gmLogoGradient)" />
      {/* Sleek play triangle intersecting an aperture / GM motif */}
      <path
        d="M62 35C58 31 53 29 47 29C35.5 29 26 38.5 26 50C26 61.5 35.5 71 47 71C56.5 71 64.5 64.5 66.8 55.5H49.5V45.5H78V50C78 67.5 64.5 81 47 81C29.5 81 16 67.5 16 50C16 32.5 29.5 19 47 19C55.5 19 63 22 69 27.5L62 35Z"
        fill="#FFFFFF"
      />
      <path d="M48 42L63 50L48 58V42Z" fill="#FFFFFF" />
    </svg>
  );
};

LogoIcon.propTypes = {
  className: PropTypes.string,
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default function Logo({
  size = 'md',
  layout = 'horizontal',
  tagline = true,
  className = '',
}) {
  const sizeMap = {
    xs: { icon: 20, text: 'text-sm', tag: 'text-[8px]', spacing: 'gap-1.5' },
    sm: { icon: 28, text: 'text-lg', tag: 'text-[9px]', spacing: 'gap-2' },
    md: { icon: 36, text: 'text-xl', tag: 'text-[10px]', spacing: 'gap-2.5' },
    lg: { icon: 48, text: 'text-2xl', tag: 'text-[11px]', spacing: 'gap-3' },
    xl: { icon: 60, text: 'text-3xl', tag: 'text-[13px]', spacing: 'gap-3.5' },
    '2xl': { icon: 76, text: 'text-4xl', tag: 'text-[15px]', spacing: 'gap-4' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`flex ${
        layout === 'vertical' ? 'flex-col items-center text-center' : 'items-center text-left'
      } ${currentSize.spacing} select-none ${className}`}
    >
      <LogoIcon size={currentSize.icon} />
      <div className="flex flex-col">
        <h1 className={`${currentSize.text} font-black tracking-tight text-[var(--gm-text)]`}>
          Gram<span className="text-[var(--gm-brand)]">Mate</span>
        </h1>
        {tagline && (
          <p className={`${currentSize.tag} mt-0.5 font-bold uppercase tracking-wider text-[var(--gm-text-tertiary)]`}>
            Watch. Create. Earn.
          </p>
        )}
      </div>
    </div>
  );
}

Logo.propTypes = {
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', '2xl']),
  layout: PropTypes.oneOf(['horizontal', 'vertical']),
  tagline: PropTypes.bool,
  className: PropTypes.string,
};
