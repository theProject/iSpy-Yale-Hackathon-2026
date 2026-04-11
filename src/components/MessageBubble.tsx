import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, fontSizes, fontWeights } from '../theme';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  onPlayAudio?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onPlayAudio,
}) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isSystem) {
    return (
      <View style={styles.systemContainer}>
        <Text style={styles.systemText}>{message.content}</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${isUser ? 'You said' : 'Assistant said'}: ${message.content}`}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        {!isUser && (
          <View style={styles.assistantHeader}>
            <View style={styles.assistantIcon}>
              <Ionicons name="eye-outline" size={14} color={colors.primary} />
            </View>
            <Text style={styles.assistantLabel}>i-spy</Text>
          </View>
        )}
        <Text style={[styles.text, isUser && styles.userText]}>
          {message.content}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.time}>{formatTime(message.timestamp)}</Text>
          {!isUser && onPlayAudio && (
            <TouchableOpacity
              onPress={onPlayAudio}
              style={styles.playButton}
              accessibilityRole="button"
              accessibilityLabel="Play audio"
            >
              <Ionicons name="volume-medium" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: borderRadius.sm,
  },
  assistantBubble: {
    backgroundColor: colors.surfaceLight,
    borderBottomLeftRadius: borderRadius.sm,
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  assistantIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assistantLabel: {
    color: colors.primary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  text: {
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.5,
  },
  userText: {
    color: colors.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  time: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
  },
  playButton: {
    padding: spacing.xs,
  },
  systemContainer: {
    alignItems: 'center',
    marginVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  systemText: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
