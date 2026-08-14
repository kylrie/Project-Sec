import React, { useState } from 'react';
import { Send, Mic, Square } from 'lucide-react';

export default function CommandBar({ onSendCommand, onStop, isListening, isSpeaking }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSendCommand(input.trim());
      setInput('');
    }
  };

  const quickPills = [
    { label: 'What time is it?', intent: 'time' },
    { label: 'Set a timer for 10 minutes', intent: 'timer' },
    { label: "What's the weather?", intent: 'weather' },
    { label: 'Remind me to call Mom at 5 PM', intent: 'reminder' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 16px' }}>
      {/* Quick Action Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {quickPills.map((pill, idx) => (
          <button
            key={idx}
            className={`intent-pill ${pill.intent}`}
            onClick={() => onSendCommand(pill.label)}
            style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
          >
            + {pill.label}
          </button>
        ))}
      </div>

      {/* Input Form & Action Bar */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Speak or type a command for F.R.I.D.A.Y..."
          style={{
            flex: 1,
            background: 'rgba(5, 8, 17, 0.7)',
            border: '1px solid var(--border-cyan)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            color: '#fff',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.9rem',
            outline: 'none'
          }}
        />

        {isSpeaking ? (
          <button
            type="button"
            className="hud-btn danger"
            onClick={onStop}
            title="Barge-in: Interrupt TTS"
          >
            <Square size={16} /> Stop
          </button>
        ) : (
          <button type="submit" className="hud-btn">
            <Send size={16} /> Send
          </button>
        )}
      </form>
    </div>
  );
}
