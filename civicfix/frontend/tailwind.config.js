/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f2f5fa',
          100: '#e3e9f3',
          200: '#c4d0e3',
          300: '#94a7c7',
          400: '#5f78a3',
          500: '#3d5683',
          600: '#2c426b',
          700: '#213456',
          800: '#172745',
          900: '#0f1d36',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 29, 54, 0.04), 0 4px 16px rgba(15, 29, 54, 0.06)',
        lift: '0 2px 4px rgba(15, 29, 54, 0.06), 0 12px 28px rgba(15, 29, 54, 0.10)',
      },
    },
  },
  plugins: [],
}
