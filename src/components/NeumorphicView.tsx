import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { colors, neumorphic, borderRadius, spacing } from '../theme';

interface NeumorphicViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'raised' | 'inset' | 'flat';
  intensity?: 'light' | 'medium' | 'strong';
}

export const NeumorphicView: React.FC<NeumorphicViewProps> = ({
  children,
  style,
  variant = 'raised',
  intensity = 'medium',
}) => {
  const getIntensityMultiplier = () => {
    switch (intensity) {
      case 'light': return 0.5;
      case 'strong': return 1.5;
      default: return 1;
    }
  };

  const multiplier = getIntensityMultiplier();

  const variantStyles: ViewStyle = variant === 'raised'
    ? {
        shadowColor: '#000',
        shadowOffset: { width: 6 * multiplier, height: 6 * multiplier },
        shadowOpacity: 0.5 * multiplier,
        shadowRadius: 12 * multiplier,
        elevation: 8 * multiplier,
      }
    : variant === 'inset'
    ? {
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
      }
    : {};

  return (
    <View style={[styles.base, variantStyles, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
});
