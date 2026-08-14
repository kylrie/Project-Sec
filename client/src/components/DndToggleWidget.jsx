import React, { useState } from 'react';
import { BellOff, Bell } from 'lucide-react';

export default function DndToggleWidget({ onToggleDND }) {
  const [dndActive, setDndActive] = useState(false);

  const handleToggle = async () => {
    const nextState = !dndActive;
    setDndActive(nextState);
    const res = await fetch('/api/comm/dnd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: nextState, mode: 'meeting' })
    });
    const json = await res.json();
    if (onToggleDND) onToggleDND(nextState, json);
  };

  return (
    <button
      className={`hud-btn ${dndActive ? 'danger' : ''}`}
      onClick={handleToggle}
      title={dndActive ? 'DND Active: Auto-responding during meetings' : 'Enable Do Not Disturb'}
      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
    >
      {dndActive ? <BellOff size={15} /> : <Bell size={15} />}
      {dndActive ? 'DND Active (Meeting Auto-Responder)' : 'DND Mode'}
    </button>
  );
}
