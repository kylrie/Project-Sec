import React, { useState } from 'react';
import { Play, Sparkles, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { useVoiceStore } from '../stores/voiceStore';
import { speechService } from '../services/speechService';
import { audioPlayer } from '../services/audioPlayer';

export default function VoiceQualityTest() {
  const { activeVoice, playPreview, stopPreview } = useVoiceStore();
  const [testText, setTestText] = useState("Good morning Tony. You have 3 meetings scheduled today, and traffic to the 9 AM sync is heavier than usual.");
  const [playingMode, setPlayingMode] = useState(null); // 'robotic' | 'natural' | null

  const playRobotic = async () => {
    setPlayingMode('robotic');
    stopPreview();

    const voiceId = activeVoice?.id || 'voice_eleven_friday_pro';
    const roboticSettings = {
      stability: 0.75,
      similarity_boost: 0.50,
      style: 0.00,
      speed: 1.0,
      pitch: 0.0
    };

    try {
      const res = await fetch('/api/v1/tts/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testText,
          voiceId,
          settings: roboticSettings
        })
      });
      const json = await res.json();
      if (json.success && json.audioUrl) {
        await audioPlayer.playHighQualityAudio(json.audioUrl);
      } else {
        await speechService.speak(testText, { ...roboticSettings, voiceId });
      }
    } catch (e) {
      await speechService.speak(testText, { ...roboticSettings, voiceId });
    } finally {
      setTimeout(() => setPlayingMode(null), 4500);
    }
  };

  const playNatural = async () => {
    setPlayingMode('natural');
    stopPreview();

    const voiceId = activeVoice?.id || 'voice_eleven_friday_pro';
    const naturalSettings = {
      stability: 0.30,
      similarity_boost: 0.90,
      style: 0.55,
      speed: 1.0,
      pitch: 0.0
    };

    try {
      const res = await fetch('/api/v1/tts/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testText,
          voiceId,
          settings: naturalSettings
        })
      });
      const json = await res.json();
      if (json.success && json.audioUrl) {
        await audioPlayer.playHighQualityAudio(json.audioUrl);
      } else {
        await speechService.speak(testText, { ...naturalSettings, voiceId });
      }
    } catch (e) {
      await speechService.speak(testText, { ...naturalSettings, voiceId });
    } finally {
      setTimeout(() => setPlayingMode(null), 4500);
    }
  };

  return (
    <div style={{
      background: 'rgba(5, 8, 17, 0.85)',
      border: '1px solid var(--border-glass)',
      borderRadius: 'var(--radius-sm)',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={16} /> VOICE QUALITY A/B TEST BENCHMARK
        </h4>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Active Voice: <strong>{activeVoice?.name || 'F.R.I.D.A.Y. Pro'}</strong>
        </span>
      </div>

      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-dim)' }}>
        Compare the exact same voice and phrase using <strong>Robotic (Old Monotone)</strong> vs <strong>Natural (Human Prosody)</strong> settings to evaluate expressive quality.
      </p>

      {/* Test Phrase Input */}
      <textarea
        value={testText}
        onChange={(e) => setTestText(e.target.value)}
        rows={2}
        style={{
          background: '#050811',
          border: '1px solid var(--border-glass)',
          borderRadius: 4,
          color: '#fff',
          fontSize: '0.8rem',
          padding: 8,
          resize: 'none'
        }}
      />

      {/* Side-by-side comparison buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Robotic Button */}
        <div style={{
          background: 'rgba(255, 0, 85, 0.08)',
          border: '1px solid rgba(255, 0, 85, 0.4)',
          borderRadius: 4,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ff3366', fontSize: '0.8rem', fontWeight: 600 }}>
            <AlertCircle size={14} /> Robotic / Monotone
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
            • Stability: <code>0.75</code> (Monotone)<br />
            • Similarity: <code>0.50</code> (Synthetic)<br />
            • Style: <code>0.00</code> (Flat)
          </div>
          <button
            onClick={playRobotic}
            disabled={playingMode !== null}
            className="hud-btn danger"
            style={{ marginTop: 'auto', justifyContent: 'center', padding: '8px' }}
          >
            <Play size={14} /> {playingMode === 'robotic' ? 'Playing Robotic...' : '🔴 Play Robotic'}
          </button>
        </div>

        {/* Natural Human Button */}
        <div style={{
          background: 'rgba(0, 255, 170, 0.08)',
          border: '1px solid rgba(0, 255, 170, 0.4)',
          borderRadius: 4,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-green)', fontSize: '0.8rem', fontWeight: 600 }}>
            <CheckCircle2 size={14} /> Natural / Human Prosody
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
            • Stability: <code>0.30</code> (Dynamic rhythm)<br />
            • Similarity: <code>0.90</code> (Real voice depth)<br />
            • Style: <code>0.55</code> (Expressive emotion)
          </div>
          <button
            onClick={playNatural}
            disabled={playingMode !== null}
            className="hud-btn active"
            style={{ marginTop: 'auto', justifyContent: 'center', padding: '8px' }}
          >
            <Play size={14} /> {playingMode === 'natural' ? 'Playing Natural...' : '🟢 Play Natural'}
          </button>
        </div>
      </div>
    </div>
  );
}
