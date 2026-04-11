import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, fontSizes, fontWeights } from '../theme';
import type { ConnectionStatus } from '../types';

interface StatusBadgeProps {
  status: ConnectionStatus;
  deviceName?: string;
  batteryLevel?: number;
  showDetails?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  deviceName,
  batteryLevel,
  showDetails = true,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'connecting') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.5,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status]);

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          color: colors.connected,
          icon: 'checkmark-circle' as const,
          label: 'Connected',
        };
      case 'connecting':
        return {
          color: colors.connecting,
          icon: 'sync' as const,
          label: 'Connecting...',
        };
      default:
        return {
          color: colors.disconnected,
          icon: 'close-circle' as const,
          label: 'Disconnected',
        };
    }
  };

  const config = getStatusConfig();

  const getBatteryIcon = () => {
    if (!batteryLevel) return 'battery-half' as const;
    if (batteryLevel > 80) return 'battery-full' as const;
    if (batteryLevel > 50) return 'battery-half' as const;
    if (batteryLevel > 20) return 'battery-half' as const;
    return 'battery-dead' as const;
  };

  return (
    <View
      style={[styles.container, { borderColor: config.color }]}
      accessibilityRole="text"
      accessibilityLabel={`Device status: ${config.label}${deviceName ? `, ${deviceName}` : ''}${batteryLevel ? `, Battery ${batteryLevel}%` : ''}`}
    >
      <View style={styles.statusRow}>
        <Animated.View style={{ opacity: pulseAnim }}>
          <View style={[styles.dot, { backgroundColor: config.color }]} />
        </Animated.View>
        <Text style={styles.statusText}>{config.label}</Text>
      </View>

      {showDetails && status === 'connected' && (
        <View style={styles.detailsRow}>
          {deviceName && (
            <View style={styles.detailItem}>
              <Ionicons name="hardware-chip-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.detailText}>{deviceName}</Text>
            </View>
          )}
          {batteryLevel !== undefined && (
            <View style={styles.detailItem}>
              <Ionicons
                name={getBatteryIcon()}
                size={16}
                color={batteryLevel < 20 ? colors.error : colors.textSecondary}
              />
              <Text
                style={[
                  styles.detailText,
                  batteryLevel < 20 && { color: colors.error },
                ]}
              >
                {batteryLevel}%
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
  },
});
