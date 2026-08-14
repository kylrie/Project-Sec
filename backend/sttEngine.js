/**
 * Speech-To-Text Engine Configuration for F.R.I.D.A.Y.
 * Handles Whisper STT settings, VAD sensitivity, and multi-language auto-detection.
 */

export const STT_CONFIG = {
  primaryEngine: 'whisper-api',
  fallbackEngine: 'web-speech-api',
  vadSensitivity: 0.75, // Silero VAD threshold ratio
  language: 'auto',     // Auto-detect with primary fallback 'en'
  interruptionKeywords: ['stop', 'never mind', 'cancel', 'halt', 'pause', 'quiet', 'shut up']
};

export function checkInterruptionKeyword(text) {
  if (!text) return false;
  const lower = text.trim().toLowerCase();
  return STT_CONFIG.interruptionKeywords.some(keyword => lower.includes(keyword));
}

export function parseSpeechPayload(rawPayload) {
  return {
    transcript: rawPayload.transcript || '',
    confidence: rawPayload.confidence || 0.95,
    language: rawPayload.language || 'en-US',
    isInterruption: checkInterruptionKeyword(rawPayload.transcript),
    timestamp: Date.now()
  };
}
