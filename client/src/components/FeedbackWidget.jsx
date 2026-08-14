import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';

export default function FeedbackWidget({ messageId }) {
  const [submitted, setSubmitted] = useState(false);

  const handleVote = async (rating) => {
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, rating })
      });
      setSubmitted(true);
    } catch (err) {
      console.warn('Feedback submit error:', err);
    }
  };

  if (submitted) {
    return (
      <span style={{ fontSize: '0.7rem', color: 'var(--color-green)', display: 'flex', alignItems: 'center', gap: 4 }}>
        <Check size={12} /> Feedback logged
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', items: 'center', gap: 6, opacity: 0.7 }}>
      <button
        onClick={() => handleVote('thumbs_up')}
        title="Helpful summary"
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
      >
        <ThumbsUp size={12} />
      </button>
      <button
        onClick={() => handleVote('thumbs_down')}
        title="Needs improvement"
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
      >
        <ThumbsDown size={12} />
      </button>
    </div>
  );
}
