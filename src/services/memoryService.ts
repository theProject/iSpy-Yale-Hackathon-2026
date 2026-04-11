// Memory Service - Persistent conversation memory with temporal awareness
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Memory, MemoryType, MemoryQuery, Message } from '../types';

const MEMORY_STORAGE_KEY = '@ispy_memories';
const MAX_MEMORIES = 1000;

let memoryCache: Memory[] = [];

// Generate unique ID
const generateId = () => `mem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// Load memories from storage
export const loadMemories = async (): Promise<Memory[]> => {
  try {
    const stored = await AsyncStorage.getItem(MEMORY_STORAGE_KEY);
    if (stored) {
      memoryCache = JSON.parse(stored);
    }
    return memoryCache;
  } catch (error) {
    console.error('Failed to load memories:', error);
    return [];
  }
};

// Save memories to storage
const saveMemories = async (): Promise<void> => {
  try {
    // Keep only most recent memories
    if (memoryCache.length > MAX_MEMORIES) {
      memoryCache = memoryCache
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, MAX_MEMORIES);
    }
    await AsyncStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memoryCache));
  } catch (error) {
    console.error('Failed to save memories:', error);
  }
};

// Add a new memory
export const addMemory = async (
  type: MemoryType,
  content: string,
  options: Partial<Omit<Memory, 'id' | 'timestamp' | 'type' | 'content'>> = {}
): Promise<Memory> => {
  const memory: Memory = {
    id: generateId(),
    timestamp: Date.now(),
    type,
    content,
    importance: options.importance || 'medium',
    ...options,
  };

  memoryCache.unshift(memory);
  await saveMemories();
  return memory;
};

// Create memory from message
export const createMemoryFromMessage = async (
  message: Message,
  sessionId: string,
  context?: { location?: Memory['location']; peopleInvolved?: string[] }
): Promise<Memory> => {
  const importance = determineImportance(message.content);

  return addMemory('conversation', message.content, {
    sessionId,
    importance,
    location: context?.location,
    peopleInvolved: context?.peopleInvolved,
    summary: summarizeContent(message.content),
    tags: extractTags(message.content),
  });
};

// Determine importance of content
const determineImportance = (content: string): Memory['importance'] => {
  const lowerContent = content.toLowerCase();

  // Critical - safety related
  if (lowerContent.includes('stairs') ||
      lowerContent.includes('danger') ||
      lowerContent.includes('careful') ||
      lowerContent.includes('watch out')) {
    return 'critical';
  }

  // High - people, places, important info
  if (lowerContent.includes('remember') ||
      lowerContent.includes('meet') ||
      lowerContent.includes('arrived') ||
      lowerContent.includes('face') ||
      lowerContent.includes('friend')) {
    return 'high';
  }

  // Medium - general navigation
  if (lowerContent.includes('turn') ||
      lowerContent.includes('walk') ||
      lowerContent.includes('ahead')) {
    return 'medium';
  }

  return 'low';
};

// Simple content summarization
const summarizeContent = (content: string): string => {
  // Take first sentence or first 100 chars
  const firstSentence = content.split(/[.!?]/)[0];
  return firstSentence.length > 100
    ? firstSentence.substring(0, 100) + '...'
    : firstSentence;
};

// Extract relevant tags from content
const extractTags = (content: string): string[] => {
  const tags: string[] = [];
  const lowerContent = content.toLowerCase();

  const tagKeywords: Record<string, string[]> = {
    'navigation': ['turn', 'walk', 'ahead', 'left', 'right', 'straight'],
    'safety': ['stairs', 'curb', 'obstacle', 'careful', 'watch'],
    'people': ['person', 'someone', 'friend', 'face', 'approaching'],
    'places': ['shop', 'store', 'building', 'entrance', 'door'],
    'signs': ['sign', 'read', 'says', 'written'],
  };

  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    if (keywords.some(kw => lowerContent.includes(kw))) {
      tags.push(tag);
    }
  }

  return tags;
};

// Query memories with filters
export const queryMemories = async (query: MemoryQuery): Promise<Memory[]> => {
  let results = [...memoryCache];

  // Filter by time range
  if (query.timeRange) {
    results = results.filter(m =>
      m.timestamp >= query.timeRange!.start &&
      m.timestamp <= query.timeRange!.end
    );
  }

  // Filter by types
  if (query.types && query.types.length > 0) {
    results = results.filter(m => query.types!.includes(m.type));
  }

  // Filter by people
  if (query.peopleIds && query.peopleIds.length > 0) {
    results = results.filter(m =>
      m.peopleInvolved?.some(p => query.peopleIds!.includes(p))
    );
  }

  // Filter by location proximity
  if (query.location) {
    results = results.filter(m => {
      if (!m.location) return false;
      const distance = calculateDistance(
        query.location!.latitude,
        query.location!.longitude,
        m.location.latitude,
        m.location.longitude
      );
      return distance <= query.location!.radiusMeters;
    });
  }

  // Text search (simple keyword matching)
  if (query.query) {
    const queryLower = query.query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);

    results = results.filter(m => {
      const contentLower = m.content.toLowerCase();
      const summaryLower = (m.summary || '').toLowerCase();
      const tagsLower = (m.tags || []).join(' ').toLowerCase();
      const combined = `${contentLower} ${summaryLower} ${tagsLower}`;

      return queryWords.some(word => combined.includes(word));
    });

    // Sort by relevance (number of matching words)
    results.sort((a, b) => {
      const aContent = `${a.content} ${a.summary || ''} ${(a.tags || []).join(' ')}`.toLowerCase();
      const bContent = `${b.content} ${b.summary || ''} ${(b.tags || []).join(' ')}`.toLowerCase();

      const aScore = queryWords.filter(w => aContent.includes(w)).length;
      const bScore = queryWords.filter(w => bContent.includes(w)).length;

      return bScore - aScore;
    });
  }

  // Sort by timestamp (most recent first) if no query
  if (!query.query) {
    results.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Apply limit
  if (query.limit) {
    results = results.slice(0, query.limit);
  }

  return results;
};

// Get memories from a specific time period
export const getMemoriesFromPeriod = async (
  period: 'today' | 'yesterday' | 'this_week' | 'this_month'
): Promise<Memory[]> => {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  let start: number;
  let end = now;

  switch (period) {
    case 'today':
      start = new Date().setHours(0, 0, 0, 0);
      break;
    case 'yesterday':
      start = new Date().setHours(0, 0, 0, 0) - dayMs;
      end = new Date().setHours(0, 0, 0, 0);
      break;
    case 'this_week':
      start = now - (7 * dayMs);
      break;
    case 'this_month':
      start = now - (30 * dayMs);
      break;
    default:
      start = 0;
  }

  return queryMemories({ query: '', timeRange: { start, end } });
};

// Get memories related to a person
export const getMemoriesWithPerson = async (
  personId: string,
  limit = 10
): Promise<Memory[]> => {
  return queryMemories({
    query: '',
    peopleIds: [personId],
    limit,
  });
};

// Format memory for natural language response
export const formatMemoryForResponse = (memory: Memory): string => {
  const date = new Date(memory.timestamp);
  const timeAgo = getTimeAgo(memory.timestamp);

  let formatted = `${timeAgo}: ${memory.summary || memory.content}`;

  if (memory.location?.placeName) {
    formatted += ` (at ${memory.location.placeName})`;
  }

  return formatted;
};

// Get human-readable time ago string
export const getTimeAgo = (timestamp: number): string => {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay === 1) return 'yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) > 1 ? 's' : ''} ago`;

  return new Date(timestamp).toLocaleDateString();
};

// Answer questions about memories
export const answerMemoryQuestion = async (
  question: string
): Promise<{ found: boolean; answer: string; memories: Memory[] }> => {
  const questionLower = question.toLowerCase();

  // Parse temporal references
  let timeRange: { start: number; end: number } | undefined;
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  if (questionLower.includes('today')) {
    timeRange = { start: new Date().setHours(0, 0, 0, 0), end: now };
  } else if (questionLower.includes('yesterday')) {
    const yesterdayStart = new Date().setHours(0, 0, 0, 0) - dayMs;
    timeRange = { start: yesterdayStart, end: yesterdayStart + dayMs };
  } else if (questionLower.includes('last week') || questionLower.includes('this week')) {
    timeRange = { start: now - (7 * dayMs), end: now };
  } else if (questionLower.includes('last month')) {
    timeRange = { start: now - (30 * dayMs), end: now };
  }

  // Extract query keywords (remove common words)
  const stopWords = ['what', 'when', 'where', 'who', 'did', 'was', 'were', 'the', 'a', 'an', 'is', 'are', 'do', 'you', 'remember', 'about', 'tell', 'me'];
  const queryWords = questionLower
    .split(/\s+/)
    .filter(w => !stopWords.includes(w) && w.length > 2);

  const memories = await queryMemories({
    query: queryWords.join(' '),
    timeRange,
    limit: 5,
  });

  if (memories.length === 0) {
    return {
      found: false,
      answer: "I don't have any memories matching that. Could you be more specific?",
      memories: [],
    };
  }

  // Format response
  const memoryDescriptions = memories
    .slice(0, 3)
    .map(m => formatMemoryForResponse(m))
    .join('\n');

  return {
    found: true,
    answer: `Here's what I remember:\n${memoryDescriptions}`,
    memories,
  };
};

// Delete old memories (retention policy)
export const cleanupOldMemories = async (retentionDays: number): Promise<number> => {
  const cutoff = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
  const originalCount = memoryCache.length;

  // Keep critical and high importance memories longer
  memoryCache = memoryCache.filter(m => {
    if (m.importance === 'critical') return true;
    if (m.importance === 'high' && m.timestamp > cutoff - (30 * 24 * 60 * 60 * 1000)) return true;
    return m.timestamp > cutoff;
  });

  await saveMemories();
  return originalCount - memoryCache.length;
};

// Clear all memories
export const clearAllMemories = async (): Promise<void> => {
  memoryCache = [];
  await AsyncStorage.removeItem(MEMORY_STORAGE_KEY);
};

// Helper: Calculate distance between two coordinates (Haversine)
const calculateDistance = (
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
