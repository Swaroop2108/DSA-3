import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ React Error Boundary caught an exception:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-main, #f8fafc)',
          padding: '2rem',
          color: 'var(--text-main, #0f172a)'
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            padding: '2.5rem',
            textAlign: 'center',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#fee2e2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <AlertCircle size={32} />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0f172a' }}>
              MediSchedule Notice
            </h2>

            <p style={{ fontSize: '0.92rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              MediSchedule encountered an unexpected application error. You can try refreshing the view.
            </p>

            {this.state.error?.message && (
              <div style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '0.75rem',
                fontSize: '0.8rem',
                fontFamily: 'monospace',
                color: '#334155',
                marginBottom: '1.5rem',
                wordBreak: 'break-word',
                textAlign: 'left'
              }}>
                {this.state.error.message}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.5rem',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={16} /> Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
