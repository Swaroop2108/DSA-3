import React, { useState, useEffect } from 'react';
import API from '../services/api';
import Modal from '../components/Common/Modal';
import { useAuth } from '../context/AuthContext';
import { Stethoscope, Plus, Calendar, Wrench, CheckCircle, Clock, Eye, AlertCircle } from 'lucide-react';

const OperatingRooms = () => {
  const { isAdmin } = useAuth();
  const [ors, setOrs] = useState([]);
  const [surgeries, setSurgeries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedOr, setSelectedOr] = useState(null);
  const [orSchedule, setOrSchedule] = useState([]);

  // Form State
  const [newOrData, setNewOrData] = useState({
    orId: '',
    name: '',
    department: 'General Surgery',
    equipment: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [orRes, surgRes] = await Promise.all([
        API.get('/ors'),
        API.get('/surgeries')
      ]);

      if (orRes.data.success) {
        setOrs(orRes.data.operatingRooms || orRes.data.ors || []);
      }
      if (surgRes.data.success) {
        setSurgeries(surgRes.data.surgeries || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenScheduleModal = async (or) => {
    setSelectedOr(or);
    setIsScheduleModalOpen(true);
    try {
      const res = await API.get(`/ors/${or.orId}/schedule`);
      if (res.data.success) {
        setOrSchedule(res.data.schedule || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenDetailsModal = (or) => {
    setSelectedOr(or);
    setIsDetailsModalOpen(true);
  };

  const handleCreateOR = async (e) => {
    e.preventDefault();
    try {
      const equipmentArray = typeof newOrData.equipment === 'string'
        ? newOrData.equipment.split(',').map(s => s.trim()).filter(Boolean)
        : newOrData.equipment;

      const res = await API.post('/ors', {
        ...newOrData,
        equipment: equipmentArray
      });

      if (res.data.success) {
        setIsAddModalOpen(false);
        setNewOrData({ orId: '', name: '', department: 'General Surgery', equipment: '' });
        fetchData();
      }
    } catch (err) {
      alert('Error creating OR: ' + (err.response?.data?.message || err.message));
    }
  };

  const toggleStatus = async (or, newStatus) => {
    try {
      const res = await API.put(`/ors/${or.orId}`, { status: newStatus });
      if (res.data.success) {
        fetchData();
      }
    } catch (err) {
      alert('Status update failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const now = new Date().getTime();

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Operating Rooms (OR) Management</h1>
          <p className="page-subtitle">Surgical suite availability, specialized equipment tracking, and OR schedule management.</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={18} /> Add Operating Room
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>Loading Operating Rooms...</div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          {ors.map(room => {
            const roomSurgeries = surgeries.filter(s => s.orId === room.orId && s.status !== 'CANCELLED');
            
            // Find active surgery occurring right now
            const currentSurgery = roomSurgeries.find(s => {
              const sTime = new Date(s.startTime).getTime();
              const eTime = new Date(s.endTime).getTime();
              return now >= sTime && now <= eTime;
            }) || roomSurgeries.find(s => s.status === 'IN_PROGRESS');

            // Derived status if active surgery is running
            const computedStatus = room.status === 'MAINTENANCE' 
              ? 'MAINTENANCE' 
              : (currentSurgery ? 'OCCUPIED' : room.status);

            return (
              <div key={room._id || room.orId} className="card" style={{ borderTop: `4px solid ${computedStatus === 'AVAILABLE' ? 'var(--success)' : (computedStatus === 'OCCUPIED' ? 'var(--emergency)' : 'var(--medium)')}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {room.orId}
                    </div>
                    <h3 style={{ fontSize: '1.05rem', marginTop: '0.15rem' }}>{room.name}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{room.department}</div>
                  </div>
                  <span className={`badge ${computedStatus === 'AVAILABLE' ? 'badge-available' : (computedStatus === 'OCCUPIED' ? 'badge-occupied' : 'badge-maintenance')}`}>
                    {computedStatus}
                  </span>
                </div>

                {/* Current Surgery Status Banner */}
                {currentSurgery && (
                  <div style={{ background: 'var(--emergency-bg)', border: '1px solid var(--emergency-border)', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.82rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--emergency)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <AlertCircle size={15} /> Surgery In Progress
                    </div>
                    <div style={{ fontWeight: 600, marginTop: '0.2rem', color: 'var(--text-main)' }}>
                      {currentSurgery.surgeryType}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Patient: {currentSurgery.patientName} | Dr. {currentSurgery.doctorName}
                    </div>
                  </div>
                )}

                {/* Equipment list */}
                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.82rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    🛠️ Surgical Equipment:
                  </div>
                  <div style={{ color: 'var(--text-main)' }}>
                    {room.equipment && room.equipment.length > 0 ? room.equipment.join(', ') : 'Standard Surgical Suite'}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleOpenScheduleModal(room)}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                  >
                    <Calendar size={14} /> Schedule ({roomSurgeries.length})
                  </button>

                  <button
                    onClick={() => handleOpenDetailsModal(room)}
                    className="btn btn-outline btn-sm"
                    title="View OR Details"
                  >
                    <Eye size={14} />
                  </button>

                  {isAdmin && (
                    <select
                      value={room.status}
                      onChange={(e) => toggleStatus(room, e.target.value)}
                      className="form-control"
                      style={{ fontSize: '0.75rem', width: '130px' }}
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="OCCUPIED">OCCUPIED</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                    </select>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add OR Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Operating Room"
      >
        <form onSubmit={handleCreateOR} className="form-grid">
          <div className="form-group">
            <label className="form-label">OR ID *</label>
            <input type="text" required placeholder="e.g. OR-06" value={newOrData.orId} onChange={(e) => setNewOrData(p => ({ ...p, orId: e.target.value }))} className="form-control" />
          </div>

          <div className="form-group">
            <label className="form-label">Suite Name *</label>
            <input type="text" required placeholder="e.g. OR-06 Vascular Suite" value={newOrData.name} onChange={(e) => setNewOrData(p => ({ ...p, name: e.target.value }))} className="form-control" />
          </div>

          <div className="form-group">
            <label className="form-label">Department *</label>
            <select value={newOrData.department} onChange={(e) => setNewOrData(p => ({ ...p, department: e.target.value }))} className="form-control">
              <option value="General Surgery">General Surgery</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="Neurology">Neurology</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Equipment (comma separated)</label>
            <input type="text" placeholder="Laparoscopic Tower, Defibrillator" value={newOrData.equipment} onChange={(e) => setNewOrData(p => ({ ...p, equipment: e.target.value }))} className="form-control" />
          </div>

          <div className="form-group full-width" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Suite</button>
          </div>
        </form>
      </Modal>

      {/* Schedule Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title={`Schedule for ${selectedOr?.name} (${selectedOr?.orId})`}
        maxWidth="650px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {orSchedule.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No surgeries currently scheduled in this room.</p>
          ) : (
            orSchedule.map(surg => (
              <div key={surg._id || surg.surgeryId} style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{surg.surgeryType}</div>
                  <span className={`badge badge-${(surg.status || 'SCHEDULED').toLowerCase()}`}>{surg.status}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Patient: <strong>{surg.patientName}</strong> • Surgeon: {surg.doctorName}
                </div>
                <div style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: 'var(--primary)', marginTop: '0.35rem' }}>
                  {new Date(surg.startTime).toLocaleDateString()} | {new Date(surg.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(surg.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* OR Details Modal */}
      {isDetailsModalOpen && selectedOr && (
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          title={`Operating Room Details — ${selectedOr.orId}`}
          maxWidth="550px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{selectedOr.orId}</div>
              <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.1rem' }}>{selectedOr.name}</h3>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{selectedOr.department} Department</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>STATUS</div>
                <span className={`badge ${selectedOr.status === 'AVAILABLE' ? 'badge-available' : (selectedOr.status === 'OCCUPIED' ? 'badge-occupied' : 'badge-maintenance')}`}>
                  {selectedOr.status}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>TOTAL SCHEDULED</div>
                <div style={{ fontWeight: 700 }}>
                  {surgeries.filter(s => s.orId === selectedOr.orId && s.status !== 'CANCELLED').length} Surgeries
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>INSTALLED EQUIPMENT</div>
              <div style={{ fontSize: '0.85rem', background: '#fff', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }}>
                {selectedOr.equipment && selectedOr.equipment.length > 0 ? selectedOr.equipment.join(', ') : 'Standard Operating Room Setup'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setIsDetailsModalOpen(false)}>Close</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OperatingRooms;
