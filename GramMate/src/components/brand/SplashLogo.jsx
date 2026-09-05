import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import Logo from './Logo';

const LOADING_MESSAGES = [
  'Checking your session...',
  'Syncing user profile...',
  'Connecting to GramMate network...',
  'Preparing your feed...',
];

export default function SplashLogo({
  fullScreen = false,
  overlay = false,
  message = '',
}) {
  const [activeMessage, setActiveMessage] = useState(LOADING_MESSAGES[0]);
  const displayMessage = message || activeMessage;

  useEffect(() => {
    if (message) return undefined;

    const interval = setInterval(() => {
      setActiveMessage((prev) => {
        const currentIndex = LOADING_MESSAGES.indexOf(prev);
        const nextIndex = (currentIndex + 1) % LOADING_MESSAGES.length;
        return LOADING_MESSAGES[nextIndex];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [message]);

  const containerClasses = fullScreen
    ? 'fixed inset-0 z-[9999] flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-[var(--gm-bg)] text-[var(--gm-text)]'
    : overlay
      ? 'absolute inset-0 z-[90] flex h-full w-full flex-col items-center justify-center bg-[var(--gm-surface-overlay)] backdrop-blur-xs text-[var(--gm-text)]'
      : 'flex w-full flex-col items-center justify-center py-12 text-[var(--gm-text)]';

  return (
    <div className={containerClasses}>
      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-6">
          <Logo size={fullScreen ? 'lg' : 'md'} layout="vertical" tagline={false} />
        </div>

        <div className="mt-2 flex max-w-xs flex-col items-center text-center">
          <span className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gm-text-tertiary)]">
            Watch. Create. Earn.
          </span>

          <div className="relative mb-4 h-1 w-44 overflow-hidden rounded-full bg-[var(--gm-surface-elevated)] border border-[var(--gm-border)]">
            <motion.div
              animate={{ left: ['-100%', '100%'] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute bottom-0 top-0 w-1/2 rounded-full bg-[var(--gm-brand)]"
            />
          </div>

          <p className="text-xs font-medium text-[var(--gm-text-secondary)]">
            {displayMessage}
          </p>
        </div>
      </div>
    </div>
  );
}

SplashLogo.propTypes = {
  fullScreen: PropTypes.bool,
  overlay: PropTypes.bool,
  message: PropTypes.string,
};
