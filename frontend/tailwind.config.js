/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0f766e',
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        navy: {
          700: '#15325b',
          800: '#0f2644',
          900: '#0b1e36',
          950: '#071526',
        },
        cyan: {
          DEFAULT: '#0284c7',
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        secondary: '#0369a1',
        accent: '#f97316',
        ink: '#0f172a',
        mist: '#f8fafc',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Sora', 'Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'clinical': '0 4px 24px -4px rgba(15, 23, 42, 0.06), 0 2px 6px -2px rgba(15, 23, 42, 0.04)',
        'clinical-hover': '0 12px 32px -4px rgba(13, 148, 136, 0.15), 0 4px 12px -2px rgba(15, 23, 42, 0.06)',
        'glow-teal': '0 0 24px -2px rgba(20, 184, 166, 0.35)',
        'glow-cyan': '0 0 24px -2px rgba(14, 165, 233, 0.35)',
      },
    },
  },
  plugins: [],
}
