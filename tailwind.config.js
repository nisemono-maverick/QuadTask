/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Theme-aware CSS variables (RGB format supports opacity modifiers)
        'bg-primary': 'rgb(var(--bg-primary-rgb) / <alpha-value>)',
        'bg-secondary': 'rgb(var(--bg-secondary-rgb) / <alpha-value>)',
        'bg-tertiary': 'rgb(var(--bg-tertiary-rgb) / <alpha-value>)',
        'bg-hover': 'rgb(var(--bg-hover-rgb) / <alpha-value>)',
        'text-primary': 'rgb(var(--text-primary-rgb) / <alpha-value>)',
        'text-secondary': 'rgb(var(--text-secondary-rgb) / <alpha-value>)',
        'text-tertiary': 'rgb(var(--text-tertiary-rgb) / <alpha-value>)',
        'border-default': 'rgb(var(--border-default-rgb) / <alpha-value>)',
        'border-focus': 'rgb(var(--border-focus-rgb) / <alpha-value>)',
        'primary': 'rgb(var(--primary-rgb) / <alpha-value>)',
        'primary-hover': 'rgb(var(--primary-hover-rgb) / <alpha-value>)',
        'primary-light': 'rgb(var(--primary-light-rgb) / <alpha-value>)',
        'danger': 'rgb(var(--danger-rgb) / <alpha-value>)',
        'success': 'rgb(var(--success-rgb) / <alpha-value>)',
        'warning': 'rgb(var(--warning-rgb) / <alpha-value>)',
        // Quadrant colors
        'q1-bg': 'rgb(var(--q1-bg-rgb) / <alpha-value>)',
        'q1-border': 'rgb(var(--q1-border-rgb) / <alpha-value>)',
        'q2-bg': 'rgb(var(--q2-bg-rgb) / <alpha-value>)',
        'q2-border': 'rgb(var(--q2-border-rgb) / <alpha-value>)',
        'q3-bg': 'rgb(var(--q3-bg-rgb) / <alpha-value>)',
        'q3-border': 'rgb(var(--q3-border-rgb) / <alpha-value>)',
        'q4-bg': 'rgb(var(--q4-bg-rgb) / <alpha-value>)',
        'q4-border': 'rgb(var(--q4-border-rgb) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', 'sans-serif'],
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'md': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
}
