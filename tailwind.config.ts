import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      // ── Platform Design Tokens ───────────────────────────────────────────
      colors: {
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          900: '#1E3A5F',
        },
        // ── BMI Category Colors (WCAG AA compliant) ──────────────────────
        // CR-01: Category colors must ONLY be used as backgrounds.
        // Text on these backgrounds uses semantic text tokens below.
        // Do NOT use these as text colors — they fail contrast.
        category: {
          underweight: '#EFF6FF',       // blue-50 background
          normal: '#F0FDF4',            // green-50 background
          overweight: '#FFFBEB',        // amber-50 background
          obese1: '#FFF7ED',            // orange-50 background
          obese2: '#FEF2F2',            // red-50 background
          obese3: '#4B0082',            // deep purple (text: white)
        },
        // ── Category Badge Colors (text + background pairs, WCAG AA) ─────
        // These pairs are tested to meet 4.5:1 contrast ratio.
        badge: {
          underweight: { bg: '#1E40AF', text: '#FFFFFF' },  // blue-800 + white: 7.0:1 ✓
          normal: { bg: '#166534', text: '#FFFFFF' },        // green-800 + white: 7.3:1 ✓
          overweight: { bg: '#92400E', text: '#FFFFFF' },    // amber-800 + white: 6.1:1 ✓
          obese1: { bg: '#9A3412', text: '#FFFFFF' },        // orange-800 + white: 6.6:1 ✓
          obese2: { bg: '#991B1B', text: '#FFFFFF' },        // red-800 + white: 7.0:1 ✓
          obese3: { bg: '#581C87', text: '#FFFFFF' },        // purple-900 + white: 10.4:1 ✓
        },
        // ── Semantic Text Colors ──────────────────────────────────────────
        content: {
          primary: '#0F172A',     // slate-900: 16.0:1 on white ✓
          secondary: '#475569',   // slate-600: 5.9:1 on white ✓
          tertiary: '#94A3B8',    // slate-400: do not use for body text
          inverse: '#F8FAFC',     // on dark backgrounds
          link: '#2563EB',        // blue-600: 4.6:1 on white ✓
          error: '#991B1B',       // red-800: 7.0:1 on white ✓
          success: '#166534',     // green-800: 7.3:1 on white ✓
          warning: '#92400E',     // amber-800: 6.1:1 on white ✓
        },
        // ── Surface Colors ────────────────────────────────────────────────
        surface: {
          page: '#FFFFFF',
          card: '#F8FAFC',        // slate-50
          elevated: '#FFFFFF',
          input: '#FFFFFF',
          disabled: '#F1F5F9',    // slate-100
        },
        // ── Border Colors ─────────────────────────────────────────────────
        border: {
          default: '#E2E8F0',     // slate-200
          focus: '#2563EB',       // blue-600 — 3:1 against surface ✓
          error: '#DC2626',       // red-600
          hover: '#CBD5E1',       // slate-300
        },
        // ── Accent Colors ─────────────────────────────────────────────────
        accent: {
          primary: '#2563EB',
          'primary-hover': '#1D4ED8',
        },
      },
      // ── Typography ───────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      // ── Focus Ring (WCAG 2.4.11) ─────────────────────────────────────────
      ringColor: {
        DEFAULT: '#2563EB',
        offset: '#FFFFFF',
      },
      // ── Spacing ───────────────────────────────────────────────────────────
      // Minimum touch target: 44×44px (WCAG 2.5.5)
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
}

export default config
