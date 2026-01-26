/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'space-dark': '#000814',
        'space-blue': '#001d3d',
        'neon-cyan': '#00d9ff',
        'neon-purple': '#8b00ff',
        'neon-red': '#ff0844',
        'neon-orange': '#ff6b35',
        'neon-green': '#00ff88',
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce': 'bounce 1s infinite',
        'spin': 'spin 1s linear infinite',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 217, 255, 0.5)',
        'glow-purple': '0 0 20px rgba(139, 0, 255, 0.5)',
        'glow-red': '0 0 20px rgba(255, 8, 68, 0.5)',
      }
    },
  },
  plugins: [],
}