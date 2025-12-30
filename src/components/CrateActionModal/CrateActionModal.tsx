import React from 'react';
import Button from '../UI/Button';

interface CrateActionModalProps {
  isOpen: boolean;
  tierEmoji: string;
  tierName: string;
  cost: number;
  costType: 'xp' | 'gems';
  onOpenNow: () => void;
  onStoreInventory: () => void;
  onClose: () => void;
}

const CrateActionModal: React.FC<CrateActionModalProps> = ({
  isOpen,
  tierEmoji,
  tierName,
  cost,
  costType,
  onOpenNow,
  onStoreInventory,
  onClose,
}) => {
  if (!isOpen) return null;

  const costDisplay = costType === 'xp' ? `${cost} XP` : `${cost} 💎`;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="panel"
        style={{
          padding: 32,
          maxWidth: 400,
          textAlign: 'center',
          background: 'var(--bg)',
          border: '2px solid var(--accent)',
          borderRadius: 12,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>{tierEmoji}</div>
        
        <h2 style={{ margin: '0 0 8px 0', fontSize: '1.8rem' }}>
          {tierName} Crate
        </h2>
        
        <div
          style={{
            fontSize: '1.2rem',
            color: 'var(--muted)',
            marginBottom: 24,
            padding: 12,
          }}
        >
          Cost: <span style={{ fontWeight: 'bold', color: costType === 'xp' ? '#6366f1' : '#ec4899' }}>{costDisplay}</span>
        </div>

        <p style={{ color: 'var(--muted)', marginBottom: 24, fontSize: '0.95rem' }}>
          What would you like to do?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Button
            onClick={() => {
              onOpenNow();
              onClose();
            }}
            style={{ width: '100%', padding: '12px 16px' }}
          >
            🎉 Purchase & Open Now
          </Button>
          <Button
            onClick={() => {
              onStoreInventory();
              onClose();
            }}
            variant="ghost"
            style={{ width: '100%', padding: '12px 16px' }}
          >
            🎒 Purchase & Store in Inventory
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            style={{ width: '100%', padding: '12px 16px', opacity: 0.7 }}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CrateActionModal;
