// services/streamingClient.js — Gapless Client-Side Audio Stream Player & Telemetry Manager
import { socketService } from './socketService.js';
import { audioDiagnostics } from './audioDiagnostics.js';
import { speechService } from './speechService.js';

export class AudioStreamPlayer {
  constructor() {
    this.audioContext = null;
    this.nextStartTime = 0;
    this.activeSources = [];
    this.isPlaying = false;
    this.isBuffering = false;
    this.currentSentenceIndex = 0;
    this.currentSentenceText = '';
    
    // Telemetry & Latency Data
    this.metrics = {
      sttLatency: 0,
      llmFirstTokenLatency: 0,
      ttsFirstAudioLatency: 0,
      totalPerceivedLatency: 0,
      isCacheHit: false
    };

    this.liveTranscription = {
      text: '',
      isFinal: false
    };

    this.thinkingState = {
      isThinking: false,
      stage: 'idle',
      text: ''
    };

    // Subscriptions
    this.listeners = {
      transcription: [],
      thinking: [],
      latencyMetrics: [],
      responseComplete: [],
      playbackState: []
    };

    this.initSocketListeners();
  }

  getAudioContext() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx({
          sampleRate: 44100,
          latencyHint: 'interactive'
        });
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  /**
   * Hook up WebSocket events for 4-Stage Streaming Pipeline
   */
  initSocketListeners() {
    // 1. Transcription updates (Live Interim & Final)
    socketService.on('transcription', (data) => {
      this.liveTranscription = {
        text: data.text || '',
        isFinal: Boolean(data.is_final)
      };
      this.emit('transcription', this.liveTranscription);
    });

    // 2. Thinking indicator
    socketService.on('thinking', (data) => {
      this.thinkingState = {
        isThinking: true,
        stage: data.stage || 'thinking',
        text: data.text || data.sentenceText || 'FRIDAY is thinking...'
      };
      this.emit('thinking', this.thinkingState);
    });

    // 3. Streaming Audio Chunks (Gapless Playback)
    socketService.on('audio_chunk', async (data) => {
      await this.enqueueAndPlayChunk(data);
    });

    // 4. Latency Telemetry Metrics
    socketService.on('latency_metrics', (data) => {
      if (data.metrics) {
        this.metrics = { ...this.metrics, ...data.metrics };
        this.emit('latencyMetrics', this.metrics);
      }
    });

    // 5. Response Complete
    socketService.on('response_complete', (data) => {
      this.thinkingState = { isThinking: false, stage: 'idle', text: '' };
      this.emit('thinking', this.thinkingState);
      this.emit('responseComplete', data);
    });

    // 6. Barge-in / Abort
    socketService.on('TTS_ABORTED', () => {
      this.stop();
    });
  }

  /**
   * Decode base64 MP3 chunk and schedule gaplessly in AudioContext
   */
  async enqueueAndPlayChunk(chunkData) {
    const { chunk, sentenceIndex, fallbackText } = chunkData;
    if (!chunk) return;

    await audioDiagnostics.unlockAudioContext();
    const ctx = this.getAudioContext();

    if (!ctx) {
      if (fallbackText) {
        speechService.speak(fallbackText);
      }
      return;
    }

    try {
      // Decode Base64 to ArrayBuffer
      const binaryString = window.atob(chunk);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Decode audio stream chunk
      const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));

      if (!audioBuffer) return;

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      // Schedule gapless start time
      const currentTime = ctx.currentTime;
      const startTime = Math.max(currentTime, this.nextStartTime);
      source.start(startTime);

      // Advance timeline pointer
      this.nextStartTime = startTime + audioBuffer.duration;
      this.activeSources.push(source);

      if (!this.isPlaying) {
        this.isPlaying = true;
        this.emit('playbackState', { isPlaying: true, isBuffering: false });
      }

      source.onended = () => {
        const index = this.activeSources.indexOf(source);
        if (index > -1) this.activeSources.splice(index, 1);

        if (this.activeSources.length === 0 && ctx.currentTime >= this.nextStartTime - 0.05) {
          this.isPlaying = false;
          this.nextStartTime = 0;
          this.emit('playbackState', { isPlaying: false, isBuffering: false });
        }
      };
    } catch (decodeErr) {
      // If Web Audio decoding fails on raw chunk, fallback smoothly
      if (fallbackText) {
        speechService.speak(fallbackText);
      }
    }
  }

  /**
   * Send a streaming text command to backend
   */
  sendStreamCommand(text, options = {}) {
    this.stop();
    this.thinkingState = { isThinking: true, stage: 'intent_routing', text: 'Connecting to neural brain...' };
    this.emit('thinking', this.thinkingState);

    socketService.send({
      type: 'STREAM_COMMAND',
      text,
      options,
      timestamp: Date.now()
    });
  }

  /**
   * Send voice chunk over WebSocket
   */
  sendVoiceChunk(chunk) {
    socketService.send({
      type: 'VOICE_CHUNK',
      chunk,
      timestamp: Date.now()
    });
  }

  /**
   * Signal end of user voice input
   */
  sendVoiceEnd(text = null) {
    socketService.send({
      type: 'VOICE_END',
      text,
      timestamp: Date.now()
    });
  }

  /**
   * Stop active audio stream and reset timeline (Barge-In)
   */
  stop() {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {}
    }
    this.activeSources = [];
    this.nextStartTime = 0;
    this.isPlaying = false;
    this.isBuffering = false;
    this.thinkingState = { isThinking: false, stage: 'idle', text: '' };
    this.emit('thinking', this.thinkingState);
    this.emit('playbackState', { isPlaying: false, isBuffering: false });
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }
}

export const streamingClient = new AudioStreamPlayer();
