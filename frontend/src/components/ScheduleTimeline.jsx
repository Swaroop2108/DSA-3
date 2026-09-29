import React from 'react';
import { CalendarClock, Stethoscope, User, Clock, AlertCircle, Eye } from 'lucide-react';

const ScheduleTimeline = ({ surgeries, ors, onReschedule, onCancel, onViewDetails }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {ors.map(room => {
        const roomSurgeries = surgeries.filter(s => s.orId === room.orId && s.status !== 'CANCELLED');

        return (
          <div key={room._id || room.orId} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  background: 'var(--primary-light)',
                  color: 'var(--primary-text)',
                  padding: '0.4rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)'
                }}>
                  {room.orId}
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{room.name}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{room.department}</span>
                </div>
              </div>

              <span className={`badge ${room.status === 'AVAILABLE' ? 'badge-available' : (room.status === 'OCCUPIED' ? 'badge-occupied' : 'badge-maintenance')}`}>
                {room.status}
              </span>
            </div>

            {/* Surgeries Timeline Items */}
            {roomSurgeries.length === 0 ? (
              <div style={{ padding: '1rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                No surgeries currently scheduled for this Operating Room.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {roomSurgeries.map(surg => {
                  const sTimeStr = new Date(surg.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const eTimeStr = new Date(surg.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateStr = new Date(surg.startTime).toLocaleDateString();
                  const isEmergency = surg.priority === 1;

                  return (
                    <div
                      key={surg._id || surg.surgeryId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        background: isEmergency ? 'var(--emergency-bg)' : '#f8fafc',
                        border: isEmergency ? '1px solid var(--emergency-border)' : '1px solid var(--border)',
                        flexWrap: 'wrap',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          minWidth: '130px',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          color: isEmergency ? 'var(--emergency)' : 'var(--primary)'
                        }}>
                          <div>{dateStr}</div>
                          <div>{sTimeStr} - {eTimeStr}</div>
                        </div>

                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>{surg.surgeryType}</span>
                            <span className={`badge badge-${surg.priorityLabel ? surg.priorityLabel.toLowerCase() : 'normal'}`}>
                              {surg.priorityLabel || 'NORMAL'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            👤 Patient: <strong>{surg.patientName}</strong> ({surg.patientId}) • 👨‍⚕️ Surgeon: {surg.doctorName}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className={`badge badge-${(surg.status || 'SCHEDULED').toLowerCase()}`}>
                          {surg.status}
                        </span>

                        {onViewDetails && (
                          <button
                            onClick={() => onViewDetails(surg)}
                            className="btn btn-secondary btn-sm"
                            title="View Surgery Details"
                          >
                            <Eye size={14} /> Details
                          </button>
                        )}
                        {onReschedule && (
                          <button
                            onClick={() => onReschedule(surg)}
                            className="btn btn-secondary btn-sm"
                          >
                            Reschedule
                          </button>
                        )}
                        {onCancel && (
                          <button
                            onClick={() => onCancel(surg)}
                            className="btn btn-outline btn-sm"
                            style={{ color: 'var(--emergency)', borderColor: 'var(--emergency-border)' }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ScheduleTimeline;
