import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContainer = ({ toasts = [], removeToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        let Icon = Info;
        let className = 'toast-info';

        if (toast.type === 'EMERGENCY') {
          Icon = AlertCircle;
          className = 'toast-emergency';
        } else if (toast.type === 'SUCCESS') {
          Icon = CheckCircle;
          className = 'toast-success';
        } else if (toast.type === 'WARNING') {
          Icon = AlertTriangle;
          className = 'toast-warning';
        }

        return (
          <div key={toast.id} className={`toast ${className}`}>
            <Icon size={20} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {toast.title}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                {toast.message}
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{ background: 'transparent', color: 'var(--text-muted)' }}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
