/**
 * GramMate Design Tokens
 * Central reference for the design system values.
 * CSS variables in index.css are the runtime source of truth;
 * these tokens provide JS-accessible references for components
 * that need programmatic color/style values.
 */

export const colors = {
  brand: {
    DEFAULT: '#7C3AED',
    light: '#8B5CF6',
    dark: '#6D28D9',
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6D28D9',
    900: '#4C1D95',
  },
  accent: {
    DEFAULT: '#06B6D4',
    light: '#22D3EE',
    dark: '#0891B2',
    50: '#ECFEFF',
    100: '#CFFAFE',
    500: '#06B6D4',
    600: '#0891B2',
    700: '#0E7490',
  },
  success: {
    DEFAULT: '#10B981',
    light: '#34D399',
    dark: '#059669',
  },
  warning: {
    DEFAULT: '#F59E0B',
    light: '#FBBF24',
    dark: '#D97706',
  },
  danger: {
    DEFAULT: '#F43F5E',
    light: '#FB7185',
    dark: '#E11D48',
  },
  dark: {
    bg: '#0B0B1A',
    bgAlt: '#0F0F23',
    surface: '#141428',
    surfaceElevated: '#1A1A35',
    text: '#F0F0F8',
    textSecondary: '#8B8BA3',
    textTertiary: '#5B5B73',
  },
  light: {
    bg: '#F8F8FC',
    bgAlt: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceElevated: '#F3F3FA',
    text: '#1A1A2E',
    textSecondary: '#64648C',
    textTertiary: '#9898B0',
  },
};

export const gradients = {
  brand: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
  brandSubtle: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.15))',
  hero: 'linear-gradient(135deg, #0B0B1A 0%, #1A0A3E 50%, #0B1A2E 100%)',
  surface: 'linear-gradient(180deg, #141428, #0B0B1A)',
};

export const shadows = {
  soft: '0 4px 24px -4px rgba(0, 0, 0, 0.12)',
  elevated: '0 12px 40px -8px rgba(0, 0, 0, 0.2)',
  glowBrand: '0 0 20px -4px rgba(124, 58, 237, 0.4)',
  glowAccent: '0 0 20px -4px rgba(6, 182, 212, 0.4)',
};

export const radius = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.25rem',
  full: '9999px',
};

export const spacing = {
  page: {
    x: 'px-4 sm:px-6 lg:px-8',
    y: 'py-8',
    maxWidth: 'max-w-7xl mx-auto',
  },
};

export const transitions = {
  fast: '150ms ease',
  normal: '250ms ease',
  slow: '400ms ease',
  spring: '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
};

export const typography = {
  fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  display: { size: '3.5rem', weight: 800, lineHeight: 1.05, letterSpacing: '-0.02em' },
  h1: { size: '2.25rem', weight: 700, lineHeight: 1.15, letterSpacing: '-0.015em' },
  h2: { size: '1.5rem', weight: 700, lineHeight: 1.25, letterSpacing: '-0.01em' },
  h3: { size: '1.125rem', weight: 600, lineHeight: 1.35 },
  body: { size: '0.9375rem', weight: 400, lineHeight: 1.6 },
  caption: { size: '0.75rem', weight: 500, lineHeight: 1.5 },
  overline: { size: '0.6875rem', weight: 700, lineHeight: 1.4, letterSpacing: '0.1em' },
};

const tokens = { colors, gradients, shadows, radius, spacing, transitions, typography };
export default tokens;
