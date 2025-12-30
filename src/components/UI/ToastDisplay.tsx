import React from 'react';
import { useToast, Toast } from '../../context/ToastContext';
import '../../styles/toast.css';

const ToastDisplay: React.FC = () => {
  const { toasts, removeToast } = useToast();

  const getToastStyles = (type: Toast['type']) => {
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
    };

    const typeStyles: Record<Toast['type'], React.CSSProperties> = {
      success: {
        ...baseStyles,
        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.95) 0%, rgba(34, 197, 94, 0.85) 100%)',
        border: '1px solid rgba(34, 197, 94, 0.9)',
        color: '#fff',
      },
      error: {
        ...baseStyles,
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(239, 68, 68, 0.85) 100%)',
        border: '1px solid rgba(239, 68, 68, 0.9)',
        color: '#fff',
      },
      warning: {
        ...baseStyles,
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.95) 0%, rgba(139, 92, 246, 0.85) 100%)',
        border: '1px solid rgba(168, 85, 247, 0.9)',
        color: '#fff',
      },
      info: {
        ...baseStyles,
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(59, 130, 246, 0.85) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.9)',
        color: '#fff',
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
          <span style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{getIcon(toast.type)}</span>
          <span style={{ flex: 1, color: 'var(--text)' }}>{toast.message}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeToast(toast.id);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text)',
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
