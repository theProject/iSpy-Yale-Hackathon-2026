import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  StatusBar,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SessionCard } from '../components';
import { colors, spacing, fontSizes, fontWeights, borderRadius } from '../theme';
import { useStore } from '../store';
import type { RootStackParamList, Session } from '../types';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const HistoryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const sessions = useStore((state) => state.sessions);
  const sessionsLoaded = useStore((state) => state.sessionsLoaded);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = sessions.filter((session) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const titleMatch = session.title?.toLowerCase().includes(query);
    const contentMatch = session.messages.some((m) =>
      m.content.toLowerCase().includes(query)
    );
    return titleMatch || contentMatch;
  });

  const groupSessionsByDate = (sessions: Session[]) => {
    const groups: { [key: string]: Session[] } = {};

    sessions.forEach((session) => {
      const date = new Date(session.startTime);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let key: string;
      if (date.toDateString() === today.toDateString()) {
        key = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = 'Yesterday';
      } else if (today.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
        key = 'This Week';
      } else {
        key = date.toLocaleDateString([], { month: 'long', year: 'numeric' });
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(session);
    });

    return Object.entries(groups).map(([title, data]) => ({
      title,
      data,
    }));
  };

  const groupedSessions = groupSessionsByDate(filteredSessions);

  // Show loading state
  if (!sessionsLoaded) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.title}>Session History</Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading sessions...</Text>
          </View>
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
          <Text style={styles.title}>Session History</Text>
          <Text style={styles.subtitle}>
            {sessions.length} total session{sessions.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search sessions..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              accessibilityLabel="Search sessions"
            />
            {searchQuery.length > 0 && (
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.textMuted}
                onPress={() => setSearchQuery('')}
              />
            )}
          </View>
        </View>

        {/* Sessions List */}
        <FlatList
          data={groupedSessions}
          keyExtractor={(item) => item.title}
          renderItem={({ item: group }) => (
            <View style={styles.group}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              {group.data.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onPress={() =>
                    navigation.navigate('SessionDetail', { sessionId: session.id })
                  }
                />
              ))}
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-open-outline" size={64} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Sessions Found</Text>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'Try a different search term'
                  : 'Start a navigation session to see your history here'}
              </Text>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
    marginTop: spacing.md,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.xxxl,
    fontWeight: fontWeights.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
    marginTop: spacing.xs,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    paddingVertical: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  group: {
    marginBottom: spacing.lg,
  },
  groupTitle: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl * 2,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    marginTop: spacing.lg,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSizes.md,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 250,
  },
});
