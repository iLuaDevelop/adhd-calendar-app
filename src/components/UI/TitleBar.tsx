import React from 'react';

const TitleBar: React.FC = () => {
  const handleMinimize = () => {
    window.electronAPI?.minimize();
  };

  const handleMaximize = () => {
    window.electronAPI?.maximize();
  };

  const handleClose = () => {
    window.electronAPI?.close();
  };

  return (
    <div style={{
      height: '32px',
      background: 'var(--bg)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      WebkitAppRegion: 'drag' as any,
      userSelect: 'none',
      flexShrink: 0,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
      }}>
        <div style={{
          fontSize: '0.875rem',
          fontWeight: 500,
          color: 'var(--text)',
          letterSpacing: '0.5px',
          WebkitAppRegion: 'no-drag' as any,
        }}>
          ADHD Calendar
        </div>
        <div style={{
          flex: 1,
          WebkitAppRegion: 'drag' as any,
        }} />
        
        {/* Window Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          WebkitAppRegion: 'no-drag' as any,
          marginLeft: '16px',
        }}>
          <button
            onClick={handleMinimize}
            style={{
              width: '32px',
              height: '32px',
              border: 'none',
              background: 'transparent',
              color: 'var(--text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              transition: 'background 0.2s',
              padding: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            title="Minimize"
          >
            −
          </button>
          <button
            onClick={handleMaximize}
            style={{
              width: '32px',
              height: '32px',
              border: 'none',
              background: 'transparent',
              color: 'var(--text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              transition: 'background 0.2s',
              padding: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            title="Maximize"
          >
            ☐
          </button>
          <button
            onClick={handleClose}
            style={{
              width: '32px',
              height: '32px',
              border: 'none',
              background: 'transparent',
              color: 'var(--text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              transition: 'background 0.2s',
              padding: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default TitleBar;
