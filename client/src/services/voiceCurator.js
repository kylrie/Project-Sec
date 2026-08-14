// services/voiceCurator.js

// High-quality known ElevenLabs voices
export const HIGH_QUALITY_VOICE_IDS = [
  'EXAVITQu4vr4xnSDxMaL', // Sarah (Default)
  'XrExE9yKIg1WjnnlVkGX', // Matilda
  'nPczCjzI2devNBz1zQrb', // Brian
  'cgSgspJ2msm6clMCkdW9', // Jessica
  'JBFqnCBsd6RMkjVDRZzb', // George
  'Xb7hH8MSUJpSbSDYk0k2', // Alice
  'N2lVS1w4EtoT3dr4eOWO', // Callum
  'SOYHLrjzK2X1ezoPC6cr', // Harry
  'pFZP5JQG7iQjIQuC4Bku', // Lily
  'CwhRBWXzGAHq8TQ4Fs17', // Roger
  'en-US-JennyNeural',
  'AVSpeechSynthesisVoice_en_US'
];

export function filterQualityVoices(allVoices = []) {
  return allVoices.filter((voice) => {
    const voiceId = voice.voice_id || voice.provider_voice_id || voice.id;
    if (HIGH_QUALITY_VOICE_IDS.includes(voiceId)) return true;
    if (voice.category === 'cloned' || voice.isCloned) return true;
    if (voice.category === 'custom') return true;
    if (voice.labels?.quality === 'high' || voice.isHD) return true;

    // Exclude old low-quality legacy voices
    if (voice.name?.includes('Legacy')) return false;
    return true;
  });
}
