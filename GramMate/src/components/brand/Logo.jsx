import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

export const LogoIcon = ({ className = '', size = 40, glow = false }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${glow ? 'drop-shadow-[0_0_12px_rgba(139,92,246,0.6)]' : ''} transition-all duration-300`}
    >
      <defs>
        <linearGradient id="grammate-icon-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#08D9D6" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#FF2E63" />
        </linearGradient>
      </defs>
      
      {/* Outer Stylized 'G' with Arrow */}
      <path
        d="M 68 35 
           C 74 41, 76 49, 76 56
           C 76 70, 64 82, 50 82
           C 36 82, 24 70, 24 56
           C 24 42, 36 30, 50 30
           C 55 30, 60 32, 64 35
           L 72 26
           C 66 20, 58 18, 50 18
           C 29 18, 12 35, 12 56
           C 12 77, 29 94, 50 94
           C 71 94, 88 77, 88 56
           C 88 45, 84 35, 78 28
           L 92 14
           L 66 14
           L 66 38
           L 70 35"
        fill="url(#grammate-icon-gradient)"
      />

      {/* Central Left-Pointing Play Triangle */}
      <path
        d="M 54 44 
           L 40 56
           L 54 68
           Z"
        fill="url(#grammate-icon-gradient)"
        stroke="url(#grammate-icon-gradient)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
};

LogoIcon.propTypes = {
  className: PropTypes.string,
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  glow: PropTypes.bool,
};

export default function Logo({
  size = 'md',
  layout = 'horizontal',
  tagline = true,
  hoverGlow = true,
  iconGlow = false,
  className = '',
}) {
  // Sizing definitions
  const sizeMap = {
    xs: { icon: 20, text: 'text-sm', tag: 'text-[8px]', spacing: 'gap-1.5' },
    sm: { icon: 28, text: 'text-lg', tag: 'text-[9px]', spacing: 'gap-2' },
    md: { icon: 40, text: 'text-2xl', tag: 'text-[10px]', spacing: 'gap-3' },
    lg: { icon: 52, text: 'text-3xl', tag: 'text-[12px]', spacing: 'gap-3.5' },
    xl: { icon: 68, text: 'text-4xl', tag: 'text-[14px]', spacing: 'gap-4' },
    '2xl': { icon: 88, text: 'text-5xl', tag: 'text-[16px]', spacing: 'gap-5' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const content = (
    <div
      className={`flex ${
        layout === 'vertical' ? 'flex-col items-center text-center' : 'items-center text-left'
      } ${currentSize.spacing} ${className}`}
    >
      <LogoIcon size={currentSize.icon} glow={iconGlow} />
      
      <div className="flex flex-col">
        <h1 className={`${currentSize.text} font-black tracking-tighter leading-none flex items-center`}>
          <span className="text-white">Gram</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF2E63] to-[#8B5CF6] drop-shadow-[0_0_8px_rgba(255,46,99,0.3)]">
            Mate
          </span>
        </h1>
        {tagline && (
          <p className={`${currentSize.tag} text-gray-500 font-bold tracking-[0.25em] uppercase mt-1.5 leading-none`}>
            Watch. Create. Earn.
          </p>
        )}
      </div>
    </div>
  );

  if (hoverGlow) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="cursor-pointer inline-block"
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

Logo.propTypes = {
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', '2xl']),
  layout: PropTypes.oneOf(['horizontal', 'vertical']),
  tagline: PropTypes.bool,
  hoverGlow: PropTypes.bool,
  iconGlow: PropTypes.bool,
  className: PropTypes.string,
};
