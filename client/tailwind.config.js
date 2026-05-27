/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        figma: {
          black: '#1a1a1a',
          gray: '#666666',
          light: '#f5f5f5',
          border: '#e5e5e5',
          'card-shadow': 'rgba(0,0,0,0.06)',
        },
        accent: {
          pink: '#ff00a0',
          purple: '#7c3aed',
        },
      },
      maxWidth: {
        'content': '1200px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 30px rgba(0,0,0,0.12)',
      },
      borderRadius: {
        'figma': '12px',
      },
    },
  },
  plugins: [],
};
