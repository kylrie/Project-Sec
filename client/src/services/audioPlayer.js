// services/audioPlayer.js

class HighQualityAudioPlayer {
  constructor() {
    this.audioContext = null;
    this.currentSource = null;
  }

  getAudioContext() {
    if (!this.audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass({
          sampleRate: 44100, // Match 44.1kHz source
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
   * Play high-quality audio using Web Audio API without browser compression or distortion
   */
  async playHighQualityAudio(audioUrl) {
    this.stop();
    const ctx = this.getAudioContext();
    if (!ctx) return false;

    try {
      let arrayBuffer;
      if (audioUrl.startsWith('data:audio')) {
        // Base64 data URL
        const base64Data = audioUrl.split(',')[1];
        const binaryString = window.atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        arrayBuffer = bytes.buffer;
      } else {
        // Fetch remote / stream URL
        const response = await fetch(audioUrl);
        arrayBuffer = await response.arrayBuffer();
      }

      const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
      const source = ctx.createBufferSource();
      source.buffer = decodedBuffer;
      source.connect(ctx.destination);
      source.start(0);

      this.currentSource = source;
      console.log('[AudioPlayer] Playing Lossless Audio @ 44.1kHz Duration:', decodedBuffer.duration.toFixed(2) + 's');
      return true;
    } catch (err) {
      console.warn('[AudioPlayer] Lossless playback error, fallback to HTML5 Audio:', err);
      return false;
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
  }
}

export const audioPlayer = new HighQualityAudioPlayer();
