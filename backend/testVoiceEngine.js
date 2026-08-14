import assert from 'assert';
import { initDatabase } from './db.js';
import { enhancedTTSService, EmotionEngine } from './enhancedTTSService.js';
import { voiceCloneService } from './voiceCloneService.js';
import { saveVoicePresetInDB, getVoicePresetsFromDB, deleteVoicePresetFromDB } from './db.js';

console.log('--- RUNNING F.R.I.D.A.Y. VOICE STUDIO & AI ENHANCEMENT TEST SUITE ---');

async function runVoiceTests() {
  try {
    // 1. Initialize DB
    console.log('[1/6] Initializing SQLite Voice DB...');
    await initDatabase();
    console.log('✓ Database initialized.');

    // 2. Fetch Multi-Provider Voice Catalog
    console.log('[2/6] Testing Voice Catalog & Multi-Provider Filtering...');
    const catalog = await enhancedTTSService.getVoiceCatalog();
    assert(catalog.length >= 4, 'Should contain voices across multiple providers');
    const elevenVoices = await enhancedTTSService.getVoiceCatalog('elevenlabs');
    assert.strictEqual(elevenVoices[0].provider, 'elevenlabs');
    console.log(`✓ Voice catalog verified (${catalog.length} multi-provider voices loaded).`);

    // 3. EmotionEngine Context Mapping
    console.log('[3/6] Testing EmotionEngine Contextual Mapping...');
    const urgentSettings = EmotionEngine.getSettings('urgent_email', 'high');
    assert.strictEqual(urgentSettings.emotion, 'assertive');
    assert(urgentSettings.speed > 1.0, 'Urgent speech should speed up');

    const errorSettings = EmotionEngine.getSettings('error', 'normal');
    assert.strictEqual(errorSettings.emotion, 'empathetic');
    console.log('✓ EmotionEngine contextual intent mapping verified.');

    // 4. Voice Preview Generation & Active Voice Selection
    console.log('[4/6] Testing Voice Preview Audio & Active Voice Selection...');
    const preview = await enhancedTTSService.generatePreviewAudio('voice_eleven_friday_pro', 'Testing F.R.I.D.A.Y. voice.');
    assert.strictEqual(preview.success, true);
    assert.strictEqual(preview.voiceId, 'voice_eleven_friday_pro');

    const selectRes = await enhancedTTSService.setActiveVoice('voice_azure_jenny');
    assert.strictEqual(selectRes.success, true);
    const active = await enhancedTTSService.getActiveVoice();
    assert.strictEqual(active.id, 'voice_azure_jenny');
    console.log('✓ Voice preview audio & active selection verified.');

    // 5. Voice Presets CRUD
    console.log('[5/6] Testing Voice Presets CRUD...');
    const preset = {
      id: 'preset_test_01',
      name: 'Morning Briefing Preset',
      voiceId: 'voice_eleven_friday_pro',
      provider: 'elevenlabs',
      speed: 1.1,
      pitch: 0.05,
      stability: 0.4,
      style: 0.2,
      useSpeakerBoost: true,
      emotion: 'cheerful',
      autoActivateOn: 'morning_briefing'
    };
    await saveVoicePresetInDB(preset);
    const presets = await getVoicePresetsFromDB();
    assert(presets.some(p => p.id === 'preset_test_01'), 'Preset should be saved');

    await deleteVoicePresetFromDB('preset_test_01');
    console.log('✓ Voice Presets CRUD verified.');

    // 6. Voice Cloning Training Lifecycle
    console.log('[6/6] Testing ElevenLabs Voice Cloning Lifecycle...');
    const cloneStart = await voiceCloneService.startCloning('Tony Stark Sample', 3);
    assert.strictEqual(cloneStart.status, 'processing');

    const pollStatus = voiceCloneService.getCloneStatus(cloneStart.jobId);
    assert.strictEqual(pollStatus.jobId, cloneStart.jobId);
    console.log('✓ Voice Cloning lifecycle initiation & status polling verified.');

    console.log('\n===================================================================');
    console.log('SUCCESS: ALL 6 VOICE STUDIO & AI ENHANCEMENT TESTS PASSED!');
    console.log('===================================================================\n');
  } catch (err) {
    console.error('❌ VOICE ENGINE TEST FAILED:', err);
    process.exit(1);
  }
}

runVoiceTests();
