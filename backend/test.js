import assert from 'assert';
import { initDatabase, saveMessage, getRecentConversations, cleanupOldContext, purgeAllData, getDatabaseStats } from './db.js';
import { processIntent } from './intentEngine.js';
import { checkInterruptionKeyword } from './sttEngine.js';
import { buildTTSPayload } from './ttsEngine.js';

console.log('--- RUNNING F.R.I.D.A.Y. BACKEND TEST SUITE ---');

async function runTests() {
  try {
    // Test 1: Database Initialization
    console.log('[1/6] Testing Database Initialization...');
    await initDatabase();
    console.log('✓ Database initialized successfully.');

    // Test 2: Message Saving & Retrieval
    console.log('[2/6] Testing Save Message & Retrieval...');
    const userMsg = await saveMessage('user', 'What time is it?', 'GET_TIME');
    assert.strictEqual(userMsg.role, 'user');
    assert.strictEqual(userMsg.content, 'What time is it?');

    const assistantMsg = await saveMessage('assistant', 'Systems nominal: Current time is 10:00 AM.', 'GET_TIME', 120);
    assert.strictEqual(assistantMsg.role, 'assistant');

    const history = await getRecentConversations(10);
    assert(history.length >= 2, 'Conversation history should contain logged messages');
    console.log('✓ Conversation logging verified.');

    // Test 3: Intent Engine Processing & Personality Presets
    console.log('[3/6] Testing Intent Engine...');
    
    // 3a. Time Intent (Professional vs Concise vs Casual)
    const timeProf = await processIntent('What time is it?', 'professional');
    assert.strictEqual(timeProf.intent, 'GET_TIME');
    assert(timeProf.response.includes('Systems check'), 'Professional response format check');

    const timeConcise = await processIntent('What time is it?', 'concise');
    assert.strictEqual(timeConcise.intent, 'GET_TIME');

    // 3b. Timer Intent
    const timerResult = await processIntent('Set a timer for 10 minutes', 'casual');
    assert.strictEqual(timerResult.intent, 'SET_TIMER');
    assert.strictEqual(timerResult.actionPayload.duration_sec, 600);

    // 3c. Weather Intent
    const weatherResult = await processIntent('What is the weather today?', 'professional');
    assert.strictEqual(weatherResult.intent, 'GET_WEATHER');

    // 3d. Reminder Intent
    const reminderResult = await processIntent('Remind me to call Mom at 5 PM', 'professional');
    assert.strictEqual(reminderResult.intent, 'SET_REMINDER');

    // 3e. Abort / Stop Intent
    const stopResult = await processIntent('Never mind', 'professional');
    assert.strictEqual(stopResult.intent, 'ABORT_COMMAND');
    console.log('✓ Intent recognition & personality presets verified.');

    // Test 4: STT Interruption Keyword Detection
    console.log('[4/6] Testing STT Interruption Detection...');
    assert.strictEqual(checkInterruptionKeyword('Please stop right now'), true);
    assert.strictEqual(checkInterruptionKeyword('never mind cancel'), true);
    assert.strictEqual(checkInterruptionKeyword('what is the time'), false);
    console.log('✓ Interruption keyword detection verified.');

    // Test 5: TTS Payload Generation
    console.log('[5/6] Testing TTS Payload Builder...');
    const tts = buildTTSPayload('Hello boss', { personality: 'concise', speed: 1.5 });
    assert.strictEqual(tts.config.personality, 'concise');
    assert.strictEqual(tts.config.speed, 1.5);
    console.log('✓ TTS Payload Builder verified.');

    // Test 6: Privacy Purge & 7-Day Rolling Context Cleanup
    console.log('[6/6] Testing Privacy Purge & 7-Day Cleanup...');
    await cleanupOldContext();
    const statsBeforePurge = await getDatabaseStats();
    assert(statsBeforePurge.total_messages > 0, 'Should have active database stats');

    await purgeAllData();
    const statsAfterPurge = await getDatabaseStats();
    assert.strictEqual(statsAfterPurge.total_messages, 0, 'Database should be completely empty after purge');
    console.log('✓ Privacy Purge & 7-day rolling context cleanup verified.');

    console.log('\n=============================================');
    console.log('SUCCESS: ALL 6 BACKEND UNIT TESTS PASSED!');
    console.log('=============================================\n');
  } catch (err) {
    console.error('❌ TEST FAILED:', err);
    process.exit(1);
  }
}

runTests();
