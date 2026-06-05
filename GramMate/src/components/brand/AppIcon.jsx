import PropTypes from 'prop-types';
import { LogoIcon } from './Logo';

export default function AppIcon({
  size = 'md',
  variant = 'square',
  interactive = true,
  className = '',
}) {
  const containerSizeMap = {
    xs: 'w-8 h-8 rounded-md p-1',
    sm: 'w-10 h-10 rounded-md p-1.5',
    md: 'w-16 h-16 rounded-lg p-2.5',
    lg: 'w-24 h-24 rounded-lg p-4',
    xl: 'w-32 h-32 rounded-lg p-5',
    '2xl': 'w-48 h-48 rounded-lg p-8',
  };

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
  const shape = variant === 'circle' || variant === 'badge' ? 'rounded-full' : 'rounded-lg';
  const surface = variant === 'plain' ? 'flex items-center justify-center' : `${shape} flex items-center justify-center border border-slate-200 bg-white`;

  return (
    <div className={`${containerSize} ${surface} ${interactive ? 'transition-transform hover:-translate-y-0.5' : ''} ${className}`}>
      <LogoIcon size={iconSize} className="h-full w-full object-contain" />
    </div>
  );
}

AppIcon.propTypes = {
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', '2xl']),
  variant: PropTypes.oneOf(['plain', 'square', 'circle', 'badge']),
  interactive: PropTypes.bool,
  className: PropTypes.string,
};
