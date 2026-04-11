import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  View,
  Text,
  AccessibilityInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, borderRadius, spacing, fontSizes, touchTargets } from '../theme';
import type { VoiceState } from '../types';

interface VoiceButtonProps {
  state: VoiceState;
  onPress: () => void;
  onLongPress?: () => void;
  size?: number;
  disabled?: boolean;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  state,
  onPress,
  onLongPress,
  size = 120,
  disabled = false,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state === 'listening') {
      // Pulsing animation for listening state
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else if (state === 'processing') {
      // Spinning animation for processing
      pulseAnim.setValue(1);
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      ).start();
    } else if (state === 'speaking') {
      // Gentle pulse for speaking
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.timing(glowAnim, {
        toValue: 0.6,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      // Reset animations
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }

    return () => {
      pulseAnim.stopAnimation();
      rotateAnim.stopAnimation();
    };
  }, [state]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onPress();
  };

  const handleLongPress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onLongPress?.();
  };

  const getStateConfig = () => {
    switch (state) {
      case 'listening':
        return {
          icon: 'mic' as const,
          color: colors.error,
          label: 'Listening...',
          hint: 'Speak now. Tap to stop.',
        };
      case 'processing':
        return {
          icon: 'sync' as const,
          color: colors.warning,
          label: 'Processing...',
          hint: 'Please wait.',
        };
      case 'speaking':
        return {
          icon: 'volume-high' as const,
          color: colors.success,
          label: 'Speaking...',
          hint: 'Tap to interrupt.',
        };
      default:
        return {
          icon: 'mic-outline' as const,
          color: colors.primary,
          label: 'Tap to speak',
          hint: 'Hold for continuous listening.',
        };
    }
  };

  const config = getStateConfig();
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(99, 102, 241, 0)', `${config.color}66`],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.glowRing,
          {
            width: size + 40,
            height: size + 40,
            borderRadius: (size + 40) / 2,
            backgroundColor: glowColor,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.outerRing,
          {
            width: size + 20,
            height: size + 20,
            borderRadius: (size + 20) / 2,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={handlePress}
          onLongPress={handleLongPress}
          disabled={disabled}
          delayLongPress={500}
          style={[
            styles.button,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: config.color,
            },
            disabled && styles.disabled,
          ]}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={config.label}
          accessibilityHint={config.hint}
          accessibilityState={{ disabled }}
        >
          <Animated.View
            style={{
              transform: state === 'processing' ? [{ rotate: spin }] : [],
            }}
          >
            <Ionicons
              name={config.icon}
              size={size * 0.4}
              color={colors.textPrimary}
            />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
      <Text style={styles.label} accessibilityElementsHidden>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
  },
  outerRing: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: fontSizes.md,
  },
});
