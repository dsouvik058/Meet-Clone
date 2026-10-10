/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        meet: {
          dark: '#202124',        // Deep canvas background
          surface: '#292a2d',     // Floating panels, popups, drawers
          tile: '#3c4043',        // Inactive video tile, control button bg
          hover: '#43474b',       // Control button hover
          active: '#5f6368',      // Active toggled background
          border: '#5f6368',      // Thin borders & dividers
          text: {
            primary: '#e8eaed',   // High-contrast primary text
            secondary: '#9aa0a6', // Subtitles & timestamp text
            muted: '#80868b',     // Form labels & disabled indicators
          },
          blue: {
            DEFAULT: '#8ab4f8',   // Google blue accent
            hover: '#aecbfa',
            dark: '#1a73e8',
          },
          red: {
            DEFAULT: '#ea4335',   // End call, mic muted, camera off
            hover: '#d93025',
          },
          green: {
            DEFAULT: '#34a853',   // Active speaker indicator, connected
            glow: 'rgba(52, 168, 83, 0.4)',
          },
          yellow: {
            DEFAULT: '#fbbc04',   // Raised hand, warning
          },
        },
      },
      fontFamily: {
        sans: [
          '"Google Sans"',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        'meet-bar': '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 4px 8px 3px rgba(0, 0, 0, 0.15)',
        'meet-speaker': '0 0 0 3px #34a853, 0 0 16px rgba(52, 168, 83, 0.5)',
        'meet-modal': '0 12px 28px 0 rgba(0, 0, 0, 0.4), 0 2px 4px 0 rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [],
};
