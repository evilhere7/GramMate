import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { LogoIcon } from './Logo';

export default function AppIcon({
  size = 'md',
  variant = 'square',
  interactive = true,
  className = '',
}) {
  // Container size mapping (outer container sizes)
  const containerSizeMap = {
    xs: 'w-8 h-8 rounded-lg p-1 text-xs',
    sm: 'w-10 h-10 rounded-xl p-1.5 text-sm',
    md: 'w-16 h-16 rounded-2xl p-2.5 text-base',
    lg: 'w-24 h-24 rounded-3xl p-4 text-lg',
    xl: 'w-32 h-32 rounded-[2.2rem] p-5 text-xl',
    '2xl': 'w-48 h-48 rounded-[3.2rem] p-8 text-2xl',
  };

  // SVG inner size mapping
  const iconSizeMap = {
    xs: 18,
    sm: 24,
    md: 40,
    lg: 60,
    xl: 80,
    '2xl': 120,
  };

  const containerSize = containerSizeMap[size] || containerSizeMap.md;
  const iconSize = iconSizeMap[size] || iconSizeMap.md;

  let containerStyles = '';
  let borderElement = null;

  if (variant === 'square') {
    // Squircle launcher icon with glassmorphism + glow border
    containerStyles = 'bg-gradient-to-br from-gray-900 to-black border border-gray-800/80 backdrop-blur-xl shadow-[0_12px_30px_-6px_rgba(0,0,0,0.8),_0_0_20px_rgba(139,92,246,0.15)] flex items-center justify-center relative overflow-hidden';
    borderElement = (
      <div className="absolute inset-0 rounded-[inherit] border border-white/10 pointer-events-none bg-gradient-to-br from-white/10 to-transparent opacity-50" />
    );
  } else if (variant === 'circle') {
    // Circle avatar mode
    containerStyles = 'rounded-full bg-gradient-to-br from-gray-950 to-black border border-gray-800/60 flex items-center justify-center relative shadow-lg overflow-hidden';
    borderElement = (
      <div className="absolute inset-0 rounded-full border border-gradient-to-r from-[#08D9D6] to-[#FF2E63] opacity-30 pointer-events-none" />
    );
  } else if (variant === 'badge') {
    // Premium creator status badge with neon glow shadows
    containerStyles = 'rounded-full bg-black/80 flex items-center justify-center relative shadow-[0_0_15px_rgba(139,92,246,0.5)] border border-primary/40';
  } else {
    // Plain variant
    containerStyles = 'flex items-center justify-center';
  }

  const iconMarkup = (
    <LogoIcon size={iconSize} className="w-full h-full object-contain" />
  );

  const finalContainer = (
    <div className={`${containerSize} ${containerStyles} ${className}`}>
      {borderElement}
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        {iconMarkup}
      </div>
      {/* Decorative lighting reflection for premium squircle */}
      {variant === 'square' && (
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-white/5 to-transparent rotate-45 pointer-events-none" />
      )}
    </div>
  );

  if (interactive && variant !== 'plain') {
    return (
      <motion.div
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        className="cursor-pointer inline-block"
      >
        {finalContainer}
      </motion.div>
    );
  }

  return finalContainer;
}

AppIcon.propTypes = {
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', '2xl']),
  variant: PropTypes.oneOf(['plain', 'square', 'circle', 'badge']),
  interactive: PropTypes.bool,
  className: PropTypes.string,
};
