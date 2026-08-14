/**
 * Web Audio API & Microphone Frequency Data Analyzer
 */

class AudioService {
  constructor() {
    this.audioCtx = null;
    this.analyser = null;
    this.microphone = null;
    this.dataArray = null;
    this.isInitialized = false;
  }

  async initMicrophone() {
    if (this.isInitialized) return true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioCtx.createAnalyser();
      
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;
      
      this.microphone = this.audioCtx.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);
      
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      
      this.isInitialized = true;
      console.log('[AudioService] Microphone initialized with Web Audio API');
      return true;
    } catch (err) {
      console.warn('[AudioService] Microphone access denied or unavailable:', err);
      return false;
    }
  }

  getFrequencyData() {
    if (!this.analyser || !this.dataArray) {
      return new Uint8Array(32).fill(0);
    }
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }

  getAudioVolume() {
    const data = this.getFrequencyData();
    if (!data.length) return 0;
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    return sum / (data.length * 255); // Normalized 0.0 - 1.0
  }
}

export const audioService = new AudioService();
