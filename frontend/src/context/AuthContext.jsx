import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('medischedule_current_user') || localStorage.getItem('medischedule_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('medischedule_current_user') || localStorage.getItem('medischedule_user');
    if (savedUser) {
      API.get('/auth/me')
        .then(res => {
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('medischedule_current_user', JSON.stringify(res.data.user));
            localStorage.setItem('medischedule_user', JSON.stringify(res.data.user));
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password, role) => {
    try {
      const normalizedRole = (role || 'admin').toLowerCase();
      const res = await API.post('/auth/login', { email, password, role: normalizedRole });
      if (res.data.success) {
        const { token, user: userData } = res.data;
        localStorage.setItem('medischedule_token', token || 'local-demo-token');
        localStorage.setItem('medischedule_current_user', JSON.stringify(userData));
        localStorage.setItem('medischedule_user', JSON.stringify(userData));
        setUser(userData);
        return userData;
      }
      throw new Error(res.data?.message || 'Login failed');
    } catch (err) {
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      throw new Error(err.message || 'Invalid email or password credentials.');
    }
  };

  const logout = () => {
    localStorage.removeItem('medischedule_token');
    localStorage.removeItem('medischedule_current_user');
    localStorage.removeItem('medischedule_user');
    setUser(null);
  };

  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const isStaff = user?.role?.toLowerCase() === 'staff';

  const hasPermission = (permission) => {
    if (!user) return false;
    if (isAdmin) return true; // Admin has all permissions
    // Staff restricted permissions
    if (['modify_beds', 'allocate_bed', 'release_bed', 'reserve_bed', 'maintenance_bed',
         'modify_ors', 'update_or_status', 'create_or', 'view_reports',
         'modify_patients', 'add_patient', 'edit_patient', 'delete_patient', 'allocate_patient_bed',
         'modify_staff', 'add_staff', 'edit_staff', 'delete_staff', 'update_staff_status'].includes(permission)) {
      return false;
    }
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin, isStaff, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

