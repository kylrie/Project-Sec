// services/audioPlaybackService.js — High-Fidelity Data-URI Audio Playback Engine
import { audioDiagnostics } from './audioDiagnostics.js';
import { speechService } from './speechService.js';

class AudioPlaybackService {
  constructor() {
    this.audioContext = null;
    this.currentAudio = null;
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
   * Convert an ArrayBuffer into a robust Base64 Data URI
   */
  arrayBufferToDataUri(arrayBuffer, mimeType = 'audio/mpeg') {
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return `data:${mimeType};base64,${window.btoa(binary)}`;
  }

  /**
   * Play an audio URL (Data URI or Stream URL) using HTML5 Audio element
   */
  async playAudioUrl(url, fallbackText = null, voiceId = null, settings = {}) {
    this.stop();
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
        };

        audio.oncanplaythrough = () => {
          audio.play().then(() => {
            console.log('[AudioPlaybackService] SUCCESS: Native HTML5 Audio playback started.');
            resolve(true);
          }).catch(async (playErr) => {
            console.warn('[AudioPlaybackService] audio.play() rejected:', playErr.message);
            cleanup();
            if (fallbackText) {
              await speechService.speak(fallbackText, { voiceId, ...settings });
            }
            resolve(false);
          });
        };

        audio.onended = () => {
          console.log('[AudioPlaybackService] Audio playback completed.');
          cleanup();
        };

        audio.onerror = async (e) => {
          console.warn('[AudioPlaybackService] HTML5 Audio element error:', e);
          cleanup();
          if (fallbackText) {
            await speechService.speak(fallbackText, { voiceId, ...settings });
          }
          resolve(false);
        };

        // Load media
        audio.load();
      } catch (err) {
        console.error('[AudioPlaybackService] Exception starting Audio playback:', err);
        if (fallbackText) {
          speechService.speak(fallbackText, { voiceId, ...settings });
        }
        this.setPlaying(false);
        resolve(false);
      }
    });
  }

  /**
   * Fetch raw MPEG audio blob from proxy, convert to data URI, and play via HTML5 audio
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

      // 1. Raw Binary MPEG Audio Buffer
      if (response.ok && contentType.includes('audio/mpeg')) {
        const arrayBuffer = await response.arrayBuffer();
        console.log(`[AudioPlaybackService] Binary MPEG received (${arrayBuffer.byteLength} bytes). Converting to Data URI...`);

        if (arrayBuffer.byteLength > 100) {
          const dataUri = this.arrayBufferToDataUri(arrayBuffer, 'audio/mpeg');
          return await this.playAudioUrl(dataUri, text, voiceId, settings);
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
