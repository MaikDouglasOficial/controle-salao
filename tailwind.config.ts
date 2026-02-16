import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      // Breakpoints customizados para melhor responsividade
      screens: {
        'xs': '475px',  // Extra small devices (celulares muito pequenos)
      },
      // Sistema de Cores — identidade salão (âmbar/dourado)
      colors: {
        brand: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Cores Primárias (mantidas para compatibilidade)
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
        // Cores de Acento (Cinza Azulado)
        accent: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Cores de Status Padronizadas
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },
      // Sistema de Espaçamento Padronizado
      spacing: {
        '18': '4.5rem',    // 72px
        '88': '22rem',     // 352px
        '112': '28rem',    // 448px
        '128': '32rem',    // 512px
      },
      // Sistema de Raio de Borda Padronizado
      borderRadius: {
        'card': '0.75rem',     // 12px - Para cards principais
        'button': '0.5rem',    // 8px - Para botões
        'input': '0.375rem',   // 6px - Para campos de input
        'badge': '9999px',     // Totalmente arredondado para badges/status
        'filter': '0.5rem',    // 8px - Para abas de filtro
      },
      // Sistema de Sombras Padronizado
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'floating': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'button': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'button-hover': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'filter': '0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
      },
      // Sistema de Tipografia Padronizado
      fontSize: {
        'page-title': ['2.25rem', { lineHeight: '2.5rem', fontWeight: '700' }],     // Títulos de página
        'section-title': ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],    // Títulos de seção
        'card-title': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '600' }],  // Títulos de cards
        'body': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],             // Texto padrão
        'body-sm': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],     // Texto pequeno
        'label': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '500' }],       // Labels de campos
        'caption': ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }],         // Texto muito pequeno
      },
      // Transições Padronizadas
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
      },
      // Animações Padronizadas
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
