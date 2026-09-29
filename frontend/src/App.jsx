import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/Common/ErrorBoundary';
import BackendHealthCheck from './components/Common/BackendHealthCheck';
import Navbar from './components/Common/Navbar';
import Sidebar from './components/Common/Sidebar';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Beds from './pages/Beds';
import OperatingRooms from './pages/OperatingRooms';
import Surgeries from './pages/Surgeries';
import EmergencyCenter from './pages/EmergencyCenter';
import StaffPage from './pages/StaffPage';
import Conflicts from './pages/Conflicts';
import Reports from './pages/Reports';
import AuditLogs from './pages/AuditLogs';
import Instructions from './pages/Instructions';
import EquipmentPage from './pages/EquipmentPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-main)' }}>
        <div className="badge badge-scheduled" style={{ fontSize: '1rem', padding: '0.75rem 1.5rem' }}>
          Initializing MediSchedule Session...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppLayout = ({ children }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        {children}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <BackendHealthCheck>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Login Route */}
              <Route path="/login" element={<Login />} />

              {/* Protected Main Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
              <Route path="/patients" element={<ProtectedRoute><AppLayout><Patients /></AppLayout></ProtectedRoute>} />
              <Route path="/beds" element={<ProtectedRoute><AppLayout><Beds /></AppLayout></ProtectedRoute>} />
              <Route path="/ors" element={<ProtectedRoute><AppLayout><OperatingRooms /></AppLayout></ProtectedRoute>} />
              <Route path="/surgeries" element={<ProtectedRoute><AppLayout><Surgeries /></AppLayout></ProtectedRoute>} />
              <Route path="/emergency" element={<ProtectedRoute><AppLayout><EmergencyCenter /></AppLayout></ProtectedRoute>} />
              <Route path="/staff" element={<ProtectedRoute><AppLayout><StaffPage /></AppLayout></ProtectedRoute>} />
              <Route path="/instructions" element={<ProtectedRoute><AppLayout><Instructions /></AppLayout></ProtectedRoute>} />
              <Route path="/equipment" element={<ProtectedRoute><AppLayout><EquipmentPage /></AppLayout></ProtectedRoute>} />
              <Route path="/conflicts" element={<ProtectedRoute><AppLayout><Conflicts /></AppLayout></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><AdminRoute><AppLayout><Reports /></AppLayout></AdminRoute></ProtectedRoute>} />
              <Route path="/audit-logs" element={<ProtectedRoute><AppLayout><AuditLogs /></AppLayout></ProtectedRoute>} />

              {/* Fallback Catch-all Route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </BackendHealthCheck>
    </ErrorBoundary>
  );
};


export default App;

