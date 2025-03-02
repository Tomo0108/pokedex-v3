/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pokedex: 'var(--pokedex-color)',
        loading: 'var(--loading-color)',
        border: 'var(--border-dark)',
        'bg-dark': 'var(--bg-dark)',
        'bg-darker': 'var(--bg-darker)',
        'bg-screen': 'var(--bg-screen)',
        'text-dark': 'var(--text-dark)',
      },
      boxShadow: {
        inset: 'var(--shadow-inset)',
        'inset-reverse': 'var(--shadow-inset-reverse)',
      },
    },
  },
  plugins: [],
}
