import assert from 'assert';
import { initDatabase, purgeAllData } from './db.js';
import { googleCalendarService } from './googleCalendar.js';
import { googleGmailService } from './googleGmail.js';
import { googleTasksService } from './googleTasks.js';
import { googleAuthManager } from './googleAuth.js';
import { processIntent } from './intentEngine.js';

console.log('--- RUNNING F.R.I.D.A.Y. WORKSPACE INTEGRATION TEST SUITE ---');

async function runWorkspaceTests() {
  try {
    // 1. Initialize DB
    console.log('[1/7] Initializing SQLite Workspace DB...');
    await initDatabase();
    console.log('✓ Database initialized.');

    // 2. Google OAuth Status
    console.log('[2/7] Testing OAuth Status Manager...');
    const authStatus = await googleAuthManager.getAuthStatus();
    assert(authStatus.connected, 'OAuth manager should be connected');
    console.log('✓ OAuth manager verified.');

    // 3. Calendar Schedule & Conflict Detection
    console.log('[3/7] Testing Calendar Intelligence & Conflict Detection...');
    const todayEvents = await googleCalendarService.getTodaySchedule();
    assert(todayEvents.length >= 2, 'Should return scheduled events');

    // Attempt to schedule a conflicting event at 2:00 PM (14:00) when Dentist appt exists
    const conflictStart = new Date(new Date().setHours(14, 0, 0, 0)).toISOString();
    const conflictEnd = new Date(new Date().setHours(14, 30, 0, 0)).toISOString();
    
    const conflictRes = await googleCalendarService.createEvent({
      summary: 'Conflicting Meeting',
      startTime: conflictStart,
      endTime: conflictEnd
    });

    assert.strictEqual(conflictRes.conflict, true, 'Should detect calendar conflict');
    assert(conflictRes.message.includes('Dentist Appointment'), 'Should specify conflicting event name');
    console.log('✓ Conflict detection verified.');

    // 4. Smart Scheduling Slot Finder
    console.log('[4/7] Testing Smart Scheduling Slot Finder...');
    const freeSlots = googleCalendarService.findSmartSlots(45, 3);
    assert(freeSlots.length > 0, 'Should find open 45-minute slots');
    console.log(`✓ Smart Scheduling proposed ${freeSlots.length} available slots.`);

    // 5. Gmail Unread Summaries & Draft Approval Workflow
    console.log('[5/7] Testing Gmail Summaries & Draft Workflow...');
    const unread = await googleGmailService.getUnreadSummaries();
    assert(unread.count > 0, 'Should summarize unread inbox messages');
    assert(unread.summaryText.includes('URGENT'), 'Should prioritize urgent emails');

    const draftRes = await googleGmailService.createDraft('boss@stark.com', 'Late Update', 'Running 10 mins late');
    assert.strictEqual(draftRes.success, true);
    
    const sendRes = await googleGmailService.sendDraft(draftRes.draft.id);
    assert.strictEqual(sendRes.success, true);
    console.log('✓ Gmail Summarizer & Draft Approval workflow verified.');

    // 6. Google Tasks CRUD & Offline Cache Sync
    console.log('[6/7] Testing Google Tasks CRUD & Cache Sync...');
    const addTaskRes = await googleTasksService.addTask('Buy almond milk');
    assert.strictEqual(addTaskRes.success, true);

    const dueTasks = await googleTasksService.getDueTasks();
    assert(dueTasks.count > 0, 'Should return open tasks');

    const completeRes = await googleTasksService.completeTask('Buy almond milk');
    assert.strictEqual(completeRes.success, true);
    console.log('✓ Google Tasks CRUD & Offline cache sync verified.');

    // 7. Intent Engine Integration with Workspace Voice Queries
    console.log('[7/7] Testing Intent Engine Voice Queries...');
    
    const scheduleIntent = await processIntent("What's my schedule today?", 'professional');
    assert.strictEqual(scheduleIntent.intent, 'CALENDAR_READ');

    const res = await processIntent('Good morning');
    assert(res.intent === 'PROACTIVE_SUGGEST' || res.intent === 'DAILY_BRIEFING' || res.intent === 'GREETING', 'Should process morning briefing query');

    const summarizeIntent = await processIntent("Summarize my unread emails", 'concise');
    assert.strictEqual(summarizeIntent.intent, 'GMAIL_SUMMARIZE');

    const taskIntent = await processIntent("What tasks are due today?", 'professional');
    assert.strictEqual(taskIntent.intent, 'TASKS_LIST');

    console.log('✓ Intent Engine Workspace integration verified.');

    console.log('\n======================================================');
    console.log('SUCCESS: ALL 7 WORKSPACE INTEGRATION TESTS PASSED!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ WORKSPACE TEST FAILED:', err);
    process.exit(1);
  }
}

runWorkspaceTests();
