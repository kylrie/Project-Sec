import React, { useEffect, useRef } from 'react';
import { audioService } from '../services/audioService';

export default function Visualizer({ status = 'idle', isListening = false, isSpeaking = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let rotation = 0;

    const render = () => {
      const width = (canvas.width = canvas.offsetWidth);
      const height = (canvas.height = canvas.offsetHeight);
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.28;

      ctx.clearRect(0, 0, width, height);

      // Get real-time audio frequency data from audioService
      const freqData = audioService.getFrequencyData();
      const avgVol = audioService.getAudioVolume();

      // State colors
      let strokeColor = '#00f3ff';
      let glowColor = 'rgba(0, 243, 255, 0.4)';

      if (isSpeaking) {
        strokeColor = '#00ffaa';
        glowColor = 'rgba(0, 255, 170, 0.5)';
      } else if (isListening) {
        strokeColor = '#ffb700';
        glowColor = 'rgba(255, 183, 0, 0.5)';
      } else if (status === 'processing') {
        strokeColor = '#0077ff';
        glowColor = 'rgba(0, 119, 255, 0.6)';
      }

      rotation += 0.01 + avgVol * 0.05;

      // 1. Draw Outer Glowing Ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 18 + avgVol * 30, 0, Math.PI * 2);
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 4 + avgVol * 10;
      ctx.shadowBlur = 20;
      ctx.shadowColor = strokeColor;
      ctx.stroke();
      ctx.restore();

      // 2. Draw Arc Reactor Rotating Segments
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);

      const numSegments = 16;
      for (let i = 0; i < numSegments; i++) {
        const angle = (i * 2 * Math.PI) / numSegments;
        const segLen = radius * 0.22;
        const x1 = Math.cos(angle) * (radius - segLen);
        const y1 = Math.sin(angle) * (radius - segLen);
        const x2 = Math.cos(angle) * radius;
        const y2 = Math.sin(angle) * radius;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 10;
        ctx.shadowColor = strokeColor;
        ctx.stroke();
      }
      ctx.restore();

      // 3. Draw Audio Frequency Spikes around perimeter
      ctx.save();
      ctx.translate(centerX, centerY);
      const bars = Math.min(32, freqData.length);
      for (let i = 0; i < bars; i++) {
        const val = freqData[i] || 0;
        const barHeight = (val / 255) * 45;
        const angle = (i * 2 * Math.PI) / bars;

        const x1 = Math.cos(angle) * (radius + 6);
        const y1 = Math.sin(angle) * (radius + 6);
        const x2 = Math.cos(angle) * (radius + 6 + barHeight);
        const y2 = Math.sin(angle) * (radius + 6 + barHeight);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      ctx.restore();

      // 4. Central Reactor Core Glow
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.45 + avgVol * 15, 0, Math.PI * 2);
      ctx.fillStyle = glowColor;
      ctx.shadowBlur = 30;
      ctx.shadowColor = strokeColor;
      ctx.fill();
      ctx.restore();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [status, isListening, isSpeaking]);

  return (
    <div className="visualizer-container">
      <canvas ref={canvasRef} className="visualizer-canvas" />
      <div style={{
        marginTop: 12,
        fontFamily: 'var(--font-hud)',
        fontSize: '0.85rem',
        letterSpacing: '2px',
        color: isSpeaking ? '#00ffaa' : isListening ? '#ffb700' : '#00f3ff',
        textTransform: 'uppercase'
      }}>
        {isSpeaking ? '● F.R.I.D.A.Y. Speaking (Barge-in Ready)' : isListening ? '● Listening (VAD Active)' : '● Standing By ("Hey FRIDAY")'}
      </div>
    </div>
  );
}
