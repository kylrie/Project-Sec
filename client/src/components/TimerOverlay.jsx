import React, { useState, useEffect } from 'react';
import { Timer, Bell, Check } from 'lucide-react';

export default function TimerOverlay({ timers = [], reminders = [] }) {
  if (timers.length === 0 && reminders.length === 0) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 80,
      right: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      zIndex: 100,
      pointerEvents: 'none'
    }}>
      {timers.map((timer) => (
        <TimerBadge key={timer.id} timer={timer} />
      ))}

      {reminders.map((rem) => (
        <div key={rem.id} style={{
          background: 'rgba(0, 255, 170, 0.15)',
          border: '1px solid var(--color-green)',
          color: 'var(--color-green)',
          padding: '8px 14px',
          borderRadius: 'var(--radius-sm)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8rem',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 4px 16px rgba(0, 255, 170, 0.2)'
        }}>
          <Bell size={14} />
          <span>Reminder: {rem.task}</span>
        </div>
      ))}
    </div>
  );
}

function TimerBadge({ timer }) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const diff = Math.round((new Date(timer.expires_at).getTime() - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.round((new Date(timer.expires_at).getTime() - Date.now()) / 1000);
      setSecondsLeft(diff > 0 ? diff : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer.expires_at]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div style={{
      background: secondsLeft === 0 ? 'rgba(255, 51, 102, 0.2)' : 'rgba(255, 183, 0, 0.15)',
      border: secondsLeft === 0 ? '1px solid var(--color-crimson)' : '1px solid var(--color-amber)',
      color: secondsLeft === 0 ? 'var(--color-crimson)' : 'var(--color-amber)',
      padding: '8px 14px',
      borderRadius: 'var(--radius-sm)',
      fontFamily: 'var(--font-hud)',
      fontSize: '0.85rem',
      letterSpacing: '1px',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      boxShadow: '0 4px 16px rgba(255, 183, 0, 0.2)'
    }}>
      <Timer size={16} />
      <span>{timer.label}:</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
        {secondsLeft === 0 ? 'EXPIRED' : formatted}
      </span>
    </div>
  );
}
