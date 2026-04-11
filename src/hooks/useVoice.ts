import { useState, useCallback, useRef, useEffect } from 'react';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { useStore } from '../store';
import type { VoiceState } from '../types';

interface UseVoiceOptions {
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onSpeechError?: (error: Error) => void;
}

export const useVoice = (options: UseVoiceOptions = {}) => {
  const { settings } = useStore();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const speechQueueRef = useRef<string[]>([]);

  const speak = useCallback(async (text: string, immediate = false) => {
    if (immediate) {
      await Speech.stop();
      speechQueueRef.current = [];
    }

    return new Promise<void>((resolve, reject) => {
      setIsSpeaking(true);
      setVoiceState('speaking');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      Speech.speak(text, {
        language: 'en-US',
        rate: settings.voiceSpeed,
        pitch: settings.voicePitch,
        onStart: () => {
          options.onSpeechStart?.();
        },
        onDone: () => {
          setIsSpeaking(false);
          setVoiceState('idle');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          options.onSpeechEnd?.();
          resolve();
        },
        onError: (error) => {
          setIsSpeaking(false);
          setVoiceState('idle');
          options.onSpeechError?.(new Error(String(error)));
          reject(error);
        },
      });
    });
  }, [settings.voiceSpeed, settings.voicePitch, options]);

  const stopSpeaking = useCallback(async () => {
    await Speech.stop();
    speechQueueRef.current = [];
    setIsSpeaking(false);
    setVoiceState('idle');
  }, []);

  const queueSpeech = useCallback((text: string) => {
    speechQueueRef.current.push(text);
    if (!isSpeaking && speechQueueRef.current.length === 1) {
      const nextText = speechQueueRef.current.shift();
      if (nextText) {
        speak(nextText);
      }
    }
  }, [isSpeaking, speak]);

  // Process speech queue
  useEffect(() => {
    if (!isSpeaking && speechQueueRef.current.length > 0) {
      const nextText = speechQueueRef.current.shift();
      if (nextText) {
        speak(nextText);
      }
    }
  }, [isSpeaking, speak]);

  return {
    speak,
    stopSpeaking,
    queueSpeech,
    isSpeaking,
    voiceState,
    setVoiceState,
  };
};
