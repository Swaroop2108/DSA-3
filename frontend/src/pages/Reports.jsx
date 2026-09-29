import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import StatCard from '../components/Common/StatCard';
import { BarChart3, Calendar, BedDouble, Stethoscope, Clock, Users, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

const Reports = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState('week');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard', { replace: true });
      return;
    }
    fetchReports();
  }, [timeframe, isAdmin]);


  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/reports?timeframe=${timeframe}`);
      if (res.data.success) {
        setReportData(res.data.report);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hospital Reports & Resource Analytics</h1>
          <p className="page-subtitle">Hospital metrics for admissions, bed utilization, OR efficiency, and scheduling analytics.</p>
        </div>

        {/* Timeframe Selector */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['today', 'week', 'month'].map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`btn ${timeframe === tf ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}
            >
              {tf === 'today' ? 'Today' : (tf === 'week' ? 'This Week' : 'This Month')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>Generating Resource Reports...</div>
      ) : (
        <div>
          {/* Key Metric Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
            marginBottom: '1.75rem'
          }}>
            <StatCard title="Total Admissions" value={reportData?.totalAdmissions || 0} icon={Users} color="#0284c7" subtitle={`Filter: ${timeframe}`} />
            <StatCard title="Bed Utilization Rate" value={`${reportData?.bedUtilizationRate || 0}%`} icon={BedDouble} color="#0d9488" subtitle={`${reportData?.beds?.occupied || 0} / ${reportData?.beds?.total || 0} Beds Occupied`} />
            <StatCard title="OR Utilization Rate" value={`${reportData?.orUtilizationRate || 0}%`} icon={Stethoscope} color="#8b5cf6" subtitle={`${reportData?.ors?.occupied || 0} / ${reportData?.ors?.total || 0} ORs Active`} />
            <StatCard title="Total Surgeries" value={reportData?.totalSurgeries || 0} icon={BarChart3} color="#2563eb" subtitle={`${reportData?.emergencySurgeries || 0} Emergency Procedures`} />
            <StatCard title="Avg Surgery Duration" value={`${reportData?.avgSurgeryDuration || 0}m`} icon={Clock} color="#10b981" subtitle="Minutes per procedure" />
            <StatCard title="Staff Utilization" value={`${reportData?.staffUtilizationRate || 0}%`} icon={Activity} color="#d97706" subtitle="Active Shift Duty" />
          </div>

          {/* Graphical Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
            <div className="card">
              <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>🛏️ Bed Inventory Breakdown</h3>
              <div style={{ height: 240, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { category: 'Available', count: reportData?.beds?.available || 0, fill: '#10b981' },
                    { category: 'Occupied', count: reportData?.beds?.occupied || 0, fill: '#ef4444' },
                    { category: 'Maintenance', count: reportData?.beds?.maintenance || 0, fill: '#eab308' }
                  ]}>
                    <XAxis dataKey="category" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {[
                        { category: 'Available', fill: '#10b981' },
                        { category: 'Occupied', fill: '#ef4444' },
                        { category: 'Maintenance', fill: '#eab308' }
                      ].map((entry, index) => (
                        <Cell key={`bed-cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>🏥 Operating Rooms Breakdown</h3>
              <div style={{ height: 240, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { category: 'Available', count: reportData?.ors?.available || 0, fill: '#10b981' },
                    { category: 'Occupied', count: reportData?.ors?.occupied || 0, fill: '#ef4444' },
                    { category: 'Maintenance', count: reportData?.ors?.maintenance || 0, fill: '#eab308' }
                  ]}>
                    <XAxis dataKey="category" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {[
                        { category: 'Available', fill: '#10b981' },
                        { category: 'Occupied', fill: '#ef4444' },
                        { category: 'Maintenance', fill: '#eab308' }
                      ].map((entry, index) => (
                        <Cell key={`or-cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
