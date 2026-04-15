import { create } from 'zustand';
import type { Session, DeviceInfo, UserStats, AppSettings, Message, VoiceState } from '../types';
import { fetchSessions, saveSession, subscribeToSessions } from '../services/sessionService';
import type { Unsubscribe } from 'firebase/firestore';

interface AppState {
  // Device state
  device: DeviceInfo | null;
  setDevice: (device: DeviceInfo | null) => void;
  updateDeviceStatus: (status: DeviceInfo['status']) => void;

  // Session state
  currentSession: Session | null;
  sessions: Session[];
  voiceState: VoiceState;
  sessionsLoaded: boolean;

  // Session actions
  startSession: () => void;
  endSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  setVoiceState: (state: VoiceState) => void;

  // Firestore sync
  loadSessions: () => Promise<void>;
  subscribeToSessionUpdates: () => Unsubscribe;
  setSessions: (sessions: Session[]) => void;

  // Stats
  stats: UserStats;
  updateStats: () => void;

  // Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const defaultSettings: AppSettings = {
  voiceSpeed: 1.0,
  voicePitch: 1.0,
  hapticFeedback: true,
  autoReadResponses: true,
  continuousListening: false,
  highContrastMode: false,
  largeText: false,
  useGoogleTTS: true,
  // Personality
  personalityId: 'assistant',
  // 24x7 Agent
  agentAlwaysOn: true,
  agentBatteryOptimization: true,
  // Safety
  stairDetectionEnabled: true,
  obstacleAlertDistance: 3,
  depthPerceptionEnabled: true,
  // Face Recognition
  faceRecognitionEnabled: true,
  announceKnownFaces: true,
  // Memory
  memoryEnabled: true,
  memoryRetentionDays: 30,
  // Privacy
  cloudStorageEnabled: true,  // Default to enabled for better UX
};

const defaultStats: UserStats = {
  totalSessions: 0,
  totalDuration: 0,
  totalMessages: 0,
  averageSessionDuration: 0,
  sessionsThisWeek: 0,
  sessionsToday: 0,
  streak: 0,
};

export const useStore = create<AppState>((set, get) => ({
  // Device
  device: {
    id: 'dev-server-001',
    name: 'iSpy Gadget (Development)',
    status: 'connected',
    batteryLevel: 87,
    firmwareVersion: '1.0.3',
    lastSeen: Date.now(),
  },
  setDevice: (device) => set({ device }),
  updateDeviceStatus: (status) =>
    set((state) => ({
      device: state.device ? { ...state.device, status, lastSeen: Date.now() } : null,
    })),

  // Session
  currentSession: null,
  sessions: [],
  sessionsLoaded: false,
  voiceState: 'idle',

  startSession: () =>
    set((state) => {
      const newSession: Session = {
        id: generateId(),
        startTime: Date.now(),
        messages: [],
        status: 'active',
        duration: 0,
      };
      return {
        currentSession: newSession,
        voiceState: 'idle',
      };
    }),

  endSession: () => {
    const state = get();
    if (!state.currentSession) {
      console.log('[Store] endSession called but no current session');
      return;
    }

    const endedSession: Session = {
      ...state.currentSession,
      endTime: Date.now(),
      status: 'ended',
      duration: Math.floor((Date.now() - state.currentSession.startTime) / 1000),
      title: `Session ${state.sessions.length + 1}`,
    };

    console.log('[Store] Ending session:', endedSession.id, 'with', endedSession.messages.length, 'messages');

    // Save to Firestore
    saveSession(endedSession, state.settings.cloudStorageEnabled)
      .then(() => {
        console.log('[Store] Session saved to Firestore successfully');
      })
      .catch(err => {
        console.error('[Store] Failed to save session to Firestore:', err);
      });

    set({
      currentSession: null,
      sessions: [endedSession, ...state.sessions],
      voiceState: 'idle',
    });
  },

  pauseSession: () =>
    set((state) => ({
      currentSession: state.currentSession
        ? { ...state.currentSession, status: 'paused' }
        : null,
    })),

  resumeSession: () =>
    set((state) => ({
      currentSession: state.currentSession
        ? { ...state.currentSession, status: 'active' }
        : null,
    })),

  addMessage: (message) =>
    set((state) => {
      if (!state.currentSession) return state;
      const newMessage: Message = {
        ...message,
        id: generateId(),
        timestamp: Date.now(),
      };
      return {
        currentSession: {
          ...state.currentSession,
          messages: [...state.currentSession.messages, newMessage],
        },
      };
    }),

  setVoiceState: (voiceState) => set({ voiceState }),

  // Firestore sync
  loadSessions: async () => {
    try {
      const { settings } = get();
      const sessions = await fetchSessions(settings.cloudStorageEnabled);
      set({ sessions, sessionsLoaded: true });
    } catch (error) {
      console.error('Failed to load sessions:', error);
      set({ sessionsLoaded: true });
    }
  },

  subscribeToSessionUpdates: () => {
    return subscribeToSessions((sessions) => {
      set({ sessions, sessionsLoaded: true });
    });
  },

  setSessions: (sessions) => set({ sessions }),

  // Stats
  stats: defaultStats,

  updateStats: () =>
    set((state) => {
      const sessions = state.sessions;
      const now = Date.now();
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;

      const totalDuration = sessions.reduce((acc, s) => acc + s.duration, 0);
      const totalMessages = sessions.reduce((acc, s) => acc + s.messages.length, 0);
      const sessionsToday = sessions.filter((s) => s.startTime >= todayStart).length;
      const sessionsThisWeek = sessions.filter((s) => s.startTime >= weekStart).length;

      return {
        stats: {
          totalSessions: sessions.length,
          totalDuration,
          totalMessages,
          averageSessionDuration: sessions.length > 0 ? totalDuration / sessions.length : 0,
          sessionsToday,
          sessionsThisWeek,
          streak: state.stats.streak,
          lastSessionDate: sessions[0]?.startTime,
        },
      };
    }),

  // Settings
  settings: defaultSettings,
  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),
}));
