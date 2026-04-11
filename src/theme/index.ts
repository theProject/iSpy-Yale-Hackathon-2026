export * from './colors';
export * from './spacing';
export * from './typography';

import { colors, neumorphic } from './colors';
import { spacing, borderRadius, touchTargets } from './spacing';
import { fontSizes, fontWeights, lineHeights, textStyles } from './typography';

export const theme = {
  colors,
  neumorphic,
  spacing,
  borderRadius,
  touchTargets,
  fontSizes,
  fontWeights,
  lineHeights,
  textStyles,
} as const;

export type Theme = typeof theme;
