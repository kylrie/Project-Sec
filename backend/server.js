import 'dotenv/config';
import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { 
  initDatabase, 
  saveMessage, 
  getRecentConversations, 
  purgeAllData, 
  getDatabaseStats,
  getActiveTimers,
  getPendingReminders,
  getPendingDrafts,
  getRecentMeetings 
} from './db.js';
import { processIntent } from './intentEngine.js';
import { buildTTSPayload } from './ttsEngine.js';
import { checkInterruptionKeyword } from './sttEngine.js';

import { googleAuthManager } from './googleAuth.js';
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
import { enhancedTTSService } from './enhancedTTSService.js';
import voiceRoutes from './voiceRoutes.js';

const PORT = process.env.PORT || 3001;
const app = express();

app.use(cors());
app.use(express.json());

// Initialize SQLite database
await initDatabase();

// REST API Health & Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'F.R.I.D.A.Y. Production Core & Unified Secretary Brain Engine',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Voice Studio & TTS Routes
app.use('/api/v1', voiceRoutes);
app.use('/api', voiceRoutes);

// Phase 5 Sync & Brain REST Endpoints
app.post(['/api/sync', '/api/v1/sync/push'], async (req, res) => {
  try {
    const deviceId = req.body.deviceId || 'desktop_win_01';
    const result = await syncEngine.syncNow(deviceId, req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get(['/api/brain/briefing2', '/api/v1/briefing'], async (req, res) => {
  try {
    const personality = req.query.personality || 'professional';
    const result = await secretaryBrain.getMorningBriefing2(personality);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/brain/habits', async (req, res) => {
  try {
    const habits = await habitLearningEngine.getHabits();
    const suggestions = await habitLearningEngine.getProactiveHabitSuggestions();
    res.json({ success: true, habits, suggestions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/brain/prep', async (req, res) => {
  try {
    const title = req.query.title || 'Acme Corp Strategy Sync';
    const prepPack = await predictivePrepEngine.generatePrepPack(title);
    res.json({ success: true, prepPack });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/audit', async (req, res) => {
  try {
    const auditRes = await auditLogger.getDailyAuditSummary();
    res.json({ success: true, ...auditRes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/feedback', async (req, res) => {
  try {
    const { messageId, rating, comment } = req.body;
    const result = await feedbackEngine.submitFeedback(messageId, rating, comment);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Communication REST Endpoints
app.get(['/api/comm/inbox', '/api/v1/communications/inbox'], async (req, res) => {
  try {
    const filter = req.query.platform || 'all';
    const summary = await communicationEngine.getUnifiedInboxSummary(filter);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post(['/api/comm/send', '/api/v1/communications/send'], async (req, res) => {
  try {
    const { platform, recipient, body } = req.body;
    let result;
    if (platform === 'viber') {
      result = await viberService.sendViberMessage(recipient, body);
    } else if (platform === 'messenger') {
      result = await messengerService.sendMessengerMessage(recipient, body);
    } else {
      result = await telephonyService.sendSMS(recipient, body);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/comm/call', async (req, res) => {
  try {
    const { contactName, phoneNumber } = req.body;
    const result = await telephonyService.initiateCall(contactName, phoneNumber);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/comm/dnd', async (req, res) => {
  try {
    const { enabled, mode } = req.body;
    const result = enabled ? await dndAutoResponder.enableDND(mode) : await dndAutoResponder.disableDND();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Meeting REST Endpoints
app.post(['/api/meetings/start', '/api/v1/meetings'], async (req, res) => {
  try {
    const { title, provider } = req.body;
    const result = await meetingEngine.startMeeting(title, provider);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/meetings/stop', async (req, res) => {
  try {
    const result = await meetingEngine.stopMeeting();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/meetings/flag', async (req, res) => {
  try {
    const { note } = req.body;
    const result = await meetingEngine.flagBookmark(note);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get(['/api/meetings', '/api/v1/meetings'], async (req, res) => {
  try {
    const meetings = await getRecentMeetings(20);
    res.json({ success: true, count: meetings.length, meetings, activeMeeting: meetingEngine.activeMeeting });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/meetings/:id/export', async (req, res) => {
  try {
    const meeting = meetingEngine.activeMeeting || { id: req.params.id, title: 'Executive Sync', provider: 'google_meet', start_time: new Date().toISOString() };
    const summaryData = {
      executive_summary: ["Reviewed Q3 financial audit", "Confirmed FRIDAY voice latency under 200ms", "Allocated hardware budget"],
      decisions: ["Move production rollout to Q2 end", "Approve hardware budget sign-off"],
      action_items: [
        { action: "Finalize hardware specs", owner: "Pepper Potts", deadline: "Friday" },
        { action: "Submit budget forecast models", owner: "Sarah Jenkins", deadline: "Tomorrow" }
      ]
    };

    const exportRes = await PDFExporter.exportToFile(meeting, summaryData, [], summaryData.action_items);
    res.json(exportRes);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Google OAuth Endpoints
app.get('/api/auth/google', (req, res) => {
  const url = googleAuthManager.getAuthUrl();
  res.json({ success: true, authUrl: url });
});

app.get('/api/auth/status', async (req, res) => {
  try {
    const status = await googleAuthManager.getAuthStatus();
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/revoke', async (req, res) => {
  try {
    const result = await googleAuthManager.revokePermissions();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Google Workspace REST Endpoints
app.get('/api/workspace/briefing', async (req, res) => {
  try {
    const personality = req.query.personality || 'professional';
    const briefingText = await googleCalendarService.getDailyBriefing(personality);
    res.json({ success: true, briefing: briefingText });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/workspace/summary', async (req, res) => {
  try {
    const events = await googleCalendarService.getTodaySchedule();
    const unread = await googleGmailService.getUnreadSummaries();
    const tasksRes = await googleTasksService.getDueTasks();
    const alerts = await workspaceEngine.getProactiveAlerts();
    const pendingDrafts = await getPendingDrafts();
    const commSummary = await communicationEngine.getUnifiedInboxSummary();
    const briefing2 = await secretaryBrain.getMorningBriefing2();

    res.json({
      success: true,
      data: {
        events,
        unreadEmailsCount: unread.count,
        urgentEmailsCount: unread.urgentCount,
        tasksCount: tasksRes.count,
        tasks: tasksRes.tasks || [],
        alerts,
        pendingDrafts,
        activeMeeting: meetingEngine.activeMeeting,
        commSummary,
        briefing2Text: briefing2.text
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/workspace/drafts/send', async (req, res) => {
  try {
    const { draftId } = req.body;
    const result = await googleGmailService.sendDraft(draftId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/conversations', async (req, res) => {
  try {
    const history = await getRecentConversations(50);
    res.json({ success: true, count: history.length, data: history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/timers', async (req, res) => {
  try {
    const timers = await getActiveTimers();
    const reminders = await getPendingReminders();
    res.json({ success: true, timers, reminders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/privacy/stats', async (req, res) => {
  try {
    const stats = await getDatabaseStats();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/privacy/purge', async (req, res) => {
  try {
    const result = await purgeAllData();
    res.json({ success: true, message: 'All user data, workspace tokens, messages, and logs purged.', result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('[WS] Client connected to F.R.I.D.A.Y. Production Sync & Brain Core');

  let userPersonality = 'professional';
  let voiceSpeed = 1.0;
  let voicePitch = 1.0;

  ws.send(JSON.stringify({
    type: 'SYSTEM_STATUS',
    status: 'CONNECTED',
    message: 'F.R.I.D.A.Y. Unified Secretary Brain & Sync Core Nominal',
    timestamp: Date.now()
  }));

  ws.on('message', async (data) => {
    try {
      const payload = JSON.parse(data.toString());
      const startTime = Date.now();

      switch (payload.type) {
        case 'PING':
          ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
          break;

        case 'SET_PREFERENCES':
          if (payload.personality) userPersonality = payload.personality;
          if (payload.speed) voiceSpeed = payload.speed;
          if (payload.pitch) voicePitch = payload.pitch;
          ws.send(JSON.stringify({
            type: 'PREFERENCES_UPDATED',
            preferences: { userPersonality, voiceSpeed, voicePitch }
          }));
          break;

        case 'BARGE_IN':
          console.log('[WS] Barge-in signal received.');
          ws.send(JSON.stringify({
            type: 'TTS_ABORTED',
            reason: payload.reason || 'User interrupted speech',
            timestamp: Date.now()
          }));
          break;

        case 'COMMAND': {
          const userQuery = payload.text || '';
          if (!userQuery.trim()) return;

          const isStopKeyword = checkInterruptionKeyword(userQuery);
          if (isStopKeyword) {
            ws.send(JSON.stringify({ type: 'TTS_ABORTED', reason: 'Stop keyword detected' }));
          }

          await saveMessage('user', userQuery, payload.intent || 'INPUT');

          const result = await processIntent(userQuery, userPersonality);
          const latencyMs = Date.now() - startTime;

          const activeVoice = await enhancedTTSService.getActiveVoice();
          const audioStreamUrl = `/api/v1/tts/stream?text=${encodeURIComponent(result.response)}&voiceId=${activeVoice.id}`;

          const ttsPayload = buildTTSPayload(result.response, {
            personality: userPersonality,
            speed: voiceSpeed,
            pitch: voicePitch
          });

          const alerts = await workspaceEngine.getProactiveAlerts();

          ws.send(JSON.stringify({
            type: 'RESPONSE',
            intent: result.intent,
            text: result.response,
            actionPayload: result.actionPayload,
            alerts: alerts,
            activeMeeting: meetingEngine.activeMeeting,
            audioStreamUrl: audioStreamUrl,
            activeVoice: activeVoice,
            tts: ttsPayload,
            latency_ms: latencyMs,
            timestamp: Date.now()
          }));

          ws.send(JSON.stringify({
            type: 'PLAY_AUDIO',
            audioStreamUrl: audioStreamUrl,
            text: result.response,
            voiceId: activeVoice.id,
            timestamp: Date.now()
          }));
          break;
        }

        default:
          console.warn('[WS] Unknown message type:', payload.type);
      }
    } catch (err) {
      console.error('[WS] Error processing message:', err);
      ws.send(JSON.stringify({
        type: 'ERROR',
        error: 'Failed to process request',
        details: err.message
      }));
    }
  });

  ws.on('close', () => {
    console.log('[WS] Client disconnected');
  });
});

server.listen(PORT, () => {
  const hasElevenLabs = Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY !== 'mock_elevenlabs_api_key');
  const maskedKey = hasElevenLabs 
    ? `${process.env.ELEVENLABS_API_KEY.substring(0, 4)}...${process.env.ELEVENLABS_API_KEY.slice(-4)}`
    : 'NOT SET (Mock Mode)';

  console.log(`=======================================================`);
  console.log(`[FRIDAY] Backend Core & Unified Secretary Brain Online`);
  console.log(`[FRIDAY] HTTP Server: http://localhost:${PORT}`);
  console.log(`[FRIDAY] WebSocket:   ws://localhost:${PORT}`);
  console.log(`[FRIDAY] ElevenLabs API Key: ${hasElevenLabs ? 'LOADED (' + maskedKey + ')' : 'MISSING / MOCK'}`);
  console.log(`=======================================================`);
});
