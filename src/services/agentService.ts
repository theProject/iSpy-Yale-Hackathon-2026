// 24x7 Agent Service - Always-on assistant with context awareness
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  AgentState,
  AgentMode,
  Alert,
  AlertType,
  EnvironmentContext,
  Memory,
} from '../types';
import { speakNavigation, stopSpeaking, isSpeaking } from './googleTTS';
import { addMemory, answerMemoryQuestion, queryMemories } from './memoryService';
import { getPersonality, formatResponse, generateProactiveSuggestion } from './personalityService';
import { detectFaces, processAndAnnounceFaces } from './faceRecognitionService';
import { detectObstacles, detectStairs, processAndAlertObstacles, announceStairs } from './depthPerceptionService';

const BACKGROUND_TASK_NAME = 'ISPY_AGENT_TASK';
const AGENT_STATE_KEY = '@ispy_agent_state';

// Agent state
let agentState: AgentState = {
  isActive: false,
  mode: 'idle',
  lastActivity: Date.now(),
  activeAlerts: [],
  batteryOptimization: true,
};

// Event listeners
type AgentEventListener = (event: string, data: unknown) => void;
const eventListeners: AgentEventListener[] = [];

// Emit events to listeners
const emitEvent = (event: string, data: unknown) => {
  eventListeners.forEach(listener => listener(event, data));
};

// Subscribe to agent events
export const subscribeToAgent = (listener: AgentEventListener): (() => void) => {
  eventListeners.push(listener);
  return () => {
    const index = eventListeners.indexOf(listener);
    if (index > -1) eventListeners.splice(index, 1);
  };
};

// Get current agent state
export const getAgentState = (): AgentState => agentState;

// Update agent state
const updateState = async (updates: Partial<AgentState>) => {
  agentState = { ...agentState, ...updates, lastActivity: Date.now() };
  emitEvent('stateChange', agentState);
  await saveAgentState();
};

// Save state to storage
const saveAgentState = async () => {
  try {
    await AsyncStorage.setItem(AGENT_STATE_KEY, JSON.stringify(agentState));
  } catch (error) {
    console.error('Failed to save agent state:', error);
  }
};

// Load state from storage
export const loadAgentState = async (): Promise<AgentState> => {
  try {
    const stored = await AsyncStorage.getItem(AGENT_STATE_KEY);
    if (stored) {
      agentState = JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load agent state:', error);
  }
  return agentState;
};

// Start the agent
export const startAgent = async (mode: AgentMode = 'active'): Promise<void> => {
  await updateState({ isActive: true, mode });

  // Start background task if available
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
      minimumInterval: 60, // 1 minute
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch (error) {
    console.log('Background fetch not available:', error);
  }

  // Start monitoring loops
  startMonitoringLoop();

  const personality = getPersonality();
  const greeting = formatResponse(
    `Agent activated in ${mode} mode. I'm here to help.`,
    { isGreeting: true }
  );
  await speakNavigation(greeting);

  emitEvent('started', { mode });
};

// Stop the agent
export const stopAgent = async (): Promise<void> => {
  await updateState({ isActive: false, mode: 'sleep' });

  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TASK_NAME);
  } catch (error) {
    console.log('Failed to unregister background task:', error);
  }

  await speakNavigation('Agent deactivated. Stay safe!');
  emitEvent('stopped', {});
};

// Change agent mode
export const setAgentMode = async (mode: AgentMode): Promise<void> => {
  const previousMode = agentState.mode;
  await updateState({ mode });

  const modeDescriptions: Record<AgentMode, string> = {
    idle: 'Passive monitoring',
    active: 'Active assistance',
    navigation: 'Navigation mode',
    exploration: 'Exploration mode',
    social: 'Social mode - face recognition active',
    safety: 'Safety priority mode',
    sleep: 'Sleep mode',
  };

  if (previousMode !== mode) {
    await speakNavigation(`Switched to ${modeDescriptions[mode]}.`);
  }

  emitEvent('modeChange', { from: previousMode, to: mode });
};

// Monitoring loop for continuous sensing
let monitoringInterval: ReturnType<typeof setInterval> | null = null;
let idleTime = 0;

const startMonitoringLoop = () => {
  if (monitoringInterval) return;

  monitoringInterval = setInterval(async () => {
    if (!agentState.isActive || agentState.mode === 'sleep') {
      return;
    }

    idleTime += 5; // 5 second intervals

    // Skip intensive operations in battery optimization mode
    const skipIntensive = agentState.batteryOptimization && idleTime < 30;

    try {
      // Safety mode: constant obstacle monitoring
      if (agentState.mode === 'safety' || !skipIntensive) {
        await performSafetyCheck();
      }

      // Social mode: face detection
      if (agentState.mode === 'social' && !skipIntensive) {
        await performFaceDetection();
      }

      // Proactive suggestions based on idle time
      if (idleTime > 30) {
        const suggestion = generateProactiveSuggestion({
          idleTimeSeconds: idleTime,
          hasDestination: agentState.mode === 'navigation',
          recentObstacles: agentState.activeAlerts.some(a => a.type === 'obstacle'),
          knownPersonNearby: agentState.activeAlerts.some(a => a.type === 'person_recognized'),
        });

        if (suggestion && !isSpeaking()) {
          await speakNavigation(suggestion);
          idleTime = 0; // Reset idle after suggestion
        }
      }

    } catch (error) {
      console.error('Monitoring error:', error);
    }
  }, 5000); // Every 5 seconds
};

const stopMonitoringLoop = () => {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
};

// Safety check routine
const performSafetyCheck = async () => {
  // Detect obstacles
  const obstacles = await detectObstacles();

  if (obstacles.length > 0) {
    const announcements = await processAndAlertObstacles(obstacles, 3);

    // Create alerts
    for (const obs of obstacles) {
      if (obs.distance < 2) {
        await addAlert({
          type: 'obstacle',
          priority: obs.distance < 1 ? 'high' : 'medium',
          message: announcements[0] || `${obs.type} detected`,
          data: obs,
        });
      }
    }
  }

  // Detect stairs
  const stairs = await detectStairs();

  if (stairs.detected && stairs.confidence > 0.8) {
    await announceStairs(stairs);
    await addAlert({
      type: 'stairs',
      priority: stairs.direction === 'down' ? 'high' : 'medium',
      message: `Stairs ${stairs.direction} detected`,
      data: stairs,
    });
  }
};

// Face detection routine
const performFaceDetection = async () => {
  const faces = await detectFaces();

  if (faces.length > 0) {
    await processAndAnnounceFaces(faces, true);

    // Create alerts for recognized faces
    for (const face of faces) {
      if (face.matchedFaceId) {
        await addAlert({
          type: 'person_recognized',
          priority: 'low',
          message: `${face.matchedFaceName} is nearby`,
          data: face,
        });
      }
    }
  }
};

// Add an alert
const addAlert = async (
  alert: Omit<Alert, 'id' | 'timestamp' | 'acknowledged'>
): Promise<Alert> => {
  const newAlert: Alert = {
    ...alert,
    id: `alert_${Date.now()}`,
    timestamp: Date.now(),
    acknowledged: false,
  };

  // Limit alerts to 20
  const alerts = [newAlert, ...agentState.activeAlerts].slice(0, 20);
  await updateState({ activeAlerts: alerts });

  emitEvent('alert', newAlert);

  // Create memory for important alerts
  if (alert.priority === 'high' || alert.priority === 'critical') {
    await addMemory('event', alert.message, {
      importance: alert.priority === 'critical' ? 'critical' : 'high',
      tags: [alert.type],
    });
  }

  return newAlert;
};

// Acknowledge an alert
export const acknowledgeAlert = async (alertId: string): Promise<void> => {
  const alerts = agentState.activeAlerts.map(a =>
    a.id === alertId ? { ...a, acknowledged: true } : a
  );
  await updateState({ activeAlerts: alerts });
};

// Clear acknowledged alerts
export const clearAcknowledgedAlerts = async (): Promise<void> => {
  const alerts = agentState.activeAlerts.filter(a => !a.acknowledged);
  await updateState({ activeAlerts: alerts });
};

// Process user query with memory context
export const processQuery = async (
  query: string,
  context?: {
    currentLocation?: { latitude: number; longitude: number };
    environmentContext?: EnvironmentContext;
  }
): Promise<string> => {
  idleTime = 0; // Reset idle time on user interaction

  const queryLower = query.toLowerCase();

  // Check if it's a memory question
  if (
    queryLower.includes('remember') ||
    queryLower.includes('last time') ||
    queryLower.includes('when did') ||
    queryLower.includes('yesterday') ||
    queryLower.includes('earlier')
  ) {
    const memoryResult = await answerMemoryQuestion(query);
    if (memoryResult.found) {
      return formatResponse(memoryResult.answer, {});
    }
  }

  // Check for face-related queries
  if (
    queryLower.includes('who') ||
    queryLower.includes('person') ||
    queryLower.includes('someone')
  ) {
    // Trigger face detection
    await setAgentMode('social');
    return formatResponse(
      "I'll keep an eye out for people. I'll let you know when I recognize someone.",
      {}
    );
  }

  // Check for safety-related queries
  if (
    queryLower.includes('stairs') ||
    queryLower.includes('obstacle') ||
    queryLower.includes('safe')
  ) {
    await setAgentMode('safety');
    const stairs = await detectStairs();
    const obstacles = await detectObstacles();

    let response = '';

    if (stairs.detected) {
      response += await announceStairs(stairs);
    }

    if (obstacles.length > 0) {
      const announcements = await processAndAlertObstacles(obstacles, 5);
      response += announcements.join(' ');
    }

    if (!response) {
      response = 'The path ahead appears clear. No obstacles or stairs detected.';
    }

    return formatResponse(response, { isSafety: true });
  }

  // Default: describe surroundings or pass to AI model
  // In production, this would go to Gemini Live or similar
  return formatResponse(
    "I'm here to help. Ask me about your surroundings, navigation, or people nearby.",
    {}
  );
};

// Record user activity (for memory)
export const recordActivity = async (
  activity: string,
  context?: {
    location?: { latitude: number; longitude: number; placeName?: string };
    peopleInvolved?: string[];
  }
): Promise<void> => {
  await addMemory('event', activity, {
    importance: 'medium',
    location: context?.location,
    peopleInvolved: context?.peopleInvolved,
  });
};

// Get agent status summary
export const getAgentSummary = (): string => {
  const mode = agentState.mode;
  const alertCount = agentState.activeAlerts.filter(a => !a.acknowledged).length;
  const lastActive = new Date(agentState.lastActivity).toLocaleTimeString();

  let summary = `Agent: ${agentState.isActive ? 'Active' : 'Inactive'}`;
  summary += ` | Mode: ${mode}`;
  if (alertCount > 0) {
    summary += ` | ${alertCount} alert${alertCount > 1 ? 's' : ''}`;
  }

  return summary;
};

// Register background task
TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
  if (!agentState.isActive || agentState.mode === 'sleep') {
    return BackgroundFetch.BackgroundFetchResult.NoData;
  }

  try {
    // Minimal background processing
    if (agentState.mode === 'safety') {
      await performSafetyCheck();
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Cleanup on unmount
export const cleanupAgent = () => {
  stopMonitoringLoop();
};
