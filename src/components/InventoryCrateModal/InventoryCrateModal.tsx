import React, { useState } from 'react';
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
  const [triggerAnimation, setTriggerAnimation] = useState(false);

  if (!isOpen) return null;

  const tierEmojis = {
    bronze: '📦',
    silver: '🎁',
    gold: '💎',
    platinum: '🌟',
  };

  const handleOpenCrate = () => {
    setTriggerAnimation(true);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
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
          padding: 32,
          maxWidth: 300,
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
      >
        <h2 style={{ margin: '0 0 24px 0', fontSize: '1.5rem' }}>
          {tierEmojis[tier]} {tier.charAt(0).toUpperCase() + tier.slice(1)} Crate
        </h2>

        {/* LootCrate Component for animation */}
        <div style={{ marginBottom: 24 }}>
          <LootCrate
            tier={tier}
            cost={0}
            costType="gems"
            rewards={rewards}
            onOpen={(reward) => {
              onRewardReceived(reward);
              setTriggerAnimation(false);
            }}
            isDisabled={false}
            isFree={true}
            triggerAnimation={triggerAnimation}
          />
        </div>

        {/* Button to start animation */}
        {!triggerAnimation && (
          <Button
            variant="primary"
            onClick={handleOpenCrate}
            style={{ width: '100%', marginBottom: 12 }}
          >
            🎉 Open Crate
          </Button>
        )}

        {/* Close button */}
        <Button
          variant="ghost"
          onClick={onClose}
          style={{ width: '100%' }}
        >
          Close
        </Button>
      </div>
    </div>
  );
};

export default InventoryCrateModal;
