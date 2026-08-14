import { addTimer, addReminder } from './db.js';
import { googleCalendarService } from './googleCalendar.js';
import { googleGmailService } from './googleGmail.js';
import { googleTasksService } from './googleTasks.js';
import { workspaceEngine } from './workspaceEngine.js';
import { meetingEngine } from './meetingEngine.js';
import { PDFExporter } from './pdfExporter.js';

import { communicationEngine } from './communicationEngine.js';
import { telephonyService } from './telephonyService.js';
import { viberService } from './viberService.js';
import { messengerService } from './messengerService.js';
import { dndAutoResponder } from './dndAutoResponder.js';

import { syncEngine } from './syncEngine.js';
import { secretaryBrain } from './secretaryBrain.js';
import { habitLearningEngine } from './habitLearningEngine.js';
import { predictivePrepEngine } from './predictivePrepEngine.js';
import { auditLogger } from './auditLogger.js';
import { feedbackEngine } from './feedbackEngine.js';

/**
 * Recognizes intents from speech/text input and executes standard actions.
 * Supports presets for personality: 'professional' | 'casual' | 'concise'.
 */
export async function processIntent(text, personality = 'professional') {
  const normalized = text.trim().toLowerCase();

  // 1. Abort / Cancel Command
  if (normalized === 'stop' || normalized === 'never mind' || normalized === 'cancel' || normalized.includes('abort')) {
    return {
      intent: 'ABORT_COMMAND',
      response: formatResponse('Operation aborted, boss.', 'Aborted.', 'Aborted.', personality),
      actionPayload: { action: 'abort' }
    };
  }

  // 1.5 Quick Greetings & Instant Acknowledgments
  if (normalized === 'good morning' || normalized === 'hello' || normalized === 'hi' || normalized === 'hey friday') {
    return {
      intent: 'GREETING',
      response: formatResponse('Good morning, boss. Ready when you are.', 'Hey boss! What can I do for you?', 'Online and ready.', personality),
      actionPayload: { greeting: true }
    };
  }

  // 2. Morning Briefing 2.0 ("Good morning", "Morning briefing 2.0", "Run briefing")
  if (normalized.includes('briefing 2') || (normalized.includes('morning') && normalized.includes('briefing')) || normalized.includes('secretary brain')) {
    const briefing2Res = await secretaryBrain.getMorningBriefing2(personality);
    await auditLogger.log('BRIEFING_RUN', 'Ran Morning Briefing 2.0');
    return {
      intent: 'PROACTIVE_SUGGEST',
      response: briefing2Res.text,
      actionPayload: briefing2Res
    };
  }

  // 3. Predictive Meeting Prep Pack ("Show meeting prep", "Predictive prep", "Prepare for meeting")
  if (normalized.includes('prep pack') || normalized.includes('predictive prep') || (normalized.includes('prepare') && normalized.includes('meeting'))) {
    const prepRes = await predictivePrepEngine.generatePrepPack('Acme Corp Strategy Sync');
    await auditLogger.log('PREP_PACK_GEN', 'Generated Predictive Meeting Prep Pack');
    return {
      intent: 'PREP_MEETING',
      response: prepRes.suggestedPrepText,
      actionPayload: prepRes
    };
  }

  // 4. Habit Learning Insights ("Show learned habits", "Habit insights")
  if (normalized.includes('learned habits') || normalized.includes('habit insights') || normalized.includes('my habits')) {
    const habitsRes = await habitLearningEngine.getProactiveHabitSuggestions();
    return {
      intent: 'HABIT_CHECK',
      response: `Learned Habits Insight: ${habitsRes.join(' ')}`,
      actionPayload: { suggestions: habitsRes }
    };
  }

  // 5. Security Audit Summary Log ("Show audit log", "Security audit")
  if (normalized.includes('audit log') || normalized.includes('security audit')) {
    const auditRes = await auditLogger.getDailyAuditSummary();
    return {
      intent: 'AUDIT_SUMMARY',
      response: auditRes.summaryText,
      actionPayload: auditRes
    };
  }

  // 6. Cross-Device Sync ("Sync data", "Sync now")
  if (normalized.includes('sync data') || normalized.includes('sync now') || normalized.includes('cross device')) {
    const syncRes = await syncEngine.syncNow('desktop_win_01');
    await auditLogger.log('CROSS_DEVICE_SYNC', 'Executed E2E Encrypted Cross-Device Sync');
    return {
      intent: 'CROSS_DEVICE_SYNC',
      response: `Cross-device synchronization complete. E2E encryption active. All devices updated.`,
      actionPayload: syncRes
    };
  }

  // 7. DND & Auto-Responder ("I'm in a meeting, only interrupt for emergencies", "Enable DND")
  if (normalized.includes('do not disturb') || normalized.includes('dnd') || (normalized.includes('meeting') && normalized.includes('emergencies'))) {
    if (normalized.includes('disable') || normalized.includes('off') || normalized.includes('turn off')) {
      const disableRes = await dndAutoResponder.disableDND();
      return {
        intent: 'DND_SET',
        response: disableRes.message,
        actionPayload: disableRes
      };
    }

    const dndRes = await dndAutoResponder.enableDND('meeting');
    await auditLogger.log('DND_ENABLED', 'Enabled Meeting DND Auto-Responder');
    return {
      intent: 'DND_SET',
      response: dndRes.message,
      actionPayload: dndRes
    };
  }

  // 8. Unified Communication Digest & Inbox ("Read my unread messages", "Show unified inbox", "Communication digest")
  if (normalized.includes('unified inbox') || normalized.includes('unread messages') || normalized.includes('digest')) {
    const summaryRes = await communicationEngine.getUnifiedInboxSummary('all');
    await auditLogger.log('MSG_READ', 'Read Unified Communication Inbox');
    return {
      intent: 'UNIFIED_INBOX',
      response: summaryRes.digestText,
      actionPayload: summaryRes
    };
  }

  // 9. Call Initiation ("Call John", "Dial Pepper")
  if (normalized.startsWith('call ') || normalized.startsWith('dial ')) {
    const contactName = text.replace(/^(call|dial) /i, '').trim();
    const callRes = await telephonyService.initiateCall(contactName);
    await auditLogger.log('CALL_INITIATED', `Initiated call to ${contactName}`);
    return {
      intent: 'CALL_INITIATE',
      response: callRes.announcement,
      actionPayload: callRes
    };
  }

  // 10. Viber Voice Send ("Tell John on Viber I'll be 10 minutes late")
  if (normalized.includes('on viber') || normalized.startsWith('viber ')) {
    const recipientMatch = text.match(/(?:tell|send|viber) ([^on|I'll|saying]+)/i);
    const recipient = recipientMatch ? recipientMatch[1].replace(/on viber/i, '').trim() : 'John';
    
    const bodyMatch = text.match(/(?:saying|viber|that) (.*)/i) || text.match(/I'll (.*)/i);
    const body = bodyMatch ? bodyMatch[1].trim() : "I'll be 10 minutes late.";

    const viberRes = await viberService.sendViberMessage(recipient, body);
    await auditLogger.log('COMM_DISPATCH', `Sent Viber message to ${recipient}`);
    return {
      intent: 'VIBER_SEND',
      response: viberRes.sentMessage,
      actionPayload: viberRes
    };
  }

  // 11. Messenger Group Chat Summarizer ("Summarize family group chat", "What did the family group say?")
  if (normalized.includes('family group') || (normalized.includes('messenger') && normalized.includes('group'))) {
    const groupRes = await messengerService.summarizeGroupChat('Family Group');
    await auditLogger.log('MSG_READ', 'Summarized Messenger Family Group');
    return {
      intent: 'MESSENGER_SUMMARIZE',
      response: `Summary of 24h activity in ${groupRes.groupName} (${groupRes.messageCount} messages): ${groupRes.summary}`,
      actionPayload: groupRes
    };
  }

  // 12. SMS Read & Send ("Send SMS to Mom saying I'll be there", "Text John")
  if (normalized.startsWith('send sms') || normalized.startsWith('text ') || normalized.includes('sms')) {
    const recipientMatch = text.match(/(?:sms to|text) ([^saying|I'll]+)/i);
    const recipient = recipientMatch ? recipientMatch[1].trim() : 'Mom';
    
    const bodyMatch = text.match(/saying (.*)/i);
    const body = bodyMatch ? bodyMatch[1].trim() : 'Dinner at 7 PM sounds great!';

    const smsRes = await telephonyService.sendSMS(recipient, body);
    await auditLogger.log('COMM_DISPATCH', `Sent SMS to ${recipient}`);
    return {
      intent: 'SMS_SEND',
      response: smsRes.sentMessage,
      actionPayload: smsRes
    };
  }

  // 13. Meeting Start
  if (normalized.includes('start meeting') || normalized.includes('meeting minutes') || normalized.includes('start recording') || normalized.includes('join meet')) {
    const provider = normalized.includes('ambient') ? 'ambient' : 'google_meet';
    const title = text.replace(/start meeting (minutes )?/i, '').replace(/start recording /i, '') || 'Executive Sync';

    const startRes = await meetingEngine.startMeeting(title, provider);
    await auditLogger.log('MEETING_START', `Started meeting recording: ${title}`);
    return {
      intent: 'MEETING_START',
      response: startRes.message,
      actionPayload: startRes
    };
  }

  // 14. Smart Voice Bookmark
  if (normalized.includes('flag that') || normalized.includes('bookmark') || normalized.includes('flag decision')) {
    const bookmarkRes = await meetingEngine.flagBookmark('Voice Flagged Bookmark');
    return {
      intent: 'MEETING_FLAG',
      response: bookmarkRes.message,
      actionPayload: bookmarkRes
    };
  }

  // 15. Meeting Stop
  if (normalized.includes('end meeting') || normalized.includes('stop meeting') || normalized.includes('finish meeting')) {
    const stopRes = await meetingEngine.stopMeeting();
    await auditLogger.log('MEETING_END', 'Finished meeting recording & generated summary');
    return {
      intent: 'MEETING_STOP',
      response: stopRes.summaryText || stopRes.message,
      actionPayload: stopRes
    };
  }

  // 16. Export Meeting Minutes PDF
  if (normalized.includes('export pdf') || normalized.includes('export meeting') || normalized.includes('export minutes')) {
    const active = meetingEngine.activeMeeting || { id: 'mtg_001', title: 'Executive Strategy Sync', provider: 'google_meet', start_time: new Date().toISOString() };
    const summaryData = {
      executive_summary: ["Reviewed Q3 financial audit", "Confirmed FRIDAY voice latency under 200ms", "Allocated hardware budget"],
      decisions: ["Move production rollout to Q2 end", "Approve hardware budget sign-off"],
      action_items: [
        { action: "Finalize hardware specs", owner: "Pepper Potts", deadline: "Friday" },
        { action: "Submit budget forecast models", owner: "Sarah Jenkins", deadline: "Tomorrow" }
      ]
    };

    const exportRes = await PDFExporter.exportToFile(active, summaryData, [], summaryData.action_items);
    await auditLogger.log('EXPORT_PDF', `Exported meeting minutes PDF for ${active.title}`);
    return {
      intent: 'MEETING_EXPORT',
      response: `Meeting minutes successfully exported to PDF/Markdown: ${exportRes.filename}.`,
      actionPayload: exportRes
    };
  }

  // 17. Search Transcript
  if (normalized.startsWith('search transcript') || (normalized.includes('search meeting') && normalized.includes('for'))) {
    const q = text.replace(/search meeting transcript for /i, '').replace(/search meeting for /i, '');
    const searchRes = await meetingEngine.searchTranscript('mtg_001', q);
    
    return {
      intent: 'MEETING_SEARCH',
      response: `Found ${searchRes.matchCount} transcript matches for "${q}". Top speaker: ${searchRes.results[0]?.speaker || 'Tony Stark'}.`,
      actionPayload: searchRes
    };
  }

  // 18. Daily Executive Morning Briefing
  if (normalized.includes('daily briefing') || normalized.includes('morning briefing') || normalized.includes('good morning')) {
    const briefingText = await googleCalendarService.getDailyBriefing(personality);
    await auditLogger.log('BRIEFING_RUN', 'Ran Morning Daily Briefing');
    return {
      intent: 'DAILY_BRIEFING',
      response: briefingText,
      actionPayload: { type: 'briefing' }
    };
  }

  // 19. Calendar Read Schedule
  if (normalized.includes('schedule') || normalized.includes('calendar') || normalized.includes('meetings today')) {
    const todayEvents = await googleCalendarService.getTodaySchedule();
    if (todayEvents.length === 0) {
      return {
        intent: 'CALENDAR_READ',
        response: formatResponse("Your calendar is completely open today, boss.", "You have no meetings today!", "No meetings.", personality),
        actionPayload: { count: 0, events: [] }
      };
    }

    const eventListStr = todayEvents.map(e => `${e.summary} at ${new Date(e.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`).join('. ');
    const firstEvt = todayEvents[0];
    workspaceEngine.setEventContext(firstEvt);

    return {
      intent: 'CALENDAR_READ',
      response: `You have ${todayEvents.length} meeting${todayEvents.length > 1 ? 's' : ''} scheduled today: ${eventListStr}.`,
      actionPayload: { count: todayEvents.length, events: todayEvents }
    };
  }

  // 20. Smart Scheduling Slot Finder
  if (normalized.includes('find') && (normalized.includes('slot') || normalized.includes('time') || normalized.includes('free'))) {
    const durationMatch = normalized.match(/(\d+)\s*(?:min|minute)/i);
    const duration = durationMatch ? parseInt(durationMatch[1], 10) : 45;

    const slots = googleCalendarService.findSmartSlots(duration, 3);
    if (slots.length === 0) {
      return {
        intent: 'SMART_SCHEDULING',
        response: "I scanned your calendar, but couldn't find an open slot matching that duration this week.",
        actionPayload: { slots: [] }
      };
    }

    const slotLabels = slots.map(s => s.label).join(', ');
    return {
      intent: 'SMART_SCHEDULING',
      response: `I found ${slots.length} available ${duration}-minute slots: ${slotLabels}. Which one works best?`,
      actionPayload: { slots }
    };
  }

  // 21. Create Calendar Event
  if (normalized.startsWith('schedule') || normalized.startsWith('create a meeting') || normalized.startsWith('add meeting')) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 1);
    targetDate.setHours(14, 0, 0, 0);
    const endDate = new Date(targetDate.getTime() + 30 * 60 * 1000);

    const summaryMatch = text.match(/schedule (?:a )?(?:meeting )?(?:with )?([^at|tomorrow|today]+)/i);
    const summary = summaryMatch ? `Meeting with ${summaryMatch[1].trim()}` : 'Scheduled Sync';

    const result = await googleCalendarService.createEvent({
      summary,
      startTime: targetDate.toISOString(),
      endTime: endDate.toISOString(),
      location: 'Google Meet'
    });

    if (result.conflict) {
      workspaceEngine.setEventContext(result.conflictingEvent);
      return {
        intent: 'CALENDAR_CONFLICT',
        response: result.message,
        actionPayload: result
      };
    }

    workspaceEngine.setEventContext(result.event);
    await auditLogger.log('EVENT_CREATED', `Created Calendar Event: ${summary}`);
    return {
      intent: 'CALENDAR_CREATE',
      response: result.message,
      actionPayload: result
    };
  }

  // 22. Gmail Summarize
  if (normalized.includes('summarize') && (normalized.includes('email') || normalized.includes('inbox') || normalized.includes('mail'))) {
    const unreadInfo = await googleGmailService.getUnreadSummaries();
    if (unreadInfo.emails && unreadInfo.emails.length > 0) {
      workspaceEngine.setEmailContext(unreadInfo.emails[0]);
    }
    return {
      intent: 'GMAIL_SUMMARIZE',
      response: unreadInfo.summaryText,
      actionPayload: unreadInfo
    };
  }

  // 23. Gmail Triage
  if (normalized.includes('urgent email') || normalized.includes('urgent mail') || normalized.includes('triage')) {
    const triageText = await googleGmailService.getUrgentEmails();
    return {
      intent: 'GMAIL_TRIAGE',
      response: triageText,
      actionPayload: { triage: true }
    };
  }

  // 24. Gmail Search
  if (normalized.startsWith('find email') || normalized.startsWith('search email') || (normalized.includes('email') && normalized.includes('from'))) {
    const query = text.replace(/find (that )?email /i, '').replace(/search email /i, '');
    const searchRes = await googleGmailService.searchEmails(query);
    return {
      intent: 'GMAIL_SEARCH',
      response: searchRes,
      actionPayload: { query }
    };
  }

  // 25. Gmail Draft Email
  if (normalized.startsWith('draft an email') || normalized.startsWith('draft email') || normalized.startsWith('compose email')) {
    const recipientMatch = text.match(/to ([^saying|about|that]+)/i);
    const recipient = recipientMatch ? recipientMatch[1].trim() : 'boss@stark.com';

    const bodyMatch = text.match(/saying (.*)/i) || text.match(/about (.*)/i);
    const bodyText = bodyMatch ? bodyMatch[1].trim() : 'I am running slightly behind schedule today and will arrive shortly.';
    const subject = `Update: ${bodyText.substring(0, 30)}...`;

    const draftRes = await googleGmailService.createDraft(recipient, subject, bodyText);
    workspaceEngine.setEmailContext(draftRes.draft);
    await auditLogger.log('DRAFT_CREATED', `Created Email Draft to ${recipient}`);

    return {
      intent: 'GMAIL_DRAFT',
      response: draftRes.promptText,
      actionPayload: draftRes
    };
  }

  // 26. Gmail Confirm & Send Email
  if (normalized === 'send it' || normalized === 'send email' || normalized === 'confirm draft' || normalized === 'yes send it') {
    const sendRes = await googleGmailService.sendDraft();
    await auditLogger.log('EMAIL_SENT', 'Confirmed & Sent Email Draft');
    return {
      intent: 'GMAIL_SEND_CONFIRM',
      response: sendRes.sentMessage || sendRes.message,
      actionPayload: sendRes
    };
  }

  // 27. Google Tasks: List Tasks
  if (normalized.includes('task') && (normalized.includes('due') || normalized.includes('list') || normalized.includes('what'))) {
    const tasksRes = await googleTasksService.getDueTasks();
    return {
      intent: 'TASKS_LIST',
      response: tasksRes.responseText,
      actionPayload: tasksRes
    };
  }

  // 28. Google Tasks: Add Task
  if (normalized.startsWith('add') && (normalized.includes('task') || normalized.includes('list') || normalized.includes('shopping'))) {
    const titleMatch = text.replace(/^add (task )?/i, '').replace(/ to my (shopping )?list/i, '').replace(/^'/,'').replace(/'$/,'');
    const taskRes = await googleTasksService.addTask(titleMatch || 'New Task');
    return {
      intent: 'TASKS_ADD',
      response: taskRes.responseText,
      actionPayload: taskRes
    };
  }

  // 29. Google Tasks: Complete Task
  if (normalized.includes('complete') || normalized.includes('mark') && normalized.includes('done')) {
    const titleMatch = text.replace(/mark /i, '').replace(/ as complete/i, '').replace(/ as done/i, '');
    const completeRes = await googleTasksService.completeTask(titleMatch);
    return {
      intent: 'TASKS_COMPLETE',
      response: completeRes.responseText,
      actionPayload: completeRes
    };
  }

  // 30. Timer Intent
  const timerMatch = normalized.match(/timer (?:for )?(\d+)\s*(minute|min|sec|second|hour|hr)s?/i) ||
                     normalized.match(/set (?:a )?timer (?:for )?(\d+)\s*(minute|min|sec|second|hour|hr)s?/i);
  if (timerMatch) {
    const amount = parseInt(timerMatch[1], 10);
    const unit = timerMatch[2].toLowerCase();
    
    let durationSec = amount;
    if (unit.startsWith('min')) durationSec = amount * 60;
    else if (unit.startsWith('hour') || unit.startsWith('hr')) durationSec = amount * 3600;

    const label = `${amount} ${unit} timer`;
    const createdTimer = await addTimer(label, durationSec);

    return {
      intent: 'SET_TIMER',
      response: formatResponse(`Timer initialized for ${amount} ${unit}s. Expiry logged.`, `Got it! Set a timer for ${amount} ${unit}s.`, `Timer set for ${amount} ${unit}s.`, personality),
      actionPayload: createdTimer
    };
  }

  // 31. Time Intent
  if (/\btime\b/i.test(normalized) || /\bclock\b/i.test(normalized)) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    
    return {
      intent: 'GET_TIME',
      response: formatResponse(`Systems check: Current local time is ${timeStr}, ${dateStr}.`, `It's currently ${timeStr} on ${dateStr}, boss.`, timeStr, personality),
      actionPayload: { time: timeStr, date: dateStr }
    };
  }

  // 32. Weather Intent
  if (normalized.includes('weather') || normalized.includes('temperature') || normalized.includes('forecast')) {
    const mockWeather = { temp: '72°F (22°C)', condition: 'Clear Skies', humidity: '45%' };
    return {
      intent: 'GET_WEATHER',
      response: formatResponse(`Environmental status: ${mockWeather.temp}, ${mockWeather.condition}.`, `Looking outside: It's a nice ${mockWeather.temp} with ${mockWeather.condition.toLowerCase()}.`, `${mockWeather.temp}, ${mockWeather.condition}.`, personality),
      actionPayload: mockWeather
    };
  }

  // 33. Reminder Intent
  if (normalized.startsWith('remind me to') || normalized.includes('reminder')) {
    const taskMatch = normalized.replace(/^remind me to\s*/i, '').replace(/^set a reminder to\s*/i, '');
    const reminderAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const createdReminder = await addReminder(taskMatch || 'Follow up task', reminderAt);

    return {
      intent: 'SET_REMINDER',
      response: formatResponse(`Tactical reminder logged: "${taskMatch}". Priority queued.`, `Sure thing! I've set a reminder to "${taskMatch}".`, `Reminder set: ${taskMatch}.`, personality),
      actionPayload: createdReminder
    };
  }

  // 34. General Fallback
  return {
    intent: 'GENERAL_LLM',
    response: formatResponse(`Command received: "${text}". Secondary analysis complete. All systems operational.`, `I hear you! You said "${text}". Anything else I can help with?`, `Acknowledged: "${text}".`, personality),
    actionPayload: { raw_query: text }
  };
}

function formatResponse(professional, casual, concise, preset) {
  if (preset === 'concise') return concise;
  if (preset === 'casual') return casual;
  return professional;
}
