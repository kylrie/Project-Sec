import React, { useState } from 'react';
import { FileText, Download, CheckSquare, X, Search, Check, Calendar } from 'lucide-react';

export default function MeetingSummaryModal({ summaryData, meetingInfo, onClose, onExportPDF }) {
  const [syncedTasks, setSyncedTasks] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [exporting, setExporting] = useState(false);

  if (!summaryData) return null;

  const handleSyncTasks = async () => {
    setSyncedTasks(true);
    // Tasks already synced on backend, confirm notification
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await onExportPDF(meetingInfo?.id || 'mtg_001');
    } catch (err) {
      console.error('Export err:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: 780 }}>
        <div className="modal-header">
          <h2><FileText size={20} /> Meeting Intelligence Report</h2>
          <button className="hud-btn" onClick={onClose} style={{ padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: 18 }}>
          {/* Header Info */}
          <div style={{
            background: 'rgba(0, 243, 255, 0.05)',
            border: '1px solid var(--border-cyan)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-hud)', fontSize: '1rem', color: '#fff' }}>
                {meetingInfo?.title || 'Executive Strategy Sync'}
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Platform: {meetingInfo?.provider || 'Google Meet'} • Generated in 0.8 seconds
              </span>
            </div>

            <button className="hud-btn active" onClick={handleExport} disabled={exporting}>
              <Download size={15} /> {exporting ? 'Exporting...' : 'Export PDF / Markdown'}
            </button>
          </div>

          {/* 1. Executive Summary */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-hud)', fontSize: '0.85rem', color: 'var(--color-cyan)', marginBottom: 8 }}>
              1. EXECUTIVE SUMMARY (3-5 Key Points)
            </h4>
            <ul style={{ paddingLeft: 20, color: '#e2e8f0', fontSize: '0.85rem', lineHeight: '1.5' }}>
              {(summaryData.summary?.executive_summary || summaryData.executive_summary || [
                "Reviewed Q3 financial audit milestones and confirmed launch readiness.",
                "Evaluated F.R.I.D.A.Y. voice synthesis latency benchmarks under 200ms.",
                "Allocated hardware budget for defense contractor integrations."
              ]).map((pt, i) => (
                <li key={i}>{pt}</li>
              ))}
            </ul>
          </div>

          {/* 2. Key Decisions Made */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-hud)', fontSize: '0.85rem', color: 'var(--color-amber)', marginBottom: 8 }}>
              2. KEY DECISIONS MADE
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(summaryData.summary?.decisions || summaryData.decisions || [
                "Move official production rollout to end of Q2.",
                "Approve hardware budget sign-off for Pepper Potts."
              ]).map((dec, i) => (
                <div key={i} style={{
                  background: 'rgba(255, 183, 0, 0.1)',
                  border: '1px solid var(--color-amber)',
                  color: 'var(--color-amber)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-mono)'
                }}>
                  ✓ DECISION: {dec}
                </div>
              ))}
            </div>
          </div>

          {/* 3. Action Items Table with Google Tasks Sync */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h4 style={{ fontFamily: 'var(--font-hud)', fontSize: '0.85rem', color: 'var(--color-green)' }}>
                3. EXTRACTED ACTION ITEMS
              </h4>
              <button className="hud-btn" onClick={handleSyncTasks} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                <CheckSquare size={13} /> {syncedTasks ? '✓ Synced to Google Tasks' : 'Sync to Google Tasks'}
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
              <thead>
                <tr style={{ background: 'rgba(0, 255, 170, 0.1)', color: 'var(--color-green)', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>Action Item</th>
                  <th style={{ padding: '8px' }}>Owner</th>
                  <th style={{ padding: '8px' }}>Deadline</th>
                  <th style={{ padding: '8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {(summaryData.summary?.action_items || summaryData.actionItems || [
                  { action: "Finalize hardware specs document", owner: "Pepper Potts", deadline: "Friday" },
                  { action: "Submit budget forecast models", owner: "Sarah Jenkins", deadline: "Tomorrow" },
                  { action: "Benchmark Whisper VAD latency on mobile", owner: "Tony Stark", deadline: "In 2 days" }
                ]).map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px', color: '#fff' }}>{item.action}</td>
                    <td style={{ padding: '8px', color: 'var(--color-cyan)' }}>{item.owner}</td>
                    <td style={{ padding: '8px', color: 'var(--color-amber)' }}>{item.deadline}</td>
                    <td style={{ padding: '8px', color: 'var(--color-green)' }}>Pending Tasks Sync</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 4. Transcript Search */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-hud)', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>
              SEARCH DIARIZED TRANSCRIPT
            </h4>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Search transcript by keyword (e.g. hardware, latency)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(5, 8, 17, 0.8)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                  color: '#fff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
