import { getVoicesFromDB, saveVoice, setActiveVoiceInDB } from './db.js';
import { getNaturalSettings } from './voiceSettingsEngine.js';
import { filterQualityVoices } from './voiceCurator.js';

export const sampleVoiceCatalog = [
  {
    id: 'voice_eleven_sarah',
    provider: 'elevenlabs',
    provider_voice_id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah (Mature, Reassuring & Confident)',
    gender: 'female',
    language: 'en-US',
    accent: 'American',
    previewUrl: null,
    category: 'warm',
    isCloned: false,
    isHD: true,
    emotions: ['cheerful', 'warm', 'empathetic'],
    supportsSpeed: true,
    supportsPitch: true,
    latency: 'low',
    costPer1KChars: 0.015,
    isDefault: true
  },
  {
    id: 'voice_eleven_matilda',
    provider: 'elevenlabs',
    provider_voice_id: 'XrExE9yKIg1WjnnlVkGX',
    name: 'Matilda (Expressive & Clear)',
    gender: 'female',
    language: 'en-US',
    accent: 'American',
    previewUrl: null,
    category: 'professional',
    isCloned: false,
    isHD: true,
    emotions: ['assertive', 'neutral', 'cheerful'],
    supportsSpeed: true,
    supportsPitch: true,
    latency: 'low',
    costPer1KChars: 0.015,
    isDefault: false
  },
  {
    id: 'voice_eleven_brian',
    provider: 'elevenlabs',
    provider_voice_id: 'nPczCjzI2devNBz1zQrb',
    name: 'Brian (Deep, Resonant & Comforting)',
    gender: 'male',
    language: 'en-US',
    accent: 'American',
    previewUrl: null,
    category: 'professional',
    isCloned: false,
    isHD: true,
    emotions: ['neutral', 'assertive'],
    supportsSpeed: true,
    supportsPitch: true,
    latency: 'low',
    costPer1KChars: 0.015,
    isDefault: false
  },
  {
    id: 'voice_eleven_jessica',
    provider: 'elevenlabs',
    provider_voice_id: 'cgSgspJ2msm6clMCkdW9',
    name: 'Jessica (Playful, Bright & Warm)',
    gender: 'female',
    language: 'en-US',
    accent: 'American',
    previewUrl: null,
    category: 'casual',
    isCloned: false,
    isHD: true,
    emotions: ['cheerful', 'warm'],
    supportsSpeed: true,
    supportsPitch: true,
    latency: 'low',
    costPer1KChars: 0.015,
    isDefault: false
  },
  {
    id: 'voice_eleven_george',
    provider: 'elevenlabs',
    provider_voice_id: 'JBFqnCBsd6RMkjVDRZzb',
    name: 'George (Warm & Captivating Storyteller)',
    gender: 'male',
    language: 'en-GB',
    accent: 'British',
    previewUrl: null,
    category: 'warm',
    isCloned: false,
    isHD: true,
    emotions: ['warm', 'cheerful'],
    supportsSpeed: true,
    supportsPitch: true,
    latency: 'low',
    costPer1KChars: 0.015,
    isDefault: false
  },
  {
    id: 'voice_eleven_alice',
    provider: 'elevenlabs',
    provider_voice_id: 'Xb7hH8MSUJpSbSDYk0k2',
    name: 'Alice (Clear & Engaging Educator)',
    gender: 'female',
    language: 'en-US',
    accent: 'American',
    previewUrl: null,
    category: 'professional',
    isCloned: false,
    isHD: true,
    emotions: ['assertive', 'neutral'],
    supportsSpeed: true,
    supportsPitch: true,
    latency: 'low',
    costPer1KChars: 0.015,
    isDefault: false
  },
  {
    id: 'voice_eleven_callum',
    provider: 'elevenlabs',
    provider_voice_id: 'N2lVS1w4EtoT3dr4eOWO',
    name: 'Callum (Husky Scottish Male)',
    gender: 'male',
    language: 'en-GB',
    accent: 'Scottish',
    previewUrl: null,
    category: 'casual',
    isCloned: false,
    isHD: true,
    emotions: ['warm', 'cheerful'],
    supportsSpeed: true,
    supportsPitch: true,
    latency: 'medium',
    costPer1KChars: 0.015,
    isDefault: false
  },
  {
    id: 'voice_eleven_harry',
    provider: 'elevenlabs',
    provider_voice_id: 'SOYHLrjzK2X1ezoPC6cr',
    name: 'Harry (British Natural Butler)',
    gender: 'male',
    language: 'en-GB',
    accent: 'British',
    previewUrl: null,
    category: 'professional',
    isCloned: false,
    isHD: true,
    emotions: ['polite', 'neutral'],
    supportsSpeed: true,
    supportsPitch: true,
    latency: 'low',
    costPer1KChars: 0.015,
    isDefault: false
  },
  {
    id: 'voice_eleven_lily',
    provider: 'elevenlabs',
    provider_voice_id: 'pFZP5JQG7iQjIQuC4Bku',
    name: 'Lily (Velvety Actress)',
    gender: 'female',
    language: 'en-US',
    accent: 'American',
    previewUrl: null,
    category: 'warm',
    isCloned: false,
    isHD: true,
    emotions: ['warm', 'cheerful'],
    supportsSpeed: true,
    supportsPitch: true,
    latency: 'low',
    costPer1KChars: 0.015,
    isDefault: false
  },
  {
    id: 'voice_azure_jenny',
    provider: 'azure',
    provider_voice_id: 'en-US-JennyNeural',
    name: 'Azure Jenny Neural',
    gender: 'female',
    language: 'en-US',
    accent: 'American',
    previewUrl: null,
    category: 'professional',
    isCloned: false,
    isHD: true,
    emotions: ['neutral', 'cheerful'],
    supportsSpeed: true,
    supportsPitch: true,
    latency: 'low',
    costPer1KChars: 0.004,
    isDefault: false
  },
  {
    id: 'voice_device_native',
    provider: 'device',
    provider_voice_id: 'AVSpeechSynthesisVoice_en_US',
    name: 'On-Device Native Voice (Offline)',
    gender: 'neutral',
    language: 'en-US',
    accent: 'Local',
    previewUrl: null,
    category: 'casual',
    isCloned: false,
    isHD: false,
    emotions: ['neutral'],
    supportsSpeed: true,
    supportsPitch: true,
    latency: 'low',
    costPer1KChars: 0.0,
    isDefault: false
  }
];

export const MODEL_ID = 'eleven_multilingual_v2'; // Most natural, emotional, human-like
export const OUTPUT_FORMAT = 'mp3_44100_128'; // 44.1kHz stereo HD audio (universal tier compatible)

export class EmotionEngine {
  static getEmotionMap() {
    return {
      'calendar_reminder': { speed: 1.0, stability: 0.35, emotion: 'professional', pitch: 0.0 },
      'urgent_email': { speed: 1.12, stability: 0.40, emotion: 'assertive', pitch: 0.05 },
      'greeting': { speed: 1.0, stability: 0.28, emotion: 'cheerful', pitch: 0.08 },
      'error': { speed: 0.92, stability: 0.38, emotion: 'empathetic', pitch: -0.05 },
      'meeting_summary': { speed: 1.04, stability: 0.32, emotion: 'neutral', pitch: 0.0 },
      'casual_chat': { speed: 1.0, stability: 0.25, emotion: 'warm', pitch: 0.02 }
    };
  }

  static getSettings(intent = 'greeting', urgency = 'normal') {
    const map = this.getEmotionMap();
    const base = map[intent] || map['greeting'];
    if (urgency === 'high') {
      return { ...base, speed: Math.min(base.speed + 0.12, 1.4), emotion: 'assertive' };
    }
    return base;
  }
}

export class EnhancedTTSService {
  constructor() {
    this.seeded = false;
  }

  async seedVoices() {
    if (this.seeded) return;
    for (const v of sampleVoiceCatalog) {
      await saveVoice(v);
    }
    this.seeded = true;
  }

  async getVoiceCatalog(providerFilter = null, categoryFilter = null) {
    await this.seedVoices();
    let voices = await getVoicesFromDB();

    if (voices.length === 0) {
      voices = sampleVoiceCatalog;
    } else {
      voices = voices.map(v => ({
        ...v,
        isCloned: Boolean(v.is_cloned),
        isHD: Boolean(v.is_hd),
        isDefault: Boolean(v.is_default),
        emotions: typeof v.emotions === 'string' ? JSON.parse(v.emotions) : v.emotions,
        settings: typeof v.settings === 'string' ? JSON.parse(v.settings) : v.settings
      }));
    }

    voices = filterQualityVoices(voices);

    if (providerFilter) {
      voices = voices.filter(v => v.provider === providerFilter);
    }
    if (categoryFilter && categoryFilter !== 'all') {
      voices = voices.filter(v => v.category === categoryFilter);
    }

    return voices;
  }

  async getActiveVoice() {
    const catalog = await this.getVoiceCatalog();
    const active = catalog.find(v => v.isDefault) || catalog[0];
    return active;
  }

  async setActiveVoice(voiceId) {
    await setActiveVoiceInDB(voiceId);
    return { success: true, activeVoiceId: voiceId };
  }

  // Synthesize and return raw binary audio buffer
  async synthesizeRawAudio(text, voiceId = null, customSettings = {}) {
    const catalog = await this.getVoiceCatalog();
    const targetVoiceId = voiceId || (await this.getActiveVoice()).id;
    const voice = catalog.find(v => v.id === targetVoiceId || v.provider_voice_id === targetVoiceId) || catalog[0];
    const naturalDefault = getNaturalSettings('natural_conversational');

    const mergedSettings = {
      stability: customSettings.stability !== undefined ? customSettings.stability : naturalDefault.stability,
      similarity_boost: customSettings.similarity_boost !== undefined ? customSettings.similarity_boost : (customSettings.similarityBoost || naturalDefault.similarity_boost),
      style: customSettings.style !== undefined ? customSettings.style : naturalDefault.style,
      use_speaker_boost: customSettings.use_speaker_boost !== undefined ? customSettings.use_speaker_boost : true
    };

    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (apiKey && apiKey !== 'mock_elevenlabs_api_key' && voice.provider === 'elevenlabs') {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice.provider_voice_id}?output_format=${OUTPUT_FORMAT}`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify({
          text,
          model_id: MODEL_ID,
          voice_settings: {
            stability: mergedSettings.stability,
            similarity_boost: mergedSettings.similarity_boost,
            style: mergedSettings.style,
            use_speaker_boost: mergedSettings.use_speaker_boost
          }
        })
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
    }

    return null;
  }

  async synthesize(text, context = {}, voiceId = null, customSettings = {}) {
    const catalog = await this.getVoiceCatalog();
    const targetVoiceId = voiceId || (await this.getActiveVoice()).id;
    const voice = catalog.find(v => v.id === targetVoiceId || v.provider_voice_id === targetVoiceId) || catalog[0];
    const naturalDefault = getNaturalSettings('natural_conversational');
    const emotionSettings = EmotionEngine.getSettings(context.intent || 'greeting', context.urgency || 'normal');

    const mergedSettings = {
      stability: customSettings.stability !== undefined ? customSettings.stability : naturalDefault.stability,
      similarity_boost: customSettings.similarity_boost !== undefined ? customSettings.similarity_boost : (customSettings.similarityBoost || naturalDefault.similarity_boost),
      style: customSettings.style !== undefined ? customSettings.style : naturalDefault.style,
      use_speaker_boost: customSettings.use_speaker_boost !== undefined ? customSettings.use_speaker_boost : true,
      speed: customSettings.speed || emotionSettings.speed || 1.0,
      pitch: customSettings.pitch || emotionSettings.pitch || 0.0,
      emotion: emotionSettings.emotion
    };

    return {
      success: true,
      text,
      voiceId: voice.id,
      voiceName: voice.name,
      provider: voice.provider,
      accent: voice.accent,
      gender: voice.gender,
      model: MODEL_ID,
      format: OUTPUT_FORMAT,
      settings: mergedSettings
    };
  }

  async generatePreviewAudio(voiceId, text = 'Hello, I am F.R.I.D.A.Y., your AI voice secretary.', customSettings = {}) {
    return this.synthesize(text, {}, voiceId, customSettings);
  }
}

export const enhancedTTSService = new EnhancedTTSService();
