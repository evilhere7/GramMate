import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import Logo from './Logo';

const LOADING_MESSAGES = [
  'Checking your session...',
  'Loading creator tools...',
  'Syncing wallet ledger...',
  'Preparing reward controls...',
  'Opening GramMate...',
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
    ? 'fixed inset-0 z-[9999] flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-white'
    : overlay
      ? 'absolute inset-0 z-[90] flex h-full w-full flex-col items-center justify-center bg-white/90 backdrop-blur'
      : 'flex w-full flex-col items-center justify-center py-12';

  return (
    <div className={containerClasses}>
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          animate={{ opacity: [0.92, 1, 0.92] }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="mb-8"
        >
          <Logo size={fullScreen ? 'xl' : 'lg'} layout="vertical" tagline={false} hoverGlow={false} />
        </motion.div>

        <div className="mt-4 flex max-w-xs flex-col items-center text-center">
          <motion.span
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-4 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 md:text-xs"
          >
            Watch. Create. Earn.
          </motion.span>

          <div className="relative mb-4 h-1 w-48 overflow-hidden rounded-full bg-slate-200">
            <motion.div
              animate={{ left: ['-100%', '100%'] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute bottom-0 top-0 w-1/2 rounded-full bg-blue-600"
            />
          </div>

          <motion.p
            key={displayMessage}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 0.8, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            className="text-xs font-medium tracking-wide text-slate-500"
          >
            {displayMessage}
          </motion.p>
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
