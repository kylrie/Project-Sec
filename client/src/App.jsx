import React, { useState, useEffect } from 'react';
import { Shield, Settings, Mic, MicOff, Square, Bell, Video, MessageSquare, Activity, Sparkles, Lock, Volume2 } from 'lucide-react';
import Visualizer from './components/Visualizer';
import ChatInterface from './components/ChatInterface';
import CommandBar from './components/CommandBar';
import PrivacyDashboard from './components/PrivacyDashboard';
import SettingsModal from './components/SettingsModal';
import TimerOverlay from './components/TimerOverlay';
import WorkspaceWidget from './components/WorkspaceWidget';
import DraftApprovalModal from './components/DraftApprovalModal';
import MeetingHUD from './components/MeetingHUD';
import MeetingSummaryModal from './components/MeetingSummaryModal';
import UnifiedInbox from './components/UnifiedInbox';
import SmartReplyBar from './components/SmartReplyBar';
import DndToggleWidget from './components/DndToggleWidget';

import SecretaryBrainHUD from './components/SecretaryBrainHUD';
import AuditLogModal from './components/AuditLogModal';
import VoiceOnboardingModal from './components/VoiceOnboardingModal';
import AdminDashboard from './components/AdminDashboard';
import VoiceStudioPanel from './components/VoiceStudioPanel';
import LatencyDebugPanel from './components/LatencyDebugPanel';
import { streamingClient } from './services/streamingClient';

import { socketService } from './services/socketService';
import { audioService } from './services/audioService';
import { speechService } from './services/speechService';
import { wakeWordService } from './services/wakeWordService';
import { audioPlaybackService } from './services/audioPlaybackService';
import { useVoiceStore } from './stores/voiceStore';

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState('idle');
  
  const [timers, setTimers] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activeDraft, setActiveDraft] = useState(null);

  // Meeting Intelligence state
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [meetingSummary, setMeetingSummary] = useState(null);

  // Unified Communication state
  const [showUnifiedInbox, setShowUnifiedInbox] = useState(false);
  const [smartReplies, setSmartReplies] = useState([
    { label: "Yes, see you at 7!", text: "Yes, see you at 7!" },
    { label: "Can we push by 15 mins?", text: "Can we push by 15 minutes?" },
    { label: "I am running slightly late.", text: "I am running slightly behind schedule, will arrive shortly." }
  ]);

  // Voice Studio Store State
  const { activeVoice, fetchVoices } = useVoiceStore();

  // Modals state
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showVoiceStudio, setShowVoiceStudio] = useState(false);
  const [showLatencyPanel, setShowLatencyPanel] = useState(false);

  // Settings state
  const [wakeWord, setWakeWord] = useState('hey friday');
  const [personality, setPersonality] = useState('professional');
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);

  // Global Keyboard Shortcuts (`V` -> Voice Studio, `L` -> Latency Telemetry HUD)
  useEffect(() => {
    fetchVoices();

    const handleKeyDown = (e) => {
      if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        if (e.key === 'v' || e.key === 'V') {
          setShowVoiceStudio(prev => !prev);
        } else if (e.key === 'l' || e.key === 'L') {
          setShowLatencyPanel(prev => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. Initialize WebSocket & Speech Services
  useEffect(() => {
    socketService.connect('ws://localhost:3001');

    socketService.on('connection_change', (connected) => {
      setIsConnected(connected);
    });

    socketService.on('RESPONSE', (data) => {
      setStatus('speaking');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.text,
          intent: data.intent,
          latency_ms: data.latency_ms,
          timestamp: data.timestamp
        }
      ]);

      if (data.alerts && data.alerts.length > 0) {
        setAlerts(data.alerts);
      }

      if (data.intent === 'SET_TIMER' && data.actionPayload) {
        setTimers((prev) => [...prev, data.actionPayload]);
      } else if (data.intent === 'SET_REMINDER' && data.actionPayload) {
        setReminders((prev) => [...prev, data.actionPayload]);
      } else if (data.intent === 'GMAIL_DRAFT' && data.actionPayload?.draft) {
        setActiveDraft(data.actionPayload.draft);
      } else if (data.intent === 'MEETING_START' && data.actionPayload?.meeting) {
        setActiveMeeting(data.actionPayload.meeting);
      } else if (data.intent === 'MEETING_STOP' && data.actionPayload?.meeting) {
        setActiveMeeting(null);
        setMeetingSummary(data.actionPayload);
      }

      // Synthesize Speech with Raw Binary Audio Stream / Web Audio API
      if (data.audioStreamUrl) {
        audioPlaybackService.playStreamUrl(data.audioStreamUrl, data.text, data.activeVoice?.id, { speed, pitch, personality });
      } else {
        audioPlaybackService.playRawAudio(data.text, data.activeVoice?.id, { speed, pitch, personality });
      }
    });

    socketService.on('PLAY_AUDIO', (data) => {
      if (data.audioStreamUrl) {
        audioPlaybackService.playStreamUrl(data.audioStreamUrl, data.text, data.voiceId, { speed, pitch, personality });
      } else if (data.text) {
        audioPlaybackService.playRawAudio(data.text, data.voiceId, { speed, pitch, personality });
      }
    });

    socketService.on('TTS_ABORTED', () => {
      audioPlaybackService.stop();
      setStatus('idle');
      setIsSpeaking(false);
    });

    speechService.onResult(({ text, hasWakeWord }) => {
      if (hasWakeWord || isListening) {
        handleSendCommand(text);
      }
    });

    speechService.onStateChange(({ isListening: listening, isSpeaking: speaking }) => {
      setIsListening(listening);
      setIsSpeaking(speaking);
      if (speaking) setStatus('speaking');
      else if (listening) setStatus('listening');
      else setStatus('idle');
    });

    wakeWordService.onWakeWord(({ source }) => {
      console.log(`[WakeWord] Triggered via ${source}`);
      audioService.initMicrophone();
      speechService.startListening();
    });

    fetch('/api/conversations')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setMessages(data.data);
        }
      })
      .catch((err) => console.log('Fetch history fallback:', err));

    return () => {
      speechService.stopListening();
    };
  }, [speed, pitch, personality]);

  const handleSendCommand = (text) => {
    if (!text.trim()) return;

    setStatus('processing');
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: text, timestamp: Date.now() }
    ]);

    socketService.sendCommand(text);
  };

  const handleStopSpeech = () => {
    speechService.stopSpeaking('User clicked stop button');
    socketService.sendBargeIn('Manual Stop Button');
    setStatus('idle');
  };

  const toggleListening = async () => {
    if (isListening) {
      speechService.stopListening();
    } else {
      await audioService.initMicrophone();
      speechService.startListening();
    }
  };

  const handleConfirmSendDraft = async (draftId) => {
    const res = await fetch('/api/workspace/drafts/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draftId })
    });
    const json = await res.json();
    if (json.success) {
      handleSendCommand('send it');
    }
  };

  const handleStartAmbientMeeting = async () => {
    handleSendCommand('start ambient meeting minutes');
  };

  const handleStopActiveMeeting = async () => {
    handleSendCommand('end meeting');
  };

  const handleFlagBookmark = async () => {
    handleSendCommand('FRIDAY flag that');
  };

  const handleExportPDF = async (meetingId) => {
    const res = await fetch(`/api/meetings/${meetingId}/export`);
    const json = await res.json();
    if (json.success) {
      alert(`Meeting minutes exported cleanly to file: ${json.filename}`);
    }
  };

  return (
    <div className="app-container">
      {/* Header Bar */}
      <header className="hud-header">
        <div className="brand-title">
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'radial-gradient(circle, var(--color-cyan) 0%, rgba(0,243,255,0.2) 70%)',
            boxShadow: '0 0 15px var(--color-cyan)'
          }} />
          <h1>F.R.I.D.A.Y.</h1>
          <span className="brand-tag">VOICE STUDIO ENHANCED v5.1</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <DndToggleWidget onToggleDND={(enabled) => {
            handleSendCommand(enabled ? 'Enable Do Not Disturb: Only interrupt for emergencies' : 'Turn off DND');
          }} />

          <button className="hud-btn active" onClick={() => setShowVoiceStudio(true)} title="Voice Studio (Press 'V')">
            <Volume2 size={15} /> Voice Studio {activeVoice ? `(${activeVoice.name.split(' ')[0]})` : ''}
          </button>

          <button className="hud-btn" onClick={() => setShowLatencyPanel(true)} title="Streaming Latency Telemetry (Press 'L')">
            <Activity size={15} color="#00f3ff" /> Telemetry
          </button>

          <button className="hud-btn" onClick={() => setShowOnboarding(true)} title="5-Minute Setup">
            <Sparkles size={15} /> Setup
          </button>

          <button className="hud-btn" onClick={() => setShowAuditLog(true)} title="Security Audit Log">
            <Lock size={15} /> Audit
          </button>

          <button className="hud-btn" onClick={() => setShowAdmin(true)} title="Admin Dashboard">
            <Activity size={15} /> Admin
          </button>

          <button className="hud-btn" onClick={() => setShowUnifiedInbox(true)}>
            <MessageSquare size={15} /> Inbox
          </button>

          <button className="hud-btn" onClick={() => setShowPrivacy(true)}>
            <Shield size={15} /> Privacy
          </button>

          <button className="hud-btn" onClick={() => setShowSettings(true)}>
            <Settings size={15} /> Settings
          </button>
        </div>
      </header>

      {/* Active Timer Overlay */}
      <TimerOverlay timers={timers} reminders={reminders} />

      {/* Proactive Meeting Alert */}
      {alerts.map((alert) => (
        <div key={alert.id} style={{
          position: 'fixed',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 243, 255, 0.95)',
          color: '#050811',
          padding: '12px 20px',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 0 30px var(--color-cyan)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontFamily: 'var(--font-hud)',
          fontSize: '0.85rem'
        }}>
          <Bell size={18} />
          <span>{alert.message}</span>
          <button
            onClick={() => handleSendCommand(`start meeting ${alert.title}`)}
            style={{
              background: '#050811',
              color: 'var(--color-cyan)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Video size={14} /> Join & Record Meeting
          </button>
          <button
            onClick={() => setAlerts([])}
            style={{ background: 'none', border: 'none', color: '#050811', cursor: 'pointer', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      ))}

      {/* Main 2-Column Content */}
      <div className="main-content">
        {/* Left Column: Visualizer, Secretary Brain & Workspace Widget */}
        <div className="hud-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <Visualizer status={status} isListening={isListening} isSpeaking={isSpeaking} />

          <div style={{ padding: '0 24px 10px', display: 'flex', justifyContent: 'center', gap: 12 }}>
            <button
              className={`hud-btn ${isListening ? 'active' : ''}`}
              onClick={toggleListening}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              {isListening ? <Mic size={18} /> : <MicOff size={18} />}
              {isListening ? 'Listening (VAD Active)' : 'Activate Voice Mic'}
            </button>

            {isSpeaking && (
              <button className="hud-btn danger" onClick={handleStopSpeech}>
                <Square size={18} /> Barge-In Stop
              </button>
            )}
          </div>

          {/* Secretary Brain Proactive Suggestions */}
          <SecretaryBrainHUD onSendCommand={handleSendCommand} />

          <WorkspaceWidget
            onRunBriefing={() => handleSendCommand('Run morning daily briefing')}
            onSendCommand={handleSendCommand}
            onStartAmbientMeeting={handleStartAmbientMeeting}
            onOpenUnifiedInbox={() => setShowUnifiedInbox(true)}
          />

          <SmartReplyBar
            suggestions={smartReplies}
            onSelectReply={(text) => handleSendCommand(text)}
          />

          <CommandBar
            onSendCommand={handleSendCommand}
            onStop={handleStopSpeech}
            isListening={isListening}
            isSpeaking={isSpeaking}
          />
        </div>

        {/* Right Column: Voice Dialog Transcript Feed */}
        <div className="hud-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-glass)',
            fontFamily: 'var(--font-hud)',
            fontSize: '0.9rem',
            color: 'var(--color-cyan)',
            letterSpacing: '1px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>TACTICAL VOICE LOG</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Active Voice: {activeVoice?.name || 'F.R.I.D.A.Y. Pro'}
            </span>
          </div>

          <ChatInterface messages={messages} />
        </div>
      </div>

      {/* Voice Studio Modal */}
      <VoiceStudioPanel
        isOpen={showVoiceStudio}
        onClose={() => setShowVoiceStudio(false)}
      />

      {/* Privacy Dashboard Modal */}
      <PrivacyDashboard isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        wakeWord={wakeWord}
        onUpdateWakeWord={(w) => {
          setWakeWord(w);
          wakeWordService.setWakeWord(w);
        }}
        personality={personality}
        onUpdatePersonality={(p) => {
          setPersonality(p);
          socketService.updatePreferences({ personality: p });
        }}
        speed={speed}
        onUpdateSpeed={(s) => {
          setSpeed(s);
          socketService.updatePreferences({ speed: s });
        }}
        pitch={pitch}
        onUpdatePitch={(p) => {
          setPitch(p);
          socketService.updatePreferences({ pitch: p });
        }}
      />

      {/* Unified Inbox Modal */}
      <UnifiedInbox
        isOpen={showUnifiedInbox}
        onClose={() => setShowUnifiedInbox(false)}
        onSendCommand={handleSendCommand}
      />

      {/* Security Audit Log Modal */}
      <AuditLogModal
        isOpen={showAuditLog}
        onClose={() => setShowAuditLog(false)}
      />

      {/* Voice Onboarding Modal */}
      <VoiceOnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onCompleteOnboarding={() => handleSendCommand('Run morning briefing 2.0')}
      />

      {/* Admin Dashboard Modal */}
      <AdminDashboard
        isOpen={showAdmin}
        onClose={() => setShowAdmin(false)}
      />

      {/* Draft Approval Modal */}
      <DraftApprovalModal
        draft={activeDraft}
        onClose={() => setActiveDraft(null)}
        onConfirmSend={handleConfirmSendDraft}
      />

      {/* Active Meeting Recording HUD */}
      <MeetingHUD
        activeMeeting={activeMeeting}
        onFlagBookmark={handleFlagBookmark}
        onStopMeeting={handleStopActiveMeeting}
      />

      {/* Post-Meeting Summary Modal */}
      <MeetingSummaryModal
        summaryData={meetingSummary}
        meetingInfo={meetingSummary?.meeting}
        onClose={() => setMeetingSummary(null)}
        onExportPDF={handleExportPDF}
      />

      {/* Latency Telemetry Debug HUD Modal */}
      <LatencyDebugPanel
        isOpen={showLatencyPanel}
        onClose={() => setShowLatencyPanel(false)}
      />
    </div>
  );
}
