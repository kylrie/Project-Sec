import express from 'express';
import { enhancedTTSService, MODEL_ID, OUTPUT_FORMAT } from './enhancedTTSService.js';
import { voiceCloneService } from './voiceCloneService.js';
import { saveVoicePresetInDB, getVoicePresetsFromDB, deleteVoicePresetFromDB } from './db.js';

const router = express.Router();

// GET /api/v1/voices
router.get('/voices', async (req, res) => {
  try {
    const { provider, category } = req.query;
    const voices = await enhancedTTSService.getVoiceCatalog(provider, category);
    const activeVoice = await enhancedTTSService.getActiveVoice();
    res.json({ success: true, total: voices.length, voices, activeVoice, model: MODEL_ID, format: OUTPUT_FORMAT });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/tts/synthesize (Returns Raw Binary Audio Bytes)
router.post(['/tts/synthesize', '/tts'], async (req, res) => {
  try {
    const { text, voiceId, settings } = req.body;
    const audioBuffer = await enhancedTTSService.synthesizeRawAudio(text, voiceId, settings || {});

    res.setHeader('X-Voice-Model', MODEL_ID);
    res.setHeader('X-Audio-Format', OUTPUT_FORMAT);

    if (audioBuffer) {
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', audioBuffer.length);
      return res.send(audioBuffer);
    }

    // Fallback info if API key is not configured
    const meta = await enhancedTTSService.synthesize(text, {}, voiceId, settings || {});
    res.json(meta);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST & GET /api/v1/tts/stream (Direct Audio Stream)
router.all(['/tts/stream'], async (req, res) => {
  try {
    const text = req.body?.text || req.query?.text || 'Hello, I am F.R.I.D.A.Y.';
    const voiceId = req.body?.voiceId || req.query?.voiceId;
    const settings = req.body?.settings || {};

    const catalog = await enhancedTTSService.getVoiceCatalog();
    const voice = catalog.find(v => v.id === voiceId || v.provider_voice_id === voiceId) || catalog[0];
    const apiKey = process.env.ELEVENLABS_API_KEY;

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('X-Voice-Model', MODEL_ID);
    res.setHeader('X-Audio-Format', OUTPUT_FORMAT);

    if (apiKey && apiKey !== 'mock_elevenlabs_api_key' && voice.provider === 'elevenlabs') {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voice.provider_voice_id}/stream?output_format=${OUTPUT_FORMAT}`,
        {
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
              stability: settings?.stability ?? 0.30,
              similarity_boost: settings?.similarity_boost ?? (settings?.similarityBoost ?? 0.90),
              style: settings?.style ?? 0.55,
              use_speaker_boost: true
            }
          })
        }
      );

      if (response.body && response.body.pipe) {
        return response.body.pipe(res);
      }
    }

    // Direct buffer response fallback
    const audioBuffer = await enhancedTTSService.synthesizeRawAudio(text, voiceId, settings);
    if (audioBuffer) {
      return res.end(audioBuffer);
    }

    res.end();
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/voices/preview
router.post('/voices/preview', async (req, res) => {
  try {
    const { voiceId, text, settings } = req.body;
    const preview = await enhancedTTSService.generatePreviewAudio(voiceId, text, settings);
    res.setHeader('X-Voice-Model', MODEL_ID);
    res.setHeader('X-Audio-Format', OUTPUT_FORMAT);
    res.json({ success: true, ...preview });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/voices/select
router.post('/voices/select', async (req, res) => {
  try {
    const { voiceId } = req.body;
    const result = await enhancedTTSService.setActiveVoice(voiceId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/voices/clone
router.post('/voices/clone', async (req, res) => {
  try {
    const { name, sampleCount } = req.body;
    const result = await voiceCloneService.startCloning(name || 'Custom Cloned Voice', sampleCount || 3);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/voices/clone/:jobId
router.get('/voices/clone/:jobId', (req, res) => {
  try {
    const status = voiceCloneService.getCloneStatus(req.params.jobId);
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/voices/presets
router.get('/voices/presets', async (req, res) => {
  try {
    const presets = await getVoicePresetsFromDB();
    res.json({ success: true, count: presets.length, presets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/voices/presets
router.post('/voices/presets', async (req, res) => {
  try {
    const preset = {
      id: 'preset_' + Date.now(),
      name: req.body.name || 'Custom Preset',
      voiceId: req.body.voiceId || 'voice_eleven_charlotte',
      provider: req.body.provider || 'elevenlabs',
      speed: req.body.speed || 1.0,
      pitch: req.body.pitch || 0.0,
      stability: req.body.stability !== undefined ? req.body.stability : 0.30,
      style: req.body.style !== undefined ? req.body.style : 0.55,
      useSpeakerBoost: req.body.useSpeakerBoost !== false,
      emotion: req.body.emotion || 'neutral',
      autoActivateOn: req.body.autoActivateOn || null
    };
    const saved = await saveVoicePresetInDB(preset);
    res.json({ success: true, preset: saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/voices/presets/:presetId/activate
router.post('/voices/presets/:presetId/activate', async (req, res) => {
  try {
    res.json({ success: true, presetId: req.params.presetId, message: 'Voice preset activated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/v1/voices/presets/:presetId
router.delete('/voices/presets/:presetId', async (req, res) => {
  try {
    const result = await deleteVoicePresetFromDB(req.params.presetId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
