import React, { useState, useEffect } from 'react';
import { Mic, Play, Pause, Check, Sliders, Sparkles, X, Volume2, Split, Plus, Search, Shield, Zap, Info, Activity, Radio, Cpu } from 'lucide-react';
import { useVoiceStore } from '../stores/voiceStore';
import { audioDiagnostics } from '../services/audioDiagnostics';
import { audioPlaybackService } from '../services/audioPlaybackService';
import { filterQualityVoices } from '../services/voiceCurator';
import VoiceWaveform from './VoiceWaveform';
import VoiceQualityTest from './VoiceQualityTest';
import QualityDebugPanel from './QualityDebugPanel';

export default function VoiceStudioPanel({ isOpen, onClose }) {
  const {
    voices,
    activeVoice,
    presets,
    isLoadingVoices,
    selectedCategory,
    selectedProvider,
    searchQuery,
    settings,
    isPreviewPlaying,
    previewVoiceId,
    abVoiceA,
    abVoiceB,
    abPhrase,
    fetchVoices,
    setActiveVoice,
    playPreview,
    stopPreview,
    updateSettings,
    fetchPresets,
    savePreset,
    setABVoices,
    setCategory,
    setProvider,
    setSearchQuery
  } = useVoiceStore();

  const [activeTab, setActiveTab] = useState('library'); // 'library' | 'quality_test' | 'ab_test' | 'clone' | 'presets'
  const [tryMeText, setTryMeText] = useState('Hello, I am F.R.I.D.A.Y., your AI voice secretary.');
  const [presetNameInput, setPresetNameInput] = useState('');

  // Diagnostics State
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [isTestingSpeakers, setIsTestingSpeakers] = useState(false);

  // Voice Cloning Form State
  const [cloneName, setCloneName] = useState('');
  const [cloneStatus, setCloneStatus] = useState(null);
  const [isCloning, setIsCloning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchVoices();
      fetchPresets();
      audioDiagnostics.unlockAudioContext();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestSpeakers = async () => {
    setIsTestingSpeakers(true);
    await audioPlaybackService.testAudioBeep();
    const diag = await audioDiagnostics.runFullAudioDiagnostic();
    setDiagnosticResult(diag);
    setIsTestingSpeakers(false);
  };

  const curatedVoices = filterQualityVoices(voices);

  const filteredVoices = curatedVoices.filter((v) => {
    const matchesCat = selectedCategory === 'all' || v.category === selectedCategory || (selectedCategory === 'cloned' && v.isCloned);
    const matchesProv = selectedProvider === 'all' || v.provider === selectedProvider;
    const matchesQuery = !searchQuery || v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.accent.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesProv && matchesQuery;
  });

  const handleStartClone = async () => {
    if (!cloneName.trim()) return;
    setIsCloning(true);
    setCloneStatus('Uploading audio samples & training model...');
    try {
      const res = await fetch('/api/v1/voices/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cloneName, sampleCount: 3 })
      });
      const json = await res.json();
      if (json.success) {
        setCloneStatus('Training complete! Voice added to your library.');
        fetchVoices();
      }
    } catch (err) {
      setCloneStatus('Cloning failed. Check audio quality.');
    } finally {
      setIsCloning(false);
    }
  };

  const handleCreatePreset = () => {
    if (!presetNameInput.trim()) return;
    savePreset(presetNameInput);
    setPresetNameInput('');
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: 1120, width: '94vw', height: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header Bar */}
        <div className="modal-header" style={{ paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'radial-gradient(circle, var(--color-cyan) 0%, rgba(0,243,255,0.2) 70%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px var(--color-cyan)'
            }}>
              <Volume2 size={18} style={{ color: '#050811' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', margin: 0 }}>F.R.I.D.A.Y. VOICE STUDIO (HD HUMAN UPGRADE)</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>eleven_multilingual_v2 • 192kbps 44.1kHz CD Stereo</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Audio Speaker Diagnostic Button */}
            <button
              className="hud-btn"
              onClick={handleTestSpeakers}
              style={{ padding: '4px 10px', fontSize: '0.75rem', borderColor: 'var(--color-cyan)', color: 'var(--color-cyan)' }}
              title="Play diagnostic chime through physical speakers to verify hardware output"
            >
              <Radio size={14} /> {isTestingSpeakers ? 'Testing...' : '🔊 Test Speakers'}
            </button>

            {/* Top Navigation Tabs */}
            <div style={{ display: 'flex', gap: 6, background: 'rgba(5,8,17,0.8)', padding: 4, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
              {[
                { id: 'library', label: 'Voice Library' },
                { id: 'quality_test', label: 'Quality A/B Test' },
                { id: 'ab_test', label: 'Voice Compare' },
                { id: 'clone', label: 'Voice Clone' },
                { id: 'presets', label: 'Presets' }
              ].map((t) => (
                <button
                  key={t.id}
                  className={`hud-btn ${activeTab === t.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.id)}
                  style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button className="hud-btn" onClick={onClose} style={{ padding: 6 }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Audio Diagnostic Result Alert */}
        {diagnosticResult && (
          <div style={{
            background: 'rgba(0, 243, 255, 0.1)',
            border: '1px solid var(--color-cyan)',
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.75rem',
            color: 'var(--color-cyan)'
          }}>
            <span>
              ✔ <strong>Speaker Hardware Test Passed:</strong> WebAudio Context: <code>{diagnosticResult.contextState}</code> • 440Hz/880Hz Diagnostic Chime Sent to Speakers.
            </span>
            <button
              onClick={() => setDiagnosticResult(null)}
              style={{ background: 'none', border: 'none', color: 'var(--color-cyan)', cursor: 'pointer', fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Studio Content Area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', gap: 16 }}>
          {/* Main Panel Content */}
          {activeTab === 'library' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
              {/* Filter & Search Bar */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: 'var(--text-dim)' }} />
                  <input
                    type="text"
                    placeholder="Search curated natural voice by name, accent..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(5, 8, 17, 0.8)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 10px 6px 32px',
                      color: '#fff',
                      fontSize: '0.8rem'
                    }}
                  />
                </div>

                {/* Provider Selector */}
                <select
                  value={selectedProvider}
                  onChange={(e) => setProvider(e.target.value)}
                  style={{
                    background: 'rgba(5, 8, 17, 0.8)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '6px 10px',
                    color: '#fff',
                    fontSize: '0.8rem'
                  }}
                >
                  <option value="all">All Providers</option>
                  <option value="elevenlabs">ElevenLabs (multilingual_v2 HD)</option>
                  <option value="azure">Azure Neural (Low Latency)</option>
                  <option value="google">Google Cloud TTS</option>
                  <option value="device">On-Device (Offline)</option>
                </select>
              </div>

              {/* Category Pills */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['all', 'professional', 'warm', 'casual', 'authoritative', 'cloned'].map((cat) => (
                  <button
                    key={cat}
                    className={`hud-btn ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setCategory(cat)}
                    style={{ padding: '3px 10px', fontSize: '0.75rem', textTransform: 'capitalize' }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Voice Cards Grid */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 12,
                paddingRight: 4
              }}>
                {filteredVoices.map((voice) => {
                  const isSelected = activeVoice?.id === voice.id;
                  const isPlayingThis = isPreviewPlaying && previewVoiceId === voice.id;

                  return (
                    <div
                      key={voice.id}
                      onClick={() => setActiveVoice(voice)}
                      style={{
                        background: isSelected ? 'rgba(0, 243, 255, 0.12)' : 'rgba(5, 8, 17, 0.75)',
                        border: isSelected ? '1px solid var(--color-cyan)' : '1px solid var(--border-glass)',
                        borderRadius: 'var(--radius-sm)',
                        padding: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 10,
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 0 15px rgba(0, 243, 255, 0.2)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
                            {voice.name}
                            {isSelected && <Check size={14} style={{ color: 'var(--color-cyan)' }} />}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            {voice.accent} • {voice.gender}
                          </span>
                        </div>

                        <span className="intent-pill" style={{ fontSize: '0.65rem' }}>
                          {voice.provider}
                        </span>
                      </div>

                      {/* Waveform / Preview Bar */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <VoiceWaveform isPlaying={isPlayingThis} height={20} barCount={10} />

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isPlayingThis) stopPreview();
                            else playPreview(voice.id, tryMeText);
                          }}
                          style={{
                            background: isPlayingThis ? 'var(--color-cyan)' : 'rgba(0, 243, 255, 0.15)',
                            color: isPlayingThis ? '#050811' : 'var(--color-cyan)',
                            border: 'none',
                            borderRadius: '50%',
                            width: 28,
                            height: 28,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          {isPlayingThis ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: 2 }} />}
                        </button>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        <span>Latency: {voice.latency}</span>
                        <span>{voice.costPer1KChars === 0 ? 'FREE' : `$${voice.costPer1KChars}/1k`}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quality A/B Test Panel */}
          {activeTab === 'quality_test' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
              <VoiceQualityTest />
              <QualityDebugPanel />
            </div>
          )}

          {/* A/B Test Comparison Panel */}
          {activeTab === 'ab_test' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'rgba(0, 243, 255, 0.05)', border: '1px solid var(--border-cyan)', padding: 12, borderRadius: 'var(--radius-sm)' }}>
                <h4 style={{ margin: '0 0 6px', color: 'var(--color-cyan)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Split size={14} /> Voice A/B Comparison Tool
                </h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Compare two different voices speaking the exact same phrase side-by-side to pick the perfect tone for F.R.I.D.A.Y.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flex: 1 }}>
                {/* Voice A */}
                <div style={{ background: 'rgba(5, 8, 17, 0.8)', border: '1px solid var(--border-glass)', padding: 16, borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <h4 style={{ margin: 0, color: '#fff', fontSize: '0.9rem' }}>Voice A (Primary Candidate)</h4>
                  <select
                    value={abVoiceA?.id || activeVoice?.id || ''}
                    onChange={(e) => {
                      const v = voices.find(x => x.id === e.target.value);
                      setABVoices(v, abVoiceB);
                    }}
                    style={{ background: '#050811', border: '1px solid var(--border-glass)', color: '#fff', padding: 8, borderRadius: 4, fontSize: '0.8rem' }}
                  >
                    {curatedVoices.map(v => <option key={v.id} value={v.id}>{v.name} ({v.provider})</option>)}
                  </select>

                  <button
                    className="hud-btn active"
                    onClick={() => playPreview((abVoiceA || activeVoice)?.id, abPhrase)}
                    style={{ marginTop: 'auto', justifyContent: 'center' }}
                  >
                    <Play size={14} /> Listen to Voice A
                  </button>
                </div>

                {/* Voice B */}
                <div style={{ background: 'rgba(5, 8, 17, 0.8)', border: '1px solid var(--border-glass)', padding: 16, borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <h4 style={{ margin: 0, color: '#fff', fontSize: '0.9rem' }}>Voice B (Challenger Candidate)</h4>
                  <select
                    value={abVoiceB?.id || voices[1]?.id || ''}
                    onChange={(e) => {
                      const v = voices.find(x => x.id === e.target.value);
                      setABVoices(abVoiceA, v);
                    }}
                    style={{ background: '#050811', border: '1px solid var(--border-glass)', color: '#fff', padding: 8, borderRadius: 4, fontSize: '0.8rem' }}
                  >
                    {curatedVoices.map(v => <option key={v.id} value={v.id}>{v.name} ({v.provider})</option>)}
                  </select>

                  <button
                    className="hud-btn active"
                    onClick={() => playPreview((abVoiceB || voices[1])?.id, abPhrase)}
                    style={{ marginTop: 'auto', justifyContent: 'center' }}
                  >
                    <Play size={14} /> Listen to Voice B
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Voice Cloning Panel */}
          {activeTab === 'clone' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'rgba(0, 255, 170, 0.05)', border: '1px solid var(--color-green)', padding: 12, borderRadius: 'var(--radius-sm)' }}>
                <h4 style={{ margin: '0 0 6px', color: 'var(--color-green)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mic size={14} /> ElevenLabs Professional Voice Cloning
                </h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Clone your own voice or a custom voice profile. Record 3 clean audio samples (3-10 seconds each) to train the model.
                </p>
              </div>

              <div style={{ background: 'rgba(5, 8, 17, 0.8)', border: '1px solid var(--border-glass)', padding: 16, borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 520 }}>
                <label style={{ fontSize: '0.8rem', color: '#fff' }}>Voice Profile Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Tony Stark Personal Voice"
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  style={{ background: '#050811', border: '1px solid var(--border-glass)', color: '#fff', padding: 8, borderRadius: 4, fontSize: '0.8rem' }}
                />

                <div style={{ background: 'rgba(0,0,0,0.4)', padding: 12, borderRadius: 4, fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  ✔ Sample 1: "Good morning boss, standing by."<br />
                  ✔ Sample 2: "You have 3 meetings today."<br />
                  ✔ Sample 3: "Shall I schedule the workout?"
                </div>

                <button
                  className="hud-btn active"
                  onClick={handleStartClone}
                  disabled={isCloning}
                  style={{ justifyContent: 'center', marginTop: 8 }}
                >
                  <Sparkles size={14} /> {isCloning ? 'Cloning in Progress...' : 'Start Voice Cloning Training'}
                </button>

                {cloneStatus && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-cyan)', textAlign: 'center' }}>
                    {cloneStatus}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Voice Presets Panel */}
          {activeTab === 'presets' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  placeholder="New Preset Name (e.g. Urgent Mode)"
                  value={presetNameInput}
                  onChange={(e) => setPresetNameInput(e.target.value)}
                  style={{ flex: 1, background: 'rgba(5, 8, 17, 0.8)', border: '1px solid var(--border-glass)', color: '#fff', padding: '6px 12px', borderRadius: 4, fontSize: '0.8rem' }}
                />
                <button className="hud-btn active" onClick={handleCreatePreset} style={{ fontSize: '0.8rem' }}>
                  <Plus size={14} /> Save Active Voice Preset
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
                {presets.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    No presets saved yet. Adjust speed/pitch and click Save.
                  </div>
                ) : (
                  presets.map((p) => (
                    <div key={p.id} style={{ background: 'rgba(5, 8, 17, 0.8)', border: '1px solid var(--border-glass)', padding: 12, borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#fff', fontSize: '0.85rem' }}>{p.name}</strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          Speed: {p.speed}x • Pitch: {p.pitch} • Stability: {p.stability}
                        </div>
                      </div>
                      <button className="hud-btn" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                        Activate
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Right Column: Side Inspector & Real-time Adjustment Sliders */}
          <div style={{
            width: 320,
            background: 'rgba(5, 8, 17, 0.9)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-sm)',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sliders size={14} /> REAL-TIME VOICE INSPECTOR
            </h4>

            {activeVoice && (
              <div style={{ fontSize: '0.8rem', color: '#fff', background: 'rgba(0, 243, 255, 0.05)', border: '1px solid var(--border-glass)', padding: 10, borderRadius: 4 }}>
                <strong>Active: {activeVoice.name}</strong>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Provider: {activeVoice.provider} • Accent: {activeVoice.accent}
                </div>
              </div>
            )}

            {/* Try Me Input Box */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>"Try Me" Test Phrase:</label>
              <textarea
                value={tryMeText}
                onChange={(e) => setTryMeText(e.target.value)}
                rows={2}
                style={{
                  background: '#050811',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 4,
                  color: '#fff',
                  fontSize: '0.75rem',
                  padding: 6,
                  resize: 'none'
                }}
              />
              <button
                className="hud-btn active"
                onClick={() => playPreview(activeVoice?.id, tryMeText)}
                style={{ fontSize: '0.75rem', padding: '4px 8px', marginTop: 4, justifyContent: 'center' }}
              >
                <Play size={12} /> Test Selected Voice
              </button>
            </div>

            {/* Customization Sliders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Stability Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  <span>Stability (0.30 = Natural Human)</span>
                  <span>{Math.round((settings.stability !== undefined ? settings.stability : 0.30) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.90"
                  step="0.05"
                  value={settings.stability !== undefined ? settings.stability : 0.30}
                  onChange={(e) => updateSettings({ stability: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--color-cyan)' }}
                />
              </div>

              {/* Similarity Boost Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  <span>Similarity (0.90 = Voice Depth)</span>
                  <span>{Math.round((settings.similarity_boost || settings.similarityBoost || 0.90) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.40"
                  max="1.00"
                  step="0.05"
                  value={settings.similarity_boost || settings.similarityBoost || 0.90}
                  onChange={(e) => updateSettings({ similarity_boost: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--color-cyan)' }}
                />
              </div>

              {/* Style Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  <span>Style / Expressiveness (0.55)</span>
                  <span>{Math.round((settings.style !== undefined ? settings.style : 0.55) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.00"
                  max="1.00"
                  step="0.05"
                  value={settings.style !== undefined ? settings.style : 0.55}
                  onChange={(e) => updateSettings({ style: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--color-cyan)' }}
                />
              </div>

              {/* Speed Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  <span>Speed</span>
                  <span>{settings.speed || 1.0}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.05"
                  value={settings.speed || 1.0}
                  onChange={(e) => updateSettings({ speed: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--color-cyan)' }}
                />
              </div>
            </div>

            {/* Primary Set Active CTA Button */}
            <button
              className="hud-btn active"
              onClick={() => {
                if (activeVoice) setActiveVoice(activeVoice);
                onClose();
              }}
              style={{ marginTop: 'auto', padding: '10px', justifyContent: 'center', fontSize: '0.85rem' }}
            >
              <Check size={16} /> Set as F.R.I.D.A.Y.'s Voice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
