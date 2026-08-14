import React from 'react';

export default function VoiceWaveform({ isPlaying = false, height = 24, barCount = 12 }) {
  const bars = Array.from({ length: barCount });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height }}>
      {bars.map((_, i) => {
        const animDuration = 0.4 + (i % 5) * 0.15;
        return (
          <div
            key={i}
            style={{
              width: 3,
              borderRadius: 2,
              background: 'var(--color-cyan)',
              height: isPlaying ? `${Math.floor(20 + Math.sin(i) * 70)}%` : '20%',
              transition: 'height 0.15s ease',
              animation: isPlaying ? `waveformPulse ${animDuration}s ease-in-out infinite alternate` : 'none',
              boxShadow: isPlaying ? '0 0 6px var(--color-cyan)' : 'none'
            }}
          />
        );
      })}
    </div>
  );
}
