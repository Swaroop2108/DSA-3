import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, Users, BedDouble, Stethoscope, 
  CalendarClock, AlertTriangle, AlertCircle, UserCheck, 
  BarChart3, Activity, ClipboardList, Wrench 
} from 'lucide-react';

const Sidebar = () => {
  const { user, isAdmin } = useAuth();

  const allNavItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Patients', path: '/patients', icon: Users },
    { label: 'Bed Grid & Allocation', path: '/beds', icon: BedDouble },
    { label: 'Operating Rooms', path: '/ors', icon: Stethoscope },
    { label: 'Surgery Schedule', path: '/surgeries', icon: CalendarClock },
    { label: 'Emergency Center', path: '/emergency', icon: AlertCircle, highlight: true },
    { label: 'Staff Management', path: '/staff', icon: UserCheck },
    { label: 'Staff Instructions', path: '/instructions', icon: ClipboardList },
    { label: 'Equipment Availability', path: '/equipment', icon: Wrench },
    { label: 'Conflicts', path: '/conflicts', icon: AlertTriangle },
    { label: 'Reports & Analytics', path: '/reports', icon: BarChart3, adminOnly: true },
    { label: 'Audit Logs', path: '/audit-logs', icon: Activity, adminOnly: true }
  ];

  const navItems = allNavItems.filter(item => isAdmin || !item.adminOnly);


  return (
    <aside style={{
      width: '260px',
      background: 'var(--bg-sidebar)',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      flexShrink: 0
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '1.5rem 1.5rem 1.25rem',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: '1.25rem',
          boxShadow: '0 4px 12px rgba(13, 148, 136, 0.4)'
        }}>
          🏥
        </div>
        <div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#ffffff', letterSpacing: '-0.02em' }}>
            MediSchedule
          </div>
          <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Smart Hospital Management
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{ padding: '1.25rem 0.85rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div style={{ padding: '0 0.75rem 0.5rem', fontSize: '0.68rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>
          Main Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                color: isActive ? '#ffffff' : (item.highlight ? '#fca5a5' : '#94a3b8'),
                background: isActive ? 'var(--bg-sidebar-active)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.88rem',
                transition: 'all 0.15s ease',
                borderLeft: isActive ? '3px solid var(--primary-hover)' : '3px solid transparent'
              })}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon size={18} style={{ color: item.highlight ? '#ef4444' : 'inherit' }} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span style={{
                  background: 'var(--primary)',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '4px',
                  fontWeight: 700
                }}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Project Footer Info */}
      <div style={{
        padding: '1rem 1.25rem',
        borderTop: '1px solid #1e293b',
        background: '#090d16',
        fontSize: '0.75rem',
        color: '#64748b'
      }}>
        <div style={{ fontWeight: 600, color: '#94a3b8', marginBottom: '0.2rem' }}>
          MediSchedule System
        </div>
        <div>Hospital Resource & Surgery Scheduler</div>
      </div>
    </aside>
  );
};

export default Sidebar;
