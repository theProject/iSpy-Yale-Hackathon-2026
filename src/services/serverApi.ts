// Server API Service
// Communicates with the laptop server for vision + voice assistance

import { SERVER_CONFIG, API_ENDPOINTS, REQUEST_CONFIG } from '../config';

// Types
export interface ServerStatus {
  status: 'running' | 'error';
  camera: number | string;
  recording: boolean;
  recording_mode: 'ask' | 'watch' | null;
  watch_active: boolean;
  watch_condition: string | null;
}

export interface AskResponse {
  query?: string;
  response?: string;
  error?: string;
}

export interface WatchResponse {
  status?: 'recording' | 'watching' | 'cancelled' | 'no_active_watch';
  condition?: string;
  error?: string;
  response?: string;
}

// Helper for making requests with timeout
const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeout: number = REQUEST_CONFIG.TIMEOUT_MS
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Get full URL for endpoint
const getUrl = (endpoint: string): string => {
  return `${SERVER_CONFIG.BASE_URL}${endpoint}`;
};

/**
 * Check server status and connection
 */
export const getServerStatus = async (): Promise<ServerStatus | null> => {
  try {
    const response = await fetchWithTimeout(getUrl(API_ENDPOINTS.STATUS), {
      method: 'GET',
    }, 5000); // Quick timeout for status checks

    if (!response.ok) {
      console.error('Server status error:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to connect to server:', error);
    return null;
  }
};

/**
 * Start recording for ask mode
 * User presses button -> call this
 */
export const startAsk = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetchWithTimeout(getUrl(API_ENDPOINTS.ASK_START), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();
    return { success: data.status === 'recording' };
  } catch (error) {
    console.error('Failed to start ask:', error);
    return { success: false, error: 'Connection failed' };
  }
};

/**
 * Stop recording and get AI response
 * User releases button -> call this
 */
export const stopAsk = async (): Promise<AskResponse> => {
  try {
    const response = await fetchWithTimeout(getUrl(API_ENDPOINTS.ASK_STOP), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    return await response.json();
  } catch (error) {
    console.error('Failed to stop ask:', error);
    return { error: 'Connection failed' };
  }
};

/**
 * Start recording for watch mode
 * User presses watch button -> call this
 */
export const startWatch = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetchWithTimeout(getUrl(API_ENDPOINTS.WATCH_START), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();
    return { success: data.status === 'recording' };
  } catch (error) {
    console.error('Failed to start watch:', error);
    return { success: false, error: 'Connection failed' };
  }
};

/**
 * Stop recording and activate watch
 * User releases watch button -> call this
 */
export const stopWatch = async (): Promise<WatchResponse> => {
  try {
    const response = await fetchWithTimeout(getUrl(API_ENDPOINTS.WATCH_STOP), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    return await response.json();
  } catch (error) {
    console.error('Failed to stop watch:', error);
    return { error: 'Connection failed' };
  }
};

/**
 * Cancel active watch
 */
export const cancelWatch = async (): Promise<WatchResponse> => {
  try {
    const response = await fetchWithTimeout(getUrl(API_ENDPOINTS.WATCH_CANCEL), {
      method: 'DELETE',
    });

    return await response.json();
  } catch (error) {
    console.error('Failed to cancel watch:', error);
    return { error: 'Connection failed' };
  }
};
