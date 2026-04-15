# i-spy Setup & Integration Guide

## Quick Start

```bash
# Install dependencies
npm install

# Start Expo
npx expo start

# Run on iOS simulator
npx expo start --ios
```

---

## API Keys Required

### 1. Google Maps Platform

Create a project at [Google Cloud Console](https://console.cloud.google.com/) and enable:

- **Maps SDK for iOS** - Display maps
- **Maps SDK for Android** - Display maps
- **Places API** - Destination search, nearby places
- **Directions API** - Turn-by-turn navigation
- **Geocoding API** - Address to coordinates

```bash
# Create .env file in project root
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_api_key_here
```

**iOS Setup** - Add to `app.json`:
```json
{
  "expo": {
    "ios": {
      "config": {
        "googleMapsApiKey": "YOUR_API_KEY"
      }
    }
  }
}
```

### 2. Google Cloud Text-to-Speech (Optional)

For premium Google voices (app falls back to expo-speech if not configured):

---

## Future Features & Roadmap

### High Priority
- **Response UI Improvements**:
  - Add scrollbar for longer AI responses
  - Better text formatting and readability
  - Response history with pagination

- **Watch Mode Enhancements**:
  - Improved object recognition accuracy
  - Emotional state detection in responses
  - Customizable alert thresholds
  - Multi-object tracking

### Medium Priority
- **Assistant Customization**:
  - Multiple personality modes (formal, friendly, technical)
  - Voice selection and TTS preferences
  - Custom wake words and commands

- **Advanced Features**:
  - Scene description with spatial relationships
  - Color and texture recognition
  - Text reading from images
  - Face recognition for familiar people

### Long-term Vision
- **IoT Integration**:
  - ESP32-based wearable device
  - Gemma 2B model for on-device processing
  - Bluetooth connectivity for seamless pairing
  - Battery-optimized edge computing

- **Accessibility Improvements**:
  - Haptic feedback for alerts
  - Braille display support
  - Multi-language support
  - Offline mode with cached responses

1. Enable **Cloud Text-to-Speech API** in Google Cloud Console
2. Create service account with TTS permissions
3. Add API key:

```bash
EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY=your_cloud_api_key_here
```

---

## Integrating the AI Model (Gemini Live)

The app is designed to be model-agnostic. Currently uses mock responses for demo.

### Where to Integrate

1. **src/services/agentService.ts** - `processQuery()` function
   - Currently returns mock responses
   - Replace with Gemini API call

2. **src/screens/SessionScreen.tsx** - `handleVoicePress()` function
   - Currently uses mock AI responses
   - Should send audio/text to Gemini Live

### Gemini Live Integration Steps

```typescript
// Example integration in agentService.ts

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY);

export const processQuery = async (query: string, context?: Context): Promise<string> => {
  // Build context from memory
  const memories = await queryMemories({ query, limit: 5 });
  const memoryContext = memories.map(m => formatMemoryForResponse(m)).join('\n');

  // Build personality prompt
  const personalityPrompt = buildSystemPrompt();

  // Include environment context
  const environmentInfo = context?.environmentContext
    ? `Current environment: ${JSON.stringify(context.environmentContext)}`
    : '';

  const model = genAI.getGenerativeModel({
    model: 'gemini-pro',
    systemInstruction: personalityPrompt,
  });

  const result = await model.generateContent([
    `Previous context:\n${memoryContext}\n\n${environmentInfo}\n\nUser: ${query}`
  ]);

  const response = result.response.text();

  // Save to memory
  await addMemory('conversation', response, { importance: 'medium' });

  return formatResponse(response, {});
};
```

### Real-time Audio with Gemini Live

For continuous voice interaction:

```typescript
// Use expo-av for audio recording
import { Audio } from 'expo-av';

// Stream audio to Gemini Live API
// Receive streaming audio response
// Use expo-speech or Google TTS to speak response
```

---

## Computer Vision Integration

### Face Recognition

**Current:** Mock implementation in `src/services/faceRecognitionService.ts`

**To Implement:**
1. **Google Cloud Vision API** - Face detection
2. **TensorFlow Lite** - On-device face embeddings
3. **Custom ML Model** - Train on user's contacts

```typescript
// Replace detectFaces() in faceRecognitionService.ts

import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

// Load face detection model
const model = await tf.loadGraphModel(bundleResourceIO(modelJson, modelWeights));

// Process camera frame
const predictions = await model.predict(tensor);
```

### Depth Perception / Stair Detection

**Current:** Mock implementation in `src/services/depthPerceptionService.ts`

**Hardware Options:**
1. **LiDAR** (iPhone 12 Pro+) - Use ARKit
2. **Stereo Cameras** - Custom iSpy Gadget hardware
3. **Monocular Depth** - ML model on single camera

**ML Models to Consider:**
- MiDaS - Monocular depth estimation
- YOLO - Object detection
- Custom stair detection CNN

```typescript
// Example ARKit depth integration (iOS)
import { ARSession } from 'expo-ar';

// Get depth data from LiDAR
const depthData = await ARSession.getDepthMap();
```

---

## Hardware Integration (iSpy Gadget)

### Bluetooth Connection

```typescript
// Use react-native-ble-plx for Bluetooth
import { BleManager } from 'react-native-ble-plx';

const manager = new BleManager();

// Scan for iSpy Gadget
manager.startDeviceScan(null, null, (error, device) => {
  if (device?.name?.includes('i-spy')) {
    // Connect and set up data streams
  }
});
```

### Expected Data Streams from iSpy Gadget

| Stream | Description | Format |
|--------|-------------|--------|
| Camera | Video feed | MJPEG/H.264 |
| Depth | Depth map | Float32 array |
| IMU | Orientation/motion | Quaternion + Accel |
| Audio | Microphone | PCM 16-bit |
| Battery | Battery level | Percentage |

---

## Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Navigation | Ready | Needs API keys |
| Voice TTS | Ready | Uses expo-speech |
| Memory System | Ready | AsyncStorage persisted |
| Face Recognition | Mock | Needs ML model |
| Depth Perception | Mock | Needs hardware/ML |
| Stair Detection | Mock | Needs CV model |
| 24x7 Agent | Ready | Background task registered |
| Personality | Ready | 4 presets available |

---

## Testing Checklist

### Before Demo
- [ ] Add Google Maps API key
- [ ] Test Places Autocomplete search
- [ ] Test Directions with real route
- [ ] Verify TTS speaks directions
- [ ] Add sample faces in Settings
- [ ] Test personality switching

### With Hardware
- [ ] Bluetooth pairing flow
- [ ] Camera stream processing
- [ ] Depth sensor integration
- [ ] Real-time face detection
- [ ] Stair detection alerts

---

## Environment Variables

Create `.env` in project root:

```bash
# Google Maps Platform
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...

# Google Cloud (for premium TTS)
EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY=AIza...

# Gemini API (for AI integration)
EXPO_PUBLIC_GEMINI_API_KEY=AIza...
```

---

## File Structure

```
src/
├── components/        # UI components
├── screens/           # App screens
├── services/
│   ├── agentService.ts         # 24x7 agent logic
│   ├── memoryService.ts        # Conversation memory
│   ├── personalityService.ts   # AI personality
│   ├── faceRecognitionService.ts
│   ├── depthPerceptionService.ts
│   ├── googleDirections.ts     # Navigation
│   ├── googleMapsTools.ts      # Places, geocoding
│   └── googleTTS.ts            # Text-to-speech
├── store/             # Zustand state
├── types/             # TypeScript types
├── config/            # API configuration
└── theme/             # Design tokens
```

---

## Next Steps

1. **Add API Keys** - Google Maps, Cloud TTS
2. **Test Navigation** - Real routes with TTS
3. **Integrate Gemini** - Replace mock responses
4. **Add ML Models** - Face detection, depth
5. **Hardware Integration** - Connect actual iSpy Gadget
6. **User Testing** - Test with visually impaired users

---

## Resources

- [Google Maps Platform](https://developers.google.com/maps)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Expo Documentation](https://docs.expo.dev)
- [TensorFlow.js React Native](https://www.tensorflow.org/js/guide/react_native)
- [ARKit Depth](https://developer.apple.com/documentation/arkit/environmental_analysis/displaying_a_point_cloud_using_scene_depth)
