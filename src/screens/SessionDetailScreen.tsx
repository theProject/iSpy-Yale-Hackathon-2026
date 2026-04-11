import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { MessageBubble, NeumorphicButton } from '../components';
import { colors, spacing, fontSizes, fontWeights, borderRadius } from '../theme';
import { useStore } from '../store';
import type { RootStackParamList, Message } from '../types';

type RouteProps = RouteProp<RootStackParamList, 'SessionDetail'>;

export const SessionDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { sessions, settings } = useStore();

  const session = sessions.find((s) => s.id === route.params.sessionId);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) {
      return `${mins} min ${secs} sec`;
    }
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePlayAudio = useCallback((message: Message) => {
    Speech.speak(message.content, {
      language: 'en-US',
      rate: settings.voiceSpeed,
      pitch: settings.voicePitch,
    });
  }, [settings]);

  const handleShare = async () => {
    if (!session) return;

    const transcript = session.messages
      .map((m) => `${m.role === 'user' ? 'You' : 'i-spy'}: ${m.content}`)
      .join('\n\n');

    try {
      await Share.share({
        title: session.title || 'i-spy Session',
        message: `i-spy Session - ${formatDate(session.startTime)}\n\nDuration: ${formatDuration(session.duration)}\n\n${transcript}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Unable to share session');
    }
  };

  const handleReadAll = () => {
    if (!session) return;

    const assistantMessages = session.messages
      .filter((m) => m.role === 'assistant')
      .map((m) => m.content)
      .join('. ');

    if (assistantMessages) {
      Speech.speak(assistantMessages, {
        language: 'en-US',
        rate: settings.voiceSpeed,
        pitch: settings.voicePitch,
      });
    }
  };

  if (!session) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyText}>Session not found</Text>
          <NeumorphicButton
            title="Go Back"
            onPress={() => navigation.goBack()}
            variant="primary"
          />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <NeumorphicButton
              title=""
              onPress={() => navigation.goBack()}
              variant="ghost"
              size="small"
              icon={<Ionicons name="arrow-back" size={24} color={colors.textPrimary} />}
              accessibilityLabel="Go back"
              style={styles.backButton}
            />
            <View style={styles.headerActions}>
              <NeumorphicButton
                title=""
                onPress={handleReadAll}
                variant="ghost"
                size="small"
                icon={<Ionicons name="volume-high-outline" size={20} color={colors.textPrimary} />}
                accessibilityLabel="Read all responses"
                style={styles.actionButton}
              />
              <NeumorphicButton
                title=""
                onPress={handleShare}
                variant="ghost"
                size="small"
                icon={<Ionicons name="share-outline" size={20} color={colors.textPrimary} />}
                accessibilityLabel="Share session"
                style={styles.actionButton}
              />
            </View>
          </View>

          <Text style={styles.title}>{session.title || 'Session'}</Text>
          <Text style={styles.date}>{formatDate(session.startTime)}</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="time-outline" size={16} color={colors.textMuted} />
              <Text style={styles.statText}>{formatDuration(session.duration)}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="chatbubbles-outline" size={16} color={colors.textMuted} />
              <Text style={styles.statText}>{session.messages.length} messages</Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          data={session.messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              onPlayAudio={item.role === 'assistant' ? () => handlePlayAudio(item) : undefined}
            />
          )}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.transcriptHeader}>
              <Ionicons name="document-text-outline" size={20} color={colors.textMuted} />
              <Text style={styles.transcriptTitle}>Transcript</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyMessages}>
              <Text style={styles.emptyMessagesText}>No messages in this session</Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: fontSizes.lg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backButton: {
    paddingHorizontal: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    paddingHorizontal: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
  },
  date: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
  },
  messagesContent: {
    paddingVertical: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  transcriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  transcriptTitle: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyMessages: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyMessagesText: {
    color: colors.textMuted,
    fontSize: fontSizes.md,
  },
});
