import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        ink: '#10243e',
        signal: '#d71920',
        mist: '#f4f7fb',
        line: '#e4eaf1'
      },
      boxShadow: {
        soft: '0 18px 45px rgba(16, 36, 62, 0.08)'
      }
    }
  },
  plugins: []
} satisfies Config;
