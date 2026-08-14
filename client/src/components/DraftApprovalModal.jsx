import React, { useState } from 'react';
import { Mail, Send, X, AlertCircle } from 'lucide-react';

export default function DraftApprovalModal({ draft, onClose, onConfirmSend }) {
  const [sending, setSending] = useState(false);

  if (!draft) return null;

  const handleSend = async () => {
    setSending(true);
    try {
      await onConfirmSend(draft.id);
      onClose();
    } catch (err) {
      console.error('Send draft error:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h2><Mail size={20} /> Voice Email Draft Approval Gate</h2>
          <button className="hud-btn" onClick={onClose} style={{ padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: 16 }}>
          <div style={{
            background: 'rgba(255, 183, 0, 0.1)',
            border: '1px solid var(--color-amber)',
            color: 'var(--color-amber)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertCircle size={16} />
            <span>CONFIRMATION REQUIRED: Say "Send it" or click below to dispatch.</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>To:</span>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)' }}>
                {draft.recipient}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Subject:</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>
                {draft.subject}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Body Preview:</span>
              <div style={{
                background: 'rgba(5, 8, 17, 0.9)',
                border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px',
                fontSize: '0.85rem',
                color: '#e2e8f0',
                lineHeight: '1.4',
                fontFamily: 'var(--font-sans)',
                marginTop: 4
              }}>
                {draft.body}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button className="hud-btn" onClick={onClose} style={{ background: 'transparent' }}>
              Cancel
            </button>
            <button className="hud-btn active" onClick={handleSend} disabled={sending}>
              <Send size={16} /> {sending ? 'Sending...' : 'Send Email (Gmail API)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
