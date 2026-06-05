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
      <rect x="10" y="10" width="80" height="80" rx="18" fill="#0F172A" />
      <path
        d="M64 34.5C59.8 30.8 54.8 29 49 29C37.4 29 28 38.4 28 50C28 61.6 37.4 71 49 71C58.9 71 67.2 64.1 69.4 54.8H51.5V44.6H81V50C81 68.2 67.1 82 49 82C31 82 17 68 17 50C17 32 31 18 49 18C58 18 65.6 21.1 71.8 26.8L64 34.5Z"
        fill="#FFFFFF"
      />
      <path d="M47 42L62 50L47 58V42Z" fill="#2563EB" />
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
  hoverGlow = false,
  className = '',
}) {
  const sizeMap = {
    xs: { icon: 20, text: 'text-sm', tag: 'text-[8px]', spacing: 'gap-1.5' },
    sm: { icon: 28, text: 'text-lg', tag: 'text-[9px]', spacing: 'gap-2' },
    md: { icon: 40, text: 'text-2xl', tag: 'text-[10px]', spacing: 'gap-3' },
    lg: { icon: 52, text: 'text-3xl', tag: 'text-[12px]', spacing: 'gap-3.5' },
    xl: { icon: 68, text: 'text-4xl', tag: 'text-[14px]', spacing: 'gap-4' },
    '2xl': { icon: 88, text: 'text-5xl', tag: 'text-[16px]', spacing: 'gap-5' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`flex ${
        layout === 'vertical' ? 'flex-col items-center text-center' : 'items-center text-left'
      } ${currentSize.spacing} ${hoverGlow ? 'transition-transform hover:scale-[1.01]' : ''} ${className}`}
    >
      <LogoIcon size={currentSize.icon} />
      <div className="flex flex-col">
        <h1 className={`${currentSize.text} font-extrabold leading-none tracking-normal text-slate-950`}>
          GramMate
        </h1>
        {tagline && (
          <p className={`${currentSize.tag} mt-1.5 font-bold uppercase leading-none tracking-[0.18em] text-slate-500`}>
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
  hoverGlow: PropTypes.bool,
  className: PropTypes.string,
};
