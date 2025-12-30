import React from 'react';
import LootCrate from '../UI/LootCrate';
import Button from '../UI/Button';

interface InventoryCrateModalProps {
  isOpen: boolean;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  rewards: Array<{ type: 'xp' | 'gems'; amount: number }>;
  onClose: () => void;
  onRewardReceived: (reward: { type: 'xp' | 'gems'; amount: number }) => void;
}

const InventoryCrateModal: React.FC<InventoryCrateModalProps> = ({
  isOpen,
  tier,
  rewards,
  onClose,
  onRewardReceived,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => {
        // Only close if clicking the background, not the modal itself
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="panel"
        style={{
          padding: 24,
          maxWidth: 320,
          textAlign: 'center',
          background: 'var(--panel)',
          border: '1px solid var(--border)',
        }}
      >
        {/* LootCrate Component for animation */}
        <div style={{ marginBottom: 16 }}>
          <LootCrate
            tier={tier}
            cost={0}
            costType="gems"
            rewards={rewards}
            onOpen={(reward) => {
              onRewardReceived(reward);
            }}
            isDisabled={false}
            isFree={true}
            hideCloseButton={true}
          />
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          onClick={onClose}
          style={{ width: '100%', fontSize: '0.9rem' }}
        >
          Close
        </Button>
      </div>
    </div>
  );
};

export default InventoryCrateModal;
