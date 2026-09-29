import React, { useState, useEffect } from 'react';
import API from '../services/api';
import Modal from '../components/Common/Modal';
import { useAuth } from '../context/AuthContext';
import { UserCheck, Plus, Search, CheckCircle, Clock } from 'lucide-react';

const StaffPage = () => {
  const { isAdmin } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');

  // Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: 'Doctor',
    department: 'General Surgery',
    specialization: '',
    phone: '',
    email: '',
    availableFrom: '08:00',
    availableTo: '18:00'
  });

  useEffect(() => {
    fetchStaff();
  }, [roleFilter]);

  const fetchStaff = async () => {
    try {
      const res = await API.get(`/staff?role=${roleFilter}`);
      if (res.data.success) {
        setStaff(res.data.staff);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/staff', formData);
      if (res.data.success) {
        setIsAddModalOpen(false);
        fetchStaff();
      }
    } catch (err) {
      alert('Error creating staff: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleStatus = async (staffMember, newStatus) => {
    try {
      const res = await API.put(`/staff/${staffMember.staffId}`, { status: newStatus });
      if (res.data.success) {
        fetchStaff();
      }
    } catch (err) {
      alert('Error updating staff status: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Management & Doctor Schedules</h1>
          <p className="page-subtitle">Medical personnel availability tracking, surgeon schedules, and shift management.</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={18} /> Register Staff Member
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', overflowX: 'auto' }}>
        {['', 'Surgeon', 'Doctor', 'Nurse', 'Anesthetist', 'Technician'].map(role => (
          <button
            key={role}
            onClick={() => setRoleFilter(role)}
            className={`btn ${roleFilter === role ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}
          >
            {role === '' ? '👥 All Medical Staff' : role}
          </button>
        ))}
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>Loading Medical Staff Directory...</div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.25rem'
        }}>
          {staff.map(member => (
            <div key={member._id || member.staffId} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{member.name}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                    {member.role} • {member.department}
                  </div>
                </div>
                <span className={`badge ${member.status === 'AVAILABLE' ? 'badge-available' : (member.status === 'BUSY' ? 'badge-occupied' : 'badge-maintenance')}`}>
                  {member.status}
                </span>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: isAdmin ? '1rem' : '0', fontSize: '0.82rem' }}>
                <div><strong>ID:</strong> {member.staffId}</div>
                <div><strong>Specialization:</strong> {member.specialization}</div>
                <div><strong>Working Hours:</strong> {member.availableFrom || '08:00'} - {member.availableTo || '18:00'}</div>
                <div><strong>Contact:</strong> {member.phone || member.email || 'N/A'}</div>
              </div>

              {isAdmin && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status Toggle:</span>
                  <select
                    value={member.status}
                    onChange={(e) => handleToggleStatus(member, e.target.value)}
                    className="form-control"
                    style={{ fontSize: '0.75rem', flex: 1 }}
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="BUSY">BUSY</option>
                    <option value="OFF-DUTY">OFF-DUTY</option>
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register Medical Staff"
      >
        <form onSubmit={handleCreateStaff} className="form-grid">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input type="text" required placeholder="e.g. Dr. Rajesh Kumar" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="form-control" />
          </div>

          <div className="form-group">
            <label className="form-label">Role *</label>
            <select value={formData.role} onChange={(e) => setFormData(p => ({ ...p, role: e.target.value }))} className="form-control">
              <option value="Surgeon">Surgeon</option>
              <option value="Doctor">Doctor</option>
              <option value="Nurse">Nurse</option>
              <option value="Anesthetist">Anesthetist</option>
              <option value="Technician">Technician</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Department *</label>
            <select value={formData.department} onChange={(e) => setFormData(p => ({ ...p, department: e.target.value }))} className="form-control">
              <option value="General Surgery">General Surgery</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="Neurology">Neurology</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Specialization</label>
            <input type="text" placeholder="Laparoscopic Surgery" value={formData.specialization} onChange={(e) => setFormData(p => ({ ...p, specialization: e.target.value }))} className="form-control" />
          </div>

          <div className="form-group">
            <label className="form-label">Available From</label>
            <input type="time" value={formData.availableFrom} onChange={(e) => setFormData(p => ({ ...p, availableFrom: e.target.value }))} className="form-control" />
          </div>

          <div className="form-group">
            <label className="form-label">Available To</label>
            <input type="time" value={formData.availableTo} onChange={(e) => setFormData(p => ({ ...p, availableTo: e.target.value }))} className="form-control" />
          </div>

          <div className="form-group full-width" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Register Staff</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StaffPage;
