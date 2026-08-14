// services/audioPlaybackService.js
import { audioDiagnostics } from './audioDiagnostics.js';
import { speechService } from './speechService.js';

class AudioPlaybackService {
  constructor() {
    this.audioContext = null;
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
   * Fetch raw MPEG audio blob from proxy, create blob URL, and play via Web Audio API
   */
  async playRawAudio(text, voiceId, settings = {}) {
    await audioDiagnostics.unlockAudioContext();
    this.stop();

    try {
      this.setPlaying(true);

      const response = await fetch('/api/v1/tts/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify({
          text,
          voiceId,
          settings
        })
      });

      const contentType = response.headers.get('Content-Type');

      // If backend returned raw binary MPEG audio
      if (response.ok && contentType && contentType.includes('audio/mpeg')) {
        const blob = await response.blob();
        if (blob.size > 100) {
          // Release any previous blob URL
          if (this.currentBlobUrl) {
            URL.revokeObjectURL(this.currentBlobUrl);
          }
          this.currentBlobUrl = URL.createObjectURL(blob);

          const arrayBuffer = await blob.arrayBuffer();
          const ctx = this.getAudioContext();

          if (ctx) {
            const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
            const source = ctx.createBufferSource();
            source.buffer = decodedBuffer;
            source.connect(ctx.destination);

            source.onended = () => {
              this.setPlaying(false);
              this.currentSource = null;
            };

            source.start(0);
            this.currentSource = source;
            console.log('[AudioPlaybackService] Playing Raw 44.1kHz Binary Stream Duration:', decodedBuffer.duration.toFixed(2) + 's');
            return true;
          }
        }
      } else if (response.ok && contentType && contentType.includes('application/json')) {
        const json = await response.json();
        if (json.audioUrl) {
          console.log('[AudioPlaybackService] Received JSON with base64 audio, decoding...');
          const base64Data = json.audioUrl.replace(/^data:audio\/\w+;base64,/, '');
          const binaryString = window.atob(base64Data);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
          }
          const arrayBuffer = bytes.buffer;

          const ctx = this.getAudioContext();
          if (ctx) {
            const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
            const source = ctx.createBufferSource();
            source.buffer = decodedBuffer;
            source.connect(ctx.destination);

            source.onended = () => {
              this.setPlaying(false);
              this.currentSource = null;
            };

            source.start(0);
            this.currentSource = source;
            console.log('[AudioPlaybackService] Playing base64 Audio Duration:', decodedBuffer.duration.toFixed(2) + 's');
            return true;
          }
        }
      }

      // Fallback: Web Speech API with mapped human voice characteristics
      console.log('[AudioPlaybackService] Using HD SpeechSynthesis fallback for:', voiceId);
      await speechService.speak(text, { voiceId, ...settings });
      this.setPlaying(false);
      return true;
    } catch (err) {
      console.warn('[AudioPlaybackService] Audio stream error, fallback to SpeechSynthesis:', err);
      await speechService.speak(text, { voiceId, ...settings });
      this.setPlaying(false);
      return false;
    }
  }

  /**
   * Play from direct stream URL (e.g. from WebSocket payload)
   */
  async playStreamUrl(url, fallbackText, voiceId, settings = {}) {
    await audioDiagnostics.unlockAudioContext();
    this.stop();

    try {
      this.setPlaying(true);
      const response = await fetch(url);
      const contentType = response.headers.get('Content-Type');

      if (response.ok && contentType && contentType.includes('audio/mpeg')) {
        const blob = await response.blob();
        if (blob.size > 100) {
          const arrayBuffer = await blob.arrayBuffer();
          const ctx = this.getAudioContext();
          if (ctx) {
            const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
            const source = ctx.createBufferSource();
            source.buffer = decodedBuffer;
            source.connect(ctx.destination);

            source.onended = () => {
              this.setPlaying(false);
              this.currentSource = null;
            };

            source.start(0);
            this.currentSource = source;
            return true;
          }
        }
      }

      // Fallback to speechService
      if (fallbackText) {
        await speechService.speak(fallbackText, { voiceId, ...settings });
      }
      this.setPlaying(false);
    } catch (e) {
      if (fallbackText) {
        await speechService.speak(fallbackText, { voiceId, ...settings });
      }
      this.setPlaying(false);
    }
  }

  stop() {
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
