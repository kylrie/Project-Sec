import React, { useState, useEffect } from 'react';
import { Shield, Trash2, X, Database, RefreshCw, HardDrive } from 'lucide-react';

export default function PrivacyDashboard({ isOpen, onClose }) {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [purgedMessage, setPurgedMessage] = useState('');

  const fetchPrivacyData = async () => {
    setLoading(true);
    try {
      const statsRes = await fetch('/api/privacy/stats');
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.stats);

      const logsRes = await fetch('/api/conversations');
      const logsData = await logsRes.json();
      if (logsData.success) setLogs(logsData.data || []);
    } catch (err) {
      console.error('Privacy fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPrivacyData();
    }
  }, [isOpen]);

  const handlePurgeAll = async () => {
    if (!window.confirm('CAUTION: Are you sure you want to purge all local voice memory, timers, and conversation logs? This action is irreversible.')) {
      return;
    }

    try {
      const res = await fetch('/api/privacy/purge', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPurgedMessage('All local database records successfully wiped.');
        fetchPrivacyData();
      }
    } catch (err) {
      console.error('Purge error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h2><Shield size={20} /> Privacy Dashboard & Local Data Audit</h2>
          <button className="hud-btn" onClick={onClose} style={{ padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {purgedMessage && (
            <div style={{
              background: 'rgba(0, 255, 170, 0.15)',
              border: '1px solid var(--color-green)',
              color: 'var(--color-green)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem'
            }}>
              ✓ {purgedMessage}
            </div>
          )}

          {/* Local Storage Telemetry Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div style={{
              background: 'rgba(0, 243, 255, 0.05)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px',
              textAlign: 'center'
            }}>
              <Database size={20} style={{ color: 'var(--color-cyan)', marginBottom: 4 }} />
              <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-hud)' }}>
                {stats ? stats.total_messages : 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stored Logs</div>
            </div>

            <div style={{
              background: 'rgba(255, 183, 0, 0.05)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px',
              textAlign: 'center'
            }}>
              <HardDrive size={20} style={{ color: 'var(--color-amber)', marginBottom: 4 }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                7-Day Rolling
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auto Retention</div>
            </div>

            <div style={{
              background: 'rgba(0, 119, 255, 0.05)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px',
              textAlign: 'center'
            }}>
              <Shield size={20} style={{ color: '#60a5fa', marginBottom: 4 }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                Local SQLite
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>100% On-Device</div>
            </div>
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Audit raw records stored in <code style={{ color: 'var(--color-cyan)' }}>friday.db</code>:
            </span>
            <button className="hud-btn danger" onClick={handlePurgeAll}>
              <Trash2 size={16} /> Purge All Memory
            </button>
          </div>

          {/* Raw Log Table */}
          <div style={{
            background: 'rgba(5, 8, 17, 0.9)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-sm)',
            maxHeight: '260px',
            overflowY: 'auto'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
              <thead>
                <tr style={{ background: 'rgba(0, 243, 255, 0.1)', color: 'var(--color-cyan)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px' }}>ID</th>
                  <th style={{ padding: '8px 12px' }}>Timestamp</th>
                  <th style={{ padding: '8px 12px' }}>Role</th>
                  <th style={{ padding: '8px 12px' }}>Intent</th>
                  <th style={{ padding: '8px 12px' }}>Content</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: 'var(--text-dim)' }}>
                      No records logged. Privacy engine zero state clean.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '6px 12px', color: 'var(--text-dim)' }}>{log.id}</td>
                      <td style={{ padding: '6px 12px', color: 'var(--text-muted)' }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td style={{ padding: '6px 12px', color: log.role === 'user' ? '#60a5fa' : 'var(--color-cyan)' }}>
                        {log.role}
                      </td>
                      <td style={{ padding: '6px 12px' }}>{log.intent || '-'}</td>
                      <td style={{ padding: '6px 12px', color: '#e2e8f0' }}>{log.content}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
