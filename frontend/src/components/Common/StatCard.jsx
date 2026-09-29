import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = '#0f766e', subtitle, trend }) => {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.25rem' }}>
          {title}
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.1 }}>
          {value}
        </div>
        {subtitle && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            {subtitle}
          </div>
        )}
      </div>

      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: 'var(--radius-md)',
        background: `${color}15`, // 15% opacity tint
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {Icon && <Icon size={24} />}
      </div>
    </div>
  );
};

export default StatCard;
