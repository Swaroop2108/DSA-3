import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Admin');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password, role);
      if (user.role?.toLowerCase() === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const autofillAdmin = () => {
    setEmail('admin@medischedule.com');
    setPassword('admin123');
    setRole('Admin');
  };

  const autofillStaff = () => {
    setEmail('staff@medischedule.com');
    setPassword('staff123');
    setRole('Staff');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f766e 100%)',
      padding: '1.5rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        overflow: 'hidden'
      }}>
        {/* Header Branding */}
        <div style={{
          background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
          color: '#ffffff',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.85rem',
            fontSize: '1.75rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            🏥
          </div>
          <h2 style={{ color: '#ffffff', fontSize: '1.65rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            MediSchedule
          </h2>
          <p style={{ color: '#ccfbf1', fontSize: '0.85rem', marginTop: '0.2rem', fontWeight: 400 }}>
            Smart Hospital Resource Management & Scheduling System
          </p>
        </div>

        {/* Login Form */}
        <div style={{ padding: '2rem' }}>
          {error && (
            <div style={{
              background: 'var(--emergency-bg)',
              border: '1px solid var(--emergency-border)',
              color: 'var(--emergency)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Role Switcher Tabs */}
            <div className="form-group">
              <label className="form-label">Select Role</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setRole('Admin')}
                  className={`btn ${role === 'Admin' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                >
                  <ShieldCheck size={16} /> Admin
                </button>
                <button
                  type="button"
                  onClick={() => setRole('Staff')}
                  className={`btn ${role === 'Staff' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                >
                  <UserCheck size={16} /> Staff
                </button>
              </div>
            </div>

            {/* Email Field */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  required
                  placeholder="name@medischedule.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '2.4rem', width: '100%' }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '2.4rem', width: '100%' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {loading ? 'Authenticating...' : `Login as ${role}`}
            </button>
          </form>

          {/* Quick Demo Credentials Autofill Helper */}
          <div style={{
            marginTop: '1.75rem',
            padding: '1rem',
            background: '#f8fafc',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            fontSize: '0.8rem'
          }}>
            <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              🔑 Quick Demo Credentials
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span><strong>Admin:</strong> admin@medischedule.com</span>
                <button
                  type="button"
                  onClick={autofillAdmin}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}
                >
                  Autofill Admin
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span><strong>Staff:</strong> staff@medischedule.com</span>
                <button
                  type="button"
                  onClick={autofillStaff}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}
                >
                  Autofill Staff
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
