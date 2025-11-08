/**
 * 🎨 ShopPet Theme System
 * Modern, Pet-friendly Design System inspired by Rover.com & WagWalking
 */

export const theme = {
  // 🎨 Color Palette - Fresh & Modern
  colors: {
    primary: {
      DEFAULT: '#2ecc71', // Fresh green
      light: '#58d68d',
      dark: '#27ae60',
      foreground: '#FFFFFF',
    },
    secondary: {
      DEFAULT: '#F6AD55', // Soft orange
      light: '#FBD38D',
      dark: '#ED8936',
      foreground: '#1A202C',
    },
    background: {
      DEFAULT: '#f8fafc', // Bright white
      card: '#FFFFFF',
      muted: '#F7FAFC',
    },
    accent: {
      DEFAULT: '#2ecc71', // Fresh green (same as primary)
      light: '#58d68d',
      dark: '#27ae60',
      foreground: '#FFFFFF',
    },
    success: '#48BB78',
    warning: '#F6AD55',
    error: '#F56565',
    muted: {
      DEFAULT: '#E2E8F0',
      foreground: '#64748B',
    },
    border: '#E2E8F0',
  },

  // 📝 Typography - Modern & Clean
  typography: {
    fontFamily: {
      sans: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      display: ['Poppins', 'sans-serif'],
      body: ['Poppins', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      xs: '0.825rem',     // 13.2px (10% larger)
      sm: '0.9625rem',    // 15.4px (10% larger)
      base: '1.1rem',     // 17.6px (10% larger)
      lg: '1.2375rem',    // 19.8px (10% larger)
      xl: '1.375rem',     // 22px (10% larger)
      '2xl': '1.65rem',   // 26.4px (10% larger)
      '3xl': '2.0625rem', // 33px (10% larger)
      '4xl': '2.475rem',  // 39.6px (10% larger)
      '5xl': '3.3rem',    // 52.8px (10% larger)
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },

  // 📏 Spacing - Consistent & Harmonious
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
    '4xl': '6rem',   // 96px
  },

  // 🔲 Border Radius - Soft & Friendly
  borderRadius: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
    '3xl': '2rem',   // 32px
    full: '9999px',
  },

  // ✨ Shadows - Soft & Elegant
  shadows: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
    sm: '0 2px 8px rgba(0, 0, 0, 0.08)',
    md: '0 4px 16px rgba(0, 0, 0, 0.1)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
    xl: '0 12px 32px rgba(0, 0, 0, 0.15)',
    glow: '0 0 24px rgba(43, 108, 176, 0.3)',
  },

  // 🎬 Animation - Smooth & Natural
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    smooth: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // 📱 Breakpoints - Mobile First
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

export type Theme = typeof theme;

// 🎨 CSS Variables Generator (for dynamic theming)
export const generateCSSVariables = () => {
  return {
    '--color-primary': theme.colors.primary.DEFAULT,
    '--color-primary-light': theme.colors.primary.light,
    '--color-primary-dark': theme.colors.primary.dark,
    '--color-secondary': theme.colors.secondary.DEFAULT,
    '--color-secondary-light': theme.colors.secondary.light,
    '--color-secondary-dark': theme.colors.secondary.dark,
    '--color-background': theme.colors.background.DEFAULT,
    '--color-background-card': theme.colors.background.card,
    '--color-accent': theme.colors.accent.DEFAULT,
    '--color-accent-light': theme.colors.accent.light,
    '--color-accent-dark': theme.colors.accent.dark,
    '--color-success': theme.colors.success,
    '--color-warning': theme.colors.warning,
    '--color-error': theme.colors.error,
  };
};
