import React, { useState } from 'react';
import { Mic, CheckCircle, ArrowRight, X, Shield, Sparkles } from 'lucide-react';

export default function VoiceOnboardingModal({ isOpen, onClose, onCompleteOnboarding }) {
  const [step, setStep] = useState(1);

  if (!isOpen) return null;

  const steps = [
    {
      title: "Welcome to F.R.I.D.A.Y.",
      desc: "Your autonomous AI voice secretary and executive communication manager. Setup takes under 5 minutes.",
      action: "Start Voice Setup"
    },
    {
      title: "Step 1: Wake Word Calibration",
      desc: 'Say "Hey FRIDAY" or press Ctrl+Shift+Space to activate F.R.I.D.A.Y. from anywhere.',
      action: "Test Wake Word"
    },
    {
      title: "Step 2: Connect Google Workspace",
      desc: "Grants OAuth permissions for Google Calendar, Gmail unread triage, and Google Tasks sync.",
      action: "Authorize Google OAuth"
    },
    {
      title: "Step 3: Multi-Channel Communication",
      desc: "Connect SMS, Viber, and Facebook Messenger for hands-free voice readouts and smart replies.",
      action: "Connect Channels"
    },
    {
      title: "Step 4: You're Ready, Boss!",
      desc: 'Try saying: "Run my morning briefing 2.0" or "Start meeting minutes". F.R.I.D.A.Y. is operational.',
      action: "Launch F.R.I.D.A.Y. HUD"
    }
  ];

  const currentStep = steps[step - 1];

  const handleNext = () => {
    if (step < steps.length) {
      setStep(step + 1);
    } else {
      if (onCompleteOnboarding) onCompleteOnboarding();
      onClose();
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h2><Sparkles size={20} style={{ color: 'var(--color-cyan)' }} /> Voice-Guided Onboarding Setup</h2>
          <button className="hud-btn" onClick={onClose} style={{ padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: 20, padding: '24px 0' }}>
          {/* Progress Indicator */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {steps.map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: 32,
                  height: 4,
                  borderRadius: 2,
                  background: idx + 1 <= step ? 'var(--color-cyan)' : 'rgba(255,255,255,0.1)',
                  boxShadow: idx + 1 === step ? '0 0 10px var(--color-cyan)' : 'none'
                }}
              />
            ))}
          </div>

          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'radial-gradient(circle, var(--color-cyan) 0%, rgba(0,243,255,0.1) 70%)',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px var(--color-cyan)'
            }}>
              <Mic size={28} style={{ color: '#050811' }} />
            </div>

            <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: 8 }}>
              {currentStep.title}
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', maxWidth: 440, margin: '0 auto 20px', lineHeight: 1.5 }}>
              {currentStep.desc}
            </p>

            <button
              className="hud-btn active"
              onClick={handleNext}
              style={{ padding: '10px 24px', fontSize: '0.9rem', margin: '0 auto' }}
            >
              {currentStep.action} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
