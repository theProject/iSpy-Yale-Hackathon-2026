import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, fontSizes, fontWeights } from '../theme';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = colors.primary,
  trend,
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.direction === 'up') return 'trending-up';
    if (trend.direction === 'down') return 'trending-down';
    return 'remove';
  };

  const getTrendColor = () => {
    if (!trend) return colors.textMuted;
    if (trend.direction === 'up') return colors.success;
    if (trend.direction === 'down') return colors.error;
    return colors.textMuted;
  };

  return (
    <View
      style={styles.container}
      accessibilityRole="text"
      accessibilityLabel={`${title}: ${value}${subtitle ? `, ${subtitle}` : ''}`}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {trend && (
        <View style={styles.trendRow}>
          <Ionicons name={getTrendIcon() as any} size={14} color={getTrendColor()} />
          <Text style={[styles.trendText, { color: getTrendColor() }]}>
            {trend.value}%
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flex: 1,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  value: {
    color: colors.textPrimary,
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    marginTop: spacing.xs,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  trendText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
  },
});
