import React, { useState, useEffect } from 'react';
import API from '../services/api';
import BedGrid from '../components/BedGrid';
import Modal from '../components/Common/Modal';
import { useAuth } from '../context/AuthContext';
import { Plus, BedDouble, CheckCircle, Wrench, Clock, ShieldAlert } from 'lucide-react';

const Beds = () => {
  const { isAdmin } = useAuth();
  const [beds, setBeds] = useState([]);
  const [waitingPatients, setWaitingPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [isAddBedModalOpen, setIsAddBedModalOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState('');

  // New Bed Form
  const [newBedData, setNewBedData] = useState({
    bedId: '',
    ward: 'ICU',
    floor: '1st Floor',
    type: 'ICU',
    equipment: ''
  });

  useEffect(() => {
    fetchBeds();
    fetchWaitingPatients();
  }, []);

  const fetchBeds = async () => {
    try {
      const res = await API.get('/beds');
      if (res.data.success) {
        setBeds(res.data.beds);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWaitingPatients = async () => {
    try {
      const res = await API.get('/patients?status=WAITING');
      if (res.data.success) {
        setWaitingPatients(res.data.patients);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAllocateModal = (bed) => {
    setSelectedBed(bed);
    setSelectedPatientId('');
    setIsAllocateModalOpen(true);
  };

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBed || !selectedPatientId) return;

    try {
      const res = await API.post(`/beds/${selectedBed.bedId}/allocate`, {
        patientId: selectedPatientId
      });
      if (res.data.success) {
        setIsAllocateModalOpen(false);
        setSelectedBed(null);
        fetchBeds();
        fetchWaitingPatients();
      }
    } catch (err) {
      alert('Allocation Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleReleaseBed = async (bed) => {
    if (!window.confirm(`Release bed ${bed.bedId}? Status will become AVAILABLE.`)) return;
    try {
      const res = await API.post(`/beds/${bed.bedId}/release`);
      if (res.data.success) {
        fetchBeds();
        fetchWaitingPatients();
      }
    } catch (err) {
      alert('Release Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleReserveBed = async (bed) => {
    try {
      const res = await API.post(`/beds/${bed.bedId}/reserve`);
      if (res.data.success) {
        fetchBeds();
      }
    } catch (err) {
      alert('Reserve Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleMarkMaintenance = async (bed) => {
    try {
      const res = await API.post(`/beds/${bed.bedId}/maintenance`);
      if (res.data.success) {
        fetchBeds();
      }
    } catch (err) {
      alert('Maintenance Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCreateBed = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/beds', newBedData);
      if (res.data.success) {
        setIsAddBedModalOpen(false);
        setNewBedData({ bedId: '', ward: 'ICU', floor: '1st Floor', type: 'ICU', equipment: '' });
        fetchBeds();
      }
    } catch (err) {
      alert('Error creating bed: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hospital Bed Management</h1>
          <p className="page-subtitle">Priority-based bed allocation across ICU, Emergency, General, and Private Wards.</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setIsAddBedModalOpen(true)}>
            <Plus size={18} /> Add New Bed
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>Loading Bed Inventory...</div>
      ) : (
        <BedGrid
          beds={beds}
          onAllocate={handleOpenAllocateModal}
          onRelease={handleReleaseBed}
          onReserve={handleReserveBed}
          onMaintenance={handleMarkMaintenance}
          isAdmin={isAdmin}
        />
      )}

      {/* Allocate Bed Modal */}
      <Modal
        isOpen={isAllocateModalOpen}
        onClose={() => setIsAllocateModalOpen(false)}
        title={`Allocate Bed ${selectedBed?.bedId} (${selectedBed?.ward} Ward)`}
      >
        <form onSubmit={handleAllocateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label className="form-label" style={{ marginBottom: '0.4rem', display: 'block' }}>
              Select Patient from Priority Queue *
            </label>
            <select
              required
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="form-control"
              style={{ width: '100%' }}
            >
              <option value="">-- Choose Patient --</option>
              {waitingPatients.map(p => (
                <option key={p.patientId} value={p.patientId}>
                  [{p.priorityLabel}] {p.name} ({p.patientId}) - Diagnosis: {p.diagnosis}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAllocateModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Allocate Bed Now</button>
          </div>
        </form>
      </Modal>

      {/* Add Bed Modal */}
      <Modal
        isOpen={isAddBedModalOpen}
        onClose={() => setIsAddBedModalOpen(false)}
        title="Add New Hospital Bed"
      >
        <form onSubmit={handleCreateBed} className="form-grid">
          <div className="form-group">
            <label className="form-label">Bed ID *</label>
            <input type="text" required placeholder="e.g. ICU-07" value={newBedData.bedId} onChange={(e) => setNewBedData(p => ({ ...p, bedId: e.target.value }))} className="form-control" />
          </div>

          <div className="form-group">
            <label className="form-label">Ward Category *</label>
            <select value={newBedData.ward} onChange={(e) => setNewBedData(p => ({ ...p, ward: e.target.value, type: e.target.value }))} className="form-control">
              <option value="ICU">ICU</option>
              <option value="EMERGENCY">EMERGENCY</option>
              <option value="GENERAL">GENERAL</option>
              <option value="PRIVATE">PRIVATE</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Floor</label>
            <input type="text" value={newBedData.floor} onChange={(e) => setNewBedData(p => ({ ...p, floor: e.target.value }))} className="form-control" />
          </div>

          <div className="form-group">
            <label className="form-label">Equipment (comma separated)</label>
            <input type="text" placeholder="Ventilator, ECG Monitor" value={newBedData.equipment} onChange={(e) => setNewBedData(p => ({ ...p, equipment: e.target.value }))} className="form-control" />
          </div>

          <div className="form-group full-width" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddBedModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Bed</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Beds;
