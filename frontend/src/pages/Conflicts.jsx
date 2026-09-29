import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { AlertTriangle, CheckCircle, ArrowRight, ShieldAlert } from 'lucide-react';

const Conflicts = () => {
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConflicts();
  }, []);

  const fetchConflicts = async () => {
    try {
      const res = await API.get('/scheduling/conflicts');
      if (res.data.success) {
        setConflicts(res.data.conflicts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuggestion = async (conflict) => {
    try {
      // Auto reschedule the lower priority or later surgery
      const targetSurgery = conflict.surgeryB;
      const newStartTime = new Date(new Date(conflict.surgeryA.endTime).getTime() + 15 * 60 * 1000);

      const res = await API.put(`/surgeries/${targetSurgery.surgeryId}`, {
        startTime: newStartTime.toISOString(),
        duration: targetSurgery.duration
      });

      if (res.data.success) {
        alert(`Conflict resolved! Rescheduled ${targetSurgery.surgeryId} (${targetSurgery.patientName}) to ${newStartTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}.`);
        fetchConflicts();
      }
    } catch (err) {
      alert('Error resolving conflict: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={28} /> Scheduling Conflicts & Resolution
          </h1>
          <p className="page-subtitle">Automated interval overlap detection for double-booked ORs, surgeons, and maintenance windows.</p>
        </div>
        <button className="btn btn-primary" onClick={fetchConflicts}>
          🔄 Re-Scan Conflicts
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>Scanning Database for Schedule Overlaps...</div>
      ) : conflicts.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem', textAlign: 'center', background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
          <CheckCircle size={48} style={{ color: '#10b981', margin: '0 auto 1rem' }} />
          <h3 style={{ color: '#047857', fontSize: '1.25rem' }}>No Scheduling Conflicts Detected</h3>
          <p style={{ color: '#065f46', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            All Operating Rooms, surgeons, and patient surgery intervals are 100% non-overlapping and synchronized!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {conflicts.map((conflict, idx) => (
            <div key={idx} className="card" style={{ borderLeft: '5px solid #f59e0b', background: '#fffbeb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldAlert size={20} style={{ color: '#d97706' }} />
                  <h3 style={{ fontSize: '1.1rem', color: '#92400e' }}>
                    ⚠️ {conflict.type}: {conflict.resource}
                  </h3>
                </div>
                <span className="badge badge-medium">CONFLICT #{idx + 1}</span>
              </div>

              <p style={{ color: 'var(--text-main)', fontSize: '0.92rem', marginBottom: '0.85rem' }}>
                {conflict.message}
              </p>

              {/* Conflicting Surgeries details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid #fde68a' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Surgery A</div>
                  <div style={{ fontWeight: 700 }}>{conflict.surgeryA.surgeryType}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Patient: {conflict.surgeryA.patientName} | Doctor: {conflict.surgeryA.doctorName}
                  </div>
                  <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--primary)', marginTop: '0.2rem' }}>
                    {new Date(conflict.surgeryA.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(conflict.surgeryA.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                  </div>
                </div>

                <div style={{ background: '#ffffff', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid #fde68a' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Surgery B (Conflict Target)</div>
                  <div style={{ fontWeight: 700 }}>{conflict.surgeryB.surgeryType}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Patient: {conflict.surgeryB.patientName} | Doctor: {conflict.surgeryB.doctorName}
                  </div>
                  <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--emergency)', marginTop: '0.2rem' }}>
                    {new Date(conflict.surgeryB.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(conflict.surgeryB.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>

              {/* Resolution Proposal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid #fde68a' }}>
                <div style={{ fontSize: '0.85rem', color: '#92400e' }}>
                  💡 <strong>Suggested Solution:</strong> {conflict.suggestedAlternative}
                </div>
                <button
                  onClick={() => handleApplySuggestion(conflict)}
                  className="btn btn-warning btn-sm"
                >
                  Apply Auto-Suggestion <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Conflicts;
