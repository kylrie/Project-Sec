// components/LatencyDebugPanel.jsx — Real-time Latency & Streaming Pipeline Telemetry HUD
import React, { useState, useEffect } from 'react';
import { Activity, Zap, CheckCircle2, Clock, Cpu, Volume2, Radio, Sparkles, X, RefreshCw, Play } from 'lucide-react';
import { streamingClient } from '../services/streamingClient.js';

export default function LatencyDebugPanel({ isOpen, onClose }) {
  const [metrics, setMetrics] = useState({
    sttLatency: 0,
    llmFirstTokenLatency: 0,
    ttsFirstAudioLatency: 0,
    totalPerceivedLatency: 0,
    isCacheHit: false
  });

  const [thinkingState, setThinkingState] = useState({ isThinking: false, stage: 'idle', text: '' });
  const [transcription, setTranscription] = useState({ text: '', isFinal: false });
  const [sentenceLog, setSentenceLog] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const handleMetrics = (data) => {
      setMetrics(data);
      setHistory(prev => [
        { ...data, timestamp: new Date().toLocaleTimeString() },
        ...prev.slice(0, 4)
      ]);
    };

    const handleThinking = (state) => {
      setThinkingState(state);
      if (state.sentenceText) {
        setSentenceLog(prev => [...prev, state.sentenceText]);
      }
    };

    const handleTranscription = (data) => {
      setTranscription(data);
      if (data.isFinal) {
        setSentenceLog([]);
      }
    };

    streamingClient.on('latencyMetrics', handleMetrics);
    streamingClient.on('thinking', handleThinking);
    streamingClient.on('transcription', handleTranscription);

    return () => {
      streamingClient.off('latencyMetrics', handleMetrics);
      streamingClient.off('thinking', handleThinking);
      streamingClient.off('transcription', handleTranscription);
    };
  }, []);

  if (!isOpen) return null;

  const getLatencyColor = (ms, targetMs) => {
    if (ms <= targetMs) return '#00f3ff'; // Cyan optimal
    if (ms <= targetMs * 1.5) return '#ffd700'; // Yellow acceptable
    return '#ff0055'; // Red alert
  };

  const runTestStream = (sampleText) => {
    setSentenceLog([]);
    streamingClient.sendStreamCommand(sampleText || 'Check my schedule for today');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(16px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <div style={{
        background: '#070d1e',
        border: '1px solid rgba(0, 243, 255, 0.3)',
        borderRadius: 16,
        width: '100%',
        maxWidth: 820,
        boxShadow: '0 20px 60px rgba(0, 243, 255, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid rgba(0, 243, 255, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0, 243, 255, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={20} color="#00f3ff" />
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, letterSpacing: '0.05em', color: '#fff' }}>
              STREAMING PIPELINE LATENCY TELEMETRY HUD
            </h2>
            <span style={{
              fontSize: '0.65rem',
              padding: '2px 8px',
              borderRadius: 12,
              background: 'rgba(0, 243, 255, 0.15)',
              color: '#00f3ff',
              border: '1px solid rgba(0, 243, 255, 0.3)'
            }}>
              4-STAGE ENGINE
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => runTestStream('Check my schedule for today')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                background: 'rgba(0, 243, 255, 0.2)',
                border: '1px solid #00f3ff',
                borderRadius: 6,
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Zap size={14} color="#00f3ff" /> Run Stream Benchmark
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                padding: 4
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, maxHeight: '80vh', overflowY: 'auto' }}>
          
          {/* Main Key Metric: Total Perceived Latency */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 243, 255, 0.08) 0%, rgba(255, 0, 85, 0.03) 100%)',
            border: '1px solid rgba(0, 243, 255, 0.3)',
            borderRadius: 12,
            padding: 20,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Perceived Response Latency (Voice End ➔ First Audio Byte)
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4 }}>
                <span style={{ fontSize: '2.4rem', fontWeight: 800, color: getLatencyColor(metrics.totalPerceivedLatency, 3000) }}>
                  {metrics.totalPerceivedLatency > 0 ? `${metrics.totalPerceivedLatency} ms` : '--'}
                </span>
                <span style={{ fontSize: '0.85rem', color: metrics.totalPerceivedLatency <= 3000 ? '#00f3ff' : '#ff0055' }}>
                  {metrics.totalPerceivedLatency > 0
                    ? (metrics.totalPerceivedLatency <= 3000 ? '⚡ TARGET ACHIEVED (< 3.0s)' : '⚠️ Exceeds 3.0s target')
                    : 'Awaiting Voice Query'}
                </span>
              </div>
            </div>

            {metrics.isCacheHit && (
              <div style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: 'rgba(0, 243, 255, 0.2)',
                border: '1px solid #00f3ff',
                color: '#00f3ff',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <Sparkles size={16} /> INSTANT CACHE HIT (sub-50ms)
              </div>
            )}
          </div>

          {/* 3 Sub-Stage Latency Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {/* Stage 1: STT */}
            <div style={{
              background: '#0c142b',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 10,
              padding: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#00f3ff' }}>
                <Radio size={14} /> Stage 1: STT Latency
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: 6, color: '#fff' }}>
                {metrics.sttLatency} ms
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: 2 }}>
                Target: &lt; 1,000 ms
              </div>
            </div>

            {/* Stage 2: LLM TTFT */}
            <div style={{
              background: '#0c142b',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 10,
              padding: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#ffaa00' }}>
                <Cpu size={14} /> Stage 2: LLM First Token
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: 6, color: '#fff' }}>
                {metrics.llmFirstTokenLatency} ms
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: 2 }}>
                Target: &lt; 500 ms (gpt-4o-mini)
              </div>
            </div>

            {/* Stage 3: TTS TTFA */}
            <div style={{
              background: '#0c142b',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 10,
              padding: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#00ffaa' }}>
                <Volume2 size={14} /> Stage 3: TTS First Audio
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: 6, color: '#fff' }}>
                {metrics.ttsFirstAudioLatency} ms
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: 2 }}>
                Target: &lt; 1,500 ms (ElevenLabs stream)
              </div>
            </div>
          </div>

          {/* Real-time Streaming Pipeline Stage Visualizer */}
          <div style={{
            background: '#0c142b',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 10,
            padding: 16
          }}>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', marginBottom: 12 }}>
              4-Stage Pipeline Progress & State
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              {[
                { label: '1. Streaming STT', active: thinkingState.stage === 'listening' },
                { label: '2. Intent Routing', active: thinkingState.stage === 'intent_routing' },
                { label: '3. Sentence Buffer', active: thinkingState.stage === 'llm_reasoning' },
                { label: '4. TTS Stream', active: thinkingState.stage === 'tts_synthesizing' },
                { label: '5. Gapless Output', active: !thinkingState.isThinking && metrics.totalPerceivedLatency > 0 }
              ].map((step, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  zIndex: 2
                }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: step.active ? '#00f3ff' : 'rgba(255, 255, 255, 0.06)',
                    color: step.active ? '#050811' : 'rgba(255, 255, 255, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    boxShadow: step.active ? '0 0 16px rgba(0, 243, 255, 0.6)' : 'none',
                    transition: 'all 0.2s ease'
                  }}>
                    {idx + 1}
                  </div>
                  <span style={{ fontSize: '0.65rem', color: step.active ? '#00f3ff' : 'rgba(255, 255, 255, 0.5)' }}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Sentence Stream Timeline */}
          {sentenceLog.length > 0 && (
            <div style={{
              background: '#0c142b',
              border: '1px solid rgba(0, 243, 255, 0.2)',
              borderRadius: 10,
              padding: 16
            }}>
              <div style={{ fontSize: '0.75rem', color: '#00f3ff', textTransform: 'uppercase', marginBottom: 8 }}>
                Pipelined Sentence Dispatch Stream ({sentenceLog.length} sentences)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sentenceLog.map((sentence, idx) => (
                  <div key={idx} style={{
                    fontSize: '0.8rem',
                    color: '#fff',
                    padding: '6px 10px',
                    borderRadius: 6,
                    background: 'rgba(0, 243, 255, 0.06)',
                    borderLeft: '3px solid #00f3ff'
                  }}>
                    <span style={{ color: '#00f3ff', fontWeight: 600, marginRight: 6 }}>[Sentence {idx + 1}]</span>
                    {sentence}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Benchmark Queries */}
          <div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: 8 }}>
              Test Benchmark Queries:
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                "Good morning",
                "Check my schedule for today",
                "Draft email to team about Friday sync",
                "What is my next meeting?"
              ].map((query, idx) => (
                <button
                  key={idx}
                  onClick={() => runTestStream(query)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  "{query}"
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
