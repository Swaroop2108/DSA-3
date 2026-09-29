import React, { useState, useEffect } from 'react';
import API from '../services/api';
import StatCard from '../components/Common/StatCard';
import { useAuth } from '../context/AuthContext';
import { 
  Users, BedDouble, Stethoscope, CalendarClock, AlertCircle, 
  UserCheck, AlertTriangle, Activity, ArrowRight, ShieldAlert, ClipboardList, CheckCircle, Clock 
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [instructions, setInstructions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    const interval = setInterval(fetchDashboardStats, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [statsRes, instRes] = await Promise.all([
        API.get('/dashboard/stats'),
        API.get('/instructions')
      ]);
      if (statsRes.data.success) {
        setData(statsRes.data);
      }
      if (instRes.data.success) {
        setInstructions(instRes.data.instructions || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="badge badge-scheduled" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
            Loading MediSchedule Dashboard Data...
          </div>
        </div>
      </div>
    );
  }

  const { stats, charts, sections } = data || {};

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hospital Administration Dashboard</h1>
          <p className="page-subtitle">Real-time resource utilization, priority queues, and surgery schedules.</p>
        </div>
        <div>
          <NavLink to="/emergency" className="btn btn-danger btn-sm">
            🚨 Emergency Center ({stats?.emergencyCases || 0})
          </NavLink>
        </div>
      </div>

      {/* Dynamic Statistics Cards Grid (10 Stats) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '1.75rem'
      }}>
        <StatCard title="Total Patients" value={stats?.totalPatients || 0} icon={Users} color="#0284c7" subtitle="Registered Patients" />
        <StatCard title="Admitted Patients" value={stats?.admittedPatients || 0} icon={UserCheck} color="#0d9488" subtitle="Active Admissions" />
        <StatCard title="Available Beds" value={stats?.availableBeds || 0} icon={BedDouble} color="#10b981" subtitle={`Out of ${stats?.totalBeds || 0} Total Beds`} />
        <StatCard title="Occupied Beds" value={stats?.occupiedBeds || 0} icon={BedDouble} color="#ef4444" subtitle="Currently Occupied" />
        <StatCard title="Available ORs" value={`${stats?.availableORs || 0} / ${stats?.totalORs || 0}`} icon={Stethoscope} color="#8b5cf6" subtitle="Operating Rooms" />
        <StatCard title="Scheduled Surgeries" value={stats?.scheduledSurgeries || 0} icon={CalendarClock} color="#2563eb" subtitle="Active Procedures" />
        <StatCard title="Emergency Cases" value={stats?.emergencyCases || 0} icon={AlertCircle} color="#dc2626" subtitle="Priority 1 Patients" />
        <StatCard title="Available Staff" value={stats?.availableStaff || 0} icon={UserCheck} color="#059669" subtitle="On-Duty Medical Staff" />
        <StatCard title="Scheduling Conflicts" value={stats?.schedulingConflicts || 0} icon={AlertTriangle} color="#d97706" subtitle="Requires Attention" />
      </div>

      {/* Staff Instructions Overview Section (Requirement 8, 9, 12, 16, 17) */}
      <div className="card" style={{ marginBottom: '1.75rem', borderLeft: '4px solid var(--primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ClipboardList size={20} style={{ color: 'var(--primary)' }} />
              {isAdmin ? 'Staff Instructions Overview' : 'Instructions from Admin'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
              {isAdmin 
                ? `Total Instructions: ${instructions.length} | Pending: ${instructions.filter(i => i.status === 'PENDING').length} | Completed: ${instructions.filter(i => i.status === 'COMPLETED').length}`
                : `Assigned to ${user?.name || 'Staff'}: ${instructions.filter(i => i.status === 'PENDING').length} Pending • ${instructions.filter(i => i.status === 'COMPLETED').length} Completed`}
            </p>
          </div>
          <NavLink to="/instructions" className="btn btn-primary btn-sm">
            {isAdmin ? 'Manage Instructions' : 'View Instructions'} <ArrowRight size={14} />
          </NavLink>
        </div>

        {instructions.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No instructions available at this time.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem', marginTop: '0.75rem' }}>
            {instructions.slice(0, 3).map(inst => (
              <div key={inst._id || inst.instructionId} style={{
                padding: '0.75rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                background: '#f8fafc',
                border: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{inst.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Assigned to: {inst.assignedStaffName} • Priority: {inst.priority}
                  </div>
                </div>
                <span className={`badge ${inst.status === 'PENDING' ? 'badge-occupied' : 'badge-available'}`} style={{ fontSize: '0.65rem' }}>
                  {inst.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>


      {/* Analytics Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '1.5rem',
        marginBottom: '1.75rem'
      }}>
        {/* Chart 1: Bed Occupancy by Ward */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
            🛏️ Bed Occupancy Distribution by Ward
          </h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.bedOccupancyByWard || []}>
                <XAxis dataKey="ward" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Bar dataKey="occupied" name="Occupied" fill="#ef4444" stackId="a" radius={[0, 0, 4, 4]} />
                <Bar dataKey="available" name="Available" fill="#10b981" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Patient Priority Distribution (Pie Chart) */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
            🎯 Patient Priority Queue Breakdown
          </h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.patientPriorityDistribution || []}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={50}
                  paddingAngle={4}
                  label={({ name, count }) => `${name}: ${count}`}
                >
                  {(charts?.patientPriorityDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sections Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Today's Schedule */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem' }}>🏥 Today's Surgery Schedule</h3>
            <NavLink to="/surgeries" style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              View All <ArrowRight size={14} />
            </NavLink>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {sections?.todaysSchedule?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No surgeries scheduled for today.</p>
            ) : (
              sections?.todaysSchedule?.map(s => (
                <div key={s._id || s.surgeryId} style={{
                  padding: '0.75rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  background: '#f8fafc',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{s.surgeryType}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {s.patientName} • {s.orId} • {s.doctorName}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>
                      {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <span className={`badge badge-${s.priorityLabel?.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                      {s.priorityLabel}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Emergency Cases */}
        <div className="card" style={{ borderLeft: '4px solid var(--emergency)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--emergency)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={20} /> 🚨 Active Emergency Cases
            </h3>
            <NavLink to="/emergency" className="btn btn-danger btn-sm" style={{ fontSize: '0.75rem' }}>
              Schedule Emergency
            </NavLink>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {sections?.emergencyCases?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No active emergency cases requiring scheduling.</p>
            ) : (
              sections?.emergencyCases?.map(p => (
                <div key={p._id || p.patientId} style={{
                  padding: '0.75rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--emergency-bg)',
                  border: '1px solid var(--emergency-border)',
                  display: 'flex',
                  justifyConstraints: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{p.name} ({p.patientId})</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Diagnosis: <strong>{p.diagnosis}</strong> | Dept: {p.department}
                    </div>
                  </div>
                  <span className="badge badge-emergency">EMERGENCY</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
