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
      console.log(`[AudioPlaybackService] Requesting TTS synthesis for voice '${voiceId}'...`);

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

      const contentType = response.headers.get('Content-Type') || '';
      console.log(`[AudioPlaybackService] Response status: ${response.status}, Content-Type: '${contentType}'`);

      // 1. If backend returned raw binary MPEG audio
      if (response.ok && contentType.includes('audio/mpeg')) {
        const blob = await response.blob();
        console.log(`[AudioPlaybackService] Binary MPEG Blob received (${blob.size} bytes). Initializing Web Audio decoding...`);

        if (blob.size > 100) {
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
            console.log(`[AudioPlaybackService] SUCCESS: Playing 44.1kHz ElevenLabs Stream (${decodedBuffer.duration.toFixed(2)}s)`);
            return true;
          }
        }
      } 
      // 2. If backend returned JSON (with base64 audioUrl)
      else if (response.ok && contentType.includes('application/json')) {
        const json = await response.json();
        console.log(`[AudioPlaybackService] JSON response received. json.audioUrl present: ${Boolean(json?.audioUrl)}`);

        if (json.audioUrl) {
          console.log('[AudioPlaybackService] Decoding base64 audio data URI...');
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
            console.log(`[AudioPlaybackService] SUCCESS: Playing decoded base64 stream (${decodedBuffer.duration.toFixed(2)}s)`);
            return true;
          }
        }
      }

      // 3. Fallback to Web Speech API with mapped characteristics
      console.warn(`[AudioPlaybackService] Fallback to SpeechSynthesis for voice '${voiceId}'`);
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

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
      console.log('[AudioPlaybackService] Test diagnostic chime played via Web Audio API Oscillator.');
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
