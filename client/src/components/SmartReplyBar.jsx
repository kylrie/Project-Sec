import React from 'react';
import { Sparkles, MessageCircle } from 'lucide-react';

export default function SmartReplyBar({ suggestions = [], onSelectReply }) {
  const defaultReplies = [
    "Yes, see you then!",
    "Can we push by 15 mins?",
    "I am running slightly late."
  ];

  const pills = suggestions.length > 0 ? suggestions : defaultReplies.map(r => ({ label: r, text: r }));

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 16px',
      background: 'rgba(0, 243, 255, 0.04)',
      borderTop: '1px solid var(--border-glass)'
    }}>
      <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-hud)', color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', gap: 4 }}>
        <Sparkles size={12} /> Smart Reply:
      </span>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {pills.map((pill, i) => (
          <button
            key={i}
            onClick={() => onSelectReply(pill.text || pill.label)}
            style={{
              background: 'rgba(0, 243, 255, 0.1)',
              border: '1px solid rgba(0, 243, 255, 0.25)',
              color: '#e2e8f0',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-sans)',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {pill.label || pill.text}
          </button>
        ))}
      </div>
    </div>
  );
}
