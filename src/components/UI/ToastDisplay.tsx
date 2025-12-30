import React from 'react';
import { useToast, Toast } from '../../context/ToastContext';
import '../../styles/toast.css';

const ToastDisplay: React.FC = () => {
  const { toasts, removeToast } = useToast();

  const getToastStyles = (type: Toast['type']): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      padding: '12px 16px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '0.9rem',
      fontWeight: '500',
      marginBottom: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      animation: 'slideIn 0.3s ease',
      color: '#ffffff',
    };

    const typeStyles: Record<Toast['type'], React.CSSProperties> = {
      success: {
        ...baseStyles,
        background: '#22c55e',
        border: '1px solid #16a34a',
      },
      error: {
        ...baseStyles,
        background: '#ef4444',
        border: '1px solid #dc2626',
      },
      warning: {
        ...baseStyles,
        background: '#a855f7',
        border: '1px solid #7c3aed',
      },
      info: {
        ...baseStyles,
        background: '#3b82f6',
        border: '1px solid #1d4ed8',
      },
    };

    return typeStyles[type];
  };

  const getIcon = (type: Toast['type']) => {
    const icons: Record<Toast['type'], string> = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };
    return icons[type];
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 99999,
        pointerEvents: 'auto',
        maxWidth: '400px',
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={getToastStyles(toast.type)}
          onClick={() => removeToast(toast.id)}
        >
          <span style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#ffffff' }}>{getIcon(toast.type)}</span>
          <span style={{ flex: 1, color: '#ffffff' }}>{toast.message}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeToast(toast.id);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '1.2em',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastDisplay;
