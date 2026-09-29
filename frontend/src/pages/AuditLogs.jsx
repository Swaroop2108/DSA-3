import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { resetStorage } from '../services/storage';
import { Activity, RefreshCw, RotateCcw, AlertTriangle } from 'lucide-react';
import Modal from '../components/Common/Modal';

const AuditLogs = () => {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await API.get('/audit/logs');
      if (res.data.success) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetData = () => {
    resetStorage();
    setShowResetModal(false);
    window.location.reload();
  };

  return (
    <div className="page-wrapper">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={28} style={{ color: 'var(--primary)' }} /> System Audit Logs & Administration
          </h1>
          <p className="page-subtitle">Immutable audit trail of user logins, resource allocations, and local demo data controls.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={fetchLogs}>
            <RefreshCw size={16} /> Refresh Logs
          </button>
          {isAdmin && (
            <button className="btn btn-emergency" onClick={() => setShowResetModal(true)} style={{ gap: '0.4rem' }}>
              <RotateCcw size={16} /> Reset Demo Data
            </button>
          )}
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Log ID</th>
              <th>Timestamp</th>
              <th>User & Role</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading Audit Logs...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No audit logs recorded yet.</td></tr>
            ) : (
              logs.map(log => (
                <tr key={log._id || log.logId}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.8rem', color: 'var(--primary)' }}>
                    {log.logId}
                  </td>
                  <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{log.user}</div>
                    <span className={`badge ${log.role?.toLowerCase() === 'admin' ? 'badge-emergency' : 'badge-available'}`} style={{ fontSize: '0.65rem' }}>
                      {log.role}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {log.action}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                    {log.entity}
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {log.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reset Demo Data Modal */}
      {showResetModal && (
        <Modal title="Reset Demo Data" onClose={() => setShowResetModal(false)}>
          <div style={{ padding: '0.5rem 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'var(--emergency)' }}>
              <AlertTriangle size={32} />
              <div>
                <h4 style={{ margin: 0, fontWeight: 700 }}>Reset all local demo data?</h4>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  This action will clear all modified patients, bed allocations, surgeries, and restore default baseline college demonstration data.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowResetModal(false)}>
                Cancel
              </button>
              <button className="btn btn-emergency" onClick={handleResetData}>
                Reset
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AuditLogs;
