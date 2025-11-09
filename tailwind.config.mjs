/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './supabase/**/*.{js,ts,jsx,tsx,mdx}',
    './tools/**/*.{js,ts,jsx,tsx,mdx}',
    './scripts/**/*.{js,ts,tsx,tsx}',
    './middleware.ts',
    './next.config.mjs',
  ],
  theme: {
    extend: {
      colors: {
        /* 既存HSLカラー（後方互換性） */
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        
        /* 新規OKLCHカラー（フォールバック付き） */
        'um-blue': {
          DEFAULT: 'var(--um-blue-fallback)',
          oklch: 'var(--um-blue)',
        },
        'um-violet': {
          DEFAULT: 'var(--um-violet-fallback)',
          oklch: 'var(--um-violet)',
        },
        'um-sun': {
          DEFAULT: 'var(--um-sun-fallback)',
          oklch: 'var(--um-sun)',
        },
        ink: {
          DEFAULT: 'var(--ink-fallback)',
          oklch: 'var(--ink)',
        },
        'bg-0': {
          DEFAULT: 'var(--bg-0-fallback)',
          oklch: 'var(--bg-0)',
        },
        'bg-1': {
          DEFAULT: 'var(--bg-1-fallback)',
          oklch: 'var(--bg-1)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        /* 新規半径スケール */
        'um-sm': 'var(--radius-sm)',
        'um-md': 'var(--radius-md)',
        'um-lg': 'var(--radius-lg)',
        'um-xl': 'var(--radius-xl)',
      },
      boxShadow: {
        'elev-0': 'var(--elev-0)',
        'elev-1': 'var(--elev-1)',
        'elev-2': 'var(--elev-2)',
        'elev-3': 'var(--elev-3)',
        'elev-4': 'var(--elev-4)',
      },
      backdropBlur: {
        'glass': '12px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config

