import React, { useState, useEffect } from 'react';
import API from '../services/api';
import Modal from '../components/Common/Modal';
import ScheduleTimeline from '../components/ScheduleTimeline';
import { useAuth } from '../context/AuthContext';
import { Plus, CalendarClock, AlertTriangle, Eye, Clock, CheckCircle } from 'lucide-react';

const Surgeries = () => {
  const { isAdmin } = useAuth();
  const [surgeries, setSurgeries] = useState([]);
  const [ors, setOrs] = useState([]);
  const [patients, setPatients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedSurgery, setSelectedSurgery] = useState(null);

  // Form State (New Schedule)
  const [formData, setFormData] = useState({
    patientId: '',
    surgeryType: '',
    orId: 'OR-01',
    doctorId: 'STF-101',
    preferredDate: new Date().toISOString().split('T')[0],
    preferredTime: '10:00',
    duration: 60,
    notes: ''
  });

  // Reschedule Form State
  const [rescheduleData, setRescheduleData] = useState({
    orId: '',
    doctorId: '',
    date: '',
    time: '',
    duration: 60,
    notes: ''
  });

  const [conflictError, setConflictError] = useState('');

  useEffect(() => {
    fetchSurgeries();
    fetchORs();
    fetchPatients();
    fetchStaff();
  }, []);

  const fetchSurgeries = async () => {
    try {
      const res = await API.get('/surgeries');
      if (res.data.success) {
        setSurgeries(res.data.surgeries);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchORs = async () => {
    try {
      const res = await API.get('/ors');
      if (res.data.success) setOrs(res.data.operatingRooms || res.data.ors || []);
    } catch (err) { console.error(err); }
  };

  const fetchPatients = async () => {
    try {
      const res = await API.get('/patients');
      if (res.data.success) setPatients(res.data.patients || []);
    } catch (err) { console.error(err); }
  };

  const fetchStaff = async () => {
    try {
      const res = await API.get('/staff?role=Surgeon');
      if (res.data.success) setStaff(res.data.staff || []);
    } catch (err) { console.error(err); }
  };

  // Submit New Schedule
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setConflictError('');

    if (!formData.patientId || !formData.orId || !formData.doctorId || !formData.preferredDate || !formData.preferredTime) {
      alert('Please fill out all required fields.');
      return;
    }

    const startDateTime = `${formData.preferredDate}T${formData.preferredTime}:00`;
    const selectedPatient = patients.find(p => p.patientId === formData.patientId);
    const selectedDoctor = staff.find(s => s.staffId === formData.doctorId);

    try {
      const res = await API.post('/surgeries', {
        patientId: formData.patientId,
        patientName: selectedPatient?.name || 'Patient',
        surgeryType: formData.surgeryType,
        orId: formData.orId,
        doctorId: formData.doctorId,
        doctorName: selectedDoctor?.name || formData.doctorId,
        startTime: startDateTime,
        duration: Number(formData.duration) || 60,
        priority: selectedPatient?.priority || 4,
        notes: formData.notes
      });

      if (res.data.success) {
        setIsScheduleModalOpen(false);
        setFormData({
          patientId: '',
          surgeryType: '',
          orId: 'OR-01',
          doctorId: 'STF-101',
          preferredDate: new Date().toISOString().split('T')[0],
          preferredTime: '10:00',
          duration: 60,
          notes: ''
        });
        fetchSurgeries();
        fetchORs();
      }
    } catch (err) {
      if (err.response?.data?.message) {
        setConflictError(err.response.data.message);
      } else {
        setConflictError(err.message || 'Unable to schedule surgery.');
      }
    }
  };

  // Open Reschedule Modal
  const handleOpenReschedule = (surg) => {
    setSelectedSurgery(surg);
    setConflictError('');

    const stDate = new Date(surg.startTime);
    const dateStr = stDate.toISOString().split('T')[0];
    const timeStr = stDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    setRescheduleData({
      orId: surg.orId,
      doctorId: surg.doctorId,
      date: dateStr,
      time: timeStr,
      duration: surg.duration || 60,
      notes: surg.notes || ''
    });

    setIsRescheduleModalOpen(true);
  };

  // Submit Reschedule
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    setConflictError('');

    if (!selectedSurgery) return;

    const startDateTime = `${rescheduleData.date}T${rescheduleData.time}:00`;
    const selectedDoctor = staff.find(s => s.staffId === rescheduleData.doctorId);

    try {
      const res = await API.put(`/surgeries/${selectedSurgery.surgeryId}`, {
        orId: rescheduleData.orId,
        doctorId: rescheduleData.doctorId,
        doctorName: selectedDoctor?.name || selectedSurgery.doctorName,
        startTime: startDateTime,
        duration: Number(rescheduleData.duration) || 60,
        notes: rescheduleData.notes
      });

      if (res.data.success) {
        setIsRescheduleModalOpen(false);
        setSelectedSurgery(null);
        fetchSurgeries();
        fetchORs();
      }
    } catch (err) {
      if (err.response?.data?.message) {
        setConflictError(err.response.data.message);
      } else {
        setConflictError(err.message || 'Unable to reschedule surgery.');
      }
    }
  };

  // Cancel Surgery
  const handleCancelSurgery = async (surg) => {
    if (!window.confirm(`Cancel surgery ${surg.surgeryId} for ${surg.patientName}?`)) return;
    try {
      const res = await API.delete(`/surgeries/${surg.surgeryId}`);
      if (res.data.success) {
        fetchSurgeries();
        fetchORs();
      }
    } catch (err) {
      alert('Error cancelling surgery: ' + (err.response?.data?.message || err.message));
    }
  };

  // Open Details Modal
  const handleViewDetails = (surg) => {
    setSelectedSurgery(surg);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Surgery Scheduling & OR Timelines</h1>
          <p className="page-subtitle">Surgical procedures, operating room timelines, and schedule conflict prevention.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setConflictError(''); setIsScheduleModalOpen(true); }}>
          <Plus size={18} /> Schedule Surgery
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>Loading Surgery Schedules...</div>
      ) : (
        <ScheduleTimeline
          surgeries={surgeries}
          ors={ors}
          onReschedule={isAdmin ? handleOpenReschedule : null}
          onCancel={isAdmin ? handleCancelSurgery : null}
          onViewDetails={handleViewDetails}
        />
      )}

      {/* Schedule Surgery Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule Surgery Procedure"
        maxWidth="700px"
      >
        <form onSubmit={handleScheduleSubmit} className="form-grid">
          {conflictError && (
            <div className="form-group full-width" style={{ background: 'var(--emergency-bg)', color: 'var(--emergency)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--emergency-border)', fontSize: '0.85rem' }}>
              <AlertTriangle size={18} /> <strong>Scheduling Conflict:</strong> {conflictError}
            </div>
          )}

          <div className="form-group full-width">
            <label className="form-label">Select Patient *</label>
            <select
              required
              value={formData.patientId}
              onChange={(e) => {
                const pId = e.target.value;
                const p = patients.find(pt => pt.patientId === pId);
                setFormData(prev => ({
                  ...prev,
                  patientId: pId,
                  surgeryType: p ? (p.surgeryType !== 'N/A' ? p.surgeryType : p.diagnosis) : prev.surgeryType
                }));
              }}
              className="form-control"
            >
              <option value="">-- Choose Patient --</option>
              {patients.map(p => (
                <option key={p.patientId} value={p.patientId}>
                  [{p.priorityLabel}] {p.name} ({p.patientId}) - Diagnosis: {p.diagnosis}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Surgery Type *</label>
            <input type="text" required value={formData.surgeryType} onChange={(e) => setFormData(p => ({ ...p, surgeryType: e.target.value }))} className="form-control" />
          </div>

          <div className="form-group">
            <label className="form-label">Assigned Surgeon *</label>
            <select value={formData.doctorId} onChange={(e) => setFormData(p => ({ ...p, doctorId: e.target.value }))} className="form-control">
              {staff.map(s => (
                <option key={s.staffId} value={s.staffId}>{s.name} ({s.department})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Operating Room *</label>
            <select value={formData.orId} onChange={(e) => setFormData(p => ({ ...p, orId: e.target.value }))} className="form-control">
              {ors.map(o => (
                <option key={o.orId} value={o.orId}>{o.orId} - {o.name} ({o.status})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Duration (Minutes)</label>
            <input type="number" value={formData.duration} onChange={(e) => setFormData(p => ({ ...p, duration: e.target.value }))} className="form-control" />
          </div>

          <div className="form-group">
            <label className="form-label">Preferred Date *</label>
            <input type="date" required value={formData.preferredDate} onChange={(e) => setFormData(p => ({ ...p, preferredDate: e.target.value }))} className="form-control" />
          </div>

          <div className="form-group">
            <label className="form-label">Preferred Time *</label>
            <input type="time" required value={formData.preferredTime} onChange={(e) => setFormData(p => ({ ...p, preferredTime: e.target.value }))} className="form-control" />
          </div>

          <div className="form-group full-width">
            <label className="form-label">Notes / Instructions</label>
            <input type="text" placeholder="Pre-op requirements or notes..." value={formData.notes} onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))} className="form-control" />
          </div>

          <div className="form-group full-width" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsScheduleModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Schedule Surgery</button>
          </div>
        </form>
      </Modal>

      {/* Reschedule Surgery Modal */}
      <Modal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        title={`Reschedule Surgery ${selectedSurgery?.surgeryId}`}
        maxWidth="650px"
      >
        <form onSubmit={handleRescheduleSubmit} className="form-grid">
          {conflictError && (
            <div className="form-group full-width" style={{ background: 'var(--emergency-bg)', color: 'var(--emergency)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--emergency-border)', fontSize: '0.85rem' }}>
              <AlertTriangle size={18} /> <strong>Conflict Warning:</strong> {conflictError}
            </div>
          )}

          <div className="form-group full-width" style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <div><strong>Patient:</strong> {selectedSurgery?.patientName} ({selectedSurgery?.patientId})</div>
            <div><strong>Procedure:</strong> {selectedSurgery?.surgeryType}</div>
          </div>

          <div className="form-group">
            <label className="form-label">Operating Room *</label>
            <select value={rescheduleData.orId} onChange={(e) => setRescheduleData(p => ({ ...p, orId: e.target.value }))} className="form-control">
              {ors.map(o => (
                <option key={o.orId} value={o.orId}>{o.orId} - {o.name} ({o.status})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Assigned Surgeon *</label>
            <select value={rescheduleData.doctorId} onChange={(e) => setRescheduleData(p => ({ ...p, doctorId: e.target.value }))} className="form-control">
              {staff.map(s => (
                <option key={s.staffId} value={s.staffId}>{s.name} ({s.department})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">New Date *</label>
            <input type="date" required value={rescheduleData.date} onChange={(e) => setRescheduleData(p => ({ ...p, date: e.target.value }))} className="form-control" />
          </div>

          <div className="form-group">
            <label className="form-label">New Time *</label>
            <input type="time" required value={rescheduleData.time} onChange={(e) => setRescheduleData(p => ({ ...p, time: e.target.value }))} className="form-control" />
          </div>

          <div className="form-group">
            <label className="form-label">Duration (Minutes)</label>
            <input type="number" value={rescheduleData.duration} onChange={(e) => setRescheduleData(p => ({ ...p, duration: e.target.value }))} className="form-control" />
          </div>

          <div className="form-group full-width" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsRescheduleModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Rescheduled Time</button>
          </div>
        </form>
      </Modal>

      {/* Surgery Details Modal */}
      {isDetailsModalOpen && selectedSurgery && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`Surgery Details — ${selectedSurgery.surgeryId}`}
          maxWidth="600px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>PATIENT</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selectedSurgery.patientName}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{selectedSurgery.patientId}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>SURGERY TYPE</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selectedSurgery.surgeryType}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedSurgery.department}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>SURGEON</div>
                <div style={{ fontWeight: 600 }}>{selectedSurgery.doctorName}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>OPERATING ROOM</div>
                <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{selectedSurgery.orId}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>SCHEDULED TIME</div>
                <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                  {new Date(selectedSurgery.startTime).toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>DURATION</div>
                <div style={{ fontWeight: 600 }}>{selectedSurgery.duration} Minutes</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>PRIORITY</div>
                <span className={`badge badge-${selectedSurgery.priorityLabel?.toLowerCase()}`}>
                  {selectedSurgery.priorityLabel || 'NORMAL'}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>STATUS</div>
                <span className={`badge badge-${selectedSurgery.status?.toLowerCase()}`}>
                  {selectedSurgery.status}
                </span>
              </div>
            </div>

            {selectedSurgery.notes && (
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>NOTES</div>
                <div style={{ fontSize: '0.85rem', background: '#fff', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                  {selectedSurgery.notes}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setIsDetailsModalOpen(false)}>Close</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Surgeries;
