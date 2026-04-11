// Depth Perception & Stair Detection Service
// Computer Vision for obstacle detection, depth estimation, and stair assistance
import * as Haptics from 'expo-haptics';
import type {
  DepthMap,
  ObstacleDetection,
  ObstacleType,
  StairInfo,
  EnvironmentContext,
} from '../types';
import { speakNavigation, stopSpeaking } from './googleTTS';

// Configuration
const DEPTH_CONFIG = {
  // Distance thresholds (meters)
  IMMEDIATE_DANGER: 0.5,    // Urgent alert
  CLOSE_OBSTACLE: 1.5,      // Warning
  NEARBY_OBSTACLE: 3.0,     // Info
  STAIR_DETECTION_RANGE: 4.0,

  // Alert cooldowns (ms)
  IMMEDIATE_ALERT_COOLDOWN: 1000,
  WARNING_COOLDOWN: 3000,
  INFO_COOLDOWN: 5000,

  // Confidence thresholds
  MIN_OBSTACLE_CONFIDENCE: 0.7,
  MIN_STAIR_CONFIDENCE: 0.8,
};

// Track last alerts to avoid spam
const lastAlerts: Map<string, number> = new Map();

// Check if we should alert for this obstacle
const shouldAlert = (obstacleId: string, cooldownMs: number): boolean => {
  const lastAlert = lastAlerts.get(obstacleId);
  const now = Date.now();

  if (!lastAlert || (now - lastAlert) > cooldownMs) {
    lastAlerts.set(obstacleId, now);
    return true;
  }
  return false;
};

// Process depth map and detect obstacles
// In production, this would receive depth data from the iSpy Gadget's depth sensors
// (e.g., LiDAR, stereo cameras, structured light)
export const processDepthMap = async (
  depthMap: DepthMap
): Promise<ObstacleDetection[]> => {
  const obstacles: ObstacleDetection[] = [];

  // This is a simulation - in production, this would:
  // 1. Process depth map from hardware sensors
  // 2. Run ML model for object classification
  // 3. Calculate distances and directions

  // Simulated obstacle detection for demo
  // The actual implementation would use TensorFlow Lite or similar

  return obstacles;
};

// Detect stairs from camera/depth input
// Returns detailed stair information for cane users
export const detectStairs = async (
  _imageUri?: string,
  _depthMap?: DepthMap
): Promise<StairInfo> => {
  // Simulated stair detection for demo
  // In production, this would:
  // 1. Use ML model trained on stair images
  // 2. Analyze depth map for step patterns
  // 3. Estimate step count, height, and depth

  // For demo, simulate with random detection
  const detected = Math.random() > 0.85;

  if (!detected) {
    return {
      detected: false,
      direction: 'unknown',
      distance: 0,
      confidence: 0,
      hasRailing: 'unknown',
    };
  }

  const direction = Math.random() > 0.5 ? 'up' : 'down';
  const stepCount = Math.floor(Math.random() * 12) + 3; // 3-15 steps

  return {
    detected: true,
    direction,
    stepCount,
    stepHeight: 15 + Math.random() * 5, // 15-20 cm
    stepDepth: 25 + Math.random() * 10, // 25-35 cm
    hasRailing: ['left', 'right', 'both', 'none'][Math.floor(Math.random() * 4)] as StairInfo['hasRailing'],
    distance: 1 + Math.random() * 3, // 1-4 meters
    confidence: 0.8 + Math.random() * 0.2,
    warnings: direction === 'down' ? ['Caution: stairs going down'] : undefined,
  };
};

// Announce stairs for cane user
export const announceStairs = async (stairInfo: StairInfo): Promise<string> => {
  if (!stairInfo.detected || stairInfo.confidence < DEPTH_CONFIG.MIN_STAIR_CONFIDENCE) {
    return '';
  }

  let announcement = '';

  // Direction and distance
  const directionText = stairInfo.direction === 'up' ? 'going up' : 'going down';
  announcement = `Stairs ${directionText}, ${stairInfo.distance.toFixed(0)} meters ahead.`;

  // Step count
  if (stairInfo.stepCount) {
    announcement += ` About ${stairInfo.stepCount} steps.`;
  }

  // Railing info (crucial for cane users)
  switch (stairInfo.hasRailing) {
    case 'left':
      announcement += ' Railing on your left.';
      break;
    case 'right':
      announcement += ' Railing on your right.';
      break;
    case 'both':
      announcement += ' Railings on both sides.';
      break;
    case 'none':
      announcement += ' No railings detected. Use caution.';
      break;
  }

  // Warnings
  if (stairInfo.warnings && stairInfo.warnings.length > 0) {
    announcement += ` ${stairInfo.warnings[0]}`;
  }

  // Haptic alert
  Haptics.notificationAsync(
    stairInfo.direction === 'down'
      ? Haptics.NotificationFeedbackType.Warning
      : Haptics.NotificationFeedbackType.Success
  );

  // Speak the announcement
  await speakNavigation(announcement);

  return announcement;
};

// Detect and classify obstacles
export const detectObstacles = async (
  _imageUri?: string,
  _depthMap?: DepthMap
): Promise<ObstacleDetection[]> => {
  // Simulated obstacle detection for demo
  const obstacles: ObstacleDetection[] = [];

  // Random chance of obstacle for demo
  if (Math.random() > 0.7) {
    const types: ObstacleType[] = [
      'pole', 'person', 'curb', 'step_up', 'step_down',
      'low_hanging', 'furniture', 'ground_hazard',
    ];

    const type = types[Math.floor(Math.random() * types.length)];
    const distance = 0.5 + Math.random() * 3;

    obstacles.push({
      id: `obs_${Date.now()}`,
      type,
      distance,
      direction: ['left', 'center', 'right'][Math.floor(Math.random() * 3)] as 'left' | 'center' | 'right',
      confidence: 0.7 + Math.random() * 0.3,
    });
  }

  return obstacles;
};

// Generate obstacle announcement
export const generateObstacleAnnouncement = (obstacle: ObstacleDetection): string => {
  const distanceText = obstacle.distance < 1
    ? `${(obstacle.distance * 100).toFixed(0)} centimeters`
    : `${obstacle.distance.toFixed(1)} meters`;

  const directionText = obstacle.direction === 'center'
    ? 'directly ahead'
    : `to your ${obstacle.direction}`;

  const typeDescriptions: Record<ObstacleType, string> = {
    stairs_up: 'Stairs going up',
    stairs_down: 'Stairs going down',
    curb: 'Curb',
    step_up: 'Step up',
    step_down: 'Step down',
    wall: 'Wall',
    pole: 'Pole',
    person: 'Person',
    vehicle: 'Vehicle',
    door: 'Door',
    furniture: 'Furniture',
    low_hanging: 'Low hanging obstacle',
    ground_hazard: 'Ground hazard',
    unknown: 'Obstacle',
  };

  return `${typeDescriptions[obstacle.type]} ${directionText}, ${distanceText}.`;
};

// Process obstacles and alert user
export const processAndAlertObstacles = async (
  obstacles: ObstacleDetection[],
  alertDistance: number
): Promise<string[]> => {
  const announcements: string[] = [];

  // Sort by distance (closest first)
  const sortedObstacles = obstacles
    .filter(o => o.confidence >= DEPTH_CONFIG.MIN_OBSTACLE_CONFIDENCE)
    .sort((a, b) => a.distance - b.distance);

  for (const obstacle of sortedObstacles) {
    // Skip if too far
    if (obstacle.distance > alertDistance) continue;

    // Determine alert level
    let cooldown: number;
    let hapticType: Haptics.NotificationFeedbackType;

    if (obstacle.distance <= DEPTH_CONFIG.IMMEDIATE_DANGER) {
      cooldown = DEPTH_CONFIG.IMMEDIATE_ALERT_COOLDOWN;
      hapticType = Haptics.NotificationFeedbackType.Error;
    } else if (obstacle.distance <= DEPTH_CONFIG.CLOSE_OBSTACLE) {
      cooldown = DEPTH_CONFIG.WARNING_COOLDOWN;
      hapticType = Haptics.NotificationFeedbackType.Warning;
    } else {
      cooldown = DEPTH_CONFIG.INFO_COOLDOWN;
      hapticType = Haptics.NotificationFeedbackType.Success;
    }

    // Check if we should alert
    const obstacleKey = `${obstacle.type}_${obstacle.direction}`;
    if (!shouldAlert(obstacleKey, cooldown)) continue;

    // Generate and speak announcement
    const announcement = generateObstacleAnnouncement(obstacle);
    announcements.push(announcement);

    // Haptic feedback
    Haptics.notificationAsync(hapticType);

    // Speak if immediate danger
    if (obstacle.distance <= DEPTH_CONFIG.CLOSE_OBSTACLE) {
      await stopSpeaking(); // Interrupt current speech for urgent alert
      await speakNavigation(announcement);
    }
  }

  return announcements;
};

// Get environment context from camera/sensors
export const analyzeEnvironment = async (
  _imageUri?: string,
  _depthMap?: DepthMap
): Promise<EnvironmentContext> => {
  // Simulated environment analysis
  // In production, this would use ML models for:
  // - Scene classification
  // - Lighting estimation
  // - Crowd density
  // - Weather detection (outdoor)

  const obstacles = await detectObstacles();
  const stairs = await detectStairs();

  return {
    timestamp: Date.now(),
    lighting: ['bright', 'normal', 'dim', 'dark'][Math.floor(Math.random() * 4)] as EnvironmentContext['lighting'],
    terrain: Math.random() > 0.5 ? 'indoor' : 'outdoor',
    crowdLevel: ['empty', 'sparse', 'moderate', 'crowded'][Math.floor(Math.random() * 4)] as EnvironmentContext['crowdLevel'],
    obstacles,
    stairs: stairs.detected ? stairs : undefined,
    facesDetected: [],
  };
};

// Generate cane guidance based on environment
export const generateCaneGuidance = (
  stairInfo?: StairInfo,
  obstacles?: ObstacleDetection[]
): string => {
  const guidance: string[] = [];

  // Stair guidance
  if (stairInfo?.detected) {
    if (stairInfo.direction === 'down') {
      guidance.push('Locate edge with cane before descending.');
      if (stairInfo.hasRailing !== 'none') {
        guidance.push(`Use ${stairInfo.hasRailing === 'both' ? 'either' : stairInfo.hasRailing} railing.`);
      }
    } else {
      guidance.push('Steps ascending ahead.');
      guidance.push('Use cane to locate first step edge.');
    }
  }

  // Obstacle guidance
  if (obstacles && obstacles.length > 0) {
    const groundHazards = obstacles.filter(o =>
      ['curb', 'step_up', 'step_down', 'ground_hazard'].includes(o.type)
    );

    if (groundHazards.length > 0) {
      guidance.push('Ground level changes ahead. Sweep carefully.');
    }
  }

  return guidance.join(' ');
};

// Depth pattern analysis for stair detection
// This would use computer vision to detect repeating horizontal edges
export const analyzeStairPattern = (depthMap: DepthMap): {
  isStairs: boolean;
  confidence: number;
  stepCount: number;
} => {
  // Placeholder - in production this would:
  // 1. Look for repeating horizontal edges in depth map
  // 2. Detect consistent step height patterns
  // 3. Estimate step count from pattern

  return {
    isStairs: false,
    confidence: 0,
    stepCount: 0,
  };
};

// Clear alert history
export const clearAlertHistory = (): void => {
  lastAlerts.clear();
};
