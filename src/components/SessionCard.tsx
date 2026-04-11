import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, borderRadius, spacing, fontSizes, fontWeights, touchTargets } from '../theme';
import type { Session } from '../types';

interface SessionCardProps {
  session: Session;
  onPress: () => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({ session, onPress }) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) {
      return `${mins}m ${secs}s`;
    }
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days === 1) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'long', hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const preview = session.messages[0]?.content.slice(0, 80) || 'No messages';

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.container}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Session: ${session.title || 'Untitled'}. ${session.messages.length} messages. Duration: ${formatDuration(session.duration)}`}
      accessibilityHint="Tap to view session details"
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="chatbubbles-outline" size={20} color={colors.primary} />
          <Text style={styles.title} numberOfLines={1}>
            {session.title || 'Session'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </View>

      <Text style={styles.preview} numberOfLines={2}>
        {preview}
      </Text>

      <View style={styles.footer}>
        <View style={styles.stat}>
          <Ionicons name="time-outline" size={14} color={colors.textMuted} />
          <Text style={styles.statText}>{formatDuration(session.duration)}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="chatbubble-outline" size={14} color={colors.textMuted} />
          <Text style={styles.statText}>{session.messages.length} messages</Text>
        </View>
        <Text style={styles.date}>{formatDate(session.startTime)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    minHeight: touchTargets.comfortable,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    flex: 1,
  },
  preview: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * 1.5,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
  },
  date: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    marginLeft: 'auto',
  },
});
