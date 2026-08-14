// services/voiceCurator.js

// High-quality known ElevenLabs voices
export const HIGH_QUALITY_VOICE_IDS = [
  'XB0fDUnXU5powFXDhCwa', // Charlotte — very natural, warm
  'XrExE9yKIg1WjnnlVkGX', // Matilda — expressive, clear
  'TxGEqnHWrfWFTfGW9XjX', // Josh — natural, professional
  'VR6AewLTigWG4xSOukaG', // Adam (newer version) — deep, warm
  'XB0fDUnXU5powFXDhCwa', // Charlotte
  'XrExE9yKIg1WjnnlVkGX', // Matilda
  'TxGEqnHWrfWFTfGW9XjX', // Josh
  'LcfcDJNUP1GQjkzn1xUU', // Emily
  'N2lVS1w4EtoT3dr4eOWO', // Callum
  'ODq5zmih8GrVes37Dizd', // Patrick
  'SOYHLrjzK2X1ezoPC6w8', // Harry
  'VR6AewLTigWG4xSOukaG', // Adam NEW
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
