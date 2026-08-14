class AudioDiagnosticsEngine {
  constructor() {
    this.audioCtx = null;
    this.isUnlocked = false;
  }

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    return this.audioCtx;
  }

  /**
   * Unlock Web Audio Context and SpeechSynthesis state (bypasses browser autoplay restrictions)
   */
  async unlockAudioContext() {
    try {
      const ctx = this.getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume();
        console.log('[AudioDiagnostics] AudioContext un-suspended successfully state:', ctx.state);
      }

      if (window.speechSynthesis) {
        window.speechSynthesis.resume();
      }

      this.isUnlocked = true;
      return true;
    } catch (err) {
      console.warn('[AudioDiagnostics] Error unlocking AudioContext:', err);
      return false;
    }
  }

  /**
   * Play an audible 440Hz / 880Hz dual-tone chime using Web Audio API to test physical speakers
   */
  async playDiagnosticChime() {
    await this.unlockAudioContext();
    const ctx = this.getAudioContext();

    if (!ctx) {
      console.warn('[AudioDiagnostics] Web Audio API not supported in this browser.');
      return false;
    }

    try {
      const now = ctx.currentTime;

      // Tone 1: 440 Hz (A4)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(440, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Tone 2: 880 Hz (A5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.15);
      gain2.gain.setValueAtTime(0.2, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.5);

      console.log('[AudioDiagnostics] Diagnostic audio chime played through speakers.');
      return true;
    } catch (err) {
      console.error('[AudioDiagnostics] Failed to play diagnostic chime:', err);
      return false;
    }
  }

  /**
   * Run complete audio diagnostic check
   */
  async runFullAudioDiagnostic() {
    const unlocked = await this.unlockAudioContext();
    const chimeSuccess = await this.playDiagnosticChime();

    return {
      webAudioSupported: Boolean(this.getAudioContext()),
      speechSynthesisSupported: Boolean(window.speechSynthesis),
      contextState: this.audioCtx ? this.audioCtx.state : 'unsupported',
      unlocked,
      hardwareChimePlayed: chimeSuccess,
      timestamp: new Date().toISOString()
    };
  }
}

export const audioDiagnostics = new AudioDiagnosticsEngine();
