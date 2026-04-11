// Core types for i-spy app

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  audioPlayed?: boolean;
  // Memory context
  relatedMemoryIds?: string[];
  detectedFaces?: string[]; // IDs of recognized faces
  location?: { latitude: number; longitude: number };
  environmentContext?: EnvironmentContext;
}

// Memory System Types
export interface Memory {
  id: string;
  timestamp: number;
  type: MemoryType;
  content: string;
  summary?: string;
  // Temporal references
  relatedTimestamp?: number; // "remember when..." references
  // Context
  location?: { latitude: number; longitude: number; placeName?: string };
  peopleInvolved?: string[]; // Face IDs
  sessionId?: string;
  // Importance for retrieval
  importance: 'low' | 'medium' | 'high' | 'critical';
  // Embedding for semantic search (placeholder for vector DB)
  embedding?: number[];
  tags?: string[];
}

export type MemoryType =
  | 'conversation'
  | 'location_visit'
  | 'person_met'
  | 'event'
  | 'user_preference'
  | 'learned_route'
  | 'important_place';

export interface MemoryQuery {
  query: string;
  timeRange?: { start: number; end: number };
  types?: MemoryType[];
  peopleIds?: string[];
  location?: { latitude: number; longitude: number; radiusMeters: number };
  limit?: number;
}

// Personality Configuration
export interface PersonalityConfig {
  name: string;
  voiceTone: 'friendly' | 'professional' | 'casual' | 'warm' | 'concise';
  verbosity: 'minimal' | 'balanced' | 'detailed';
  formality: 'informal' | 'neutral' | 'formal';
  humor: boolean;
  encouragement: boolean;
  proactivity: 'reactive' | 'balanced' | 'proactive';
  // Custom traits
  customPrompt?: string;
  preferredGreeting?: string;
  signOffPhrase?: string;
}

export const DEFAULT_PERSONALITIES: Record<string, PersonalityConfig> = {
  assistant: {
    name: 'Assistant',
    voiceTone: 'professional',
    verbosity: 'balanced',
    formality: 'neutral',
    humor: false,
    encouragement: true,
    proactivity: 'balanced',
  },
  friend: {
    name: 'Buddy',
    voiceTone: 'friendly',
    verbosity: 'balanced',
    formality: 'informal',
    humor: true,
    encouragement: true,
    proactivity: 'proactive',
    preferredGreeting: "Hey! What's up?",
  },
  guide: {
    name: 'Navigator',
    voiceTone: 'concise',
    verbosity: 'minimal',
    formality: 'neutral',
    humor: false,
    encouragement: false,
    proactivity: 'proactive',
  },
  companion: {
    name: 'Companion',
    voiceTone: 'warm',
    verbosity: 'detailed',
    formality: 'informal',
    humor: true,
    encouragement: true,
    proactivity: 'proactive',
    preferredGreeting: "Good to see you again!",
  },
};

// Face Recognition Types
export interface KnownFace {
  id: string;
  name: string;
  relationship?: string; // "friend", "family", "coworker", etc.
  notes?: string;
  // Face encoding (placeholder - would come from ML model)
  faceEncoding?: number[];
  // Photos for training
  photoUris?: string[];
  createdAt: number;
  lastSeen?: number;
  seenCount: number;
  // Custom greeting
  customGreeting?: string;
}

export interface FaceDetectionResult {
  boundingBox: { x: number; y: number; width: number; height: number };
  confidence: number;
  matchedFaceId?: string;
  matchedFaceName?: string;
  isNew: boolean;
}

// Depth Perception Types
export interface DepthMap {
  width: number;
  height: number;
  // Depth values in meters
  data: Float32Array | number[];
  timestamp: number;
}

export interface ObstacleDetection {
  id: string;
  type: ObstacleType;
  distance: number; // meters
  direction: 'left' | 'center' | 'right' | 'above' | 'below';
  width?: number;
  height?: number;
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export type ObstacleType =
  | 'stairs_up'
  | 'stairs_down'
  | 'curb'
  | 'step_up'
  | 'step_down'
  | 'wall'
  | 'pole'
  | 'person'
  | 'vehicle'
  | 'door'
  | 'furniture'
  | 'low_hanging'
  | 'ground_hazard'
  | 'unknown';

// Stair Detection Types
export interface StairInfo {
  detected: boolean;
  direction: 'up' | 'down' | 'unknown';
  stepCount?: number;
  stepHeight?: number; // estimated cm
  stepDepth?: number; // estimated cm
  hasRailing: 'left' | 'right' | 'both' | 'none' | 'unknown';
  distance: number; // meters to first step
  confidence: number;
  warnings?: string[];
}

// Environment Context
export interface EnvironmentContext {
  timestamp: number;
  lighting: 'bright' | 'normal' | 'dim' | 'dark';
  terrain: 'indoor' | 'outdoor' | 'mixed';
  crowdLevel: 'empty' | 'sparse' | 'moderate' | 'crowded';
  noiseLevel?: 'quiet' | 'moderate' | 'loud';
  weather?: string;
  nearbyPlaces?: string[];
  obstacles: ObstacleDetection[];
  stairs?: StairInfo;
  facesDetected: FaceDetectionResult[];
}

// 24x7 Agent Types
export interface AgentState {
  isActive: boolean;
  mode: AgentMode;
  lastActivity: number;
  activeAlerts: Alert[];
  currentTask?: string;
  batteryOptimization: boolean;
}

export type AgentMode =
  | 'idle'           // Passive monitoring
  | 'active'         // Active assistance
  | 'navigation'     // Turn-by-turn nav
  | 'exploration'    // Describing surroundings
  | 'social'         // Face recognition mode
  | 'safety'         // Obstacle/stair detection priority
  | 'sleep';         // Minimal power mode

export interface Alert {
  id: string;
  type: AlertType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  acknowledged: boolean;
  data?: unknown;
}

export type AlertType =
  | 'obstacle'
  | 'stairs'
  | 'person_recognized'
  | 'navigation_turn'
  | 'arrived'
  | 'low_battery'
  | 'connection_lost'
  | 'weather_change'
  | 'reminder';

export interface Session {
  id: string;
  startTime: number;
  endTime?: number;
  messages: Message[];
  status: 'active' | 'paused' | 'ended';
  duration: number; // in seconds
  title?: string;
  destination?: Destination;
  navigationMode?: boolean;
}

export interface Destination {
  placeId: string;
  name: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface DeviceInfo {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'connecting';
  batteryLevel?: number;
  lastSeen?: number;
  firmwareVersion?: string;
}

export interface UserStats {
  totalSessions: number;
  totalDuration: number; // in seconds
  totalMessages: number;
  averageSessionDuration: number;
  sessionsThisWeek: number;
  sessionsToday: number;
  streak: number; // consecutive days of use
  lastSessionDate?: number;
}

export interface AppSettings {
  voiceSpeed: number; // 0.5 to 2.0
  voicePitch: number; // 0.5 to 2.0
  hapticFeedback: boolean;
  autoReadResponses: boolean;
  continuousListening: boolean;
  highContrastMode: boolean;
  largeText: boolean;
  useGoogleTTS: boolean;
  // Personality
  personalityId: string;
  customPersonality?: PersonalityConfig;
  // 24x7 Agent
  agentAlwaysOn: boolean;
  agentBatteryOptimization: boolean;
  // Safety
  stairDetectionEnabled: boolean;
  obstacleAlertDistance: number; // meters
  depthPerceptionEnabled: boolean;
  // Face Recognition
  faceRecognitionEnabled: boolean;
  announceKnownFaces: boolean;
  // Memory
  memoryEnabled: boolean;
  memoryRetentionDays: number;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

export type SessionStatus = 'active' | 'paused' | 'ended';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export type NavigationState = 'idle' | 'searching' | 'routing' | 'navigating' | 'arrived';

// Navigation types
export type RootStackParamList = {
  Main: undefined;
  Session: undefined;
  SessionDetail: { sessionId: string };
};

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Stats: undefined;
  Settings: undefined;
};
