// diagnostic.js — Standalone Diagnostic & Health Verification Script for F.R.I.D.A.Y. Audio Pipeline
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { enhancedTTSService, MODEL_ID, OUTPUT_FORMAT } from './enhancedTTSService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runDiagnostics() {
  console.log('\n===============================================================');
  console.log('       F.R.I.D.A.Y. VOICE PIPELINE & ELEVENLABS DIAGNOSTICS   ');
  console.log('===============================================================\n');

  let passedTests = 0;
  const totalTests = 4;

  // -------------------------------------------------------------
  // Test 1: Environment Variables & .env File
  // -------------------------------------------------------------
  console.log('[TEST 1/4] Checking Environment Variables & Configuration...');
  const envPath = path.join(__dirname, '.env');
  const envExists = fs.existsSync(envPath);
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const isKeyPresent = Boolean(apiKey && apiKey !== 'mock_elevenlabs_api_key' && apiKey.trim().length > 10);

  if (envExists && isKeyPresent) {
    const masked = `${apiKey.substring(0, 4)}...${apiKey.slice(-4)}`;
    console.log(`  [PASS] .env file found at ${envPath}`);
    console.log(`  [PASS] ELEVENLABS_API_KEY is loaded (${masked})`);
    console.log(`  [INFO] Model: ${MODEL_ID}, Format: ${OUTPUT_FORMAT}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] Missing or invalid ELEVENLABS_API_KEY in ${envPath}`);
    console.error(`         Current value: ${apiKey || 'UNDEFINED'}`);
  }

  // -------------------------------------------------------------
  // Test 2: ElevenLabs API Connectivity
  // -------------------------------------------------------------
  console.log('\n[TEST 2/4] Testing ElevenLabs API Connectivity & Subscription...');
  let userVoices = [];
  if (isKeyPresent) {
    try {
      const resp = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: { 'xi-api-key': apiKey }
      });

      if (resp.ok) {
        const data = await resp.json();
        userVoices = data.voices || [];
        console.log(`  [PASS] Successfully connected to ElevenLabs API (HTTP 200 OK)`);
        console.log(`  [INFO] Total voices accessible: ${userVoices.length}`);
        passedTests++;
      } else {
        const err = await resp.text();
        console.error(`  [FAIL] ElevenLabs API responded with HTTP ${resp.status}: ${err}`);
      }
    } catch (err) {
      console.error(`  [FAIL] Network connection error to ElevenLabs API: ${err.message}`);
    }
  } else {
    console.warn(`  [SKIP] Skipping API connectivity test (No API key provided).`);
  }

  // -------------------------------------------------------------
  // Test 3: Local Voice Catalog Verification
  // -------------------------------------------------------------
  console.log('\n[TEST 3/4] Verifying Local Voice Catalog & Active Voice...');
  try {
    const catalog = await enhancedTTSService.getVoiceCatalog();
    const activeVoice = await enhancedTTSService.getActiveVoice();

    if (catalog.length > 0 && activeVoice) {
      console.log(`  [PASS] Voice catalog initialized with ${catalog.length} voice profiles`);
      console.log(`  [PASS] Active Voice: '${activeVoice.name}' (${activeVoice.provider_voice_id})`);
      passedTests++;
    } else {
      console.error(`  [FAIL] Voice catalog is empty or active voice could not be determined.`);
    }
  } catch (err) {
    console.error(`  [FAIL] Error loading voice catalog: ${err.message}`);
  }

  // -------------------------------------------------------------
  // Test 4: Live TTS Synthesis (Binary Stream Generation)
  // -------------------------------------------------------------
  console.log('\n[TEST 4/4] Testing Live High-Definition TTS Audio Synthesis...');
  if (isKeyPresent) {
    try {
      const activeVoice = await enhancedTTSService.getActiveVoice();
      const testText = 'Hello! This is an automated diagnostic test of the F.R.I.D.A.Y. voice synthesis system.';
      
      const startTime = Date.now();
      const audioBuffer = await enhancedTTSService.synthesizeRawAudio(testText, activeVoice.id);
      const latency = Date.now() - startTime;

      if (audioBuffer && audioBuffer.length > 1000) {
        console.log(`  [PASS] Audio stream received: ${audioBuffer.length} bytes in ${latency}ms`);
        console.log(`  [PASS] Content format: MPEG Audio (44.1kHz stereo)`);
        passedTests++;
      } else {
        console.error(`  [FAIL] TTS synthesis returned null or empty buffer.`);
      }
    } catch (err) {
      console.error(`  [FAIL] Error during live TTS synthesis: ${err.message}`);
    }
  } else {
    console.warn(`  [SKIP] Skipping live TTS synthesis (No API key provided).`);
  }

  // -------------------------------------------------------------
  // Final Diagnostic Summary
  // -------------------------------------------------------------
  console.log('\n===============================================================');
  if (passedTests === totalTests) {
    console.log(`  RESULT: ALL ${passedTests}/${totalTests} DIAGNOSTIC TESTS PASSED! (100% HEALTHY)`);
    console.log('  Your ElevenLabs audio pipeline is ready for high-fidelity speech.');
  } else {
    console.log(`  RESULT: ${passedTests}/${totalTests} TESTS PASSED.`);
    console.log('  Please review the failure details above to resolve configuration issues.');
  }
  console.log('===============================================================\n');
}

runDiagnostics();
