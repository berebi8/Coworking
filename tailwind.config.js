/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5', // Indigo
          light: '#818CF8',
          dark: '#4338CA',
        },
        teal: {
          DEFAULT: '#14B8A6',
          light: '#99F6E4',
          dark: '#0D9488',
        },
        coral: {
          DEFAULT: '#F43F5E',
          light: '#FDA4AF',
          dark: '#E11D48',
        },
        purple: {
          DEFAULT: '#8B5CF6',
          light: '#C4B5FD',
          dark: '#7C3AED',
        },
        accent: {
          blue: '#EEF2FF',   // Light blue for hover states
          mint: '#F0FDFA',   // Mint green background
          coral: '#FFF1F2',  // Light coral for danger states
          purple: '#F5F3FF', // Light purple for special states
        },
        background: {
          light: '#FAFAFA',    // Very light gray
          card: '#FFFFFF',     // Pure white
          muted: '#F3F4F6',    // Light gray for muted sections
        },
        text: {
          primary: '#111827',   // Almost black
          secondary: '#4B5563', // Medium gray
          muted: '#9CA3AF',    // Light gray
        },
        border: {
          light: '#E5E7EB',    // Light gray for borders
          focus: '#E0E7FF',    // Light indigo for focus states
        },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'dropdown': '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', '-apple-system', 'sans-serif'],
        numeric: ['Inter var', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
