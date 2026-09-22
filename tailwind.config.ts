import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",

        // Landing redesign tokens (docs/design/landing-redesign/README.md).
        ink: { DEFAULT: '#0b1220', 2: '#1a1f2b', 3: '#111a2c' },
        paper: { DEFAULT: '#f7f4ee', 2: '#efe9df', 3: '#f3efe7' },
        line: { DEFAULT: '#e2dccf', 2: '#d9d2c5', 3: '#eee8dc' },
        muted: { DEFAULT: '#6b7280', dark: '#a3adc2', body: '#4b5563' },

        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // 400/500/600 kept at their old values so existing admin and detail
        // pages are untouched; the redesign uses the named tokens below.
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          accent: '#f2b544',
          hover: '#ffc95c',
          deep: '#d97706',
          text: '#b4791b',
          side: '#c98a1c',
          window: '#ffd27a',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
        display: ['var(--font-instrument-serif)', 'Georgia', 'serif'],
      },
      borderRadius: {
        card: '22px',
        panel: '28px',
        bar: '20px',
      },
      boxShadow: {
        card: '0 1px 0 rgba(0,0,0,.04), 0 20px 40px -24px rgba(26,31,43,.25)',
        'card-hover': '0 1px 0 rgba(0,0,0,.04), 0 30px 50px -22px rgba(26,31,43,.4)',
        bar: '0 30px 60px -20px rgba(0,0,0,.5)',
        scene: '0 40px 80px -30px rgba(0,0,0,.7), inset 0 0 0 1px rgba(255,255,255,.08)',
        drawer: '-30px 0 60px -30px rgba(0,0,0,.5)',
      },
      maxWidth: {
        container: '1240px',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(.2,.7,.2,1)',
      },
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(28px)' },
          to: { opacity: '1', transform: 'none' },
        },
        twinkle: {
          '0%,100%': { opacity: '.35' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        rise: 'rise .85s cubic-bezier(.2,.7,.2,1) both',
        twinkle: 'twinkle 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
