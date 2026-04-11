import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatCard } from '../components';
import { colors, spacing, fontSizes, fontWeights, borderRadius } from '../theme';
import { useStore } from '../store';

const { width } = Dimensions.get('window');
const cardWidth = (width - spacing.lg * 2 - spacing.md) / 2;

export const StatsScreen: React.FC = () => {
  const sessions = useStore((state) => state.sessions);
  const sessionsLoaded = useStore((state) => state.sessionsLoaded);

  // Calculate stats from sessions in real-time
  const stats = useMemo(() => {
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;

    const totalSessions = sessions.length;
    const totalDuration = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
    const totalMessages = sessions.reduce((acc, s) => acc + (s.messages?.length || 0), 0);
    const sessionsToday = sessions.filter((s) => s.startTime >= todayStart).length;
    const sessionsThisWeek = sessions.filter((s) => s.startTime >= weekStart).length;
    const averageSessionDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;

    // Calculate streak (consecutive days with sessions)
    let streak = 0;
    if (sessions.length > 0) {
      const sortedSessions = [...sessions].sort((a, b) => b.startTime - a.startTime);
      let checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);

      // Check if there's a session today or yesterday to start the streak
      const latestSessionDate = new Date(sortedSessions[0].startTime);
      latestSessionDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((checkDate.getTime() - latestSessionDate.getTime()) / (24 * 60 * 60 * 1000));

      if (daysDiff <= 1) {
        // Start counting from the latest session date
        checkDate = latestSessionDate;
        streak = 1;

        // Count backwards
        for (let i = 1; i < 365; i++) {
          const prevDay = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
          const prevDayStart = prevDay.getTime();
          const prevDayEnd = prevDayStart + 24 * 60 * 60 * 1000;

          const hasSession = sortedSessions.some(
            (s) => s.startTime >= prevDayStart && s.startTime < prevDayEnd
          );

          if (hasSession) {
            streak++;
            checkDate = prevDay;
          } else {
            break;
          }
        }
      }
    }

    return {
      totalSessions,
      totalDuration,
      totalMessages,
      sessionsToday,
      sessionsThisWeek,
      averageSessionDuration,
      streak,
      lastSessionDate: sessions[0]?.startTime,
    };
  }, [sessions]);

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  // Calculate weekly data for chart
  const getWeeklyData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const weekData = days.map((day, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - today.getDay() + index);
      const dayStart = new Date(date.setHours(0, 0, 0, 0)).getTime();
      const dayEnd = new Date(date.setHours(23, 59, 59, 999)).getTime();

      const daySessions = sessions.filter(
        (s) => s.startTime >= dayStart && s.startTime <= dayEnd
      );

      return {
        day,
        count: daySessions.length,
        duration: daySessions.reduce((acc, s) => acc + s.duration, 0),
      };
    });
    return weekData;
  };

  const weeklyData = getWeeklyData();
  const maxCount = Math.max(...weeklyData.map((d) => d.count), 1);

  // Show loading state while sessions are being fetched
  if (!sessionsLoaded) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading stats...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Your Statistics</Text>
            <Text style={styles.subtitle}>Track your i-spy usage</Text>
          </View>

          {/* Streak Card */}
          <View style={styles.streakCard}>
            <View style={styles.streakContent}>
              <View style={styles.streakIcon}>
                <Ionicons name="flame" size={32} color={colors.warning} />
              </View>
              <View style={styles.streakInfo}>
                <Text style={styles.streakValue}>{stats.streak}</Text>
                <Text style={styles.streakLabel}>Day Streak</Text>
              </View>
            </View>
            <Text style={styles.streakHint}>
              Keep exploring to maintain your streak!
            </Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <StatCard
                title="Total Sessions"
                value={stats.totalSessions}
                icon="chatbubbles-outline"
                color={colors.primary}
              />
              <StatCard
                title="Today"
                value={stats.sessionsToday}
                icon="today-outline"
                color={colors.success}
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                title="Total Time"
                value={formatDuration(stats.totalDuration)}
                icon="time-outline"
                color={colors.warning}
              />
              <StatCard
                title="Avg Duration"
                value={formatDuration(Math.round(stats.averageSessionDuration))}
                icon="analytics-outline"
                color={colors.primaryLight}
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                title="This Week"
                value={stats.sessionsThisWeek}
                icon="calendar-outline"
                color={colors.success}
                trend={{ value: 15, direction: 'up' }}
              />
              <StatCard
                title="Messages"
                value={stats.totalMessages}
                icon="chatbubble-ellipses-outline"
                color={colors.primary}
              />
            </View>
          </View>

          {/* Weekly Activity Chart */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weekly Activity</Text>
            <View style={styles.chartContainer}>
              <View style={styles.chart}>
                {weeklyData.map((data, index) => (
                  <View key={data.day} style={styles.barContainer}>
                    <View style={styles.barWrapper}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: `${(data.count / maxCount) * 100}%`,
                            backgroundColor:
                              index === new Date().getDay()
                                ? colors.primary
                                : colors.surfaceLight,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.barLabel,
                        index === new Date().getDay() && styles.barLabelActive,
                      ]}
                    >
                      {data.day}
                    </Text>
                    <Text style={styles.barValue}>{data.count}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Achievements Preview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <View style={styles.achievementsGrid}>
              <View style={styles.achievement}>
                <View style={[styles.achievementIcon, stats.totalSessions >= 1 ? styles.achievementUnlocked : styles.achievementLocked]}>
                  <Ionicons name="star" size={24} color={stats.totalSessions >= 1 ? colors.warning : colors.textMuted} />
                </View>
                <Text style={styles.achievementTitle}>First Steps</Text>
                <Text style={styles.achievementDesc}>Complete first session</Text>
              </View>
              <View style={styles.achievement}>
                <View style={[styles.achievementIcon, stats.streak >= 3 ? styles.achievementUnlocked : styles.achievementLocked]}>
                  <Ionicons name="flame" size={24} color={stats.streak >= 3 ? colors.error : colors.textMuted} />
                </View>
                <Text style={styles.achievementTitle}>On Fire</Text>
                <Text style={styles.achievementDesc}>3 day streak</Text>
              </View>
              <View style={styles.achievement}>
                <View style={[styles.achievementIcon, stats.totalSessions >= 10 ? styles.achievementUnlocked : styles.achievementLocked]}>
                  <Ionicons name="trophy" size={24} color={stats.totalSessions >= 10 ? colors.warning : colors.textMuted} />
                </View>
                <Text style={styles.achievementTitle}>Explorer</Text>
                <Text style={styles.achievementDesc}>10 sessions</Text>
              </View>
              <View style={styles.achievement}>
                <View style={[styles.achievementIcon, stats.totalDuration >= 3600 ? styles.achievementUnlocked : styles.achievementLocked]}>
                  <Ionicons name="rocket" size={24} color={stats.totalDuration >= 3600 ? colors.primary : colors.textMuted} />
                </View>
                <Text style={styles.achievementTitle}>Power User</Text>
                <Text style={styles.achievementDesc}>1 hour total</Text>
              </View>
            </View>
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
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
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  header: {
    marginBottom: spacing.xl,
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
  streakCard: {
    backgroundColor: `${colors.warning}15`,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: `${colors.warning}30`,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  streakIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${colors.warning}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakInfo: {
    flex: 1,
  },
  streakValue: {
    color: colors.textPrimary,
    fontSize: fontSizes.display,
    fontWeight: fontWeights.bold,
  },
  streakLabel: {
    color: colors.warning,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
  },
  streakHint: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    marginTop: spacing.md,
  },
  statsGrid: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    marginBottom: spacing.md,
  },
  chartContainer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 150,
    alignItems: 'flex-end',
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    flex: 1,
    width: 24,
    justifyContent: 'flex-end',
    marginBottom: spacing.sm,
  },
  bar: {
    width: '100%',
    borderRadius: borderRadius.sm,
    minHeight: 4,
  },
  barLabel: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
  },
  barLabelActive: {
    color: colors.primary,
    fontWeight: fontWeights.semibold,
  },
  barValue: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  achievement: {
    width: (width - spacing.lg * 2 - spacing.md) / 2 - 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  achievementUnlocked: {
    backgroundColor: `${colors.warning}20`,
  },
  achievementLocked: {
    backgroundColor: colors.surface,
  },
  achievementTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
  },
  achievementDesc: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
  },
  bottomSpacer: {
    height: 100,
  },
});
