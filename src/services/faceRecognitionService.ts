// Face Recognition Service - Manage known contacts and recognize faces
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import type { KnownFace, FaceDetectionResult } from '../types';
import { speakNavigation } from './googleTTS';

const FACES_STORAGE_KEY = '@ispy_known_faces';

let knownFaces: KnownFace[] = [];

const generateId = () => `face_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// Load known faces from storage
export const loadKnownFaces = async (): Promise<KnownFace[]> => {
  try {
    const stored = await AsyncStorage.getItem(FACES_STORAGE_KEY);
    if (stored) {
      knownFaces = JSON.parse(stored);
    }
    return knownFaces;
  } catch (error) {
    console.error('Failed to load known faces:', error);
    return [];
  }
};

// Save known faces to storage
const saveKnownFaces = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(FACES_STORAGE_KEY, JSON.stringify(knownFaces));
  } catch (error) {
    console.error('Failed to save known faces:', error);
  }
};

// Add a new known face
export const addKnownFace = async (
  name: string,
  options: Partial<Omit<KnownFace, 'id' | 'name' | 'createdAt' | 'seenCount'>> = {}
): Promise<KnownFace> => {
  const face: KnownFace = {
    id: generateId(),
    name,
    createdAt: Date.now(),
    seenCount: 0,
    ...options,
  };

  knownFaces.push(face);
  await saveKnownFaces();
  return face;
};

// Update a known face
export const updateKnownFace = async (
  id: string,
  updates: Partial<Omit<KnownFace, 'id' | 'createdAt'>>
): Promise<KnownFace | null> => {
  const index = knownFaces.findIndex(f => f.id === id);
  if (index === -1) return null;

  knownFaces[index] = { ...knownFaces[index], ...updates };
  await saveKnownFaces();
  return knownFaces[index];
};

// Delete a known face
export const deleteKnownFace = async (id: string): Promise<boolean> => {
  const index = knownFaces.findIndex(f => f.id === id);
  if (index === -1) return false;

  knownFaces.splice(index, 1);
  await saveKnownFaces();
  return true;
};

// Get all known faces
export const getAllKnownFaces = (): KnownFace[] => {
  return knownFaces.sort((a, b) => b.seenCount - a.seenCount);
};

// Get a specific known face
export const getKnownFace = (id: string): KnownFace | undefined => {
  return knownFaces.find(f => f.id === id);
};

// Find known face by name
export const findKnownFaceByName = (name: string): KnownFace | undefined => {
  const nameLower = name.toLowerCase();
  return knownFaces.find(f => f.name.toLowerCase().includes(nameLower));
};

// Record that a face was seen
export const recordFaceSeen = async (id: string): Promise<void> => {
  const face = knownFaces.find(f => f.id === id);
  if (face) {
    face.lastSeen = Date.now();
    face.seenCount += 1;
    await saveKnownFaces();
  }
};

// Simulate face detection (would be replaced with actual ML model)
// In production, this would integrate with Google Cloud Vision API,
// TensorFlow Lite, or a custom ML model on the iSpy Gadget
export const detectFaces = async (
  _imageUri?: string // Image from camera
): Promise<FaceDetectionResult[]> => {
  // Simulated face detection for demo
  // In production, this would:
  // 1. Send image to ML model (on-device or cloud)
  // 2. Get face embeddings
  // 3. Compare with known face embeddings
  // 4. Return matches

  // For demo, randomly detect faces
  const results: FaceDetectionResult[] = [];

  // Simulate detection with 30% chance
  if (Math.random() > 0.7 && knownFaces.length > 0) {
    const randomFace = knownFaces[Math.floor(Math.random() * knownFaces.length)];

    results.push({
      boundingBox: { x: 100, y: 100, width: 150, height: 180 },
      confidence: 0.85 + Math.random() * 0.15, // 85-100% confidence
      matchedFaceId: randomFace.id,
      matchedFaceName: randomFace.name,
      isNew: false,
    });
  }

  // Chance of unknown face
  if (Math.random() > 0.8) {
    results.push({
      boundingBox: { x: 300, y: 120, width: 140, height: 170 },
      confidence: 0.7 + Math.random() * 0.2,
      isNew: true,
    });
  }

  return results;
};

// Process face detection and announce recognized faces
export const processAndAnnounceFaces = async (
  results: FaceDetectionResult[],
  shouldSpeak = true
): Promise<string[]> => {
  const announcements: string[] = [];

  for (const result of results) {
    if (result.matchedFaceId && result.matchedFaceName) {
      // Known face detected
      const face = getKnownFace(result.matchedFaceId);
      await recordFaceSeen(result.matchedFaceId);

      let announcement: string;

      // Use custom greeting if available
      if (face?.customGreeting) {
        announcement = face.customGreeting;
      } else {
        const relationship = face?.relationship ? `, your ${face.relationship},` : '';
        announcement = `${result.matchedFaceName}${relationship} is nearby.`;
      }

      announcements.push(announcement);

      if (shouldSpeak) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await speakNavigation(announcement);
      }
    } else if (result.isNew) {
      const announcement = 'Someone is approaching.';
      announcements.push(announcement);

      if (shouldSpeak && result.confidence > 0.8) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Only announce high-confidence unknown faces
        await speakNavigation(announcement);
      }
    }
  }

  return announcements;
};

// Get time since last seen text
export const getLastSeenText = (face: KnownFace): string => {
  if (!face.lastSeen) {
    return 'Never seen';
  }

  const now = Date.now();
  const diffMs = now - face.lastSeen;
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 5) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) > 1 ? 's' : ''} ago`;

  return new Date(face.lastSeen).toLocaleDateString();
};

// Generate description for a face encounter
export const describeFaceEncounter = (
  face: KnownFace,
  distance?: string
): string => {
  const parts: string[] = [];

  parts.push(face.name);

  if (face.relationship) {
    parts.push(`your ${face.relationship}`);
  }

  if (distance) {
    parts.push(`is about ${distance} away`);
  } else {
    parts.push('is nearby');
  }

  if (face.seenCount > 1 && face.lastSeen) {
    const lastSeenText = getLastSeenText(face);
    if (lastSeenText !== 'Just now') {
      parts.push(`Last seen: ${lastSeenText}`);
    }
  }

  return parts.join('. ') + '.';
};

// Search known faces
export const searchKnownFaces = (query: string): KnownFace[] => {
  const queryLower = query.toLowerCase();

  return knownFaces.filter(face => {
    return (
      face.name.toLowerCase().includes(queryLower) ||
      face.relationship?.toLowerCase().includes(queryLower) ||
      face.notes?.toLowerCase().includes(queryLower)
    );
  });
};

// Get faces by relationship
export const getFacesByRelationship = (relationship: string): KnownFace[] => {
  const relLower = relationship.toLowerCase();
  return knownFaces.filter(f =>
    f.relationship?.toLowerCase() === relLower
  );
};

// Add sample faces for demo
export const addSampleFaces = async (): Promise<void> => {
  if (knownFaces.length > 0) return; // Already has faces

  const samples = [
    { name: 'Sarah', relationship: 'friend', notes: 'Lives nearby', customGreeting: "Hey! Sarah is here!" },
    { name: 'Mom', relationship: 'family', customGreeting: "Your mom is approaching!" },
    { name: 'John', relationship: 'coworker', notes: 'Works in engineering' },
    { name: 'Dr. Chen', relationship: 'doctor', notes: 'Primary care physician' },
  ];

  for (const sample of samples) {
    await addKnownFace(sample.name, {
      relationship: sample.relationship,
      notes: sample.notes,
      customGreeting: sample.customGreeting,
    });
  }
};
