/**
 * Text-To-Speech Configuration Engine for F.R.I.D.A.Y.
 * Manages voice presets, speed, pitch, and barge-in audio packet creation.
 */

export const VOICE_PERSONALITIES = {
  professional: {
    voiceId: 'en-US-Neural-Tactical',
    rate: 1.0,
    pitch: 1.0,
    prefix: 'F.R.I.D.A.Y.'
  },
  casual: {
    voiceId: 'en-US-Neural-Friendly',
    rate: 1.1,
    pitch: 1.05,
    prefix: 'Friday'
  },
  concise: {
    voiceId: 'en-US-Neural-Direct',
    rate: 1.25,
    pitch: 0.95,
    prefix: 'FRIDAY'
  }
};

export function buildTTSPayload(text, options = {}) {
  const personality = options.personality || 'professional';
  const speed = options.speed || VOICE_PERSONALITIES[personality]?.rate || 1.0;
  const pitch = options.pitch || VOICE_PERSONALITIES[personality]?.pitch || 1.0;

  return {
    text: text,
    config: {
      personality,
      speed: Math.max(0.5, Math.min(2.0, speed)),
      pitch: Math.max(0.5, Math.min(1.5, pitch)),
      bargeInAllowed: true,
      timestamp: Date.now()
    }
  };
}
