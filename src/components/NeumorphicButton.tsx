import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  AccessibilityProps,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, borderRadius, spacing, fontSizes, fontWeights, touchTargets } from '../theme';

interface NeumorphicButtonProps extends AccessibilityProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  haptic?: boolean;
}

export const NeumorphicButton: React.FC<NeumorphicButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  haptic = true,
  ...accessibilityProps
}) => {
  const handlePress = () => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOpacity: 0.4,
          },
          text: { color: colors.textPrimary },
        };
      case 'success':
        return {
          container: {
            backgroundColor: colors.success,
            shadowColor: colors.success,
            shadowOpacity: 0.4,
          },
          text: { color: colors.textPrimary },
        };
      case 'danger':
        return {
          container: {
            backgroundColor: colors.error,
            shadowColor: colors.error,
            shadowOpacity: 0.4,
          },
          text: { color: colors.textPrimary },
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: colors.primary,
          },
          text: { color: colors.primary },
        };
      default:
        return {
          container: {
            backgroundColor: colors.surfaceLight,
            shadowColor: '#000',
            shadowOpacity: 0.3,
          },
          text: { color: colors.textPrimary },
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'small':
        return {
          container: {
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.md,
            minHeight: touchTargets.minimum,
          },
          text: { fontSize: fontSizes.sm },
        };
      case 'large':
        return {
          container: {
            paddingVertical: spacing.lg,
            paddingHorizontal: spacing.xl,
            minHeight: touchTargets.large,
          },
          text: { fontSize: fontSizes.lg },
        };
      default:
        return {
          container: {
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            minHeight: touchTargets.comfortable,
          },
          text: { fontSize: fontSizes.md },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.button,
        variantStyles.container,
        sizeStyles.container,
        disabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      {...accessibilityProps}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.text.color} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, variantStyles.text, sizeStyles.text, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
    gap: spacing.sm,
  },
  text: {
    fontWeight: fontWeights.semibold,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
