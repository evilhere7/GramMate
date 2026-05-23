/**
 * GramMate Design System Tokens
 * Production-grade design tokens for all UI surfaces
 */

export const COLORS = {
  // Primary dark palette
  primary: {
    950: '#05070F', // Darkest
    900: '#0B0F1A',
    800: '#1E2637',
    700: '#2A3447',
    600: '#364258',
    500: '#42506E',
  },
  
  // Accent colors
  accent: {
    purple: '#8E48FF',
    purple_light: '#A966FF',
    purple_dark: '#7A3FE6',
    blue: '#36D0FF',
    blue_light: '#52DCFF',
    blue_dark: '#2BADCC',
    pink: '#FF5ACD',
    pink_light: '#FF7CE0',
    pink_dark: '#E63FA8',
    green: '#2BD48A',
    green_light: '#4CDFA0',
    green_dark: '#1EB370',
  },

  // Semantic colors
  success: '#2BD48A',
  warning: '#FFB85B',
  error: '#FF4D6D',
  info: '#36D0FF',

  // Neutrals
  neutral: {
    white: '#F8FAFF',
    gray_50: '#F3F5FB',
    gray_100: '#E8ECFA',
    gray_200: '#D4DBF0',
    gray_300: '#B8C3E0',
    gray_400: '#96A8CC',
    gray_500: '#7A8FB8',
    gray_600: '#5E78A0',
    gray_700: '#4A5F8C',
    gray_800: '#364878',
    black: '#0B0F1A',
  },

  // Glass/transparency
  glass: {
    light: 'rgba(255, 255, 255, 0.08)',
    lighter: 'rgba(255, 255, 255, 0.12)',
    lightest: 'rgba(255, 255, 255, 0.16)',
  },
};

export const TYPOGRAPHY = {
  // Font families
  family: {
    display: '"Inter", "Satoshi", -apple-system, BlinkMacSystemFont, sans-serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
  },

  // Font sizes and line heights
  scale: {
    xs: { size: '12px', lineHeight: '18px', weight: 400 },
    sm: { size: '14px', lineHeight: '20px', weight: 400 },
    base: { size: '16px', lineHeight: '24px', weight: 400 },
    lg: { size: '18px', lineHeight: '28px', weight: 400 },
    xl: { size: '20px', lineHeight: '30px', weight: 500 },
    '2xl': { size: '24px', lineHeight: '32px', weight: 500 },
    '3xl': { size: '32px', lineHeight: '40px', weight: 600 },
    '4xl': { size: '48px', lineHeight: '56px', weight: 700 },
    '5xl': { size: '72px', lineHeight: '80px', weight: 700 },
  },

  // Named styles
  caption: { size: '12px', lineHeight: '18px', weight: 400 },
  small: { size: '14px', lineHeight: '20px', weight: 400 },
  body: { size: '16px', lineHeight: '24px', weight: 400 },
  body_strong: { size: '16px', lineHeight: '24px', weight: 600 },
  title: { size: '24px', lineHeight: '32px', weight: 600 },
  headline: { size: '32px', lineHeight: '40px', weight: 700 },
  display: { size: '48px', lineHeight: '56px', weight: 700 },
};

export const SPACING = {
  // Base unit system (8px)
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '40px',
  '3xl': '48px',
  '4xl': '64px',
  '5xl': '80px',
  '6xl': '96px',
};

export const BORDER_RADIUS = {
  none: '0px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  full: '9999px',
};

export const SHADOWS = {
  xs: '0 2px 4px rgba(0, 0, 0, 0.08)',
  sm: '0 4px 12px rgba(0, 0, 0, 0.12)',
  md: '0 8px 24px rgba(0, 0, 0, 0.16)',
  lg: '0 16px 48px rgba(0, 0, 0, 0.24)',
  xl: '0 22px 80px rgba(0, 0, 0, 0.35)',
  '2xl': '0 32px 120px rgba(0, 0, 0, 0.4)',
  // Glow effects
  glow_purple: '0 0 20px rgba(142, 72, 255, 0.3)',
  glow_blue: '0 0 20px rgba(54, 208, 255, 0.3)',
  glow_pink: '0 0 20px rgba(255, 90, 205, 0.3)',
  glow_green: '0 0 20px rgba(43, 212, 138, 0.3)',
};

export const MOTION = {
  // Easing functions
  easing: {
    standard: 'cubic-bezier(0.16, 1, 0.3, 1)',
    enter: 'cubic-bezier(0.4, 0, 0.2, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  },

  // Duration in ms
  duration: {
    fast: 100,
    micro: 150,
    normal: 300,
    large: 500,
    xlarge: 700,
  },

  // Common transitions
  transition: (duration = 300) => `all ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
};

export const BREAKPOINTS = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const Z_INDEX = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  offcanvas: 1040,
  modal_backdrop: 1050,
  modal: 1060,
  popover: 1070,
  tooltip: 1080,
  notification: 1090,
};

export const GLASS_MORPHISM = {
  light: {
    background: 'rgba(11, 15, 26, 0.7)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
  },
  medium: {
    background: 'rgba(11, 15, 26, 0.8)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.14)',
  },
  heavy: {
    background: 'rgba(11, 15, 26, 0.9)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.16)',
  },
};

export const BUTTON_SIZES = {
  xs: {
    padding: '6px 12px',
    fontSize: '12px',
    height: '28px',
  },
  sm: {
    padding: '8px 16px',
    fontSize: '14px',
    height: '32px',
  },
  md: {
    padding: '10px 20px',
    fontSize: '14px',
    height: '40px',
  },
  lg: {
    padding: '12px 28px',
    fontSize: '16px',
    height: '48px',
  },
  xl: {
    padding: '14px 32px',
    fontSize: '18px',
    height: '56px',
  },
};

export const INPUT_SIZES = {
  sm: {
    padding: '8px 12px',
    fontSize: '14px',
    height: '32px',
  },
  md: {
    padding: '10px 16px',
    fontSize: '14px',
    height: '40px',
  },
  lg: {
    padding: '12px 20px',
    fontSize: '16px',
    height: '48px',
  },
};
