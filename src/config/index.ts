// i-spy Server Configuration
// The laptop runs the server with camera, mic, and speaker
// The mobile app is just a remote control

export const SERVER_CONFIG = {
  // ============================================
  // SET YOUR LAPTOP IP ADDRESS HERE
  // ============================================
  // Find your laptop's IP:
  //   macOS: System Settings > Network > Wi-Fi > Details > IP Address
  //   Windows: ipconfig | findstr IPv4
  //   Linux: hostname -I
  //
  // Make sure both devices are on the same Wi-Fi network
  // ============================================

  IP_ADDRESS: 'localhost',  // <-- CHANGE THIS TO YOUR LAPTOP IP
  PORT: 8000,

  // Computed base URL (don't modify)
  get BASE_URL() {
    return `http://${this.IP_ADDRESS}:${this.PORT}`;
  },
} as const;

// API Endpoints (relative to BASE_URL)
export const API_ENDPOINTS = {
  // Health check
  STATUS: '/status',

  // Ask mode (vision + voice question)
  ASK_START: '/ask/start',
  ASK_STOP: '/ask/stop',

  // Watch mode (background monitoring)
  WATCH_START: '/watch/start',
  WATCH_STOP: '/watch/stop',
  WATCH_CANCEL: '/watch',
} as const;

// Request timeout settings
export const REQUEST_CONFIG = {
  TIMEOUT_MS: 30000,  // 30 seconds for processing requests
  POLL_INTERVAL_MS: 2000,  // Status polling interval
} as const;
