import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { NeumorphicButton } from '../components';
import { colors, spacing, fontSizes, fontWeights, borderRadius } from '../theme';
import { SERVER_CONFIG, REQUEST_CONFIG } from '../config';
import { useStore } from '../store';
import {
  getServerStatus,
  startAsk,
  stopAsk,
  startWatch,
  stopWatch,
  cancelWatch,
  type ServerStatus,
  type AskResponse,
} from '../services/serverApi';

type ConnectionState = 'connecting' | 'connected' | 'disconnected';
type ActionState = 'idle' | 'recording' | 'processing';

export const SessionScreen: React.FC = () => {
  const navigation = useNavigation();

  // Store actions
  const startSession = useStore((state) => state.startSession);
  const endSession = useStore((state) => state.endSession);
  const addMessage = useStore((state) => state.addMessage);
  const currentSession = useStore((state) => state.currentSession);

  // Start session on mount
  useEffect(() => {
    startSession();
  }, []);

  // Connection state
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);

  // Action states
  const [askState, setAskState] = useState<ActionState>('idle');
  const [watchState, setWatchState] = useState<ActionState>('idle');

  // Last response for display
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Polling interval ref
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll server status
  const pollStatus = useCallback(async () => {
    const status = await getServerStatus();
    if (status) {
      setConnectionState('connected');
      setServerStatus(status);
      setError(null);
    } else {
      setConnectionState('disconnected');
      setServerStatus(null);
    }
  }, []);

  // Start polling on mount
  useEffect(() => {
    pollStatus(); // Initial check
    pollIntervalRef.current = setInterval(pollStatus, REQUEST_CONFIG.POLL_INTERVAL_MS);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [pollStatus]);

  // Handle Ask button press (start recording)
  const handleAskPressIn = useCallback(async () => {
    if (askState !== 'idle' || connectionState !== 'connected') return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setAskState('recording');
    setError(null);

    const result = await startAsk();
    if (!result.success) {
      setAskState('idle');
      setError(result.error || 'Failed to start recording');
    }
  }, [askState, connectionState]);

  // Handle Ask button release (stop recording, get response)
  const handleAskPressOut = useCallback(async () => {
    if (askState !== 'recording') return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAskState('processing');

    const response = await stopAsk();

    if (response.error) {
      setError(response.error);
      setLastResponse(response.response || null);
    } else {
      setLastQuery(response.query || null);
      setLastResponse(response.response || null);

      // Save messages to session
      if (response.query) {
        addMessage({ role: 'user', content: response.query });
      }
      if (response.response) {
        addMessage({ role: 'assistant', content: response.response });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setAskState('idle');
    pollStatus(); // Refresh status
  }, [askState, pollStatus, addMessage]);

  // Handle Watch button press (start recording condition)
  const handleWatchPressIn = useCallback(async () => {
    if (watchState !== 'idle' || connectionState !== 'connected') return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setWatchState('recording');
    setError(null);

    const result = await startWatch();
    if (!result.success) {
      setWatchState('idle');
      setError(result.error || 'Failed to start recording');
    }
  }, [watchState, connectionState]);

  // Handle Watch button release (stop recording, activate watch)
  const handleWatchPressOut = useCallback(async () => {
    if (watchState !== 'recording') return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setWatchState('processing');

    const response = await stopWatch();

    if (response.error) {
      setError(response.error);
    } else if (response.status === 'watching') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setWatchState('idle');
    pollStatus(); // Refresh status
  }, [watchState, pollStatus]);

  // Handle cancel watch
  const handleCancelWatch = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const response = await cancelWatch();
    if (response.error) {
      setError(response.error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    pollStatus();
  }, [pollStatus]);

  // Handle end session
  const handleEndSession = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    endSession();
    navigation.goBack();
  }, [navigation, endSession]);

  // Get connection status color
  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected': return colors.success;
      case 'connecting': return colors.warning;
      case 'disconnected': return colors.error;
    }
  };

  // Get button style based on state
  const getButtonStyle = (state: ActionState, baseColor: string) => {
    switch (state) {
      case 'recording': return { backgroundColor: colors.error };
      case 'processing': return { backgroundColor: colors.warning, opacity: 0.7 };
      default: return { backgroundColor: baseColor };
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleEndSession} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Session</Text>
          <Pressable onPress={handleEndSession} style={styles.endButton}>
            <Text style={styles.endButtonText}>End</Text>
          </Pressable>
        </View>

        {/* Connection Info */}
        <View style={styles.connectionCard}>
          <View style={styles.connectionRow}>
            <Ionicons
              name={connectionState === 'connected' ? 'wifi' : 'wifi-outline'}
              size={20}
              color={getStatusColor()}
            />
            <Text style={styles.connectionText}>
              {connectionState === 'connected'
                ? `Current Backend Device: ${SERVER_CONFIG.BASE_URL}`
                : connectionState === 'connecting'
                  ? 'Connecting...'
                  : 'Disconnected'}
            </Text>
          </View>
          {serverStatus?.watch_active && serverStatus.watch_condition && (
            <View style={styles.watchInfoRow}>
              <Ionicons name="eye" size={16} color={colors.primary} />
              <Text style={styles.watchInfoText}>
                Watching for: {serverStatus.watch_condition}
              </Text>
            </View>
          )}
        </View>

        {/* Main Controls */}
        <View style={styles.controlsContainer}>
          {/* Ask Button - Large press and hold */}
          <View style={styles.mainButtonSection}>
            <Text style={styles.buttonLabel}>
              {askState === 'recording' ? 'Listening...' : askState === 'processing' ? 'Processing...' : 'Hold to Ask'}
            </Text>
            <Pressable
              onPressIn={handleAskPressIn}
              onPressOut={handleAskPressOut}
              disabled={connectionState !== 'connected' || askState === 'processing'}
              style={({ pressed }) => [
                styles.mainButton,
                getButtonStyle(askState, colors.primary),
                pressed && askState === 'idle' && styles.mainButtonPressed,
                connectionState !== 'connected' && styles.buttonDisabled,
              ]}
            >
              {askState === 'processing' ? (
                <ActivityIndicator size="large" color={colors.textPrimary} />
              ) : (
                <Ionicons
                  name={askState === 'recording' ? 'mic' : 'mic-outline'}
                  size={64}
                  color={colors.textPrimary}
                />
              )}
            </Pressable>
            <Text style={styles.buttonHint}>
              Ask about what you see
            </Text>
          </View>

          {/* Watch Button - Medium press and hold */}
          <View style={styles.secondaryButtonSection}>
            <Text style={styles.buttonLabel}>
              {watchState === 'recording' ? 'Listening...' : watchState === 'processing' ? 'Starting watch...' : 'Hold to Set Watch'}
            </Text>
            <Pressable
              onPressIn={handleWatchPressIn}
              onPressOut={handleWatchPressOut}
              disabled={connectionState !== 'connected' || watchState === 'processing'}
              style={({ pressed }) => [
                styles.watchButton,
                getButtonStyle(watchState, colors.surfaceLight),
                pressed && watchState === 'idle' && styles.watchButtonPressed,
                connectionState !== 'connected' && styles.buttonDisabled,
              ]}
            >
              {watchState === 'processing' ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <Ionicons
                  name={watchState === 'recording' ? 'eye' : 'eye-outline'}
                  size={32}
                  color={watchState === 'recording' ? colors.textPrimary : colors.primary}
                />
              )}
            </Pressable>
            <Text style={styles.buttonHint}>
              Describe what to look for
            </Text>
          </View>

          {/* Cancel Watch Button */}
          {serverStatus?.watch_active && (
            <NeumorphicButton
              title="Cancel Watch"
              onPress={handleCancelWatch}
              variant="danger"
              size="medium"
              icon={<Ionicons name="close-circle-outline" size={20} color={colors.textPrimary} />}
              style={styles.cancelButton}
            />
          )}
        </View>

        {/* Response Display */}
        <ScrollView style={styles.responseContainer} contentContainerStyle={styles.responseContent}>
          {error && (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {lastResponse && (
            <View style={styles.responseCard}>
              {lastQuery && (
                <Text style={styles.queryText}>"{lastQuery}"</Text>
              )}
              <Text style={styles.responseText}>{lastResponse}</Text>
            </View>
          )}

          {!lastResponse && !error && connectionState === 'connected' && (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>
                Hold the button and speak
              </Text>
            </View>
          )}

          {connectionState === 'disconnected' && (
            <View style={styles.emptyState}>
              <Ionicons name="cloud-offline-outline" size={48} color={colors.error} />
              <Text style={styles.emptyText}>
                Cannot connect to server at{'\n'}
                {SERVER_CONFIG.BASE_URL}
              </Text>
              <Text style={styles.hintText}>
                Check that the server is running and both devices are on the same network
              </Text>
            </View>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  backButton: {
    padding: spacing.sm,
    marginLeft: -spacing.sm,
  },
  endButton: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  endButtonText: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  connectionCard: {
    margin: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  connectionText: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
  },
  watchInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  watchInfoText: {
    color: colors.primary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    flex: 1,
  },
  controlsContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  mainButtonSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  buttonLabel: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  mainButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  mainButtonPressed: {
    transform: [{ scale: 0.95 }],
    shadowOpacity: 0.2,
  },
  buttonHint: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    marginTop: spacing.md,
  },
  secondaryButtonSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  watchButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  watchButtonPressed: {
    transform: [{ scale: 0.95 }],
    backgroundColor: colors.surface,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  cancelButton: {
    marginTop: spacing.md,
  },
  responseContainer: {
    flex: 1,
  },
  responseContent: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: `${colors.error}20`,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSizes.sm,
    flex: 1,
  },
  responseCard: {
    backgroundColor: colors.surfaceLight,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  queryText: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  responseText: {
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.5,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSizes.md,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  hintText: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
});
