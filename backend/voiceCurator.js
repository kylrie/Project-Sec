// services/voiceCurator.js

// High-quality known ElevenLabs voices with authentic prosody
export const HIGH_QUALITY_VOICE_IDS = [
  'XB0fDUnXU5powFXDhCwa', // Charlotte — very natural, warm
  'XrExE9yKIg1WjnnlVkGX', // Matilda — expressive, clear
  'TxGEqnHWrfWFTfGW9XjX', // Josh — natural, professional
  'VR6AewLTigWG4xSOukaG', // Adam (newer version) — deep, warm
  'pNInz6obpgDQGcFmaJgB', // Adam — classic but good
  'onwK4e9ZLuTAKqW03Ge9', // Nicole — soft, natural
  'MF3mGyEYCl7XYWbV9V6O', // Elli — young, natural
  'LcfcDJNUP1GQjkzn1xUU', // Emily — warm, conversational
  'ZQe5CZNOzWyzPSCn5a3c', // Daniel — professional, natural
  'N2lVS1w4EtoT3dr4eOWO', // Callum — Scottish, very natural
  'ODq5zmih8GrVes37Dizd', // Patrick — news anchor quality
  'SOYHLrjzK2X1ezoPC6w8', // Harry — British, natural
  'TX3AE3VoIzMeN6BkYKdN', // Liam — American, natural
  'XHarm0bPFKD7b8P8n8OQ', // Jessica — expressive, warm
  '21m00Tcm4TlvDq8ikWAM', // Rachel / Friday Pro (HD)
  'AZnzlk1XvdvUeBnXmlld'  // Domi / Warm Secretary
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
