import React, { useState, useEffect } from 'react';
import { Settings, X, Mic, Volume2, Sliders, Cpu, ShieldCheck, RefreshCw, Key } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  wakeWord,
  onUpdateWakeWord,
  personality,
  onUpdatePersonality,
  speed,
  onUpdateSpeed,
  pitch,
  onUpdatePitch
}) {
  const [authStatus, setAuthStatus] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/auth/status')
        .then(res => res.json())
        .then(data => {
          if (data.success) setAuthStatus(data.status);
        })
        .catch(err => console.warn('Auth status fetch err:', err));
    }
  }, [isOpen]);

  const handleRevoke = async () => {
    if (!window.confirm('Revoke Google Workspace permissions? This will disconnect Calendar, Gmail, and Tasks integration.')) return;
    try {
      const res = await fetch('/api/auth/revoke', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setAuthStatus({ connected: false });
      }
    } catch (err) {
      console.error('Revoke err:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h2><Settings size={20} /> F.R.I.D.A.Y. Engine Settings</h2>
          <button className="hud-btn" onClick={onClose} style={{ padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* 1. Google Workspace Connection & Granular Permissions */}
          <div style={{
            background: 'rgba(0, 243, 255, 0.05)',
            border: '1px solid var(--border-cyan)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '0.85rem', fontFamily: 'var(--font-hud)', color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={16} /> Google Workspace Integration
              </label>
              <span className={`intent-pill ${authStatus?.connected ? 'reminder' : 'timer'}`}>
                {authStatus?.connected ? '● CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Connected Account: <strong style={{ color: '#fff' }}>{authStatus?.account || 'boss@stark-industries.com'}</strong>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['Calendar Read/Write', 'Gmail Read & Send', 'Google Tasks CRUD'].map((scope, idx) => (
                <span key={idx} style={{
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono)',
                  background: 'rgba(0, 255, 170, 0.1)',
                  color: 'var(--color-green)',
                  border: '1px solid rgba(0, 255, 170, 0.3)',
                  padding: '2px 8px',
                  borderRadius: 4
                }}>
                  ✓ {scope}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="hud-btn danger" onClick={handleRevoke} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                <Key size={13} /> Revoke Permissions
              </button>
            </div>
          </div>

          {/* 2. Wake Word Config */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: '0.85rem', fontFamily: 'var(--font-hud)', color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mic size={14} /> Wake Word Detection Phrase
            </label>
            <input
              type="text"
              value={wakeWord}
              onChange={(e) => onUpdateWakeWord(e.target.value)}
              placeholder="e.g. Hey FRIDAY"
              style={{
                background: 'rgba(5, 8, 17, 0.8)',
                border: '1px solid var(--border-cyan)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px',
                color: '#fff',
                fontFamily: 'var(--font-mono)'
              }}
            />
          </div>

          {/* 3. Personality Presets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: '0.85rem', fontFamily: 'var(--font-hud)', color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Cpu size={14} /> Voice Personality Preset
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { id: 'professional', label: 'Professional', desc: 'Tactical, crisp & structured' },
                { id: 'casual', label: 'Casual', desc: 'Friendly, relaxed conversation' },
                { id: 'concise', label: 'Concise', desc: 'Minimalist ultra-short data' }
              ].map((item) => (
                <button
                  key={item.id}
                  className={`hud-btn ${personality === item.id ? 'active' : ''}`}
                  onClick={() => onUpdatePersonality(item.id)}
                  style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '12px' }}
                >
                  <span style={{ fontWeight: 700 }}>{item.label}</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.8, textTransform: 'none' }}>{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Voice Speed & Pitch */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.85rem', fontFamily: 'var(--font-hud)', color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Volume2 size={14} /> Voice Speed ({speed}x)
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speed}
                onChange={(e) => onUpdateSpeed(parseFloat(e.target.value))}
                style={{ accentColor: 'var(--color-cyan)' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.85rem', fontFamily: 'var(--font-hud)', color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sliders size={14} /> Pitch Tuning ({pitch}x)
              </label>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={pitch}
                onChange={(e) => onUpdatePitch(parseFloat(e.target.value))}
                style={{ accentColor: 'var(--color-cyan)' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
