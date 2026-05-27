import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import Logo from './Logo';

const LOADING_MESSAGES = [
  'Initializing Secure Connection...',
  'Loading Creator Ecosystem...',
  'Connecting Smart Wallet Ledger...',
  'Syncing Decentralized Ads Server...',
  'Powering Creative Freedom...',
];

export default function SplashLogo({
  fullScreen = false,
  overlay = false,
  message = '',
}) {
  const [activeMessage, setActiveMessage] = useState(message || LOADING_MESSAGES[0]);

  useEffect(() => {
    if (message) {
      setActiveMessage(message);
      return;
    }

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
    ? 'fixed inset-0 w-screen h-screen bg-black z-[9999] flex flex-col items-center justify-center overflow-hidden'
    : overlay
    ? 'absolute inset-0 w-full h-full bg-black/85 backdrop-blur-xl z-[90] flex flex-col items-center justify-center'
    : 'w-full py-12 flex flex-col items-center justify-center';

  return (
    <div className={containerClasses}>
      {/* Decorative Rotating Glow Orbs (Only on large fullScreen / overlay modes) */}
      {(fullScreen || overlay) && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              x: [-20, 20, -20],
              y: [-10, 10, -10],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute top-[20%] left-[15%] w-80 h-80 bg-primary/20 blur-[130px] rounded-full"
          />
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              x: [20, -20, 20],
              y: [10, -10, 10],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute bottom-[20%] right-[15%] w-[35rem] h-[35rem] bg-secondary/15 blur-[160px] rounded-full"
          />
        </div>
      )}

      {/* Main Brand Assembly */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Breathing animated Logo */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            filter: [
              'drop-shadow(0 0 15px rgba(139,92,246,0.3))',
              'drop-shadow(0 0 35px rgba(255,46,99,0.6))',
              'drop-shadow(0 0 15px rgba(139,92,246,0.3))',
            ],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="mb-8"
        >
          <Logo size={fullScreen ? 'xl' : 'lg'} layout="vertical" tagline={false} hoverGlow={false} />
        </motion.div>

        {/* Dynamic Loading Text Assembly */}
        <div className="flex flex-col items-center max-w-xs text-center mt-4">
          {/* Tagline */}
          <motion.span
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-[10px] md:text-xs text-gray-500 font-black tracking-[0.35em] uppercase mb-4"
          >
            Watch • Create • Earn
          </motion.span>

          {/* Animated custom bar indicator */}
          <div className="w-48 h-1 bg-gray-900 rounded-full overflow-hidden relative mb-4">
            <motion.div
              animate={{
                left: ['-100%', '100%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-secondary to-primary rounded-full shadow-[0_0_8px_#FF2E63]"
            />
          </div>

          {/* Live Status text with smooth fade transitions */}
          <motion.p
            key={activeMessage}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 0.8, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            className="text-xs text-gray-400 font-medium tracking-wide animate-pulse"
          >
            {activeMessage}
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
