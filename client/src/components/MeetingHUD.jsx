import React, { useState, useEffect } from 'react';
import { Mic, Square, Bookmark, ShieldAlert, Users, Radio } from 'lucide-react';

export default function MeetingHUD({ activeMeeting, onFlagBookmark, onStopMeeting }) {
  const [transcripts, setTranscripts] = useState([
    { id: 1, time: '00:05', speaker: 'Tony Stark', text: 'All right team, let us review the FRIDAY voice interface latency benchmarks.' },
    { id: 2, time: '00:15', speaker: 'Pepper Potts', text: 'The Q3 audit requires final sign-off by 5 PM. Hardware budget models are ready.' },
    { id: 3, time: '00:32', speaker: 'Rhodey', text: 'Defense systems integration tested clean. We are ready for Q2 rollout.' }
  ]);

  if (!activeMeeting) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: 900,
      background: 'rgba(8, 14, 28, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '2px solid var(--color-crimson)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 0 40px rgba(255, 51, 102, 0.35)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header Indicator */}
      <div style={{
        background: 'rgba(255, 51, 102, 0.15)',
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 51, 102, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: 'var(--color-crimson)',
            boxShadow: '0 0 12px var(--color-crimson)',
            animation: 'pulse-glow-amber 1s infinite'
          }} />
          <span style={{
            fontFamily: 'var(--font-hud)',
            fontSize: '0.9rem',
            color: 'var(--color-crimson)',
            letterSpacing: '1px',
            fontWeight: 700
          }}>
            ● RECORDING ACTIVE ({activeMeeting.title || 'Executive Meeting'})
          </span>
          <span className="brand-tag" style={{ background: 'rgba(255,51,102,0.2)', color: 'var(--color-crimson)', borderColor: 'var(--color-crimson)' }}>
            {activeMeeting.provider || 'Google Meet'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Legal Notice: Audio & Transcribing Active
          </span>
          <button className="hud-btn danger" onClick={onStopMeeting} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
            <Square size={14} /> End & Summarize Meeting
          </button>
        </div>
      </div>

      {/* Live Diarized Transcript Feed */}
      <div style={{ padding: '14px 20px', maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {transcripts.map((item) => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: '0.85rem' }}>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', fontSize: '0.75rem', paddingTop: 2 }}>
              [{item.time}]
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: item.speaker === 'Tony Stark' ? 'var(--color-cyan)' : item.speaker === 'Pepper Potts' ? 'var(--color-amber)' : 'var(--color-green)',
              minWidth: 100
            }}>
              {item.speaker}:
            </span>
            <span style={{ color: '#e2e8f0', flex: 1, fontFamily: 'var(--font-sans)' }}>
              {item.text}
            </span>
          </div>
        ))}
      </div>

      {/* Footer Controls */}
      <div style={{
        padding: '10px 20px',
        background: 'rgba(5, 8, 17, 0.8)',
        borderTop: '1px solid var(--border-glass)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Users size={14} style={{ color: 'var(--color-cyan)' }} /> 3 Speakers Identified (Tony, Pepper, Rhodey)
        </span>

        <button className="hud-btn" onClick={() => onFlagBookmark('Voice Flagged Bookmark')}>
          <Bookmark size={14} /> FRIDAY, Flag That (Smart Bookmark)
        </button>
      </div>
    </div>
  );
}
