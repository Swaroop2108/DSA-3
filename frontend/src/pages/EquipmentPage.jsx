import React, { useState, useEffect, useMemo } from 'react';
import API from '../services/api';
import Modal from '../components/Common/Modal';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Wrench, ShieldAlert, CheckCircle, Clock, Edit3, Trash2, Eye, Filter } from 'lucide-react';

const StatusBadge = ({ status }) => {
  switch (status) {
    case 'AVAILABLE':
      return <span className="badge badge-available">🟢 AVAILABLE</span>;
    case 'IN USE':
      return <span className="badge" style={{ background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>🔵 IN USE</span>;
    case 'UNDER REPAIR':
      return <span className="badge badge-occupied">🔴 UNDER REPAIR</span>;
    case 'MAINTENANCE':
      return <span className="badge badge-maintenance">🟠 MAINTENANCE</span>;
    default:
      return <span className="badge">{status}</span>;
  }
};

const EquipmentPage = () => {
  const { user, isAdmin } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permissionError, setPermissionError] = useState('');

  // Page-specific search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('ALL');

  // Modals state
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form Data State
  const initialForm = {
    equipmentId: '',
    name: '',
    category: 'Critical Care',
    location: 'ICU-01',
    status: 'AVAILABLE',
    currentAssignment: '—',
    maintenanceDetails: '',
    repairStatus: 'In Repair',
    repairReason: '',
    reportedDate: '',
    expectedAvailability: '',
    maintenanceDate: ''
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const res = await API.get('/equipment');
      if (res.data.success) {
        setEquipment(res.data.equipment || []);
      }
    } catch (err) {
      console.error('Failed to load equipment list:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper for Staff protection check
  const checkStaffPermission = () => {
    if (!isAdmin) {
      const msg = 'Staff accounts have view-only access to equipment.';
      setPermissionError(msg);
      alert(msg);
      return false;
    }
    return true;
  };

  // Extract unique locations dynamically for filter dropdown
  const uniqueLocations = useMemo(() => {
    const locs = new Set();
    equipment.forEach(item => {
      if (item.location) locs.add(item.location);
    });
    return Array.from(locs).sort();
  }, [equipment]);

  // Compute summary cards stats dynamically
  const stats = useMemo(() => {
    return {
      total: equipment.length,
      available: equipment.filter(e => e.status === 'AVAILABLE').length,
      inUse: equipment.filter(e => e.status === 'IN USE').length,
      underRepair: equipment.filter(e => e.status === 'UNDER REPAIR').length,
      maintenance: equipment.filter(e => e.status === 'MAINTENANCE').length
    };
  }, [equipment]);

  // Filter equipment dynamically based on search, status, category, location
  const filteredEquipment = useMemo(() => {
    return equipment.filter(item => {
      // 1. Search Query
      if (searchTerm) {
        const query = searchTerm.toLowerCase().trim();
        const matchesId = item.equipmentId?.toLowerCase().includes(query);
        const matchesName = item.name?.toLowerCase().includes(query);
        const matchesCategory = item.category?.toLowerCase().includes(query);
        const matchesLocation = item.location?.toLowerCase().includes(query);

        if (!matchesId && !matchesName && !matchesCategory && !matchesLocation) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      // 3. Category Filter
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false;
      }

      // 4. Location Filter
      if (locationFilter !== 'ALL' && item.location !== locationFilter) {
        return false;
      }

      return true;
    });
  }, [equipment, searchTerm, statusFilter, categoryFilter, locationFilter]);

  // Handlers
  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setIsDetailsModalOpen(true);
  };

  const handleOpenAddModal = () => {
    if (!checkStaffPermission()) return;
    setFormData({
      ...initialForm,
      equipmentId: `EQ-${String(equipment.length + 1).padStart(3, '0')}`,
      reportedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      maintenanceDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    if (!checkStaffPermission()) return;
    setSelectedItem(item);
    setFormData({
      equipmentId: item.equipmentId || '',
      name: item.name || '',
      category: item.category || 'Critical Care',
      location: item.location || '',
      status: item.status || 'AVAILABLE',
      currentAssignment: item.currentAssignment || '—',
      maintenanceDetails: item.maintenanceDetails || '',
      repairStatus: item.repairStatus || 'In Repair',
      repairReason: item.repairReason || '',
      reportedDate: item.reportedDate || '',
      expectedAvailability: item.expectedAvailability || '',
      maintenanceDate: item.maintenanceDate || ''
    });
    setIsEditModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!checkStaffPermission()) return;

    try {
      const res = await API.post('/equipment', formData);
      if (res.data.success) {
        setIsAddModalOpen(false);
        fetchEquipment();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Staff accounts have view-only access to equipment.';
      setPermissionError(errMsg);
      alert(errMsg);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!checkStaffPermission()) return;

    try {
      const res = await API.put(`/equipment/${selectedItem.equipmentId}`, formData);
      if (res.data.success) {
        setIsEditModalOpen(false);
        if (isDetailsModalOpen) {
          setSelectedItem(res.data.equipment);
        }
        fetchEquipment();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Staff accounts have view-only access to equipment.';
      setPermissionError(errMsg);
      alert(errMsg);
    }
  };

  const handleDeleteEquipment = async (item) => {
    if (!checkStaffPermission()) return;
    if (!window.confirm(`Are you sure you want to delete equipment ${item.equipmentId} (${item.name})?`)) {
      return;
    }

    try {
      const res = await API.delete(`/equipment/${item.equipmentId}`);
      if (res.data.success) {
        fetchEquipment();
        if (isDetailsModalOpen && selectedItem?.equipmentId === item.equipmentId) {
          setIsDetailsModalOpen(false);
        }
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Staff accounts have view-only access to equipment.';
      setPermissionError(errMsg);
      alert(errMsg);
    }
  };

  const handleQuickStatusChange = async (item, newStatus) => {
    if (!checkStaffPermission()) return;

    const payload = { status: newStatus };
    if (newStatus === 'AVAILABLE') {
      payload.currentAssignment = '—';
    } else if (newStatus === 'IN USE' && (!item.currentAssignment || item.currentAssignment === '—')) {
      payload.currentAssignment = item.location || 'Operating Room';
    } else if (newStatus === 'UNDER REPAIR') {
      payload.currentAssignment = 'Biomedical Engineering';
      payload.reportedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      if (!item.repairReason) {
        payload.repairReason = prompt('Enter repair reason:') || 'Technical inspection required';
      }
    } else if (newStatus === 'MAINTENANCE') {
      payload.currentAssignment = 'Biomedical Engineering';
      payload.maintenanceDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      if (!item.maintenanceDetails) {
        payload.maintenanceDetails = prompt('Enter maintenance details:') || 'Scheduled preventive maintenance';
      }
    }

    try {
      const res = await API.put(`/equipment/${item.equipmentId}`, payload);
      if (res.data.success) {
        fetchEquipment();
        if (isDetailsModalOpen && selectedItem?.equipmentId === item.equipmentId) {
          setSelectedItem(res.data.equipment);
        }
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Staff accounts have view-only access to equipment.';
      setPermissionError(errMsg);
      alert(errMsg);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Equipment Availability</h1>
          <p className="page-subtitle">Real-time status, assignments, locations, and maintenance tracking for hospital equipment.</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} /> Add Equipment
          </button>
        )}
      </div>

      {/* Permission Warning Banner (if staff attempts restricted operation) */}
      {permissionError && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fca5a5',
          color: '#b91c1c',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.9rem',
          fontWeight: 600
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldAlert size={18} />
            <span>{permissionError}</span>
          </div>
          <button
            onClick={() => setPermissionError('')}
            style={{ background: 'transparent', color: '#b91c1c', fontWeight: 700, fontSize: '1.1rem' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Equipment Summary Cards (Requirement 6) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div className="card" style={{ borderLeft: '4px solid var(--primary)', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total Equipment
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.2rem', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
            {stats.total}
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #10b981', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Available
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.2rem', color: '#047857', fontFamily: 'var(--font-heading)' }}>
            {stats.available}
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #2563eb', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            In Use
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.2rem', color: '#1d4ed8', fontFamily: 'var(--font-heading)' }}>
            {stats.inUse}
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #ef4444', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Under Repair
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.2rem', color: '#dc2626', fontFamily: 'var(--font-heading)' }}>
            {stats.underRepair}
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #f97316', padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Maintenance
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.2rem', color: '#c2410c', fontFamily: 'var(--font-heading)' }}>
            {stats.maintenance}
          </div>
        </div>
      </div>

      {/* Page-Specific Search and Filters Bar (Requirements 8 & 9) */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Page-Specific Search */}
          <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '240px' }}>
            <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by Equipment ID, Name, Category, Location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
          </div>

          {/* Filters: Status, Category, Location */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-control"
              style={{ fontSize: '0.85rem', cursor: 'pointer' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="IN USE">IN USE</option>
              <option value="UNDER REPAIR">UNDER REPAIR</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-control"
              style={{ fontSize: '0.85rem', cursor: 'pointer' }}
            >
              <option value="ALL">All Categories</option>
              <option value="Critical Care">Critical Care</option>
              <option value="Surgical">Surgical</option>
              <option value="Diagnostic">Diagnostic</option>
              <option value="Monitoring">Monitoring</option>
              <option value="Emergency">Emergency</option>
              <option value="Patient Care">Patient Care</option>
            </select>

            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="form-control"
              style={{ fontSize: '0.85rem', cursor: 'pointer' }}
            >
              <option value="ALL">All Locations</option>
              {uniqueLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>

            {(searchTerm || statusFilter !== 'ALL' || categoryFilter !== 'ALL' || locationFilter !== 'ALL') && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setCategoryFilter('ALL');
                  setLocationFilter('ALL');
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Equipment Table (Requirement 7 & 23) */}
      {loading ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading Equipment Inventory...
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Equipment ID</th>
                <th>Equipment</th>
                <th>Category</th>
                <th>Location</th>
                <th>Status</th>
                <th>Current Assignment</th>
                <th>Last Updated</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEquipment.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 600 }}>No equipment available.</div>
                    <div style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>
                      Try adjusting your search query or filter parameters.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEquipment.map(item => (
                  <tr key={item.equipmentId}>
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--primary-text)' }}>
                      {item.equipmentId}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      <button
                        onClick={() => handleViewDetails(item)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--primary)',
                          fontWeight: 600,
                          fontSize: 'inherit',
                          padding: 0,
                          textAlign: 'left',
                          cursor: 'pointer',
                          textDecoration: 'underline'
                        }}
                      >
                        {item.name}
                      </button>
                    </td>
                    <td>{item.category}</td>
                    <td style={{ fontWeight: 500 }}>{item.location}</td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td style={{ color: item.currentAssignment === '—' ? 'var(--text-muted)' : 'var(--text-main)' }}>
                      {item.currentAssignment || '—'}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {item.lastUpdated || '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleViewDetails(item)}
                          title="View Details"
                        >
                          <Eye size={14} /> Details
                        </button>

                        {isAdmin && (
                          <>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => handleOpenEditModal(item)}
                              title="Edit Equipment"
                            >
                              <Edit3 size={14} /> Edit
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteEquipment(item)}
                              title="Delete Equipment"
                            >
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
      )}

      {/* Equipment Details Modal (Requirement 12, 15, 16) */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={`Equipment Details: ${selectedItem?.name || ''}`}
        maxWidth="680px"
      >
        {selectedItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header info card */}
            <div style={{
              background: '#f8fafc',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {selectedItem.name}
                </h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.15rem' }}>
                  ID: {selectedItem.equipmentId} • {selectedItem.category}
                </div>
              </div>
              <div>
                <StatusBadge status={selectedItem.status} />
              </div>
            </div>

            {/* General Info Grid */}
            <div className="form-grid" style={{ fontSize: '0.88rem' }}>
              <div className="card" style={{ padding: '0.85rem 1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
                  Location
                </span>
                <strong style={{ fontSize: '0.95rem' }}>{selectedItem.location || 'N/A'}</strong>
              </div>

              <div className="card" style={{ padding: '0.85rem 1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
                  Current Assignment
                </span>
                <strong style={{ fontSize: '0.95rem' }}>{selectedItem.currentAssignment || '—'}</strong>
              </div>

              <div className="card" style={{ padding: '0.85rem 1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
                  Category
                </span>
                <strong style={{ fontSize: '0.95rem' }}>{selectedItem.category}</strong>
              </div>

              <div className="card" style={{ padding: '0.85rem 1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
                  Last Updated
                </span>
                <strong style={{ fontSize: '0.95rem' }}>{selectedItem.lastUpdated || '—'}</strong>
              </div>
            </div>

            {/* Repair Info Box (Requirement 15) */}
            {selectedItem.status === 'UNDER REPAIR' && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fca5a5',
                borderRadius: 'var(--radius-md)',
                padding: '1.1rem',
                fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b91c1c', fontWeight: 700, marginBottom: '0.6rem', fontSize: '0.95rem' }}>
                  <Wrench size={18} /> Repair Information
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', color: '#7f1d1d' }}>
                  <div><strong>Repair Status:</strong> {selectedItem.repairStatus || 'In Repair'}</div>
                  <div><strong>Reported Date:</strong> {selectedItem.reportedDate || 'N/A'}</div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <strong>Reason / Details:</strong> {selectedItem.repairReason || selectedItem.maintenanceDetails || 'No details provided.'}
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <strong>Expected Availability:</strong> {selectedItem.expectedAvailability || 'TBD (Under Diagnostic Review)'}
                  </div>
                </div>
              </div>
            )}

            {/* Maintenance Info Box (Requirement 16) */}
            {selectedItem.status === 'MAINTENANCE' && (
              <div style={{
                background: '#fff7ed',
                border: '1px solid #ffedd5',
                borderRadius: 'var(--radius-md)',
                padding: '1.1rem',
                fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c2410c', fontWeight: 700, marginBottom: '0.6rem', fontSize: '0.95rem' }}>
                  <Clock size={18} /> Maintenance Information
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', color: '#9a3412' }}>
                  <div><strong>Maintenance Status:</strong> Scheduled Servicing & Grounding Check</div>
                  <div><strong>Maintenance Date:</strong> {selectedItem.maintenanceDate || selectedItem.lastUpdated || 'N/A'}</div>
                  <div><strong>Maintenance Details:</strong> {selectedItem.maintenanceDetails || 'Routine preventive maintenance in progress.'}</div>
                </div>
              </div>
            )}

            {/* Regular Maintenance Log Notes (If Available or Maintenance) */}
            {selectedItem.status !== 'UNDER REPAIR' && selectedItem.status !== 'MAINTENANCE' && selectedItem.maintenanceDetails && (
              <div style={{
                background: '#f8fafc',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                fontSize: '0.85rem'
              }}>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                  Maintenance History / Notes
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  {selectedItem.maintenanceDetails}
                </div>
                {selectedItem.maintenanceDate && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '0.4rem' }}>
                    Last serviced on: {selectedItem.maintenanceDate}
                  </div>
                )}
              </div>
            )}

            {/* Quick Admin Actions inside modal */}
            {isAdmin && (
              <div style={{
                borderTop: '1px solid var(--border)',
                paddingTop: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Admin Status Controls:
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {selectedItem.status !== 'AVAILABLE' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => handleQuickStatusChange(selectedItem, 'AVAILABLE')}>
                      Set AVAILABLE 🟢
                    </button>
                  )}
                  {selectedItem.status !== 'IN USE' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => handleQuickStatusChange(selectedItem, 'IN USE')}>
                      Set IN USE 🔵
                    </button>
                  )}
                  {selectedItem.status !== 'UNDER REPAIR' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => handleQuickStatusChange(selectedItem, 'UNDER REPAIR')}>
                      Mark UNDER REPAIR 🔴
                    </button>
                  )}
                  {selectedItem.status !== 'MAINTENANCE' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => handleQuickStatusChange(selectedItem, 'MAINTENANCE')}>
                      Mark MAINTENANCE 🟠
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Close / Action Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setIsDetailsModalOpen(false)}>
                Close
              </button>
              {isAdmin && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    handleOpenEditModal(selectedItem);
                  }}
                >
                  Edit Equipment
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Add Equipment Modal (Admin Only) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Hospital Equipment"
      >
        <form onSubmit={handleCreateSubmit} className="form-grid">
          <div className="form-group">
            <label className="form-label">Equipment ID *</label>
            <input
              type="text"
              required
              placeholder="e.g. EQ-016"
              value={formData.equipmentId}
              onChange={(e) => setFormData(p => ({ ...p, equipmentId: e.target.value }))}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Equipment Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Portable X-Ray Unit"
              value={formData.name}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
              className="form-control"
            >
              <option value="Critical Care">Critical Care</option>
              <option value="Surgical">Surgical</option>
              <option value="Diagnostic">Diagnostic</option>
              <option value="Monitoring">Monitoring</option>
              <option value="Emergency">Emergency</option>
              <option value="Patient Care">Patient Care</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Location *</label>
            <input
              type="text"
              required
              placeholder="e.g. OR-01, ICU-02, ER"
              value={formData.location}
              onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Initial Status *</label>
            <select
              value={formData.status}
              onChange={(e) => {
                const newSt = e.target.value;
                setFormData(p => ({
                  ...p,
                  status: newSt,
                  currentAssignment: newSt === 'AVAILABLE' ? '—' : (newSt === 'IN USE' ? p.location : 'Biomedical Engineering')
                }));
              }}
              className="form-control"
            >
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="IN USE">IN USE</option>
              <option value="UNDER REPAIR">UNDER REPAIR</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Current Assignment</label>
            <input
              type="text"
              placeholder="e.g. OR-02 or —"
              value={formData.currentAssignment}
              onChange={(e) => setFormData(p => ({ ...p, currentAssignment: e.target.value }))}
              className="form-control"
            />
          </div>

          {formData.status === 'UNDER REPAIR' && (
            <>
              <div className="form-group full-width">
                <label className="form-label">Repair Reason / Details *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Reason for repair request..."
                  value={formData.repairReason}
                  onChange={(e) => setFormData(p => ({ ...p, repairReason: e.target.value }))}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Reported Date</label>
                <input
                  type="text"
                  placeholder="29 Sep 2026"
                  value={formData.reportedDate}
                  onChange={(e) => setFormData(p => ({ ...p, reportedDate: e.target.value }))}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Expected Availability Date</label>
                <input
                  type="text"
                  placeholder="e.g. 05 Oct 2026"
                  value={formData.expectedAvailability}
                  onChange={(e) => setFormData(p => ({ ...p, expectedAvailability: e.target.value }))}
                  className="form-control"
                />
              </div>
            </>
          )}

          {formData.status === 'MAINTENANCE' && (
            <>
              <div className="form-group full-width">
                <label className="form-label">Maintenance Details *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Preventive maintenance activities..."
                  value={formData.maintenanceDetails}
                  onChange={(e) => setFormData(p => ({ ...p, maintenanceDetails: e.target.value }))}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Maintenance Date</label>
                <input
                  type="text"
                  placeholder="29 Sep 2026"
                  value={formData.maintenanceDate}
                  onChange={(e) => setFormData(p => ({ ...p, maintenanceDate: e.target.value }))}
                  className="form-control"
                />
              </div>
            </>
          )}

          {formData.status === 'AVAILABLE' && (
            <div className="form-group full-width">
              <label className="form-label">Maintenance / Calibration History Notes</label>
              <textarea
                rows={2}
                placeholder="Optional routine check notes..."
                value={formData.maintenanceDetails}
                onChange={(e) => setFormData(p => ({ ...p, maintenanceDetails: e.target.value }))}
                className="form-control"
              />
            </div>
          )}

          <div className="form-group full-width" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Register Equipment
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Equipment Modal (Admin Only) */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Equipment: ${formData.name}`}
      >
        <form onSubmit={handleEditSubmit} className="form-grid">
          <div className="form-group">
            <label className="form-label">Equipment ID</label>
            <input
              type="text"
              disabled
              value={formData.equipmentId}
              className="form-control"
              style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Equipment Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
              className="form-control"
            >
              <option value="Critical Care">Critical Care</option>
              <option value="Surgical">Surgical</option>
              <option value="Diagnostic">Diagnostic</option>
              <option value="Monitoring">Monitoring</option>
              <option value="Emergency">Emergency</option>
              <option value="Patient Care">Patient Care</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Location *</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Status *</label>
            <select
              value={formData.status}
              onChange={(e) => {
                const newSt = e.target.value;
                setFormData(p => ({
                  ...p,
                  status: newSt,
                  currentAssignment: newSt === 'AVAILABLE' ? '—' : p.currentAssignment
                }));
              }}
              className="form-control"
            >
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="IN USE">IN USE</option>
              <option value="UNDER REPAIR">UNDER REPAIR</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Current Assignment</label>
            <input
              type="text"
              value={formData.currentAssignment}
              onChange={(e) => setFormData(p => ({ ...p, currentAssignment: e.target.value }))}
              className="form-control"
            />
          </div>

          {formData.status === 'UNDER REPAIR' && (
            <>
              <div className="form-group full-width">
                <label className="form-label">Repair Reason / Details *</label>
                <textarea
                  required
                  rows={2}
                  value={formData.repairReason}
                  onChange={(e) => setFormData(p => ({ ...p, repairReason: e.target.value }))}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Reported Date</label>
                <input
                  type="text"
                  value={formData.reportedDate}
                  onChange={(e) => setFormData(p => ({ ...p, reportedDate: e.target.value }))}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Expected Availability Date</label>
                <input
                  type="text"
                  value={formData.expectedAvailability}
                  onChange={(e) => setFormData(p => ({ ...p, expectedAvailability: e.target.value }))}
                  className="form-control"
                />
              </div>
            </>
          )}

          {formData.status === 'MAINTENANCE' && (
            <>
              <div className="form-group full-width">
                <label className="form-label">Maintenance Details *</label>
                <textarea
                  required
                  rows={2}
                  value={formData.maintenanceDetails}
                  onChange={(e) => setFormData(p => ({ ...p, maintenanceDetails: e.target.value }))}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Maintenance Date</label>
                <input
                  type="text"
                  value={formData.maintenanceDate}
                  onChange={(e) => setFormData(p => ({ ...p, maintenanceDate: e.target.value }))}
                  className="form-control"
                />
              </div>
            </>
          )}

          {formData.status !== 'UNDER REPAIR' && formData.status !== 'MAINTENANCE' && (
            <div className="form-group full-width">
              <label className="form-label">Maintenance History / Notes</label>
              <textarea
                rows={2}
                value={formData.maintenanceDetails}
                onChange={(e) => setFormData(p => ({ ...p, maintenanceDetails: e.target.value }))}
                className="form-control"
              />
            </div>
          )}

          <div className="form-group full-width" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EquipmentPage;
