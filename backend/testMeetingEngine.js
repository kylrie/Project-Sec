import assert from 'assert';
import { initDatabase } from './db.js';
import { meetingEngine } from './meetingEngine.js';
import { PDFExporter } from './pdfExporter.js';
import { googleTasksService } from './googleTasks.js';

console.log('--- RUNNING F.R.I.D.A.Y. MEETING INTELLIGENCE TEST SUITE ---');

async function runMeetingTests() {
  try {
    // 1. Initialize DB
    console.log('[1/6] Initializing SQLite Meeting DB...');
    await initDatabase();
    console.log('✓ Database initialized.');

    // 2. Start Meeting Recording
    console.log('[2/6] Testing Meeting Start & Diarized Transcript Seeding...');
    const startRes = await meetingEngine.startMeeting('Q3 Strategic Defense Review', 'google_meet');
    assert.strictEqual(startRes.success, true);
    assert.strictEqual(startRes.meeting.provider, 'google_meet');
    console.log('✓ Meeting started and recording initialized.');

    // 3. Smart Voice Bookmarking
    console.log('[3/6] Testing Smart Voice Bookmark Flagging...');
    const bookmarkRes = await meetingEngine.flagBookmark('Flagged: Launch Date Moved to Q2');
    assert.strictEqual(bookmarkRes.success, true);
    assert(bookmarkRes.bookmark.note.includes('Launch Date'), 'Bookmark note verified');
    console.log('✓ Smart Voice Bookmark verified.');

    // 4. Meeting Transcript Search with Timestamp Jump
    console.log('[4/6] Testing Diarized Transcript Keyword Search...');
    const searchRes = await meetingEngine.searchTranscript(startRes.meeting.id, 'FRIDAY');
    assert(searchRes.matchCount > 0, 'Should find keyword matches in transcript');
    assert.strictEqual(searchRes.results[0].speaker, 'Tony Stark');
    console.log(`✓ Transcript search found ${searchRes.matchCount} diarized matches.`);

    // 5. Meeting End & Intelligent Summarization (< 60s execution)
    console.log('[5/6] Testing Meeting Completion & Intelligent Summarizer...');
    const stopRes = await meetingEngine.stopMeeting();
    assert.strictEqual(stopRes.success, true);
    assert(stopRes.meeting.summary.executive_summary.length >= 3, 'Executive summary should have 3+ bullets');
    assert(stopRes.meeting.summary.decisions.length >= 2, 'Decisions made should be explicitly called out');
    assert(stopRes.meeting.summary.action_items.length >= 3, 'Action items should be extracted');
    console.log('✓ Intelligent Summarizer verified (Executive Summary, Decisions, Action Items).');

    // 6. Action Items to Google Tasks Sync & PDF Export
    console.log('[6/6] Testing Action Items to Google Tasks Sync & PDF Export...');
    const dueTasks = await googleTasksService.getDueTasks();
    assert(dueTasks.count > 0, 'Action items should automatically convert into Google Tasks');

    const exportRes = await PDFExporter.exportToFile(
      stopRes.meeting,
      stopRes.meeting.summary,
      [],
      stopRes.meeting.summary.action_items
    );
    assert.strictEqual(exportRes.success, true);
    assert(exportRes.markdown.includes('F.R.I.D.A.Y. EXECUTIVE MEETING MINUTES'));
    console.log(`✓ Meeting minutes exported cleanly to: ${exportRes.filename}.`);

    console.log('\n======================================================');
    console.log('SUCCESS: ALL 6 MEETING INTELLIGENCE TESTS PASSED!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ MEETING TEST FAILED:', err);
    process.exit(1);
  }
}

runMeetingTests();
