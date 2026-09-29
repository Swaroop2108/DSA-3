import React, { useState, useEffect } from 'react';
import API from '../services/api';
import Modal from '../components/Common/Modal';
import StatCard from '../components/Common/StatCard';
import { useAuth } from '../context/AuthContext';
import { ClipboardList, Plus, CheckCircle, Clock, Send, AlertCircle, UserCheck } from 'lucide-react';

const Instructions = () => {
  const { user, isAdmin } = useAuth();
  const [instructions, setInstructions] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Admin Send Modal
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [sendFormData, setSendFormData] = useState({
    title: '',
    description: '',
    assignedStaffId: '',
    assignedStaffName: '',
    priority: 'Normal',
    dueDate: ''
  });

  // Staff Complete Modal
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedInstruction, setSelectedInstruction] = useState(null);
  const [completionMessage, setCompletionMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInstructions();
    if (isAdmin) {
      fetchStaffList();
    }
  }, [isAdmin]);

  const fetchInstructions = async () => {
    try {
      const res = await API.get('/instructions');
      if (res.data.success) {
        setInstructions(res.data.instructions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffList = async () => {
    try {
      const res = await API.get('/staff');
      if (res.data.success) {
        setStaffList(res.data.staff || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStaffSelect = (staffId) => {
    const selected = staffList.find(s => s.staffId === staffId);
    setSendFormData(prev => ({
      ...prev,
      assignedStaffId: staffId,
      assignedStaffName: selected ? selected.name : ''
    }));
  };

  const handleSendInstructionSubmit = async (e) => {
    e.preventDefault();
    if (!sendFormData.title || !sendFormData.assignedStaffId) {
      alert('Please provide a title and select a staff member.');
      return;
    }

    try {
      const res = await API.post('/instructions', sendFormData);
      if (res.data.success) {
        setIsSendModalOpen(false);
        setSendFormData({
          title: '',
          description: '',
          assignedStaffId: '',
          assignedStaffName: '',
          priority: 'Normal',
          dueDate: ''
        });
        fetchInstructions();
      }
    } catch (err) {
      alert('Error sending instruction: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleOpenCompleteModal = (inst) => {
    setSelectedInstruction(inst);
    setCompletionMessage('');
    setIsCompleteModalOpen(true);
  };

  const handleSendDoneMessage = async (e) => {
    e.preventDefault();
    if (!selectedInstruction) return;

    setSubmitting(true);
    try {
      const res = await API.put(`/instructions/${selectedInstruction.instructionId}/complete`, {
        completionMessage
      });
      if (res.data.success) {
        setIsCompleteModalOpen(false);
        setSelectedInstruction(null);
        setCompletionMessage('');
        fetchInstructions();
      }
    } catch (err) {
      alert('Error marking instruction complete: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics
  const totalCount = instructions.length;
  const pendingCount = instructions.filter(i => i.status === 'PENDING').length;
  const completedCount = instructions.filter(i => i.status === 'COMPLETED').length;

  const filteredInstructions = instructions.filter(i => {
    if (filterStatus === 'PENDING') return i.status === 'PENDING';
    if (filterStatus === 'COMPLETED') return i.status === 'COMPLETED';
    return true;
  });

  const getPriorityBadgeClass = (priority) => {
    const p = (priority || '').toUpperCase();
    if (p === 'HIGH') return 'badge-emergency';
    if (p === 'MEDIUM') return 'badge-reserved';
    return 'badge-scheduled';
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">{isAdmin ? 'Staff Instructions Management' : 'Instructions from Admin'}</h1>
          <p className="page-subtitle">
            {isAdmin 
              ? 'Assign specific clinical and operational tasks to hospital staff members and track completion.'
              : 'Tasks and directives assigned to you by hospital administration.'}
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setIsSendModalOpen(true)}>
            <Plus size={18} /> Send Instruction
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.25rem',
        marginBottom: '1.5rem'
      }}>
        <StatCard title="Total Instructions" value={totalCount} icon={ClipboardList} color="#0284c7" subtitle="Assigned Tasks" />
        <StatCard title="Pending" value={pendingCount} icon={Clock} color="#f97316" subtitle="Awaiting Staff Action" />
        <StatCard title="Completed" value={completedCount} icon={CheckCircle} color="#10b981" subtitle="Done & Verified" />
      </div>

      {/* Status Filter Tabs */}
      <div className="card" style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.5rem' }}>
        {['ALL', 'PENDING', 'COMPLETED'].map(st => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`btn ${filterStatus === st ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}
          >
            {st === 'ALL' ? 'All Instructions' : (st === 'PENDING' ? '⏳ Pending' : '✓ Completed')}
          </button>
        ))}
      </div>

      {/* Instructions List */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>Loading Instructions...</div>
      ) : filteredInstructions.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No {filterStatus !== 'ALL' ? filterStatus.toLowerCase() : ''} instructions found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredInstructions.map(inst => {
            const isPending = inst.status === 'PENDING';

            return (
              <div
                key={inst._id || inst.instructionId}
                className="card"
                style={{
                  borderLeft: `4px solid ${isPending ? '#f97316' : '#10b981'}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.65rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{inst.title}</h3>
                      <span className={`badge ${getPriorityBadgeClass(inst.priority)}`} style={{ fontSize: '0.68rem' }}>
                        {inst.priority} Priority
                      </span>
                      <span className={`badge ${isPending ? 'badge-occupied' : 'badge-available'}`} style={{ fontSize: '0.68rem' }}>
                        {inst.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      ID: <strong>{inst.instructionId}</strong> • Assigned to: <strong>{inst.assignedStaffName}</strong> • Created by: {inst.createdBy || 'Admin'}
                    </div>
                  </div>

                  {!isAdmin && isPending && (
                    <button
                      onClick={() => handleOpenCompleteModal(inst)}
                      className="btn btn-primary btn-sm"
                    >
                      <CheckCircle size={15} /> Mark as Done
                    </button>
                  )}
                </div>

                {/* Instruction Description */}
                <div style={{
                  background: '#f8fafc',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  fontSize: '0.88rem',
                  color: 'var(--text-main)',
                  marginBottom: '0.75rem'
                }}>
                  {inst.description || 'No detailed instructions provided.'}
                </div>

                {/* Metadata & Done Message Details */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <div>
                    📅 Assigned Date: {new Date(inst.createdAt).toLocaleDateString()} {new Date(inst.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {inst.dueDate && <span> • Due: <strong>{inst.dueDate}</strong></span>}
                  </div>

                  {inst.status === 'COMPLETED' && (
                    <div style={{ color: '#059669', fontWeight: 600 }}>
                      ✓ Completed by {inst.completedBy || inst.assignedStaffName} on {inst.completedAt ? new Date(inst.completedAt).toLocaleDateString() : 'N/A'}
                    </div>
                  )}
                </div>

                {inst.status === 'COMPLETED' && inst.completionMessage && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.65rem 0.85rem',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem',
                    color: '#166534'
                  }}>
                    💬 <strong>Done Message:</strong> "{inst.completionMessage}"
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Admin: Create Instruction Modal */}
      {isAdmin && (
        <Modal
          isOpen={isSendModalOpen}
          onClose={() => setIsSendModalOpen(false)}
          title="Send Instruction to Staff Member"
          maxWidth="600px"
        >
          <form onSubmit={handleSendInstructionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label className="form-label" style={{ marginBottom: '0.35rem', display: 'block' }}>
                Instruction Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Prepare OR-02 or Bed Inspection"
                value={sendFormData.title}
                onChange={(e) => setSendFormData(p => ({ ...p, title: e.target.value }))}
                className="form-control"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label className="form-label" style={{ marginBottom: '0.35rem', display: 'block' }}>
                Instruction Description
              </label>
              <textarea
                rows={3}
                placeholder="Provide detailed instructions or checklist for the staff member..."
                value={sendFormData.description}
                onChange={(e) => setSendFormData(p => ({ ...p, description: e.target.value }))}
                className="form-control"
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ marginBottom: '0.35rem', display: 'block' }}>
                  Assigned Staff Member *
                </label>
                <select
                  required
                  value={sendFormData.assignedStaffId}
                  onChange={(e) => handleStaffSelect(e.target.value)}
                  className="form-control"
                  style={{ width: '100%' }}
                >
                  <option value="">-- Choose Staff Member --</option>
                  {staffList.map(s => (
                    <option key={s.staffId} value={s.staffId}>
                      {s.name} ({s.role} - {s.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '0.35rem', display: 'block' }}>
                  Priority Level *
                </label>
                <select
                  value={sendFormData.priority}
                  onChange={(e) => setSendFormData(p => ({ ...p, priority: e.target.value }))}
                  className="form-control"
                  style={{ width: '100%' }}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Normal">Normal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label" style={{ marginBottom: '0.35rem', display: 'block' }}>
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={sendFormData.dueDate}
                onChange={(e) => setSendFormData(p => ({ ...p, dueDate: e.target.value }))}
                className="form-control"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsSendModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">
                <Send size={16} /> Send Instruction
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Staff: Mark as Done Confirmation Modal */}
      {!isAdmin && (
        <Modal
          isOpen={isCompleteModalOpen}
          onClose={() => setIsCompleteModalOpen(false)}
          title="Have you completed this instruction?"
          maxWidth="500px"
        >
          <form onSubmit={handleSendDoneMessage} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                {selectedInstruction?.title}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {selectedInstruction?.description}
              </div>
            </div>

            <div>
              <label className="form-label" style={{ marginBottom: '0.4rem', display: 'block' }}>
                Completion Message (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Bed inspection completed. OR-02 prepared."
                value={completionMessage}
                onChange={(e) => setCompletionMessage(e.target.value)}
                className="form-control"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsCompleteModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Sending...' : 'Send Done Message'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Instructions;
