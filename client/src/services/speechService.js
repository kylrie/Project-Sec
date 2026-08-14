/**
 * Speech Recognition (STT) and Speech Synthesis (TTS) Engine with HD Voice Mapping & Audio Diagnostics
 */
import { socketService } from './socketService.js';
import { audioDiagnostics } from './audioDiagnostics.js';

class SpeechService {
  constructor() {
    this.recognition = null;
    this.synth = window.speechSynthesis;
    this.isListening = false;
    this.isSpeaking = false;
    
    this.activeVoiceProfile = null;
    this.voiceSpeed = 1.0;
    this.voicePitch = 1.0;
    this.personality = 'professional';
    this.wakeWord = 'hey friday';
    
    this.onResultCallbacks = [];
    this.onStateChangeCallbacks = [];
    
    this.initSTT();
  }

  initSTT() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[SpeechService] Web Speech Recognition API not supported in this browser.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      this.notifyStateChange();
    };

    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const activeText = (finalTranscript || interimTranscript).trim().toLowerCase();

      // BARGE-IN INTERRUPTION CHECK
      if (this.isSpeaking && activeText.length > 0) {
        console.log('[Barge-In] Voice detected during TTS output. Halting synthesis.');
        this.stopSpeaking('User voice barge-in');
      }

      if (finalTranscript.trim()) {
        this.handleFinalTranscript(finalTranscript.trim());
      }
    };

    this.recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        this.isListening = false;
        this.notifyStateChange();
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.notifyStateChange();
      if (this.autoListen) {
        setTimeout(() => this.startListening(), 500);
      }
    };
  }

  async startListening() {
    await audioDiagnostics.unlockAudioContext();
    if (this.recognition && !this.isListening) {
      this.autoListen = true;
      try {
        this.recognition.start();
      } catch (e) {}
    }
  }

  stopListening() {
    this.autoListen = false;
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      this.notifyStateChange();
    }
  }

  handleFinalTranscript(text) {
    const lower = text.toLowerCase();
    
    if (lower.includes('stop') || lower.includes('never mind') || lower.includes('quiet') || lower.includes('shut up')) {
      this.stopSpeaking('User explicit stop command');
      socketService.sendCommand(text, 'ABORT_COMMAND');
      return;
    }

    const hasWakeWord = lower.includes(this.wakeWord) || lower.includes('friday');
    this.onResultCallbacks.forEach(cb => cb({ text, hasWakeWord }));
  }

  setActiveVoiceProfile(voiceProfile) {
    this.activeVoiceProfile = voiceProfile;
  }

  // HD Voice Selection & Text-To-Speech Synthesis
  async speak(text, options = {}) {
    console.warn('[SpeechService FALLBACK] Using browser native SpeechSynthesis fallback instead of ElevenLabs HD audio. (Options:', options, ')');
    await audioDiagnostics.unlockAudioContext();

    if (!this.synth) {
      audioDiagnostics.playDiagnosticChime();
      return;
    }

    if (this.synth.paused) {
      this.synth.resume();
    }

    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const targetVoiceId = options.voiceId || (this.activeVoiceProfile ? this.activeVoiceProfile.id : 'voice_eleven_friday_pro');
    
    const voices = this.synth.getVoices();

    // Voice Profile Characteristic Mapping (Ensures distinct pitch/accent per card)
    let selectedNativeVoice = null;
    let pitchMultiplier = 1.0;
    let speedMultiplier = 1.0;

    if (targetVoiceId === 'voice_eleven_stark_warm') {
      // Warm Secretary: British Accent, Slightly Higher Pitch
      selectedNativeVoice = voices.find(v => v.lang.startsWith('en-GB') || v.name.includes('UK') || v.name.includes('Hazel') || v.name.includes('Sonia'));
      pitchMultiplier = 1.15;
      speedMultiplier = 0.95;
    } else if (targetVoiceId === 'voice_azure_jenny') {
      // Azure Jenny: Crisp US Female
      selectedNativeVoice = voices.find(v => v.name.includes('Jenny') || v.name.includes('Zira') || v.name.includes('Samantha') || (v.lang.startsWith('en-US') && v.name.includes('Female')));
      pitchMultiplier = 1.05;
      speedMultiplier = 1.05;
    } else if (targetVoiceId === 'voice_google_wavenet') {
      // Google WaveNet: Soft Casual Voice
      selectedNativeVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural'));
      pitchMultiplier = 0.95;
      speedMultiplier = 1.0;
    } else {
      // F.R.I.D.A.Y. Professional
      selectedNativeVoice = voices.find(v => v.lang.startsWith('en-US') && (v.name.includes('Neural') || v.name.includes('Zira') || v.name.includes('David')));
      pitchMultiplier = 1.0;
      speedMultiplier = 1.0;
    }

    if (selectedNativeVoice) {
      utterance.voice = selectedNativeVoice;
    }

    const finalRate = (options.speed || this.voiceSpeed) * speedMultiplier;
    const finalPitch = (options.pitch || this.voicePitch) * pitchMultiplier;

    utterance.rate = Math.max(0.5, Math.min(2.0, finalRate));
    utterance.pitch = Math.max(0.5, Math.min(1.5, finalPitch));

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.notifyStateChange();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.notifyStateChange();
    };

    utterance.onerror = (err) => {
      console.warn('[TTS] Synthesis error:', err);
      this.isSpeaking = false;
      this.notifyStateChange();
      audioDiagnostics.playDiagnosticChime();
    };

    this.synth.speak(utterance);
  }

  stopSpeaking(reason = 'Barge-in') {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      socketService.sendBargeIn(reason);
      this.notifyStateChange();
    }
  }

  onResult(callback) {
    this.onResultCallbacks.push(callback);
  }

  onStateChange(callback) {
    this.onStateChangeCallbacks.push(callback);
  }

  notifyStateChange() {
    const state = { isListening: this.isListening, isSpeaking: this.isSpeaking };
    this.onStateChangeCallbacks.forEach(cb => cb(state));
  }
}

export const speechService = new SpeechService();
