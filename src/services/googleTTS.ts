// Text-to-Speech Service
// Uses expo-speech as primary, can be extended to Google Cloud TTS with proper setup
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

interface TTSOptions {
  text: string;
  speakingRate?: number;
  pitch?: number;
}

let isSpeakingFlag = false;

// Speak text using TTS
export const speakWithGoogle = async (options: TTSOptions): Promise<void> => {
  const { text, speakingRate = 1.0, pitch = 1.0 } = options;

  // Stop any currently playing audio
  await stopSpeaking();

  isSpeakingFlag = true;

  return new Promise((resolve) => {
    Speech.speak(text, {
      language: 'en-US',
      rate: speakingRate,
      pitch: pitch,
      onDone: () => {
        isSpeakingFlag = false;
        resolve();
      },
      onError: () => {
        isSpeakingFlag = false;
        resolve();
      },
    });
  });
};

// Stop any currently playing speech
export const stopSpeaking = async (): Promise<void> => {
  try {
    await Speech.stop();
    isSpeakingFlag = false;
  } catch (e) {
    // Ignore errors when stopping
  }
};

// Check if currently speaking
export const isSpeaking = (): boolean => {
  return isSpeakingFlag;
};

// Speak a navigation instruction with priority
export const speakNavigation = async (instruction: string): Promise<void> => {
  // Navigation has high priority - stop current speech
  await stopSpeaking();
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  await speakWithGoogle({ text: instruction });
};

// Create SSML for navigation instruction (for future Google TTS)
export const createNavigationSSML = (
  instruction: string,
  distance?: string,
  isUrgent: boolean = false
): string => {
  const rate = isUrgent ? 'medium' : 'slow';
  const emphasis = isUrgent ? 'strong' : 'moderate';

  let ssml = '<speak>';

  if (isUrgent) {
    ssml += `<emphasis level="${emphasis}">${instruction}</emphasis>`;
  } else {
    ssml += `<prosody rate="${rate}">${instruction}</prosody>`;
  }

  if (distance) {
    ssml += `<break time="300ms"/><prosody rate="medium">${distance}</prosody>`;
  }

  ssml += '</speak>';
  return ssml;
};

// Speak with SSML (falls back to plain text for now)
export const speakNavigationSSML = async (ssml: string): Promise<void> => {
  // Strip SSML tags and speak as plain text
  const plainText = ssml.replace(/<[^>]*>/g, '');
  await speakNavigation(plainText);
};
