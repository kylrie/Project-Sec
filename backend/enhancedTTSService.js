import { getVoicesFromDB, saveVoice, setActiveVoiceInDB } from './db.js';
import { getNaturalSettings } from './voiceSettingsEngine.js';
import { filterQualityVoices } from './voiceCurator.js';

export const sampleVoiceCatalog = [
  {
    id: 'voice_eleven_friday_pro',
    provider: 'elevenlabs',
    provider_voice_id: '21m00Tcm4TlvDq8ikWAM',
    name: 'F.R.I.D.A.Y. Professional',
    gender: 'female',
    language: 'en-US',
    accent: 'American',
    previewUrl: null,
    category: 'professional',
    isCloned: false,
    isHD: true,
    emotions: ['cheerful', 'neutral', 'assertive'],
    supportsSpeed: true,
    supportsPitch: true,
    latency: 'medium',
    costPer1KChars: 0.015,
    isDefault: true
  },
  {
    id: 'voice_eleven_stark_warm',
    provider: 'elevenlabs',
    provider_voice_id: 'AZnzlk1XvdvUeBnXmlld',
    name: 'F.R.I.D.A.Y. Warm Secretary',
    gender: 'female',
    language: 'en-GB',
    accent: 'British',
    previewUrl: null,
    category: 'warm',
    isCloned: false,
    isHD: true,
    emotions: ['cheerful', 'empathetic'],
    supportsSpeed: true,
    supportsPitch: true,
    latency: 'medium',
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
    id: 'voice_google_wavenet',
    provider: 'google',
    provider_voice_id: 'en-US-Wavenet-F',
    name: 'Google WaveNet Female',
    gender: 'female',
    language: 'en-US',
    accent: 'American',
    previewUrl: null,
    category: 'casual',
    isCloned: false,
    isHD: false,
    emotions: ['neutral'],
    supportsSpeed: true,
    supportsPitch: true,
    latency: 'low',
    costPer1KChars: 0.002,
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
export const OUTPUT_FORMAT = 'mp3_44100_192'; // 44.1kHz stereo, 192kbps CD quality

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

    // Filter for quality voices
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

  // High-Fidelity ElevenLabs & Multi-Provider Synthesizer
  async synthesize(text, context = {}, voiceId = null, customSettings = {}) {
    const catalog = await this.getVoiceCatalog();
    const targetVoiceId = voiceId || (await this.getActiveVoice()).id;
    const voice = catalog.find(v => v.id === targetVoiceId) || catalog[0];
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

    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (apiKey && apiKey !== 'mock_elevenlabs_api_key' && voice.provider === 'elevenlabs') {
      try {
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
          const base64Audio = Buffer.from(arrayBuffer).toString('base64');
          return {
            success: true,
            text,
            voiceId: voice.id,
            voiceName: voice.name,
            provider: voice.provider,
            model: MODEL_ID,
            format: OUTPUT_FORMAT,
            audioUrl: `data:audio/mpeg;base64,${base64Audio}`,
            settings: mergedSettings
          };
        }
      } catch (err) {
        console.warn('[TTSService] ElevenLabs API error:', err.message);
      }
    }

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
      audioUrl: null,
      settings: mergedSettings
    };
  }

  async generatePreviewAudio(voiceId, text = 'Hello, I am F.R.I.D.A.Y., your AI voice secretary.', customSettings = {}) {
    return this.synthesize(text, {}, voiceId, customSettings);
  }
}

export const enhancedTTSService = new EnhancedTTSService();
