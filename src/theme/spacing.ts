// Spacing system - consistent rhythm throughout the app

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// Touch target sizes for accessibility (minimum 44px as per Apple HIG)
export const touchTargets = {
  minimum: 44,
  comfortable: 56,
  large: 72,
} as const;
