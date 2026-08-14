import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, X, RefreshCw, Eye } from 'lucide-react';

export default function AuditLogModal({ isOpen, onClose }) {
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit');
      const json = await res.json();
      if (json.success) setAuditData(json);
    } catch (err) {
      console.warn('Audit logs fetch err:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchAuditLogs();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: 760 }}>
        <div className="modal-header">
          <h2><ShieldCheck size={20} /> Security Audit Log & E2E Encryption Status</h2>
          <button className="hud-btn" onClick={onClose} style={{ padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: 16 }}>
          {/* Encryption Badge Header */}
          <div style={{
            background: 'rgba(0, 255, 170, 0.08)',
            border: '1px solid var(--color-green)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={18} style={{ color: 'var(--color-green)' }} />
              <div>
                <strong style={{ color: '#fff', fontSize: '0.85rem' }}>E2E Encryption & Security Hardening Active</strong>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  User holds master cryptographic keys. Biometric lock gate active for sensitive actions.
                </p>
              </div>
            </div>
            <button className="hud-btn" onClick={fetchAuditLogs} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          {/* Audit Summary Card */}
          <div style={{ background: 'rgba(5, 8, 17, 0.8)', border: '1px solid var(--border-glass)', padding: 12, borderRadius: 'var(--radius-sm)' }}>
            <p style={{ fontSize: '0.85rem', color: '#e2e8f0', margin: 0 }}>
              {auditData?.summaryText || 'Loading daily audit summary...'}
            </p>
          </div>

          {/* Audit Logs Table */}
          <div style={{
            background: 'rgba(5, 8, 17, 0.9)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-sm)',
            maxHeight: '280px',
            overflowY: 'auto'
          }}>
            {!auditData?.logs || auditData.logs.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No recent security audit logs found.
              </div>
            ) : (
              auditData.logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <span className="intent-pill time" style={{ marginRight: 8, fontSize: '0.7rem' }}>
                      {log.action_type}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#fff' }}>{log.description}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
