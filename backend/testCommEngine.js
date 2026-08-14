import assert from 'assert';
import { initDatabase } from './db.js';
import { communicationEngine } from './communicationEngine.js';
import { telephonyService } from './telephonyService.js';
import { viberService } from './viberService.js';
import { messengerService } from './messengerService.js';
import { smartReplyEngine } from './smartReplyEngine.js';
import { dndAutoResponder } from './dndAutoResponder.js';
import { processIntent } from './intentEngine.js';

console.log('--- RUNNING F.R.I.D.A.Y. MULTI-CHANNEL COMMUNICATION TEST SUITE ---');

async function runCommTests() {
  try {
    // 1. Initialize DB
    console.log('[1/7] Initializing SQLite Communication DB...');
    await initDatabase();
    console.log('✓ Database initialized.');

    // 2. Unified Inbox Fetch Latency & Communication Digest
    console.log('[2/7] Testing Unified Inbox Fetch & Communication Digest (< 3s)...');
    const startMs = Date.now();
    const digestRes = await communicationEngine.getUnifiedInboxSummary('all');
    const latency = Date.now() - startMs;
    assert(latency < 3000, `Unified inbox fetch should take under 3000ms (actual: ${latency}ms)`);
    assert(digestRes.digestText.includes('Communication Digest'), 'Should generate valid digest');
    console.log(`✓ Unified Inbox returned in ${latency}ms.`);

    // 3. SMS Processing & OTP Metadata Extraction
    console.log('[3/7] Testing SMS Read & OTP Extraction...');
    const smsRes = await telephonyService.receiveSMS('Stark Bank Security', 'Your Stark Bank verification code is 482910. Do not share.');
    assert.strictEqual(smsRes.metadata.is_otp, true, 'Should extract OTP flag');
    assert.strictEqual(smsRes.metadata.otp_code, '482910', 'Should extract exact OTP code 482910');
    console.log('✓ SMS processing and OTP code extraction verified.');

    // 4. Phone Call Initiation & Post-Call Summary Logger
    console.log('[4/7] Testing Call Initiation & Post-Call Summary Log...');
    const callRes = await telephonyService.initiateCall('John');
    assert.strictEqual(callRes.success, true);
    assert(callRes.call.summary.includes('spoke with John'), 'Call summary should log contact interaction');
    console.log('✓ Call initiation and summary logging verified.');

    // 5. Viber & Facebook Messenger Messaging
    console.log('[5/7] Testing Viber & Facebook Messenger Dispatch...');
    const viberRes = await viberService.sendViberMessage('John', "I'll be 10 minutes late.");
    assert.strictEqual(viberRes.success, true);

    const groupSummary = await messengerService.summarizeGroupChat('Family Group');
    assert(groupSummary.summary.includes('Mom confirmed'), 'Group chat summary verified');
    console.log('✓ Viber voice dispatch & Messenger group chat summarizer verified.');

    // 6. Smart Reply Suggestions Generator
    console.log('[6/7] Testing Smart Reply Suggestion Generator...');
    const suggestions = smartReplyEngine.generateSuggestions('Dinner at 7 PM tonight?');
    assert.strictEqual(suggestions.length, 3, 'Should generate 3 quick reply options');
    console.log('✓ Smart Reply Generator generated 3 context-aware suggestions.');

    // 7. DND Meeting Mode & Auto-Responder
    console.log('[7/7] Testing DND Meeting Mode & Emergency Filter...');
    const dndSet = await dndAutoResponder.enableDND('meeting');
    assert.strictEqual(dndSet.settings.enabled, true);

    const nonEmergency = await dndAutoResponder.checkDndFilter('Stranger', 'Hey what is up');
    assert.strictEqual(nonEmergency.interrupt, false, 'Non-emergency should be filtered during DND');
    assert.strictEqual(nonEmergency.autoResponded, true, 'Auto-responder should trigger');

    const emergency = await dndAutoResponder.checkDndFilter('Mom', 'URGENT: Call me now!');
    assert.strictEqual(emergency.interrupt, true, 'Emergency keyword should break through DND');
    
    await dndAutoResponder.disableDND();
    console.log('✓ DND Meeting Mode & Auto-Responder filter verified.');

    console.log('\n======================================================');
    console.log('SUCCESS: ALL 7 COMMUNICATION MANAGER TESTS PASSED!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ COMMUNICATION TEST FAILED:', err);
    process.exit(1);
  }
}

runCommTests();
