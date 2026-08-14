import { saveVoice } from './db.js';

export class VoiceCloneService {
  constructor() {
    this.jobs = new Map();
  }

  /**
   * Start ElevenLabs Voice Cloning process
   */
  async startCloning(name, sampleCount = 3) {
    const jobId = 'clone_job_' + Date.now();
    const mockVoiceId = 'eleven_clone_' + Date.now();

    const job = {
      jobId,
      name,
      status: 'processing',
      sampleCount,
      provider_voice_id: mockVoiceId,
      createdAt: new Date().toISOString()
    };

    this.jobs.set(jobId, job);

    // Simulate asynchronous training completion after 3 seconds
    setTimeout(async () => {
      job.status = 'ok';
      const clonedVoice = {
        id: mockVoiceId,
        provider: 'elevenlabs',
        provider_voice_id: mockVoiceId,
        name: `Cloned: ${name}`,
        gender: 'neutral',
        language: 'en-US',
        accent: 'Custom Cloned',
        category: 'custom',
        isCloned: true,
        isHD: true,
        emotions: ['cheerful', 'neutral', 'assertive'],
        supportsSpeed: true,
        supportsPitch: true,
        latency: 'medium',
        costPer1KChars: 0.02,
        isDefault: false
      };
      await saveVoice(clonedVoice);
      job.voice = clonedVoice;
    }, 3000);

    return {
      success: true,
      jobId,
      status: 'processing',
      message: `Voice cloning initiated for "${name}". Training in progress.`
    };
  }

  /**
   * Poll Voice Clone status
   */
  getCloneStatus(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) {
      return { status: 'failed', error: 'Clone job not found' };
    }
    return {
      jobId: job.jobId,
      status: job.status,
      voice: job.voice || null,
      verificationAudioUrl: job.voice ? 'https://cdn.friday.ai/previews/friday_pro.mp3' : null
    };
  }
}

export const voiceCloneService = new VoiceCloneService();
