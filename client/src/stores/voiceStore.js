import { useState, useEffect } from 'react';
import { audioDiagnostics } from '../services/audioDiagnostics.js';
import { speechService } from '../services/speechService.js';

// Lightweight Zero-Dependency Reactive Store
let state = {
  // Library State
  voices: [],
  activeVoice: null,
  presets: [],
  clonedVoices: [],
  isLoadingVoices: false,

  // Preview State
  isPreviewPlaying: false,
  previewVoiceId: null,
  previewAudioUrl: null,

  // Filters & Customization
  selectedCategory: 'all',
  selectedProvider: 'all',
  searchQuery: '',

  // Real-time Sliders (Speed, Pitch, Stability, Style)
  settings: {
    speed: 1.0,
    pitch: 0.0,
    stability: 0.5,
    style: 0.0,
    useSpeakerBoost: true,
    emotion: 'neutral'
  },

  // A/B Comparison State
  abVoiceA: null,
  abVoiceB: null,
  abPhrase: 'Hello boss, F.R.I.D.A.Y. standing by for voice comparison.'
};

let currentAudioElement = null;
const listeners = new Set();

function setState(updater) {
  state = typeof updater === 'function' ? updater(state) : { ...state, ...updater };
  listeners.forEach((listener) => listener(state));
}

export const useVoiceStore = () => {
  const [storeState, setStoreState] = useState(state);

  useEffect(() => {
    listeners.add(setStoreState);
    return () => listeners.delete(setStoreState);
  }, []);

  const actions = {
    fetchVoices: async () => {
      setState({ isLoadingVoices: true });
      try {
        const res = await fetch('/api/v1/voices');
        const json = await res.json();
        if (json.success) {
          const active = json.activeVoice || json.voices[0] || null;
          setState({
            voices: json.voices || [],
            activeVoice: active,
            clonedVoices: (json.voices || []).filter(v => v.isCloned)
          });
          if (active) {
            speechService.setActiveVoiceProfile(active);
          }
        }
      } catch (err) {
        console.warn('Fetch voices error:', err);
      } finally {
        setState({ isLoadingVoices: false });
      }
    },

    setActiveVoice: async (voice) => {
      setState({ activeVoice: voice });
      speechService.setActiveVoiceProfile(voice);
      try {
        await fetch('/api/v1/voices/select', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voiceId: voice.id })
        });
      } catch (err) {
        console.warn('Set active voice error:', err);
      }
    },

    // Hybrid HD Voice Preview Player
    playPreview: async (voiceId, customText) => {
      await audioDiagnostics.unlockAudioContext();
      actions.stopPreview();

      const textToSpeak = customText || 'Hello, I am F.R.I.D.A.Y., your AI voice secretary.';
      const voice = state.voices.find(v => v.id === voiceId) || state.activeVoice;

      setState({ isPreviewPlaying: true, previewVoiceId: voiceId });

      try {
        const res = await fetch('/api/v1/tts/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voiceId, text: textToSpeak, settings: state.settings })
        });
        const json = await res.json();

        let playedAudioStream = false;

        // If backend Proxy returns direct base64 audio stream (ElevenLabs HD)
        if (json.success && json.audioUrl) {
          try {
            const audio = new Audio(json.audioUrl);
            currentAudioElement = audio;

            audio.onended = () => actions.stopPreview();
            audio.onerror = () => {
              console.warn('[VoiceStore] Audio stream failed. Falling back to HD SpeechSynthesis.');
              speechService.speak(textToSpeak, { voiceId, ...state.settings });
            };

            await audio.play();
            playedAudioStream = true;
          } catch (e) {
            console.warn('[VoiceStore] Audio play error:', e);
          }
        }

        if (!playedAudioStream) {
          // Distinct Voice Characteristics Fallback
          console.log(`[VoiceStore] Auditioning Voice: ${voice?.name} (${voiceId})`);
          await speechService.speak(textToSpeak, { voiceId, ...state.settings });
        }
      } catch (err) {
        console.warn('[VoiceStore] Synthesis error, falling back:', err);
        await speechService.speak(textToSpeak, { voiceId, ...state.settings });
      } finally {
        setTimeout(() => {
          if (state.previewVoiceId === voiceId) {
            actions.stopPreview();
          }
        }, 4200);
      }
    },

    stopPreview: () => {
      if (currentAudioElement) {
        try {
          currentAudioElement.pause();
          currentAudioElement = null;
        } catch (e) {}
      }
      speechService.stopSpeaking('User stopped preview');
      setState({ isPreviewPlaying: false, previewVoiceId: null });
    },

    updateSettings: (newSettings) => {
      setState((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...newSettings }
      }));
    },

    fetchPresets: async () => {
      try {
        const res = await fetch('/api/v1/voices/presets');
        const json = await res.json();
        if (json.success) {
          setState({ presets: json.presets || [] });
        }
      } catch (err) {
        console.warn('Fetch presets error:', err);
      }
    },

    savePreset: async (name, autoActivateOn = null) => {
      const { activeVoice, settings } = state;
      if (!activeVoice) return;

      try {
        const res = await fetch('/api/v1/voices/presets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            voiceId: activeVoice.id,
            provider: activeVoice.provider,
            ...settings,
            autoActivateOn
          })
        });
        const json = await res.json();
        if (json.success) {
          actions.fetchPresets();
        }
      } catch (err) {
        console.warn('Save preset error:', err);
      }
    },

    setABVoices: (voiceA, voiceB) => {
      setState({ abVoiceA: voiceA, abVoiceB: voiceB });
    },

    setCategory: (category) => setState({ selectedCategory: category }),
    setProvider: (provider) => setState({ selectedProvider: provider }),
    setSearchQuery: (query) => setState({ searchQuery: query })
  };

  return { ...storeState, ...actions };
};
