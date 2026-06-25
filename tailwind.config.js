/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light mode primitives
        'bg-primary': '#FFFFFF',
        'bg-secondary': '#F9FAFB',
        'bg-tertiary': '#F3F4F6',
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
        'text-tertiary': '#9CA3AF',
        'border-default': '#E5E7EB',
        'border-focus': '#3B82F6',
        'primary': '#3B82F6',
        'primary-hover': '#2563EB',
        'primary-light': '#EFF6FF',
        'danger': '#EF4444',
        'success': '#10B981',
        'warning': '#F59E0B',
        // Quadrant colors (light)
        'q1-bg': '#FEF2F2',
        'q1-border': '#DC2626',
        'q2-bg': '#EFF6FF',
        'q2-border': '#2563EB',
        'q3-bg': '#FFFBEB',
        'q3-border': '#F59E0B',
        'q4-bg': '#F9FAFB',
        'q4-border': '#9CA3AF',
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
