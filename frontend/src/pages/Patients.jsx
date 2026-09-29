import React, { useState, useEffect } from 'react';
import API from '../services/api';
import Modal from '../components/Common/Modal';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Filter, Trash2, Edit, Eye, BedDouble, AlertCircle } from 'lucide-react';

const Patients = () => {
  const { isAdmin } = useAuth();
  const [patients, setPatients] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    phone: '',
    email: '',
    address: '',
    diagnosis: '',
    priority: 'NORMAL',
    surgeryRequired: true,
    surgeryType: '',
    expectedSurgeryDuration: 60,
    doctor: '',
    department: 'General Surgery'
  });

  const [allocationBedId, setAllocationBedId] = useState('');

  useEffect(() => {
    fetchPatients();
    fetchBeds();
  }, [search, priorityFilter, statusFilter]);

  const fetchPatients = async () => {
    try {
      const res = await API.get(`/patients?search=${search}&priority=${priorityFilter}&status=${statusFilter}`);
      if (res.data.success) {
        setPatients(res.data.patients);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBeds = async () => {
    try {
      const res = await API.get('/beds?status=AVAILABLE');
      if (res.data.success) {
        setBeds(res.data.beds);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/patients', formData);
      if (res.data.success) {
        setIsAddModalOpen(false);
        resetForm();
        fetchPatients();
      }
    } catch (err) {
      alert('Error creating patient: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEditPatient = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      const res = await API.put(`/patients/${selectedPatient.patientId}`, formData);
      if (res.data.success) {
        setIsEditModalOpen(false);
        setSelectedPatient(null);
        fetchPatients();
      }
    } catch (err) {
      alert('Error updating patient: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeletePatient = async (patientId) => {
    if (!window.confirm(`Are you sure you want to delete patient ${patientId}?`)) return;
    try {
      const res = await API.delete(`/patients/${patientId}`);
      if (res.data.success) {
        fetchPatients();
      }
    } catch (err) {
      alert('Error deleting patient: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAllocateBedSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient || !allocationBedId) return;

    try {
      const res = await API.post(`/beds/${allocationBedId}/allocate`, {
        patientId: selectedPatient.patientId
      });
      if (res.data.success) {
        setIsAllocateModalOpen(false);
        setSelectedPatient(null);
        setAllocationBedId('');
        fetchPatients();
        fetchBeds();
      }
    } catch (err) {
      alert('Bed Allocation Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const openEditModal = (p) => {
    setSelectedPatient(p);
    setFormData({
      name: p.name,
      age: p.age,
      gender: p.gender,
      phone: p.phone,
      email: p.email,
      address: p.address,
      diagnosis: p.diagnosis,
      priority: p.priorityLabel || 'NORMAL',
      surgeryRequired: p.surgeryRequired,
      surgeryType: p.surgeryType,
      expectedSurgeryDuration: p.expectedSurgeryDuration,
      doctor: p.doctor,
      department: p.department
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      age: '',
      gender: 'Male',
      phone: '',
      email: '',
      address: '',
      diagnosis: '',
      priority: 'NORMAL',
      surgeryRequired: true,
      surgeryType: '',
      expectedSurgeryDuration: 60,
      doctor: '',
      department: 'General Surgery'
    });
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Patient Management</h1>
          <p className="page-subtitle">Patient registration, priority assignment, and bed allocation tracking.</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
            <Plus size={18} /> Register New Patient
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by Patient Name, ID, or Diagnosis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control"
            style={{ paddingLeft: '2.4rem', width: '100%' }}
          />
        </div>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="form-control"
          style={{ width: '160px' }}
        >
          <option value="">All Priorities</option>
          <option value="EMERGENCY">Emergency (1)</option>
          <option value="HIGH">High (2)</option>
          <option value="MEDIUM">Medium (3)</option>
          <option value="NORMAL">Normal (4)</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-control"
          style={{ width: '160px' }}
        >
          <option value="">All Statuses</option>
          <option value="WAITING">WAITING</option>
          <option value="ADMITTED">ADMITTED</option>
          <option value="SCHEDULED">SCHEDULED</option>
          <option value="IN SURGERY">IN SURGERY</option>
          <option value="DISCHARGED">DISCHARGED</option>
        </select>
      </div>

      {/* Patients Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Patient ID</th>
              <th>Full Name</th>
              <th>Age / Gender</th>
              <th>Diagnosis</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assigned Bed</th>
              <th>Doctor / Dept</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>Loading Patients...</td></tr>
            ) : patients.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>No patients found.</td></tr>
            ) : (
              patients.map(p => (
                <tr key={p._id || p.patientId}>
                  <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>
                    {p.patientId}
                  </td>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>{p.age} Yrs / {p.gender}</td>
                  <td>{p.diagnosis}</td>
                  <td>
                    <span className={`badge badge-${p.priorityLabel ? p.priorityLabel.toLowerCase() : 'normal'}`}>
                      {p.priorityLabel || `P-${p.priority}`}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${p.status.toLowerCase().replace(' ', '_')}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>
                    {p.bedId ? (
                      <span className="badge badge-reserved" style={{ fontFamily: 'var(--font-mono)' }}>
                        🛏️ {p.bedId}
                      </span>
                    ) : isAdmin ? (
                      <button
                        onClick={() => { setSelectedPatient(p); setIsAllocateModalOpen(true); }}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                      >
                        Assign Bed
                      </button>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Unassigned</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.82rem' }}>
                    <div>{p.doctor || 'Unassigned'}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{p.department}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button onClick={() => { setSelectedPatient(p); setIsViewModalOpen(true); }} className="btn btn-secondary btn-sm" title="View Details">
                        <Eye size={14} />
                      </button>
                      {isAdmin && (
                        <>
                          <button onClick={() => openEditModal(p)} className="btn btn-secondary btn-sm" title="Edit Patient">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => handleDeletePatient(p.patientId)} className="btn btn-danger btn-sm" title="Delete Patient">
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal 1: Register New Patient */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Patient"
      >
        <form onSubmit={handleAddPatient} className="form-grid">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="form-control" />
          </div>

          <div className="form-group">
            <label className="form-label">Age *</label>
            <input type="number" name="age" required value={formData.age} onChange={handleInputChange} className="form-control" />
          </div>

          <div className="form-group">
            <label className="form-label">Gender *</label>
            <select name="gender" value={formData.gender} onChange={handleInputChange} className="form-control">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Priority Level *</label>
            <select name="priority" value={formData.priority} onChange={handleInputChange} className="form-control">
              <option value="EMERGENCY">EMERGENCY (Rank 1 - Highest)</option>
              <option value="HIGH">HIGH (Rank 2)</option>
              <option value="MEDIUM">MEDIUM (Rank 3)</option>
              <option value="NORMAL">NORMAL (Rank 4)</option>
            </select>
          </div>

          <div className="form-group full-width">
            <label className="form-label">Diagnosis *</label>
            <input type="text" name="diagnosis" required placeholder="e.g. Acute Appendicitis" value={formData.diagnosis} onChange={handleInputChange} className="form-control" />
          </div>

          <div className="form-group">
            <label className="form-label">Department</label>
            <select name="department" value={formData.department} onChange={handleInputChange} className="form-control">
              <option value="General Surgery">General Surgery</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="Neurology">Neurology</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Assigned Doctor</label>
            <input type="text" name="doctor" placeholder="e.g. Dr. Rajesh Kumar" value={formData.doctor} onChange={handleInputChange} className="form-control" />
          </div>

          <div className="form-group">
            <label className="form-label">Surgery Required?</label>
            <select name="surgeryRequired" value={formData.surgeryRequired ? 'true' : 'false'} onChange={(e) => setFormData(p => ({ ...p, surgeryRequired: e.target.value === 'true' }))} className="form-control">
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          {formData.surgeryRequired && (
            <>
              <div className="form-group">
                <label className="form-label">Surgery Type</label>
                <input type="text" name="surgeryType" placeholder="e.g. Appendectomy" value={formData.surgeryType} onChange={handleInputChange} className="form-control" />
              </div>
              <div className="form-group">
                <label className="form-label">Expected Duration (minutes)</label>
                <input type="number" name="expectedSurgeryDuration" value={formData.expectedSurgeryDuration} onChange={handleInputChange} className="form-control" />
              </div>
            </>
          )}

          <div className="form-group full-width" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Register Patient</button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Edit Patient */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Patient: ${selectedPatient?.patientId}`}
      >
        <form onSubmit={handleEditPatient} className="form-grid">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="form-control" />
          </div>
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select name="priority" value={formData.priority} onChange={handleInputChange} className="form-control">
              <option value="EMERGENCY">EMERGENCY (Rank 1)</option>
              <option value="HIGH">HIGH (Rank 2)</option>
              <option value="MEDIUM">MEDIUM (Rank 3)</option>
              <option value="NORMAL">NORMAL (Rank 4)</option>
            </select>
          </div>
          <div className="form-group full-width">
            <label className="form-label">Diagnosis</label>
            <input type="text" name="diagnosis" required value={formData.diagnosis} onChange={handleInputChange} className="form-control" />
          </div>
          <div className="form-group full-width" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Allocate Bed Modal */}
      <Modal
        isOpen={isAllocateModalOpen}
        onClose={() => setIsAllocateModalOpen(false)}
        title={`Allocate Bed for ${selectedPatient?.name} (${selectedPatient?.patientId})`}
      >
        <form onSubmit={handleAllocateBedSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Select an available hospital bed matching patient priority (<strong>{selectedPatient?.priorityLabel}</strong>):
            </div>
            <select
              value={allocationBedId}
              onChange={(e) => setAllocationBedId(e.target.value)}
              className="form-control"
              required
              style={{ width: '100%' }}
            >
              <option value="">-- Choose Available Bed --</option>
              {beds.map(b => (
                <option key={b.bedId} value={b.bedId}>
                  [{b.bedId}] {b.ward} Ward ({b.type}) - {b.floor}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAllocateModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Confirm Allocation</button>
          </div>
        </form>
      </Modal>

      {/* Modal 4: View Details */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Patient File: ${selectedPatient?.name}`}
      >
        {selectedPatient && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem' }}>
            <div><strong>Patient ID:</strong> {selectedPatient.patientId}</div>
            <div><strong>Age / Gender:</strong> {selectedPatient.age} Yrs / {selectedPatient.gender}</div>
            <div><strong>Diagnosis:</strong> {selectedPatient.diagnosis}</div>
            <div><strong>Priority Level:</strong> <span className={`badge badge-${selectedPatient.priorityLabel?.toLowerCase()}`}>{selectedPatient.priorityLabel}</span></div>
            <div><strong>Status:</strong> {selectedPatient.status}</div>
            <div><strong>Assigned Bed:</strong> {selectedPatient.bedId || 'None'}</div>
            <div><strong>Doctor:</strong> {selectedPatient.doctor} ({selectedPatient.department})</div>
            <div><strong>Admission Date:</strong> {new Date(selectedPatient.admissionDate).toLocaleString()}</div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Patients;
