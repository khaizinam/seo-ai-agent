/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      colors: {
        brand: {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          accent: '#06b6d4',
        },
        surface: {
          0: '#0a0f1e',
          1: '#0f172a',
          2: '#1e293b',
          3: '#273247',
        },
      },
      borderRadius: {
        DEFAULT: '10px',
      },
    },
  },
  plugins: [],
}
