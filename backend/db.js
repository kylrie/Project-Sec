import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.join(__dirname, 'friday.db');
const db = new sqlite3.Database(dbPath);

// Initialize Database Tables
export function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 1. Conversations table
      db.run(`
        CREATE TABLE IF NOT EXISTS conversations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          role TEXT CHECK(role IN ('user', 'assistant', 'system')),
          content TEXT NOT NULL,
          intent TEXT,
          latency_ms INTEGER
        )
      `);

      // 2. Timers table
      db.run(`
        CREATE TABLE IF NOT EXISTS timers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          label TEXT NOT NULL,
          duration_sec INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME NOT NULL,
          status TEXT DEFAULT 'active'
        )
      `);

      // 3. Reminders table
      db.run(`
        CREATE TABLE IF NOT EXISTS reminders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          task TEXT NOT NULL,
          remind_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          status TEXT DEFAULT 'pending'
        )
      `);

      // 4. User Preferences
      db.run(`
        CREATE TABLE IF NOT EXISTS user_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `);

      // 5. Google Workspace Tokens
      db.run(`
        CREATE TABLE IF NOT EXISTS google_tokens (
          service TEXT PRIMARY KEY,
          access_token TEXT,
          refresh_token TEXT,
          scopes TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 6. Cached Calendar Events
      db.run(`
        CREATE TABLE IF NOT EXISTS cached_events (
          id TEXT PRIMARY KEY,
          summary TEXT NOT NULL,
          start_time DATETIME NOT NULL,
          end_time DATETIME NOT NULL,
          location TEXT,
          attendees TEXT,
          meet_link TEXT,
          synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 7. Cached Google Tasks
      db.run(`
        CREATE TABLE IF NOT EXISTS cached_tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          due_date DATETIME,
          status TEXT DEFAULT 'needsAction',
          synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 8. Pending Email Drafts
      db.run(`
        CREATE TABLE IF NOT EXISTS pending_email_drafts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          recipient TEXT NOT NULL,
          subject TEXT NOT NULL,
          body TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          status TEXT DEFAULT 'pending_approval'
        )
      `);

      // 9. Meetings Table
      db.run(`
        CREATE TABLE IF NOT EXISTS meetings (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          provider TEXT DEFAULT 'google_meet',
          start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
          end_time DATETIME,
          status TEXT DEFAULT 'recording',
          summary_json TEXT
        )
      `);

      // 10. Meeting Transcripts Table
      db.run(`
        CREATE TABLE IF NOT EXISTS meeting_transcripts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          meeting_id TEXT NOT NULL,
          timestamp_ms INTEGER NOT NULL,
          speaker TEXT NOT NULL,
          text TEXT NOT NULL
        )
      `);

      // 11. Meeting Bookmarks Table
      db.run(`
        CREATE TABLE IF NOT EXISTS meeting_bookmarks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          meeting_id TEXT NOT NULL,
          timestamp_ms INTEGER NOT NULL,
          note TEXT NOT NULL
        )
      `);

      // 12. Meeting Action Items Table
      db.run(`
        CREATE TABLE IF NOT EXISTS meeting_action_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          meeting_id TEXT NOT NULL,
          action TEXT NOT NULL,
          owner TEXT NOT NULL,
          deadline TEXT,
          status TEXT DEFAULT 'pending'
        )
      `);

      // 13. Unified Messages Table (SMS, Viber, Messenger, Gmail)
      db.run(`
        CREATE TABLE IF NOT EXISTS unified_messages (
          id TEXT PRIMARY KEY,
          platform TEXT NOT NULL CHECK(platform IN ('sms', 'viber', 'messenger', 'gmail')),
          sender TEXT NOT NULL,
          recipient TEXT NOT NULL,
          subject TEXT,
          body TEXT NOT NULL,
          is_unread INTEGER DEFAULT 1,
          is_urgent INTEGER DEFAULT 0,
          is_otp INTEGER DEFAULT 0,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 14. Phone Call Logs Table
      db.run(`
        CREATE TABLE IF NOT EXISTS call_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          contact_name TEXT NOT NULL,
          phone_number TEXT NOT NULL,
          duration_sec INTEGER DEFAULT 0,
          summary TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 15. DND Settings Table
      db.run(`
        CREATE TABLE IF NOT EXISTS dnd_settings (
          id INTEGER PRIMARY KEY DEFAULT 1,
          enabled INTEGER DEFAULT 0,
          mode TEXT DEFAULT 'meeting',
          auto_response_text TEXT DEFAULT "F.R.I.D.A.Y. is managing Tony's messages. They will reply shortly."
        )
      `);

      // 16. Cross-Device Sync State Table
      db.run(`
        CREATE TABLE IF NOT EXISTS sync_state (
          device_id TEXT PRIMARY KEY,
          last_synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          status TEXT DEFAULT 'synced',
          pending_changes_count INTEGER DEFAULT 0
        )
      `);

      // 17. Learned Habits Table
      db.run(`
        CREATE TABLE IF NOT EXISTS learned_habits (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category TEXT NOT NULL,
          pattern TEXT NOT NULL,
          confidence REAL DEFAULT 0.85,
          suggested_action TEXT NOT NULL
        )
      `);

      // 18. Contact Relationship Tracking Table
      db.run(`
        CREATE TABLE IF NOT EXISTS contact_relationships (
          contact_name TEXT PRIMARY KEY,
          last_contacted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          interaction_count INTEGER DEFAULT 1,
          importance_score REAL DEFAULT 0.8
        )
      `);

      // 19. Security Audit Logs Table
      db.run(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          action_type TEXT NOT NULL,
          description TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 20. User Feedback Logs Table
      db.run(`
        CREATE TABLE IF NOT EXISTS user_feedback (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          message_id INTEGER,
          rating TEXT CHECK(rating IN ('thumbs_up', 'thumbs_down')),
          comment TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 21. Voices Library Table
      db.run(`
        CREATE TABLE IF NOT EXISTS voices (
          id TEXT PRIMARY KEY,
          provider TEXT NOT NULL CHECK(provider IN ('elevenlabs', 'azure', 'google', 'device')),
          provider_voice_id TEXT NOT NULL,
          name TEXT NOT NULL,
          gender TEXT,
          language TEXT DEFAULT 'en-US',
          accent TEXT DEFAULT 'American',
          category TEXT DEFAULT 'professional',
          is_cloned INTEGER DEFAULT 0,
          is_hd INTEGER DEFAULT 1,
          emotions TEXT DEFAULT '[]',
          settings TEXT DEFAULT '{}',
          is_default INTEGER DEFAULT 0,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 22. Voice Presets Table
      db.run(`
        CREATE TABLE IF NOT EXISTS voice_presets (
          id TEXT PRIMARY KEY,
          user_id TEXT DEFAULT 'user_primary',
          name TEXT NOT NULL,
          voice_id TEXT NOT NULL,
          provider TEXT NOT NULL,
          speed REAL DEFAULT 1.0,
          pitch REAL DEFAULT 0.0,
          stability REAL DEFAULT 0.5,
          style REAL DEFAULT 0.0,
          use_speaker_boost INTEGER DEFAULT 1,
          emotion TEXT,
          auto_activate_on TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 23. Voice Cloning Jobs Table
      db.run(`
        CREATE TABLE IF NOT EXISTS voice_clones (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          status TEXT DEFAULT 'processing',
          provider_voice_id TEXT,
          sample_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) return reject(err);
        cleanupOldContext()
          .then(() => resolve(db))
          .catch(reject);
      });
    });
  });
}

// 7-Day Rolling Context Cleanup
export function cleanupOldContext() {
  return new Promise((resolve, reject) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    db.run(
      `DELETE FROM conversations WHERE timestamp < ?`,
      [sevenDaysAgo],
      function (err) {
        if (err) return reject(err);
        resolve(this.changes);
      }
    );
  });
}

// Privacy Dashboard - Instant Data Purge
export function purgeAllData() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`DELETE FROM conversations`);
      db.run(`DELETE FROM timers`);
      db.run(`DELETE FROM reminders`);
      db.run(`DELETE FROM user_settings`);
      db.run(`DELETE FROM google_tokens`);
      db.run(`DELETE FROM cached_events`);
      db.run(`DELETE FROM cached_tasks`);
      db.run(`DELETE FROM pending_email_drafts`);
      db.run(`DELETE FROM meetings`);
      db.run(`DELETE FROM meeting_transcripts`);
      db.run(`DELETE FROM meeting_bookmarks`);
      db.run(`DELETE FROM meeting_action_items`);
      db.run(`DELETE FROM unified_messages`);
      db.run(`DELETE FROM call_logs`);
      db.run(`DELETE FROM dnd_settings`);
      db.run(`DELETE FROM sync_state`);
      db.run(`DELETE FROM learned_habits`);
      db.run(`DELETE FROM contact_relationships`);
      db.run(`DELETE FROM audit_logs`);
      db.run(`DELETE FROM user_feedback`);
      db.run(`DELETE FROM voices`);
      db.run(`DELETE FROM voice_presets`);
      db.run(`DELETE FROM voice_clones`, (err) => {
        if (err) return reject(err);
        resolve({ success: true, timestamp: new Date().toISOString() });
      });
    });
  });
}

// Conversations CRUD
export function saveMessage(role, content, intent = null, latency_ms = null) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(
      `INSERT INTO conversations (role, content, intent, latency_ms) VALUES (?, ?, ?, ?)`
    );
    stmt.run([role, content, intent, latency_ms], function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, role, content, intent, latency_ms, timestamp: new Date().toISOString() });
    });
  });
}

export function getRecentConversations(limit = 50) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM conversations ORDER BY timestamp DESC LIMIT ?`,
      [limit],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows ? rows.reverse() : []);
      }
    );
  });
}

// Timers & Reminders CRUD
export function addTimer(label, duration_sec) {
  return new Promise((resolve, reject) => {
    const expires_at = new Date(Date.now() + duration_sec * 1000).toISOString();
    const stmt = db.prepare(
      `INSERT INTO timers (label, duration_sec, expires_at) VALUES (?, ?, ?)`
    );
    stmt.run([label, duration_sec, expires_at], function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, label, duration_sec, expires_at, status: 'active' });
    });
  });
}

export function addReminder(task, remind_at) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(
      `INSERT INTO reminders (task, remind_at) VALUES (?, ?)`
    );
    stmt.run([task, remind_at], function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, task, remind_at, status: 'pending' });
    });
  });
}

export function getActiveTimers() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM timers WHERE status = 'active' ORDER BY expires_at ASC`, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

export function getPendingReminders() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM reminders WHERE status = 'pending' ORDER BY remind_at ASC`, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

// Google OAuth Tokens Helper
export function saveGoogleTokens(service, accessToken, refreshToken, scopes) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO google_tokens (service, access_token, refresh_token, scopes, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(service) DO UPDATE SET
        access_token = excluded.access_token,
        refresh_token = excluded.refresh_token,
        scopes = excluded.scopes,
        updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run([service, accessToken, refreshToken, JSON.stringify(scopes)], (err) => {
      if (err) return reject(err);
      resolve({ success: true, service });
    });
  });
}

export function getGoogleTokens(service = 'google_workspace') {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM google_tokens WHERE service = ?`, [service], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

export function deleteGoogleTokens(service = 'google_workspace') {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM google_tokens WHERE service = ?`, [service], (err) => {
      if (err) return reject(err);
      resolve({ success: true });
    });
  });
}

// Cached Events & Tasks Helpers
export function cacheCalendarEvents(events) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`DELETE FROM cached_events`);
      const stmt = db.prepare(`
        INSERT INTO cached_events (id, summary, start_time, end_time, location, attendees, meet_link)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      events.forEach(e => {
        stmt.run([
          e.id,
          e.summary,
          e.start_time,
          e.end_time,
          e.location || '',
          JSON.stringify(e.attendees || []),
          e.meet_link || ''
        ]);
      });
      stmt.finalize((err) => {
        if (err) return reject(err);
        resolve(events);
      });
    });
  });
}

export function getCachedEvents() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM cached_events ORDER BY start_time ASC`, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

export function cacheTasks(tasks) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`DELETE FROM cached_tasks`);
      const stmt = db.prepare(`
        INSERT INTO cached_tasks (id, title, due_date, status)
        VALUES (?, ?, ?, ?)
      `);
      tasks.forEach(t => {
        stmt.run([t.id, t.title, t.due_date || null, t.status || 'needsAction']);
      });
      stmt.finalize((err) => {
        if (err) return reject(err);
        resolve(tasks);
      });
    });
  });
}

export function getCachedTasks() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM cached_tasks ORDER BY due_date ASC`, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

// Email Drafts CRUD
export function createEmailDraft(recipient, subject, body) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO pending_email_drafts (recipient, subject, body)
      VALUES (?, ?, ?)
    `);
    stmt.run([recipient, subject, body], function (err) {
      if (err) return reject(err);
      resolve({
        id: this.lastID,
        recipient,
        subject,
        body,
        created_at: new Date().toISOString(),
        status: 'pending_approval'
      });
    });
  });
}

export function getPendingDrafts() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM pending_email_drafts WHERE status = 'pending_approval' ORDER BY created_at DESC`, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

export function updateDraftStatus(id, status) {
  return new Promise((resolve, reject) => {
    db.run(`UPDATE pending_email_drafts SET status = ? WHERE id = ?`, [status, id], function (err) {
      if (err) return reject(err);
      resolve({ id, status, success: true });
    });
  });
}

// Meetings Intelligence CRUD
export function createMeeting(id, title, provider = 'google_meet') {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO meetings (id, title, provider, start_time, status)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, 'recording')
    `);
    stmt.run([id, title, provider], function (err) {
      if (err) return reject(err);
      resolve({ id, title, provider, status: 'recording', start_time: new Date().toISOString() });
    });
  });
}

export function finishMeeting(id, summaryJson) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      UPDATE meetings SET end_time = CURRENT_TIMESTAMP, status = 'completed', summary_json = ?
      WHERE id = ?
    `);
    stmt.run([JSON.stringify(summaryJson), id], function (err) {
      if (err) return reject(err);
      resolve({ id, status: 'completed', summary: summaryJson });
    });
  });
}

export function addTranscriptLine(meetingId, timestampMs, speaker, text) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO meeting_transcripts (meeting_id, timestamp_ms, speaker, text)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run([meetingId, timestampMs, speaker, text], function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, meetingId, timestampMs, speaker, text });
    });
  });
}

export function getMeetingTranscripts(meetingId) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM meeting_transcripts WHERE meeting_id = ? ORDER BY timestamp_ms ASC`, [meetingId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

export function addMeetingBookmark(meetingId, timestampMs, note = 'Voice Flagged Bookmark') {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO meeting_bookmarks (meeting_id, timestamp_ms, note)
      VALUES (?, ?, ?)
    `);
    stmt.run([meetingId, timestampMs, note], function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, meetingId, timestampMs, note });
    });
  });
}

export function addMeetingActionItem(meetingId, action, owner, deadline) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO meeting_action_items (meeting_id, action, owner, deadline)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run([meetingId, action, owner, deadline], function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, meetingId, action, owner, deadline, status: 'pending' });
    });
  });
}

export function getMeetingActionItems(meetingId) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM meeting_action_items WHERE meeting_id = ?`, [meetingId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

export function getRecentMeetings(limit = 10) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM meetings ORDER BY start_time DESC LIMIT ?`, [limit], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

// Unified Messages CRUD (SMS, Viber, Messenger, Gmail)
export function saveUnifiedMessage({ id, platform, sender, recipient, subject, body, is_unread = 1, is_urgent = 0, is_otp = 0 }) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO unified_messages (id, platform, sender, recipient, subject, body, is_unread, is_urgent, is_otp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        is_unread = excluded.is_unread,
        is_urgent = excluded.is_urgent
    `);
    stmt.run([id, platform, sender, recipient, subject || '', body, is_unread ? 1 : 0, is_urgent ? 1 : 0, is_otp ? 1 : 0], (err) => {
      if (err) return reject(err);
      resolve({ id, platform, sender, body, is_unread, is_urgent, is_otp });
    });
  });
}

export function getUnifiedInbox(platformFilter = 'all', limit = 50) {
  return new Promise((resolve, reject) => {
    let sql = `SELECT * FROM unified_messages `;
    const params = [];
    if (platformFilter !== 'all') {
      sql += `WHERE platform = ? `;
      params.push(platformFilter);
    }
    sql += `ORDER BY timestamp DESC LIMIT ?`;
    params.push(limit);

    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

export function logCall(contactName, phoneNumber, durationSec, summary) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO call_logs (contact_name, phone_number, duration_sec, summary)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run([contactName, phoneNumber, durationSec, summary], function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, contactName, phoneNumber, durationSec, summary, timestamp: new Date().toISOString() });
    });
  });
}

export function getCallLogs(limit = 10) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM call_logs ORDER BY timestamp DESC LIMIT ?`, [limit], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

export function setDndSettings(enabled, mode = 'meeting', autoResponseText = null) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO dnd_settings (id, enabled, mode, auto_response_text)
      VALUES (1, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        enabled = excluded.enabled,
        mode = excluded.mode,
        auto_response_text = COALESCE(excluded.auto_response_text, dnd_settings.auto_response_text)
    `);
    stmt.run([enabled ? 1 : 0, mode, autoResponseText], (err) => {
      if (err) return reject(err);
      resolve({ enabled: Boolean(enabled), mode, autoResponseText });
    });
  });
}

export function getDndSettings() {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM dnd_settings WHERE id = 1`, [], (err, row) => {
      if (err) return reject(err);
      resolve(row ? { enabled: Boolean(row.enabled), mode: row.mode, auto_response_text: row.auto_response_text } : { enabled: false, mode: 'meeting', auto_response_text: "F.R.I.D.A.Y. is managing messages." });
    });
  });
}

// Phase 5 Sync & Brain CRUD
export function updateSyncState(deviceId, pendingCount = 0) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO sync_state (device_id, last_synced_at, status, pending_changes_count)
      VALUES (?, CURRENT_TIMESTAMP, 'synced', ?)
      ON CONFLICT(device_id) DO UPDATE SET
        last_synced_at = CURRENT_TIMESTAMP,
        status = 'synced',
        pending_changes_count = excluded.pending_changes_count
    `);
    stmt.run([deviceId, pendingCount], (err) => {
      if (err) return reject(err);
      resolve({ deviceId, status: 'synced', pendingCount });
    });
  });
}

export function getSyncState() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM sync_state ORDER BY last_synced_at DESC`, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

export function saveLearnedHabit(category, pattern, suggestedAction, confidence = 0.88) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO learned_habits (category, pattern, confidence, suggested_action)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run([category, pattern, confidence, suggestedAction], function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, category, pattern, confidence, suggestedAction });
    });
  });
}

export function getLearnedHabits() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM learned_habits ORDER BY confidence DESC`, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

export function logAuditEvent(actionType, description) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (action_type, description)
      VALUES (?, ?)
    `);
    stmt.run([actionType, description], function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, actionType, description, timestamp: new Date().toISOString() });
    });
  });
}

export function getAuditLogs(limit = 20) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?`, [limit], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

export function saveUserFeedback(messageId, rating, comment = null) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO user_feedback (message_id, rating, comment)
      VALUES (?, ?, ?)
    `);
    stmt.run([messageId, rating, comment], function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, messageId, rating, comment });
    });
  });
}

// Voices Studio CRUD
export function saveVoice(voice) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO voices (id, provider, provider_voice_id, name, gender, language, accent, category, is_cloned, is_hd, emotions, settings, is_default, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        category = excluded.category,
        settings = excluded.settings,
        is_default = excluded.is_default
    `);
    stmt.run([
      voice.id,
      voice.provider,
      voice.provider_voice_id || voice.id,
      voice.name,
      voice.gender || 'female',
      voice.language || 'en-US',
      voice.accent || 'American',
      voice.category || 'professional',
      voice.isCloned ? 1 : 0,
      voice.isHD ? 1 : 0,
      JSON.stringify(voice.emotions || []),
      JSON.stringify(voice.settings || {}),
      voice.isDefault ? 1 : 0,
      1
    ], (err) => {
      if (err) return reject(err);
      resolve(voice);
    });
  });
}

export function getVoicesFromDB() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM voices WHERE is_active = 1 ORDER BY is_default DESC, name ASC`, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

export function setActiveVoiceInDB(voiceId) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`UPDATE voices SET is_default = 0`);
      db.run(`UPDATE voices SET is_default = 1 WHERE id = ?`, [voiceId], (err) => {
        if (err) return reject(err);
        resolve({ voiceId, success: true });
      });
    });
  });
}

export function saveVoicePresetInDB(preset) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO voice_presets (id, name, voice_id, provider, speed, pitch, stability, style, use_speaker_boost, emotion, auto_activate_on)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        speed = excluded.speed,
        pitch = excluded.pitch,
        stability = excluded.stability,
        style = excluded.style,
        emotion = excluded.emotion,
        auto_activate_on = excluded.auto_activate_on
    `);
    stmt.run([
      preset.id,
      preset.name,
      preset.voiceId,
      preset.provider,
      preset.speed || 1.0,
      preset.pitch || 0.0,
      preset.stability || 0.5,
      preset.style || 0.0,
      preset.useSpeakerBoost ? 1 : 0,
      preset.emotion || null,
      preset.autoActivateOn || null
    ], (err) => {
      if (err) return reject(err);
      resolve(preset);
    });
  });
}

export function getVoicePresetsFromDB() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM voice_presets ORDER BY created_at DESC`, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

export function deleteVoicePresetFromDB(id) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM voice_presets WHERE id = ?`, [id], (err) => {
      if (err) return reject(err);
      resolve({ success: true, id });
    });
  });
}

export function getDatabaseStats() {
  return new Promise((resolve, reject) => {
    db.get(`SELECT COUNT(*) as count, MIN(timestamp) as oldest FROM conversations`, [], (err, row) => {
      if (err) return reject(err);
      resolve({
        total_messages: row ? row.count : 0,
        oldest_record: row ? row.oldest : null,
        retention_policy: '7-Day Rolling Context',
        database_path: dbPath
      });
    });
  });
}

export default db;
