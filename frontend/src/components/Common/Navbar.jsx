import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, LogOut } from 'lucide-react';
import API from '../../services/api';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/audit/notifications');
      if (res.data.success) {
        const rawNotifs = res.data.notifications || [];
        const filtered = rawNotifs.filter(n => {
          if (isAdmin) {
            // Admin sees admin notifications and general notifications
            return !n.assignedStaffId && !n.assignedStaffName || n.targetRole === 'admin';
          } else {
            // Staff sees notifications assigned specifically to them
            if (n.targetRole === 'admin') return false;
            if (n.assignedStaffId && user?.staffId && n.assignedStaffId === user.staffId) return true;
            if (n.assignedStaffName && user?.name && n.assignedStaffName.toLowerCase() === user.name.toLowerCase()) return true;
            if (user?.email === 'staff@medischedule.com' && (n.assignedStaffName === 'Nurse John Miller' || n.assignedStaffId === 'STF-111')) return true;
            if (!n.assignedStaffId && !n.assignedStaffName && !n.targetRole) return true;
            return false;
          }
        });
        setNotifications(filtered);
        setUnreadCount(filtered.filter(n => !n.read).length);
      }
    } catch (err) {
      // ignore
    }
  };

  const markAsRead = async (id) => {
    try {
      await API.put(`/audit/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      // ignore
    }
  };

  return (
    <header style={{
      height: '70px',
      background: '#ffffff',
      borderBottom: '1px solid var(--border)',
      padding: '0 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      position: 'sticky',
      top: 0,
      zIndex: 90
    }}>
      {/* User Actions & Notifications */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>


        {/* Notifications dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            style={{
              position: 'relative',
              background: '#f1f5f9',
              padding: '0.5rem',
              borderRadius: '50%',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                background: 'var(--emergency)',
                color: '#fff',
                borderRadius: '50%',
                fontSize: '0.7rem',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '50px',
              width: '340px',
              background: '#ffffff',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border)',
              zIndex: 200,
              overflow: 'hidden'
            }}>
              <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Notifications</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 500 }}>{unreadCount} unread</span>
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No notifications available.
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n._id || n.notificationId}
                      onClick={() => markAsRead(n._id || n.notificationId)}
                      style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid #f1f5f9',
                        background: n.read ? '#ffffff' : '#f0fdf4',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Info & Role Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '0.75rem', borderLeft: '1px solid var(--border)' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'var(--primary-light)',
            color: 'var(--primary-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.95rem'
          }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {user?.name || 'User'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className={`badge ${isAdmin ? 'badge-emergency' : 'badge-available'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem' }}>
                {user?.role || 'Staff'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.department}</span>
            </div>
          </div>

          <button
            onClick={logout}
            title="Logout"
            style={{
              background: 'transparent',
              color: 'var(--text-muted)',
              padding: '0.4rem',
              borderRadius: 'var(--radius-sm)',
              marginLeft: '0.5rem'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--emergency)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
