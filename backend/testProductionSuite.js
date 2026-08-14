import assert from 'assert';
import { initDatabase, purgeAllData } from './db.js';
import { syncEngine } from './syncEngine.js';
import { secretaryBrain } from './secretaryBrain.js';
import { habitLearningEngine } from './habitLearningEngine.js';
import { predictivePrepEngine } from './predictivePrepEngine.js';
import { auditLogger } from './auditLogger.js';
import { feedbackEngine } from './feedbackEngine.js';
import { processIntent } from './intentEngine.js';

console.log('===================================================================');
console.log('--- RUNNING UNIFIED F.R.I.D.A.Y. PRODUCTION TEST SUITE (PHASES 1-5) ---');
console.log('===================================================================\n');

async function runProductionTests() {
  try {
    // 1. Initialize SQLite Database
    console.log('[1/6] Initializing Production SQLite Database...');
    await initDatabase();
    console.log('✓ Database initialized.');

    // 2. Test E2E Encrypted Sync & Conflict Resolver
    console.log('[2/6] Testing Cross-Device E2E Encrypted Sync & Vector Clock Conflict Resolution...');
    const syncRes = await syncEngine.syncNow('desktop_win_01');
    assert.strictEqual(syncRes.success, true);
    assert.strictEqual(syncRes.encrypted, true);

    const conflictRes = syncEngine.resolveConflict(
      { id: 1, text: 'Desktop Edit', timestamp: '2026-08-14T04:00:00Z' },
      { id: 1, text: 'Phone Edit', timestamp: '2026-08-14T04:05:00Z' }
    );
    assert.strictEqual(conflictRes.winner, 'remote', 'Newer timestamp should resolve conflict winner');
    console.log('✓ Cross-Device Sync & Vector Clock Conflict Resolver verified.');

    // 3. Test Secretary Brain Morning Briefing 2.0 & Relationship Manager
    console.log('[3/6] Testing Secretary Brain Morning Briefing 2.0...');
    const briefing2 = await secretaryBrain.getMorningBriefing2('professional');
    assert(briefing2.text.includes('Good morning'), 'Briefing 2.0 should start with Good Morning');
    assert(briefing2.text.includes('haven\'t worked out in 3 days'), 'Briefing 2.0 should include workout gap recommendation');
    
    const relRes = await secretaryBrain.getRelationshipInsights();
    assert(relRes.recommendation.includes('Sarah'), 'Relationship manager should track contact frequency');
    console.log('✓ Secretary Brain Briefing 2.0 & Relationship Manager verified.');

    // 4. Test Habit Learning & Predictive Pre-Meeting Prep Pack
    console.log('[4/6] Testing Habit Learning & Predictive Pre-Meeting Prep Pack...');
    const habits = await habitLearningEngine.getHabits();
    assert(habits.length >= 3, 'Should discover at least 3 learned habits');

    const prepPack = await predictivePrepEngine.generatePrepPack('Acme Corp Strategy Sync');
    assert(prepPack.suggestedPrepText.includes('Acme_Corp_Q3_Budget_Forecast.pdf'), 'Prep pack should pull relevant budget doc');
    console.log('✓ Habit Learning Engine & Predictive Prep Pack verified.');

    // 5. Test Security Audit Logger & In-App Feedback Engine
    console.log('[5/6] Testing Security Audit Logger & In-App Feedback Tracker...');
    await auditLogger.log('EMAIL_SENT', 'Sent email to Pepper Potts');
    await auditLogger.log('EVENT_CREATED', 'Created meeting with Rhodey');
    const auditRes = await auditLogger.getDailyAuditSummary();
    assert(auditRes.summaryText.includes('Security Audit Log'), 'Audit summary verified');

    const feedbackRes = await feedbackEngine.submitFeedback(101, 'thumbs_up', 'Great latency!');
    assert.strictEqual(feedbackRes.success, true);
    console.log('✓ Security Audit Logger & In-App Feedback Engine verified.');

    // 6. Test Voice Intent Engine Phase 5 Queries
    console.log('[6/6] Testing Voice Intent Processor for Phase 5 Queries...');
    const intentRes1 = await processIntent('Run morning briefing 2.0');
    assert.strictEqual(intentRes1.intent, 'PROACTIVE_SUGGEST');

    const intentRes2 = await processIntent('Show meeting prep pack');
    assert.strictEqual(intentRes2.intent, 'PREP_MEETING');

    const intentRes3 = await processIntent('Show security audit log');
    assert.strictEqual(intentRes3.intent, 'AUDIT_SUMMARY');
    console.log('✓ Voice Intent Processor verified for Phase 5 queries.');

    console.log('\n===================================================================');
    console.log('SUCCESS: UNIFIED PRODUCTION TEST SUITE (PHASES 1-5) PASSED 100%!');
    console.log('===================================================================\n');
  } catch (err) {
    console.error('❌ PRODUCTION TEST SUITE FAILED:', err);
    process.exit(1);
  }
}

runProductionTests();
