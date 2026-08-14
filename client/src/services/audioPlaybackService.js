// services/audioPlaybackService.js — High-Fidelity Hybrid Audio Playback Engine
import { audioDiagnostics } from './audioDiagnostics.js';
import { speechService } from './speechService.js';

class AudioPlaybackService {
  constructor() {
    this.audioContext = null;
    this.currentAudio = null;
    this.currentSource = null;
    this.currentBlobUrl = null;
    this.isPlaying = false;
    this.onStateChangeCallbacks = [];
  }

  getAudioContext() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx({
          sampleRate: 44100,
          latencyHint: 'playback'
        });
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  /**
   * Play an audio URL (Blob URL or Base64 Data URI) using HTML5 Audio element with Web Audio fallback
   */
  async playAudioUrl(url, fallbackText = null, voiceId = null, settings = {}) {
    // Stop any existing playing audio without revoking the incoming url
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {}
      this.currentAudio = null;
    }
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (e) {}
      this.currentSource = null;
    }
    speechService.stopSpeaking('New audio started');
    this.setPlaying(true);

    return new Promise((resolve) => {
      try {
        const audio = new Audio();
        audio.src = url;
        audio.preload = 'auto';
        audio.volume = 1.0;
        this.currentAudio = audio;

        const cleanup = () => {
          this.setPlaying(false);
          this.currentAudio = null;
          if (this.currentBlobUrl && this.currentBlobUrl === url) {
            try {
              URL.revokeObjectURL(this.currentBlobUrl);
            } catch (e) {}
            this.currentBlobUrl = null;
          }
        };

        audio.oncanplaythrough = () => {
          audio.play().then(() => {
            console.log('[AudioPlaybackService] SUCCESS: Native HTML5 Audio playback started.');
            resolve(true);
          }).catch(async (playErr) => {
            console.warn('[AudioPlaybackService] audio.play() promise rejected:', playErr.message);
            cleanup();
            if (fallbackText) {
              await speechService.speak(fallbackText, { voiceId, ...settings });
            }
            resolve(false);
          });
        };

        audio.onended = () => {
          console.log('[AudioPlaybackService] Audio playback finished.');
          cleanup();
        };

        audio.onerror = async (e) => {
          console.warn('[AudioPlaybackService] HTML5 Audio element encountered error:', e);
          cleanup();
          if (fallbackText) {
            await speechService.speak(fallbackText, { voiceId, ...settings });
          }
          resolve(false);
        };

        // Trigger load
        audio.load();
      } catch (err) {
        console.error('[AudioPlaybackService] Exception creating Audio element:', err);
        if (fallbackText) {
          speechService.speak(fallbackText, { voiceId, ...settings });
        }
        this.setPlaying(false);
        resolve(false);
      }
    });
  }

  /**
   * Fetch raw MPEG audio blob from proxy, create blob URL, and play via high-compatibility player
   */
  async playRawAudio(text, voiceId, settings = {}) {
    await audioDiagnostics.unlockAudioContext();
    this.stop();

    try {
      this.setPlaying(true);
      console.log(`[AudioPlaybackService] Requesting TTS synthesis from backend for voice '${voiceId}'...`);

      const response = await fetch('/api/v1/tts/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg, application/json'
        },
        body: JSON.stringify({
          text,
          voiceId,
          settings
        })
      });

      const contentType = response.headers.get('Content-Type') || '';
      console.log(`[AudioPlaybackService] Server Response: HTTP ${response.status} (Content-Type: '${contentType}')`);

      // 1. Raw Binary Audio Blob
      if (response.ok && contentType.includes('audio/mpeg')) {
        const blob = await response.blob();
        console.log(`[AudioPlaybackService] Binary MPEG Blob received (${blob.size} bytes). Preparing HTML5 Audio playback...`);

        if (blob.size > 100) {
          if (this.currentBlobUrl) {
            URL.revokeObjectURL(this.currentBlobUrl);
          }
          this.currentBlobUrl = URL.createObjectURL(blob);
          return await this.playAudioUrl(this.currentBlobUrl, text, voiceId, settings);
        }
      } 
      // 2. JSON Fallback with Base64 audioUrl
      else if (response.ok && contentType.includes('application/json')) {
        const json = await response.json();
        console.log(`[AudioPlaybackService] JSON response received. Has audioUrl: ${Boolean(json?.audioUrl)}`);

        if (json.audioUrl && json.audioUrl.startsWith('data:audio/')) {
          console.log('[AudioPlaybackService] Playing base64 data URI via HTML5 Audio...');
          return await this.playAudioUrl(json.audioUrl, text, voiceId, settings);
        }
      }

      // 3. Fallback to Browser SpeechSynthesis
      console.warn(`[AudioPlaybackService] Using browser native SpeechSynthesis fallback for voice '${voiceId}'`);
      await speechService.speak(text, { voiceId, ...settings });
      this.setPlaying(false);
      return true;
    } catch (err) {
      console.warn('[AudioPlaybackService] Synthesis request failed, fallback to SpeechSynthesis:', err);
      await speechService.speak(text, { voiceId, ...settings });
      this.setPlaying(false);
      return false;
    }
  }

  /**
   * Diagnostic Web Audio API Oscillator Beep Test
   */
  async testAudioBeep() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return false;
      if (ctx.state === 'suspended') await ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
      console.log('[AudioPlaybackService] Test diagnostic chime played successfully via Web Audio Oscillator.');
      return true;
    } catch (e) {
      console.error('[AudioPlaybackService] Test audio beep failed:', e);
      return false;
    }
  }

  /**
   * Play from direct stream URL (e.g. from WebSocket payload)
   */
  async playStreamUrl(url, fallbackText, voiceId, settings = {}) {
    await audioDiagnostics.unlockAudioContext();
    return await this.playAudioUrl(url, fallbackText, voiceId, settings);
  }

  stop() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (e) {}
      this.currentAudio = null;
    }
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (e) {}
      this.currentSource = null;
    }
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }
    speechService.stopSpeaking('User stopped playback');
    this.setPlaying(false);
  }

  setPlaying(val) {
    this.isPlaying = val;
    this.onStateChangeCallbacks.forEach(cb => cb(val));
  }

  onStateChange(callback) {
    this.onStateChangeCallbacks.push(callback);
  }
}

export const audioPlaybackService = new AudioPlaybackService();
