# iSpy - AI Vision Assistant for the Blind

## PR: Complete Setup and Initial Features

This PR implements the core functionality of iSpy, an AI-powered wearable vision system that helps blind users navigate and understand their environment through voice commands.

### Changes Made

#### Backend (Python/FastAPI)
- **Camera Integration**: OpenCV-based camera capture with configurable sources
- **AI Vision**: Gemini 1.5 Flash integration for real-time object recognition
- **Speech Processing**:
  - Vosk for offline wake word detection ("Hey Hellen")
  - Google Cloud TTS for high-quality voice responses
  - Pyttsx3 fallback for offline TTS
- **API Endpoints**:
  - `/status` - Health check and system status
  - `/ask/start` & `/ask/stop` - Voice question processing
  - `/watch/start` & `/watch/stop` - Continuous monitoring mode
- **CORS Support**: Added middleware for web app integration
- **Environment Configuration**: `.env` support with example file

#### Frontend (React Native/Expo)
- **Cross-platform App**: iOS, Android, and Web support
- **Voice Interface**: Hands-free interaction with wake words
- **Real-time Status**: Server connection monitoring
- **Session Management**: Conversation history and context
- **Location Services**: Google Maps integration for navigation

#### Development Setup
- **Python Environment**: Virtual environment with pyenv
- **Package Management**: Switched to pnpm for better performance
- **Git Configuration**: Comprehensive `.gitignore` for Python/Node.js
- **Documentation**: Setup guides and API references

### Technical Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Camera Feed   │  HTTP   │   FastAPI Server │  HTTP   │   React Native  │
│   (OpenCV)      │ ──────> │   (Python)       │ <────── │   App (Expo)     │
└─────────────────┘         └─────────────────┘         └─────────────────┘
        │                           │                           │
        ▼                           ▼                           ▼
   Real-time Capture         Gemini AI Processing         Voice Commands
   (JPEG frames)             (Vision + Conversation)      (Wake words)
```

### Key Features Implemented
- ✅ Hands-free wake word activation ("Hey Hellen")
- ✅ Real-time camera capture and AI analysis
- ✅ Voice responses with TTS
- ✅ Watch mode for continuous monitoring
- ✅ Session memory and context
- ✅ Cross-platform mobile/web app
- ✅ CORS-enabled API for web integration

### Setup Instructions
1. **Backend**:
   ```bash
   cd server
   pip install -r requirements.txt
   cp .env.example .env  # Configure API keys
   python main.py
   ```

2. **Frontend**:
   ```bash
   npm install  # or pnpm install
   npx expo start --web
   ```

### Future Enhancements

#### High Priority
- **Response UI Improvements**:
  - Add scrollbar for longer AI responses
  - Better text formatting and readability
  - Response history with pagination

- **Watch Mode Enhancements**:
  - Improved object recognition accuracy
  - Emotional state detection in responses
  - Customizable alert thresholds
  - Multi-object tracking

#### Medium Priority
- **Assistant Customization**:
  - Multiple personality modes (formal, friendly, technical)
  - Voice selection and TTS preferences
  - Custom wake words and commands

- **Advanced Features**:
  - Scene description with spatial relationships
  - Color and texture recognition
  - Text reading from images
  - Face recognition for familiar people

#### Long-term Vision
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

### Testing
- ✅ Camera capture and frame processing
- ✅ Gemini API integration
- ✅ Wake word detection
- ✅ CORS cross-origin requests
- ✅ Expo web app connectivity
- ✅ Voice recording and transcription

### Dependencies
- **Backend**: Python 3.10+, FastAPI, OpenCV, Vosk, Gemini SDK
- **Frontend**: React Native, Expo, TypeScript
- **AI**: Google Gemini 1.5 Flash
- **Speech**: Vosk (offline), Google Cloud TTS

### Security Notes
- API keys stored in environment variables
- CORS configured for development (restrict in production)
- No sensitive data logging
- Camera/microphone permissions required

This PR establishes the foundation for iSpy as a comprehensive AI vision assistant, with room for extensive future development in accessibility technology.