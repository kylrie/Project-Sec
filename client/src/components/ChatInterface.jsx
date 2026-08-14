import React, { useEffect, useRef } from 'react';
import { Bot, User, Clock, CheckCircle } from 'lucide-react';

export default function ChatInterface({ messages = [] }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}
    >
      {messages.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: 'var(--text-muted)',
          margin: 'auto 0',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.85rem'
        }}>
          <Bot size={36} style={{ color: 'var(--color-cyan)', marginBottom: 8 }} />
          <p>F.R.I.D.A.Y. Tactical Systems Online.</p>
          <p style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: 4 }}>
            Say "Hey FRIDAY", press Ctrl+Shift+Space, or type a command.
          </p>
        </div>
      ) : (
        messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              background: msg.role === 'user'
                ? 'rgba(0, 119, 255, 0.2)'
                : 'rgba(0, 243, 255, 0.1)',
              border: msg.role === 'user'
                ? '1px solid rgba(0, 119, 255, 0.4)'
                : '1px solid rgba(0, 243, 255, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              position: 'relative'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyConstraint: 'space-between',
              gap: 8,
              marginBottom: 6,
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              color: msg.role === 'user' ? '#60a5fa' : 'var(--color-cyan)'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                {msg.role === 'user' ? 'OPERATOR' : 'F.R.I.D.A.Y.'}
              </span>

              {msg.intent && (
                <span className={`intent-pill ${msg.intent.toLowerCase().replace('get_', '').replace('set_', '')}`}>
                  {msg.intent}
                </span>
              )}

              {msg.latency_ms && (
                <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Clock size={10} /> {msg.latency_ms} ms
                </span>
              )}
            </div>

            <p style={{
              fontSize: '0.95rem',
              lineHeight: '1.4',
              color: msg.role === 'user' ? '#fff' : '#e2e8f0',
              fontFamily: msg.role === 'assistant' ? 'var(--font-mono)' : 'var(--font-sans)'
            }}>
              {msg.content}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
