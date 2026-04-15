import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Switch,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { StatusBadge, NeumorphicButton } from '../components';
import { colors, spacing, fontSizes, fontWeights, borderRadius, touchTargets } from '../theme';
import { useStore } from '../store';
import { DEFAULT_PERSONALITIES, type PersonalityConfig } from '../types';
import {
  getAllKnownFaces,
  addSampleFaces,
  clearAllMemories,
  cleanupOldMemories,
} from '../services';

export const SettingsScreen: React.FC = () => {
  const { device, settings, updateSettings, updateDeviceStatus } = useStore();
  const [showPersonalityModal, setShowPersonalityModal] = useState(false);
  const [facesCount, setFacesCount] = useState(0);

  useEffect(() => {
    const faces = getAllKnownFaces();
    setFacesCount(faces.length);
  }, []);

  const handleToggle = (key: keyof typeof settings) => {
    const newValue = !settings[key as keyof typeof settings];
    updateSettings({ [key]: newValue });
    if (settings.hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleForgetDevice = () => {
    Alert.alert(
      'Forget Device',
      'Are you sure you want to forget this device? You will need to pair it again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Forget',
          style: 'destructive',
          onPress: () => {
            updateDeviceStatus('disconnected');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  };

  const handleReconnect = () => {
    updateDeviceStatus('connecting');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      updateDeviceStatus('connected');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 2000);
  };

  const handleSelectPersonality = (id: string) => {
    updateSettings({ personalityId: id });
    setShowPersonalityModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleAddSampleFaces = async () => {
    await addSampleFaces();
    const faces = getAllKnownFaces();
    setFacesCount(faces.length);
    Alert.alert('Done', 'Sample contacts added for demo.');
  };

  const handleClearMemories = () => {
    Alert.alert(
      'Clear Memories',
      'This will delete all stored conversation memories. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearAllMemories();
            Alert.alert('Done', 'All memories cleared.');
          },
        },
      ]
    );
  };

  const currentPersonality = DEFAULT_PERSONALITIES[settings.personalityId] || DEFAULT_PERSONALITIES.assistant;

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
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>Customize your experience</Text>
          </View>

          {/* Device Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Device</Text>
            <View style={styles.card}>
              <StatusBadge
                status={device?.status || 'disconnected'}
                deviceName={device?.name}
                batteryLevel={device?.batteryLevel}
              />
              <Text style={styles.deviceNote}>
                Currently simulating device connection for development.{'\n'}
                Future: Connect to physical iSpy Gadget hardware via Bluetooth.
              </Text>
              <View style={styles.deviceActions}>
                {device?.status === 'connected' ? (
                  <NeumorphicButton
                    title="Forget Device"
                    onPress={handleForgetDevice}
                    variant="ghost"
                    size="small"
                  />
                ) : (
                  <NeumorphicButton
                    title={device?.status === 'connecting' ? 'Connecting...' : 'Reconnect'}
                    onPress={handleReconnect}
                    variant="primary"
                    size="small"
                    loading={device?.status === 'connecting'}
                  />
                )}
              </View>
              {device?.firmwareVersion && (
                <Text style={styles.firmwareText}>Firmware v{device.firmwareVersion}</Text>
              )}
            </View>
          </View>

          {/* Personality Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personality</Text>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setShowPersonalityModal(true)}
                accessibilityRole="button"
                accessibilityLabel={`Current personality: ${currentPersonality.name}`}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name="person-circle-outline" size={20} color={colors.textSecondary} />
                  <View>
                    <Text style={styles.settingLabel}>{currentPersonality.name}</Text>
                    <Text style={styles.settingHint}>
                      {currentPersonality.voiceTone} • {currentPersonality.verbosity}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 24x7 Agent Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>24x7 Agent</Text>
            <View style={styles.card}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleLabel}>
                  <Ionicons name="radio-outline" size={20} color={colors.textSecondary} />
                  <View>
                    <Text style={styles.settingLabel}>Always On</Text>
                    <Text style={styles.settingHint}>Continuous monitoring</Text>
                  </View>
                </View>
                <Switch
                  value={settings.agentAlwaysOn}
                  onValueChange={() => handleToggle('agentAlwaysOn')}
                  trackColor={{ false: colors.surface, true: colors.primary }}
                  thumbColor={colors.textPrimary}
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleLabel}>
                  <Ionicons name="battery-half-outline" size={20} color={colors.textSecondary} />
                  <View>
                    <Text style={styles.settingLabel}>Battery Optimization</Text>
                    <Text style={styles.settingHint}>Reduce monitoring when idle</Text>
                  </View>
                </View>
                <Switch
                  value={settings.agentBatteryOptimization}
                  onValueChange={() => handleToggle('agentBatteryOptimization')}
                  trackColor={{ false: colors.surface, true: colors.primary }}
                  thumbColor={colors.textPrimary}
                />
              </View>
            </View>
          </View>

          {/* Safety Features Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Safety Features</Text>
            <View style={styles.card}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleLabel}>
                  <Ionicons name="footsteps-outline" size={20} color={colors.textSecondary} />
                  <View>
                    <Text style={styles.settingLabel}>Stair Detection</Text>
                    <Text style={styles.settingHint}>Alert before stairs</Text>
                  </View>
                </View>
                <Switch
                  value={settings.stairDetectionEnabled}
                  onValueChange={() => handleToggle('stairDetectionEnabled')}
                  trackColor={{ false: colors.surface, true: colors.primary }}
                  thumbColor={colors.textPrimary}
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleLabel}>
                  <Ionicons name="cube-outline" size={20} color={colors.textSecondary} />
                  <View>
                    <Text style={styles.settingLabel}>Depth Perception</Text>
                    <Text style={styles.settingHint}>3D obstacle detection</Text>
                  </View>
                </View>
                <Switch
                  value={settings.depthPerceptionEnabled}
                  onValueChange={() => handleToggle('depthPerceptionEnabled')}
                  trackColor={{ false: colors.surface, true: colors.primary }}
                  thumbColor={colors.textPrimary}
                />
              </View>

              <View style={styles.sliderRow}>
                <View style={styles.sliderLabel}>
                  <Ionicons name="warning-outline" size={20} color={colors.textSecondary} />
                  <Text style={styles.settingLabel}>Alert Distance</Text>
                </View>
                <Text style={styles.sliderValue}>{settings.obstacleAlertDistance}m</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={5}
                step={0.5}
                value={settings.obstacleAlertDistance}
                onValueChange={(value) => updateSettings({ obstacleAlertDistance: value })}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.surface}
                thumbTintColor={colors.primary}
              />
            </View>
          </View>

          {/* Face Recognition Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Face Recognition</Text>
            <View style={styles.card}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleLabel}>
                  <Ionicons name="scan-outline" size={20} color={colors.textSecondary} />
                  <View>
                    <Text style={styles.settingLabel}>Face Recognition</Text>
                    <Text style={styles.settingHint}>Recognize known people</Text>
                  </View>
                </View>
                <Switch
                  value={settings.faceRecognitionEnabled}
                  onValueChange={() => handleToggle('faceRecognitionEnabled')}
                  trackColor={{ false: colors.surface, true: colors.primary }}
                  thumbColor={colors.textPrimary}
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleLabel}>
                  <Ionicons name="megaphone-outline" size={20} color={colors.textSecondary} />
                  <View>
                    <Text style={styles.settingLabel}>Announce Faces</Text>
                    <Text style={styles.settingHint}>Speak when recognizing</Text>
                  </View>
                </View>
                <Switch
                  value={settings.announceKnownFaces}
                  onValueChange={() => handleToggle('announceKnownFaces')}
                  trackColor={{ false: colors.surface, true: colors.primary }}
                  thumbColor={colors.textPrimary}
                />
              </View>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleAddSampleFaces}
                accessibilityRole="button"
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name="people-outline" size={20} color={colors.textSecondary} />
                  <View>
                    <Text style={styles.settingLabel}>Known Contacts</Text>
                    <Text style={styles.settingHint}>{facesCount} people saved</Text>
                  </View>
                </View>
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Memory Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Memory</Text>
            <View style={styles.card}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleLabel}>
                  <Ionicons name="save-outline" size={20} color={colors.textSecondary} />
                  <View>
                    <Text style={styles.settingLabel}>Remember Conversations</Text>
                    <Text style={styles.settingHint}>Store context for later</Text>
                  </View>
                </View>
                <Switch
                  value={settings.memoryEnabled}
                  onValueChange={() => handleToggle('memoryEnabled')}
                  trackColor={{ false: colors.surface, true: colors.primary }}
                  thumbColor={colors.textPrimary}
                />
              </View>

              <View style={styles.sliderRow}>
                <View style={styles.sliderLabel}>
                  <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                  <Text style={styles.settingLabel}>Retention</Text>
                </View>
                <Text style={styles.sliderValue}>{settings.memoryRetentionDays} days</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={7}
                maximumValue={90}
                step={7}
                value={settings.memoryRetentionDays}
                onValueChange={(value) => updateSettings({ memoryRetentionDays: value })}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.surface}
                thumbTintColor={colors.primary}
              />

              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleClearMemories}
                accessibilityRole="button"
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                  <Text style={[styles.settingLabel, { color: colors.error }]}>Clear All Memories</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Voice Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Voice</Text>
            <View style={styles.card}>
              <View style={styles.sliderRow}>
                <View style={styles.sliderLabel}>
                  <Ionicons name="speedometer-outline" size={20} color={colors.textSecondary} />
                  <Text style={styles.settingLabel}>Speech Speed</Text>
                </View>
                <Text style={styles.sliderValue}>{settings.voiceSpeed.toFixed(1)}x</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0.5}
                maximumValue={2.0}
                step={0.1}
                value={settings.voiceSpeed}
                onValueChange={(value) => updateSettings({ voiceSpeed: value })}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.surface}
                thumbTintColor={colors.primary}
              />

              <View style={styles.toggleRow}>
                <View style={styles.toggleLabel}>
                  <Ionicons name="volume-high-outline" size={20} color={colors.textSecondary} />
                  <View>
                    <Text style={styles.settingLabel}>Auto-read Responses</Text>
                    <Text style={styles.settingHint}>Speak responses automatically</Text>
                  </View>
                </View>
                <Switch
                  value={settings.autoReadResponses}
                  onValueChange={() => handleToggle('autoReadResponses')}
                  trackColor={{ false: colors.surface, true: colors.primary }}
                  thumbColor={colors.textPrimary}
                />
              </View>
            </View>
          </View>

          {/* Accessibility Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Accessibility</Text>
            <View style={styles.card}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleLabel}>
                  <Ionicons name="phone-portrait-outline" size={20} color={colors.textSecondary} />
                  <View>
                    <Text style={styles.settingLabel}>Haptic Feedback</Text>
                    <Text style={styles.settingHint}>Vibrations for actions</Text>
                  </View>
                </View>
                <Switch
                  value={settings.hapticFeedback}
                  onValueChange={() => handleToggle('hapticFeedback')}
                  trackColor={{ false: colors.surface, true: colors.primary }}
                  thumbColor={colors.textPrimary}
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleLabel}>
                  <Ionicons name="contrast-outline" size={20} color={colors.textSecondary} />
                  <View>
                    <Text style={styles.settingLabel}>High Contrast</Text>
                    <Text style={styles.settingHint}>Enhanced visibility</Text>
                  </View>
                </View>
                <Switch
                  value={settings.highContrastMode}
                  onValueChange={() => handleToggle('highContrastMode')}
                  trackColor={{ false: colors.surface, true: colors.primary }}
                  thumbColor={colors.textPrimary}
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleLabel}>
                  <Ionicons name="text-outline" size={20} color={colors.textSecondary} />
                  <View>
                    <Text style={styles.settingLabel}>Large Text</Text>
                    <Text style={styles.settingHint}>Bigger font sizes</Text>
                  </View>
                </View>
                <Switch
                  value={settings.largeText}
                  onValueChange={() => handleToggle('largeText')}
                  trackColor={{ false: colors.surface, true: colors.primary }}
                  thumbColor={colors.textPrimary}
                />
              </View>
            </View>
          </View>

          {/* Privacy & Data Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy & Data</Text>
            <View style={styles.card}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleLabel}>
                  <Ionicons name="cloud-outline" size={20} color={colors.textSecondary} />
                  <View>
                    <Text style={styles.settingLabel}>Cloud Storage</Text>
                    <Text style={styles.settingHint}>Store conversations in cloud</Text>
                  </View>
                </View>
                <Switch
                  value={settings.cloudStorageEnabled}
                  onValueChange={() => handleToggle('cloudStorageEnabled')}
                  trackColor={{ false: colors.surface, true: colors.primary }}
                  thumbColor={colors.textPrimary}
                />
              </View>
            </View>
          </View>

          {/* Version */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>i-spy v1.0.0</Text>
            <Text style={styles.versionSubtext}>Made with care for accessibility</Text>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>

      {/* Personality Modal */}
      <Modal
        visible={showPersonalityModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPersonalityModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Personality</Text>
            <TouchableOpacity onPress={() => setShowPersonalityModal(false)}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {Object.entries(DEFAULT_PERSONALITIES).map(([id, personality]) => (
              <TouchableOpacity
                key={id}
                style={[
                  styles.personalityOption,
                  settings.personalityId === id && styles.personalityOptionSelected,
                ]}
                onPress={() => handleSelectPersonality(id)}
              >
                <View style={styles.personalityInfo}>
                  <Text style={styles.personalityName}>{personality.name}</Text>
                  <Text style={styles.personalityDesc}>
                    {personality.voiceTone} • {personality.verbosity} • {personality.formality}
                  </Text>
                  {personality.humor && (
                    <Text style={styles.personalityTraits}>Humorous</Text>
                  )}
                  {personality.encouragement && (
                    <Text style={styles.personalityTraits}>Encouraging</Text>
                  )}
                </View>
                {settings.personalityId === id && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  deviceActions: {
    marginTop: spacing.md,
  },
  deviceNote: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    marginTop: spacing.sm,
    lineHeight: 18,
    textAlign: 'center',
  },
  firmwareText: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  sliderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  sliderLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sliderValue: {
    color: colors.primary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    minWidth: 50,
    textAlign: 'right',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    minHeight: touchTargets.minimum,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  toggleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  settingLabel: {
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.medium,
  },
  settingHint: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    minHeight: touchTargets.minimum,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  versionText: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
  },
  versionSubtext: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
  },
  bottomSpacer: {
    height: 100,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  personalityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  personalityOptionSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  personalityInfo: {
    flex: 1,
  },
  personalityName: {
    color: colors.textPrimary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
  },
  personalityDesc: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    marginTop: spacing.xs,
  },
  personalityTraits: {
    color: colors.primary,
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
  },
});
