import { useState, useEffect } from 'react';
import { audioDiagnostics } from '../services/audioDiagnostics.js';
import { speechService } from '../services/speechService.js';
import { audioPlaybackService } from '../services/audioPlaybackService.js';

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
    stability: 0.30,
    similarity_boost: 0.90,
    style: 0.55,
    useSpeakerBoost: true,
    emotion: 'neutral'
  },

  // A/B Comparison State
  abVoiceA: null,
  abVoiceB: null,
  abPhrase: 'Hello boss, F.R.I.D.A.Y. standing by for voice comparison.'
};

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

    // Raw Audio Binary Stream Preview Player
    playPreview: async (voiceId, customText) => {
      await audioDiagnostics.unlockAudioContext();
      actions.stopPreview();

      const textToSpeak = customText || 'Hello, I am F.R.I.D.A.Y., your AI voice secretary.';
      const voice = state.voices.find(v => v.id === voiceId) || state.activeVoice;

      setState({ isPreviewPlaying: true, previewVoiceId: voiceId });

      try {
        await audioPlaybackService.playRawAudio(textToSpeak, voiceId, state.settings);
      } catch (err) {
        console.warn('[VoiceStore] Playback error:', err);
      } finally {
        // Automatically reset state when playback finishes or errors
        if (state.previewVoiceId === voiceId && !audioPlaybackService.isPlaying) {
          actions.stopPreview();
        }
      }
    },

    stopPreview: () => {
      audioPlaybackService.stop();
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
