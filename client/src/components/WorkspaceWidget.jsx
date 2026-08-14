import React, { useState, useEffect } from 'react';
import { Calendar, Mail, CheckSquare, Sunrise, Video, AlertTriangle, Mic, MessageSquare } from 'lucide-react';

export default function WorkspaceWidget({ onRunBriefing, onSendCommand, onStartAmbientMeeting, onOpenUnifiedInbox }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchWorkspaceSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/workspace/summary');
      const json = await res.json();
      if (json.success) {
        setSummary(json.data);
      }
    } catch (err) {
      console.warn('Workspace summary fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceSummary();
    const interval = setInterval(fetchWorkspaceSummary, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!summary) return null;

  const commCount = summary.commSummary?.counts?.unreadTotal ? (summary.commSummary.counts.unreadTotal + summary.unreadEmailsCount) : (summary.unreadEmailsCount + 3);

  return (
    <div style={{
      background: 'rgba(5, 8, 17, 0.75)',
      border: '1px solid var(--border-cyan)',
      borderRadius: 'var(--radius-md)',
      padding: '14px 16px',
      margin: '0 16px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontFamily: 'var(--font-hud)',
          fontSize: '0.85rem',
          color: 'var(--color-cyan)',
          letterSpacing: '1px',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <Calendar size={15} /> GOOGLE WORKSPACE & COMM SECRETARY
        </span>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="hud-btn"
            onClick={onOpenUnifiedInbox}
            style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: 'var(--color-cyan)' }}
          >
            <MessageSquare size={13} /> Inbox ({commCount})
          </button>

          <button
            className="hud-btn"
            onClick={onStartAmbientMeeting}
            style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: 'var(--color-amber)', color: 'var(--color-amber)' }}
          >
            <Mic size={13} /> Ambient Meeting
          </button>

          <button
            className="hud-btn"
            onClick={onRunBriefing}
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
          >
            <Sunrise size={13} /> Run Briefing
          </button>
        </div>
      </div>

      {/* Quick Status Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {/* Today's Schedule */}
        <div style={{
          background: 'rgba(0, 243, 255, 0.05)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={12} style={{ color: 'var(--color-cyan)' }} /> Schedule
            </span>
            <span className="intent-pill time" style={{ fontSize: '0.7rem' }}>
              {summary.events.length} Events
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '90px', overflowY: 'auto' }}>
            {summary.events.length === 0 ? (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>No meetings today.</span>
            ) : (
              summary.events.map((evt) => (
                <div key={evt.id} style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                    {evt.summary}
                  </span>
                  {evt.meet_link ? (
                    <button
                      onClick={() => onSendCommand(`Join meeting ${evt.summary}`)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-green)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        padding: 0
                      }}
                    >
                      <Video size={10} /> Join
                    </button>
                  ) : (
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>
                      {new Date(evt.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Unified Communications */}
        <div style={{
          background: 'rgba(0, 119, 255, 0.05)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Mail size={12} style={{ color: '#60a5fa' }} /> Unified Inbox
            </span>
            <span className={`intent-pill ${summary.urgentEmailsCount > 0 ? 'timer' : 'weather'}`} style={{ fontSize: '0.7rem' }}>
              {commCount} Unread
            </span>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>
              SMS • Viber • Messenger • Gmail
            </span>
            <button
              onClick={onOpenUnifiedInbox}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-cyan)',
                fontSize: '0.75rem',
                textAlign: 'left',
                cursor: 'pointer',
                padding: 0,
                marginTop: 4
              }}
            >
              ➔ Open Communication Digest
            </button>
          </div>
        </div>

        {/* Google Tasks */}
        <div style={{
          background: 'rgba(0, 255, 170, 0.05)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckSquare size={12} style={{ color: 'var(--color-green)' }} /> Tasks
            </span>
            <span className="intent-pill reminder" style={{ fontSize: '0.7rem' }}>
              {summary.tasksCount} Open
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: '90px', overflowY: 'auto' }}>
            {summary.tasks.length === 0 ? (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>All tasks complete.</span>
            ) : (
              summary.tasks.slice(0, 2).map((t) => (
                <span key={t.id} style={{ fontSize: '0.75rem', color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  • {t.title}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
