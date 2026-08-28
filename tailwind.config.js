/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // cora family palette — the main surface
        ground: '#232120',
        panel: '#2b2826',
        surface: '#302c29',
        ink: '#e4dfd5',
        amber: '#e0b25a',
        'amber-soft': '#c99a45',
        alert: '#b87952',
        // WAR GAMES easter egg only (JoshuaTerminal + games)
        'terminal-green': '#80ff96',
        'terminal-amber': '#ffbd66',
        'terminal-bg': '#020603',
      },
      fontFamily: {
        serif: ['var(--font-fraunces)', 'ui-serif', 'Georgia', 'serif'],
        sans: ['var(--font-ibm-plex)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flicker': 'flicker 0.15s infinite',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
