/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#111111',
        surface: '#161616',
        'surface-hover': '#1f1f1f',
        'app-bar': '#1a1a1a',
        border: '#262626',
        'mint': '#34d399',
        'badge-purple': '#e879f9',
        'badge-purple-bg': '#2e1c36',
        'badge-purple-border': '#4a285a',
        'emerald-bg': '#142920',
        'emerald-border': '#1e3f31',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
