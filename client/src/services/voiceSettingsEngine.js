// services/voiceSettingsEngine.js

// Tested settings to maximize human naturalness and dynamic prosody
export const NATURAL_PRESETS = {
  // For conversation, briefings, general assistant work
  'natural_conversational': {
    name: 'Natural Conversational',
    stability: 0.30,        // Lower = more variation, breathing, natural rhythm
    similarity_boost: 0.90, // Higher = closer to real human voice
    style: 0.55,            // Moderate style = emotional but not theatrical
    use_speaker_boost: true
  },
  
  // For urgent notifications — still natural but clearer
  'natural_urgent': {
    name: 'Natural Urgent',
    stability: 0.40,
    similarity_boost: 0.85,
    style: 0.45,
    use_speaker_boost: true
  },
  
  // For storytelling, long-form — very expressive
  'natural_expressive': {
    name: 'Natural Expressive',
    stability: 0.25,        // Very dynamic
    similarity_boost: 0.92,
    style: 0.70,            // High style = more emphasis, emotion
    use_speaker_boost: true
  },
  
  // OLD ROBOTIC SETTINGS (for comparison only)
  'robotic': {
    name: 'Robotic (Old Monotone)',
    stability: 0.75,        // Too stable = monotone
    similarity_boost: 0.50, // Too low = generic synthetic voice
    style: 0.00,            // No style = flat
    use_speaker_boost: false
  }
};

export function getNaturalSettings(preset = 'natural_conversational') {
  return NATURAL_PRESETS[preset] || NATURAL_PRESETS['natural_conversational'];
}
