/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF2E63',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#08D9D6',
          foreground: '#09090b',
        },
        background: '#09090b',
        foreground: '#fafafa',
        muted: {
          DEFAULT: '#27272a',
          foreground: '#a1a1aa',
        },
        accent: {
          DEFAULT: '#1f1f22',
          foreground: '#fafafa',
        },
        card: {
          DEFAULT: '#121216',
          foreground: '#fafafa',
        },
        border: '#27272a',
      },
    },
  },
  plugins: [],
};
