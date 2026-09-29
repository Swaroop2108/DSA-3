import React, { useState } from 'react';
import { BedDouble, UserCheck, ShieldAlert, Wrench, Clock, CheckCircle } from 'lucide-react';

const BedGrid = ({ beds, onAllocate, onRelease, onReserve, onMaintenance, isAdmin }) => {
  const [selectedWard, setSelectedWard] = useState('ALL');

  const wards = ['ALL', 'ICU', 'EMERGENCY', 'GENERAL', 'PRIVATE'];

  const filteredBeds = selectedWard === 'ALL'
    ? beds
    : beds.filter(b => b.ward === selectedWard);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE': return <span className="badge badge-available"><CheckCircle size={12} /> Available</span>;
      case 'OCCUPIED': return <span className="badge badge-occupied"><UserCheck size={12} /> Occupied</span>;
      case 'MAINTENANCE': return <span className="badge badge-maintenance"><Wrench size={12} /> Maintenance</span>;
      case 'RESERVED': return <span className="badge badge-reserved"><Clock size={12} /> Reserved</span>;
      default: return null;
    }
  };

  return (
    <div>
      {/* Ward Selector Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {wards.map(ward => (
          <button
            key={ward}
            onClick={() => setSelectedWard(ward)}
            className={`btn ${selectedWard === ward ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}
          >
            {ward === 'ALL' ? '🏥 All Wards' : ward} ({ward === 'ALL' ? beds.length : beds.filter(b => b.ward === ward).length})
          </button>
        ))}
      </div>

      {/* Grid Display */}
      {filteredBeds.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No hospital beds found for this filter.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1.25rem'
        }}>
          {filteredBeds.map(bed => {
            const isOccupied = bed.status === 'OCCUPIED';
            const isAvailable = bed.status === 'AVAILABLE';

            return (
              <div
                key={bed._id || bed.bedId}
                className="card"
                style={{
                  borderTop: `4px solid ${
                    bed.status === 'AVAILABLE' ? 'var(--success)' :
                    bed.status === 'OCCUPIED' ? 'var(--emergency)' :
                    bed.status === 'MAINTENANCE' ? 'var(--medium)' : 'var(--accent-blue)'
                  }`,
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {bed.bedId}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {bed.ward} Ward • {bed.floor}
                    </div>
                  </div>
                  {getStatusBadge(bed.status)}
                </div>

                {/* Patient / Equipment Info */}
                <div style={{ background: '#f8fafc', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.82rem' }}>
                  {isOccupied ? (
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        👤 {bed.assignedPatientName || bed.assignedPatientId}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        ID: {bed.assignedPatientId}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        🛠️ {bed.equipment && bed.equipment.length > 0 ? bed.equipment.join(', ') : 'Standard Equipment'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons (Admin Only) */}
                {isAdmin && (
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {isAvailable && (
                      <button
                        onClick={() => onAllocate(bed)}
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1 }}
                      >
                        Allocate
                      </button>
                    )}

                    {isOccupied && (
                      <button
                        onClick={() => onRelease(bed)}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1 }}
                      >
                        Release Bed
                      </button>
                    )}

                    {isAvailable && (
                      <button
                        onClick={() => onReserve(bed)}
                        className="btn btn-outline btn-sm"
                      >
                        Reserve
                      </button>
                    )}

                    {bed.status !== 'MAINTENANCE' && (
                      <button
                        onClick={() => onMaintenance(bed)}
                        className="btn btn-secondary btn-sm"
                        title="Mark Maintenance"
                      >
                        <Wrench size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


export default BedGrid;
