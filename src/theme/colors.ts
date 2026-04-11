// i-spy Color System
// Designed for accessibility with high contrast ratios for visually impaired users

export const colors = {
  // Primary brand colors
  primary: '#6366F1',      // Indigo - main accent
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',

  // Status colors with high contrast
  success: '#10B981',      // Emerald
  successLight: '#34D399',
  warning: '#F59E0B',      // Amber
  warningLight: '#FBBF24',
  error: '#EF4444',        // Red
  errorLight: '#F87171',

  // Neumorphic base colors (dark theme for better accessibility)
  background: '#1A1B23',   // Deep dark
  surface: '#22232D',      // Slightly lighter
  surfaceLight: '#2A2B37', // Card surfaces
  surfaceDark: '#15161D',  // Shadows

  // Text colors with high contrast
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',

  // Accent gradients
  gradientStart: '#6366F1',
  gradientMid: '#8B5CF6',
  gradientEnd: '#A855F7',

  // Connection status
  connected: '#10B981',
  disconnected: '#EF4444',
  connecting: '#F59E0B',

  // Session states
  sessionActive: '#22C55E',
  sessionPaused: '#F59E0B',
  sessionEnded: '#6B7280',
} as const;

// Neumorphic shadow values
export const neumorphic = {
  // Light source from top-left
  shadowLight: 'rgba(255, 255, 255, 0.05)',
  shadowDark: 'rgba(0, 0, 0, 0.5)',

  // Inset shadows for pressed states
  insetLight: 'rgba(255, 255, 255, 0.02)',
  insetDark: 'rgba(0, 0, 0, 0.3)',

  // Glow effects for active elements
  glowPrimary: 'rgba(99, 102, 241, 0.4)',
  glowSuccess: 'rgba(16, 185, 129, 0.4)',
  glowError: 'rgba(239, 68, 68, 0.4)',
} as const;

export type ColorName = keyof typeof colors;
