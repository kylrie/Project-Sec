import React from 'react';
import { Activity, Radio, Cpu, Volume2, ShieldCheck } from 'lucide-react';
import { useVoiceStore } from '../stores/voiceStore';

export default function QualityDebugPanel() {
  const { activeVoice, settings } = useVoiceStore();

  return (
    <div style={{
      background: 'rgba(5, 8, 17, 0.9)',
      border: '1px solid var(--border-glass)',
      borderRadius: 'var(--radius-sm)',
      padding: 14,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      fontFamily: 'monospace',
      fontSize: '0.75rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: 8 }}>
        <span style={{ color: 'var(--color-cyan)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Cpu size={14} /> AUDIO PIPELINE TELEMETRY
        </span>
        <span className="intent-pill" style={{ fontSize: '0.65rem' }}>44.1 kHz STEREO</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        <div style={{ background: 'rgba(0, 243, 255, 0.05)', padding: 8, borderRadius: 4 }}>
          <div style={{ color: 'var(--text-muted)' }}>PRIMARY MODEL</div>
          <div style={{ color: '#fff', fontWeight: 600 }}>eleven_multilingual_v2</div>
        </div>

        <div style={{ background: 'rgba(0, 243, 255, 0.05)', padding: 8, borderRadius: 4 }}>
          <div style={{ color: 'var(--text-muted)' }}>AUDIO FORMAT</div>
          <div style={{ color: '#fff', fontWeight: 600 }}>mp3_44100_192 (192kbps)</div>
        </div>

        <div style={{ background: 'rgba(0, 243, 255, 0.05)', padding: 8, borderRadius: 4 }}>
          <div style={{ color: 'var(--text-muted)' }}>STABILITY (PROSODY)</div>
          <div style={{ color: 'var(--color-cyan)', fontWeight: 600 }}>
            {settings.stability !== undefined ? settings.stability : '0.30'} (Natural)
          </div>
        </div>

        <div style={{ background: 'rgba(0, 243, 255, 0.05)', padding: 8, borderRadius: 4 }}>
          <div style={{ color: 'var(--text-muted)' }}>SIMILARITY BOOST</div>
          <div style={{ color: 'var(--color-cyan)', fontWeight: 600 }}>
            {settings.similarity_boost || settings.similarityBoost || '0.90'} (Human)
          </div>
        </div>

        <div style={{ background: 'rgba(0, 243, 255, 0.05)', padding: 8, borderRadius: 4 }}>
          <div style={{ color: 'var(--text-muted)' }}>STYLE INTENSITY</div>
          <div style={{ color: 'var(--color-cyan)', fontWeight: 600 }}>
            {settings.style !== undefined ? settings.style : '0.55'}
          </div>
        </div>

        <div style={{ background: 'rgba(0, 243, 255, 0.05)', padding: 8, borderRadius: 4 }}>
          <div style={{ color: 'var(--text-muted)' }}>OUTPUT DESTINATION</div>
          <div style={{ color: 'var(--color-green)', fontWeight: 600 }}>
            WebAudio Direct (Uncompressed)
          </div>
        </div>
      </div>
    </div>
  );
}
