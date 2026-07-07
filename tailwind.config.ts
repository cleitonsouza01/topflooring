import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bone: '#F0EBE0',
        plaster: '#F7F3EA',
        navy: '#1B3A5B',
        navyd: '#132C46',
        ochre: '#D98A2B',
        ochred: '#C47C1E', // button hover bg — ≥4.5:1 with ink text
        ochrelt: '#EAA64D', // ochre accent TEXT on dark navy/ink — ≥4.5:1
        clay: '#9C5510', // ochre-family TEXT on light bone/plaster — ≥4.5:1
        ink: '#20201C',
        sage: '#5E664B', // darkened for legible small text on bone
      },
      fontFamily: {
        display: ['var(--font-space-grotesk)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        tile: '0 18px 40px -20px rgba(19,44,70,0.55)',
      },
    },
  },
  plugins: [],
};

export default config;
