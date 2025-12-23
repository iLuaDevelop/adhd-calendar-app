import React from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  console.log('[Modal] ===== MODAL COMPONENT CALLED =====', 'isOpen:', isOpen);
  if (!isOpen) {
    console.log('[Modal] isOpen is false, returning null');
    return null;
  }

  const modalContent = (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
      <div style={{ backgroundColor: 'var(--panel)', borderRadius: '12px', padding: '24px', zIndex: 10000, maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)', border: '1px solid var(--border)' }}>
        {title && <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px', color: 'var(--accent)' }}>{title}</h2>}
        <div>{children}</div>
        <button 
          style={{ marginTop: '16px', backgroundColor: 'var(--accent)', color: 'white', borderRadius: '6px', padding: '10px 20px', border: 'none', cursor: 'pointer', fontWeight: 500 }}
          onClick={onClose}
          onMouseOver={(e) => (e.currentTarget.style.opacity = '0.8')}
          onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Close
        </button>
      </div>
    </div>
  );

  console.log('[Modal] Creating portal, target:', document.body);
  const portal = createPortal(modalContent, document.body);
  console.log('[Modal] Portal created:', portal);
  return portal;
};

export default Modal;