/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0D1117',
        surface: {
          DEFAULT: '#161B22',
          subtle: '#0D1117',
          elevated: '#21262D',
          hover: '#30363D',
        },
        border: {
          DEFAULT: '#30363D',
          subtle: '#21262D',
          focus: '#58A6FF',
        },
        text: {
          primary: '#F0F6FC',
          secondary: '#8B949E',
          muted: '#6E7681',
        },
        water: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
        },
        status: {
          normal: '#10B981',
          low: '#F59E0B',
          critical: '#EF4444',
          offline: '#64748B',
        },
        chart: {
          1: 'var(--color-chart-1, #0284C7)',
          2: 'var(--color-chart-2, #10B981)',
          3: 'var(--color-chart-3, #F59E0B)',
          4: 'var(--color-chart-4, #8B5CF6)',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
