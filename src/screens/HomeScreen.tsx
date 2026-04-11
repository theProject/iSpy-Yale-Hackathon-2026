import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { NeumorphicButton, StatusBadge, SessionCard } from '../components';
import { colors, spacing, fontSizes, fontWeights, borderRadius } from '../theme';
import { useStore } from '../store';
import type { RootStackParamList, Session } from '../types';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { device, sessions, currentSession, startSession, stats } = useStore();

  const handleStartSession = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    startSession();
    navigation.navigate('Session');
  };

  const recentSessions = sessions.slice(0, 2);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[colors.background, colors.surface]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>Welcome back</Text>
                <Text style={styles.title}>i-spy</Text>
              </View>
              <View style={styles.logoContainer}>
                <Ionicons name="eye" size={32} color={colors.primary} />
              </View>
            </View>

            {/* Device Status */}
            <View style={styles.section}>
              <StatusBadge
                status={device?.status || 'disconnected'}
                deviceName={device?.name}
                batteryLevel={device?.batteryLevel}
              />
            </View>

            {/* Main Action */}
            <View style={styles.mainActionSection}>
              <Text style={styles.sectionTitle}>Start Exploring</Text>
              <Pressable
                onPress={handleStartSession}
                style={({ pressed }) => [
                  styles.mainButton,
                  pressed && styles.mainButtonPressed,
                ]}
              >
                <Ionicons name="videocam" size={56} color={colors.textPrimary} />
              </Pressable>
              <Text style={styles.hint}>
                Tap to start a new session
              </Text>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActions}>
                <NeumorphicButton
                  title="Explore"
                  onPress={handleStartSession}
                  variant="primary"
                  size="small"
                  icon={<Ionicons name="compass-outline" size={18} color={colors.textPrimary} />}
                  accessibilityLabel="Start exploring your surroundings"
                  style={styles.quickActionButton}
                />
                <NeumorphicButton
                  title="Read Signs"
                  onPress={handleStartSession}
                  variant="secondary"
                  size="small"
                  icon={<Ionicons name="document-text-outline" size={18} color={colors.textPrimary} />}
                  accessibilityLabel="Read signs and labels around you"
                  style={styles.quickActionButton}
                />
                <NeumorphicButton
                  title="Identify"
                  onPress={handleStartSession}
                  variant="secondary"
                  size="small"
                  icon={<Ionicons name="scan-outline" size={18} color={colors.textPrimary} />}
                  accessibilityLabel="Identify objects and people"
                  style={styles.quickActionButton}
                />
              </View>
            </View>

            {/* Stats Preview */}
            <View style={styles.section}>
              <View style={styles.statsPreview}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.sessionsToday}</Text>
                  <Text style={styles.statLabel}>Today</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.streak}</Text>
                  <Text style={styles.statLabel}>Day Streak</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stats.totalSessions}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
              </View>
            </View>

            {/* Recent Sessions */}
            {recentSessions.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Sessions</Text>
                  <Text
                    style={styles.seeAll}
                    onPress={() => {}}
                    accessibilityRole="button"
                  >
                    See All
                  </Text>
                </View>
                {recentSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onPress={() => navigation.navigate('SessionDetail', { sessionId: session.id })}
                  />
                ))}
              </View>
            )}

            {/* Bottom Spacing */}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  greeting: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.xxxl,
    fontWeight: fontWeights.bold,
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    marginBottom: spacing.md,
  },
  seeAll: {
    color: colors.primary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
  },
  mainActionSection: {
    alignItems: 'center',
    marginVertical: spacing.xl,
    paddingVertical: spacing.xl,
  },
  mainButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  mainButtonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
  hint: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickActionButton: {
    flex: 1,
    minWidth: (width - spacing.lg * 2 - spacing.sm * 2) / 3 - 1,
  },
  statsPreview: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
  },
  bottomSpacer: {
    height: 100,
  },
});
