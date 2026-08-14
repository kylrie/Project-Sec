import React, { useState, useEffect } from 'react';
import { MessageSquare, Phone, Mail, Send, ShieldAlert, Key, X, RefreshCw, CheckCheck } from 'lucide-react';

export default function UnifiedInbox({ isOpen, onClose, onSendCommand }) {
  const [filter, setFilter] = useState('all');
  const [inboxData, setInboxData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchInbox = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comm/inbox?platform=${filter}`);
      const json = await res.json();
      if (json.success) setInboxData(json);
    } catch (err) {
      console.warn('Inbox fetch err:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchInbox();
    }
  }, [isOpen, filter]);

  if (!isOpen) return null;

  const platformBadge = (platform) => {
    switch (platform) {
      case 'viber': return <span className="intent-pill" style={{ background: 'rgba(115, 96, 242, 0.2)', color: '#a78bfa', borderColor: '#7360f2' }}>Viber</span>;
      case 'messenger': return <span className="intent-pill" style={{ background: 'rgba(0, 132, 255, 0.2)', color: '#60a5fa', borderColor: '#0084ff' }}>Messenger</span>;
      case 'sms': return <span className="intent-pill" style={{ background: 'rgba(0, 255, 170, 0.15)', color: 'var(--color-green)', borderColor: 'var(--color-green)' }}>SMS</span>;
      case 'gmail': return <span className="intent-pill time">Gmail</span>;
      default: return <span className="intent-pill">Msg</span>;
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: 820 }}>
        <div className="modal-header">
          <h2><MessageSquare size={20} /> Multi-Channel Unified Inbox HUD</h2>
          <button className="hud-btn" onClick={onClose} style={{ padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: 16 }}>
          {/* Communication Digest Header */}
          <div style={{
            background: 'rgba(0, 243, 255, 0.08)',
            border: '1px solid var(--border-cyan)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: '#fff' }}>
              {inboxData?.digestText || 'Communication Digest: Loading multi-channel messages...'}
            </span>
            <button className="hud-btn" onClick={fetchInbox} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          {/* Platform Filter Tabs */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { id: 'all', label: 'All Channels' },
              { id: 'sms', label: 'SMS' },
              { id: 'viber', label: 'Viber' },
              { id: 'messenger', label: 'Messenger' },
              { id: 'gmail', label: 'Gmail' }
            ].map(tab => (
              <button
                key={tab.id}
                className={`hud-btn ${filter === tab.id ? 'active' : ''}`}
                onClick={() => setFilter(tab.id)}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Messages List */}
          <div style={{
            background: 'rgba(5, 8, 17, 0.9)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-sm)',
            maxHeight: '340px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {!inboxData?.messages || inboxData.messages.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No messages found for selected platform.
              </div>
            ) : (
              inboxData.messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {platformBadge(msg.platform)}
                      <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{msg.sender}</strong>
                      {msg.is_urgent === 1 && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-amber)', display: 'flex', alignItems: 'center', gap: 2 }}>
                          <ShieldAlert size={12} /> URGENT
                        </span>
                      )}
                      {msg.is_otp === 1 && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-green)', display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Key size={12} /> OTP CODE
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                    {msg.body}
                  </p>

                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button
                      onClick={() => {
                        onSendCommand(`Reply to ${msg.sender} on ${msg.platform}: I got your message.`);
                        onClose();
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-cyan)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      ➔ Voice Reply to {msg.sender}
                    </button>

                    {msg.platform === 'sms' && (
                      <button
                        onClick={() => {
                          onSendCommand(`Call ${msg.sender}`);
                          onClose();
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--color-green)',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        ➔ Call {msg.sender}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
