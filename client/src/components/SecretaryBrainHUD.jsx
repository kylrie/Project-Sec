import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, Calendar, UserCheck, Dumbbell, Clock } from 'lucide-react';

export default function SecretaryBrainHUD({ onSendCommand }) {
  const [briefing, setBriefing] = useState(null);
  const [prepPack, setPrepPack] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchBrainData = async () => {
    setLoading(true);
    try {
      const [briefRes, prepRes] = await Promise.all([
        fetch('/api/brain/briefing2'),
        fetch('/api/brain/prep?title=Acme%20Corp%20Strategy%20Sync')
      ]);

      const briefJson = await briefRes.json();
      const prepJson = await prepRes.json();

      if (briefJson.success) setBriefing(briefJson);
      if (prepJson.success) setPrepPack(prepJson.prepPack);
    } catch (err) {
      console.warn('Secretary Brain fetch err:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrainData();
  }, []);

  if (!briefing && !prepPack) return null;

  return (
    <div style={{
      background: 'rgba(0, 243, 255, 0.04)',
      border: '1px solid var(--border-cyan)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 16px',
      margin: '0 16px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontFamily: 'var(--font-hud)',
          fontSize: '0.8rem',
          color: 'var(--color-cyan)',
          letterSpacing: '1px',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <Brain size={14} /> SECRETARY BRAIN PROACTIVE SUGGESTIONS
        </span>
        <span className="intent-pill" style={{ background: 'rgba(0, 255, 170, 0.15)', color: 'var(--color-green)', borderColor: 'var(--color-green)', fontSize: '0.7rem' }}>
          PROACTIVE ACTIVE
        </span>
      </div>

      {/* Briefing 2.0 & Workout Suggestion */}
      {briefing && (
        <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4', background: 'rgba(5, 8, 17, 0.6)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: '#fff', fontWeight: 600 }}>
            <Sparkles size={13} style={{ color: 'var(--color-cyan)' }} /> Morning Briefing 2.0 Recommendation
          </div>
          <p style={{ margin: 0 }}>
            {briefing.text}
          </p>
          <div style={{ marginTop: 6, display: 'flex', gap: 10 }}>
            <button
              onClick={() => onSendCommand('Schedule 2 PM workout')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-green)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Dumbbell size={12} /> ➔ Block 2 PM Workout Slot
            </button>
          </div>
        </div>
      )}

      {/* Predictive Pre-Meeting Prep Pack */}
      {prepPack && (
        <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4', background: 'rgba(5, 8, 17, 0.6)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: '#fff', fontWeight: 600 }}>
            <Clock size={13} style={{ color: 'var(--color-amber)' }} /> Predictive Meeting Prep ({prepPack.meetingTitle})
          </div>
          <p style={{ margin: 0 }}>
            {prepPack.suggestedPrepText}
          </p>
        </div>
      )}
    </div>
  );
}
