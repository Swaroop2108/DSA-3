import React, { useState, useEffect } from 'react';
import API from '../services/api';
import Modal from '../components/Common/Modal';
import { AlertCircle, ShieldAlert, CheckCircle, Clock, CalendarClock } from 'lucide-react';

const EmergencyCenter = () => {
  const [emergencyPatients, setEmergencyPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Preemption Modal State
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [preemptionPlan, setPreemptionPlan] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [schedulingLoading, setSchedulingLoading] = useState(false);

  useEffect(() => {
    fetchEmergencyPatients();
  }, []);

  const fetchEmergencyPatients = async () => {
    try {
      const res = await API.get('/patients?priority=EMERGENCY');
      if (res.data.success) {
        setEmergencyPatients(res.data.patients);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateEmergencyPlan = async (patient) => {
    setSelectedPatient(patient);
    setSchedulingLoading(true);
    setIsModalOpen(true);

    try {
      const res = await API.post('/scheduling/emergency', {
        patientId: patient.patientId,
        patient: patient,
        duration: patient.expectedSurgeryDuration || 60,
        autoConfirm: false
      });

      if (res.data.success) {
        setPreemptionPlan(res.data.preemptionPlan || res.data);
      }
    } catch (err) {
      alert('Error calculating emergency slot: ' + (err.response?.data?.message || err.message));
    } finally {
      setSchedulingLoading(false);
    }
  };

  const handleConfirmEmergencySchedule = async () => {
    if (!selectedPatient) return;
    setSchedulingLoading(true);

    try {
      const res = await API.post('/scheduling/emergency', {
        patientId: selectedPatient.patientId,
        patient: selectedPatient,
        duration: selectedPatient.expectedSurgeryDuration || 60,
        autoConfirm: true
      });

      if (res.data.success) {
        setIsModalOpen(false);
        setSelectedPatient(null);
        setPreemptionPlan(null);
        fetchEmergencyPatients();
        alert('Emergency Surgery successfully scheduled and preemption updated!');
      }
    } catch (err) {
      alert('Error confirming emergency schedule: ' + (err.response?.data?.message || err.message));
    } finally {
      setSchedulingLoading(false);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return 'Information unavailable';
    const d = new Date(ts);
    return isNaN(d.getTime()) ? 'Information unavailable' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ color: 'var(--emergency)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={28} /> Emergency Cases & Preemption Center
          </h1>
          <p className="page-subtitle">Highest priority emergency scheduling engine with lower-priority preemption algorithms.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>Loading Emergency Center...</div>
      ) : emergencyPatients.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          🚨 No active emergency cases requiring urgent surgery.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '1.5rem'
        }}>
          {emergencyPatients.map(patient => (
            <div key={patient._id || patient.patientId} className="card" style={{ borderLeft: '5px solid var(--emergency)', background: 'var(--emergency-bg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {patient.name || 'Information unavailable'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {patient.patientId || 'N/A'} • {patient.age ? `${patient.age} Yrs` : 'N/A'} / {patient.gender || 'N/A'}
                  </div>
                </div>
                <span className="badge badge-emergency">URGENT (RANK 1)</span>
              </div>

              <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--emergency-border)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <div><strong>Diagnosis:</strong> {patient.diagnosis || 'Information unavailable'}</div>
                <div><strong>Required Surgery:</strong> {patient.surgeryType || 'Information unavailable'}</div>
                <div><strong>Expected Duration:</strong> {patient.expectedSurgeryDuration ? `${patient.expectedSurgeryDuration} Mins` : 'Information unavailable'}</div>
                <div><strong>Current Bed:</strong> {patient.bedId || 'Unassigned'}</div>
                <div><strong>Status:</strong> {patient.status || 'Information unavailable'}</div>
              </div>

              <button
                onClick={() => handleCalculateEmergencyPlan(patient)}
                className="btn btn-danger btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                🚨 Emergency Preemption Plan
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Preemption Confirmation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Emergency Preemption Plan for ${selectedPatient?.name || 'Patient'}`}
        maxWidth="680px"
      >
        {schedulingLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Calculating optimal OR slot and evaluating preemption candidates...</div>
        ) : preemptionPlan || selectedPatient ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
            
            {/* EMERGENCY CASE SUMMARY */}
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, color: 'var(--emergency)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.8rem' }}>
                🚨 Emergency Case Details
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                <div><strong>Patient:</strong> {selectedPatient?.name || 'Information unavailable'}</div>
                <div><strong>Priority:</strong> {selectedPatient?.priorityLabel || 'EMERGENCY'}</div>
                <div><strong>Required Surgery:</strong> {selectedPatient?.surgeryType || 'Information unavailable'}</div>
                <div><strong>Surgery Duration:</strong> {selectedPatient?.expectedSurgeryDuration ? `${selectedPatient.expectedSurgeryDuration} Mins` : (preemptionPlan?.duration ? `${preemptionPlan.duration} Mins` : 'Information unavailable')}</div>
                <div><strong>Assigned Doctor:</strong> {selectedPatient?.doctor || 'Information unavailable'}</div>
                <div><strong>Department:</strong> {selectedPatient?.department || 'Emergency'}</div>
                <div><strong>Current Bed:</strong> {selectedPatient?.bedId || 'Unassigned'}</div>
                <div><strong>Reason:</strong> Emergency case requires priority scheduling.</div>
              </div>
            </div>

            {/* PREEMPTION CONFLICT OR DIRECT SLOT DISPLAY */}
            {preemptionPlan?.preemptionRequired && preemptionPlan?.preemptedSurgery ? (
              <div style={{ background: 'var(--emergency-bg)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--emergency-border)' }}>
                <h4 style={{ color: 'var(--emergency)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1rem' }}>
                  <ShieldAlert size={18} /> Conflict Detected — Lower-Priority Preemption Action
                </h4>
                <p style={{ color: 'var(--text-main)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  Operating Room <strong>{preemptionPlan.preemptedSurgery.orId || 'OR-02'}</strong> is currently occupied by a lower-priority surgery. The preemption algorithm will reassign the OR to the emergency case and reschedule the conflicting surgery.
                </p>

                {/* CURRENT CONFLICT & PREEMPTION FLOW */}
                <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>⚠️ Currently Occupied Surgery:</div>
                  <div>• <strong>Existing Surgery:</strong> {preemptionPlan.preemptedSurgery.surgeryType || 'Scheduled Procedure'}</div>
                  <div>• <strong>Patient:</strong> {preemptionPlan.preemptedSurgery.patientName || 'Information unavailable'}</div>
                  <div>• <strong>Original Time:</strong> {formatTime(preemptionPlan.preemptedSurgery.originalStart)} – {formatTime(preemptionPlan.preemptedSurgery.originalEnd)}</div>
                  <div>• <strong>Priority:</strong> {preemptionPlan.preemptedSurgery.currentPriority || 'Normal'}</div>

                  <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '0.5rem', marginTop: '0.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                    🔄 Proposed Preemption Action:
                  </div>
                  <div>• Move <strong>{preemptionPlan.preemptedSurgery.patientName || 'Existing Patient'}</strong> to <strong>{preemptionPlan.preemptedSurgery.orId || 'OR-02'}</strong> at new time: <strong>{formatTime(preemptionPlan.preemptedSurgery.proposedNewStart)} – {formatTime(preemptionPlan.preemptedSurgery.proposedNewEnd)}</strong></div>
                  <div>• Assign <strong>{selectedPatient?.name || 'Emergency Patient'}</strong> to <strong>{preemptionPlan.emergencySlot?.orId || preemptionPlan.preemptedSurgery.orId || 'OR-02'}</strong> immediately ({formatTime(preemptionPlan.emergencySlot?.startTime)} – {formatTime(preemptionPlan.emergencySlot?.endTime)}).</div>
                </div>
              </div>
            ) : (
              <div style={{ background: 'var(--success-bg)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid #a7f3d0' }}>
                <h4 style={{ color: '#047857', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1rem' }}>
                  <CheckCircle size={18} /> Direct Slot Available — No Preemption Required
                </h4>
                <div style={{ fontSize: '0.85rem', color: '#065f46' }}>
                  <div><strong>Suggested OR:</strong> {preemptionPlan?.recommendedSlot?.orName || preemptionPlan?.recommendedSlot?.orId || preemptionPlan?.emergencySlot?.orId || 'OR-05'}</div>
                  <div><strong>Suggested Time:</strong> {formatTime(preemptionPlan?.recommendedSlot?.startTime || preemptionPlan?.emergencySlot?.startTime)} – {formatTime(preemptionPlan?.recommendedSlot?.endTime || preemptionPlan?.emergencySlot?.endTime)}</div>
                  <div style={{ marginTop: '0.35rem', fontWeight: 600 }}>Status: No preemption required. Direct OR slot available for immediate allocation.</div>
                </div>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={handleConfirmEmergencySchedule}>
                Confirm & Execute Emergency Schedule
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Information unavailable</div>
        )}
      </Modal>
    </div>
  );
};


export default EmergencyCenter;
