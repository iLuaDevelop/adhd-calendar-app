import React, { useState } from 'react';
import '../../styles/lootcrate.css';

interface LootReward {
  type: 'xp' | 'gems';
  amount: number;
}

interface LootCrateProps {
  tier: 'bronze' | 'silver' | 'gold';
  cost: number;
  costType: 'xp' | 'gems';
  rewards: LootReward[];
  onOpen: (reward: LootReward) => void;
  onBeforePurchase?: () => void;
  isDisabled: boolean;
  isFree?: boolean;
  cooldownMs?: number;
  lastOpenedTime?: number;
  triggerAnimation?: boolean;
  hideCloseButton?: boolean;
}

const LootCrate: React.FC<LootCrateProps> = ({
  tier,
  cost,
  costType,
  rewards,
  onOpen,
  onBeforePurchase,
  isDisabled,
  isFree = false,
  cooldownMs = 0,
  lastOpenedTime = 0,
  triggerAnimation = false,
  hideCloseButton = false,
}) => {
  const [isOpening, setIsOpening] = useState(false);
  const [selectedReward, setSelectedReward] = useState<LootReward | null>(null);
  const [scrollIndex, setScrollIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const animationTriggeredRef = React.useRef(false);

  // Handle external trigger for animation
  React.useEffect(() => {
    console.log(`[${tier}] triggerAnimation:`, triggerAnimation, 'animationTriggeredRef:', animationTriggeredRef.current);
    
    if (!triggerAnimation || animationTriggeredRef.current) {
      console.log(`[${tier}] Skipping animation - triggerAnimation: ${triggerAnimation}, ref: ${animationTriggeredRef.current}`);
      return;
    }

    console.log(`[${tier}] Starting animation`);
    animationTriggeredRef.current = true;

    setIsOpening(true);
    setScrollIndex(0);
    setSelectedReward(null);

    // Simulate scrolling through rewards
    let currentIndex = 0;
    const scrollInterval = setInterval(() => {
      currentIndex += 1;
      setScrollIndex(currentIndex % rewards.length);
    }, 100);

    // After 2 seconds of scrolling, pick a random reward
    const timeoutId = setTimeout(() => {
      clearInterval(scrollInterval);
      const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
      console.log(`[${tier}] Animation complete, picked reward:`, randomReward);
      setSelectedReward(randomReward);
      onOpen(randomReward);
    }, 2000);

    return () => {
      clearInterval(scrollInterval);
      clearTimeout(timeoutId);
      console.log(`[${tier}] useEffect cleanup`);
    };
  }, [triggerAnimation, rewards, onOpen, tier]);

  // Reset ref when animation is no longer triggered - but DON'T reset the selected reward
  // Let the user click Close to reset it manually
  React.useEffect(() => {
    if (!triggerAnimation && animationTriggeredRef.current) {
      console.log(`[${tier}] Animation trigger cleared, but keeping selectedReward visible for user to close`);
      animationTriggeredRef.current = false;
      setIsOpening(false);
    }
  }, [triggerAnimation, tier]);

  // Calculate if free crate is available
  React.useEffect(() => {
    if (!isFree) return;

    const checkCooldown = () => {
      const now = Date.now();
      const timeSinceLastOpen = now - lastOpenedTime;
      const remaining = Math.max(0, cooldownMs - timeSinceLastOpen);
      setTimeRemaining(remaining);
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, [isFree, lastOpenedTime, cooldownMs]);

  const tierColors = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
  };

  const tierEmojis = {
    bronze: '📦',
    silver: '🎁',
    gold: '💎',
  };

  const handleOpen = () => {
    if (isDisabled || isOpening) return;
    if (isFree && timeRemaining > 0) return;

    // For paid crates, show purchase modal first
    if (!isFree && onBeforePurchase) {
      onBeforePurchase();
      return;
    }

    setIsOpening(true);
    setScrollIndex(0);

    // Simulate scrolling through rewards
    let currentIndex = 0;
    const scrollInterval = setInterval(() => {
      currentIndex += 1;
      setScrollIndex(currentIndex % rewards.length);
    }, 100);

    // After 2 seconds of scrolling, pick a random reward
    setTimeout(() => {
      clearInterval(scrollInterval);
      const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
      setSelectedReward(randomReward);
      onOpen(randomReward);
    }, 2000);
  };

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getRewardDisplay = (reward: LootReward) => {
    if (reward.type === 'xp') {
      return `${reward.amount} XP`;
    } else {
      return `${reward.amount} 💎`;
    }
  };

  const crateEmoji = tierEmojis[tier];
  const crateColor = tierColors[tier];

  return (
    <div className="loot-crate-container">
      <div className="panel" style={{ padding: 16, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <h4 style={{ margin: '0 0 8px 0', textTransform: 'capitalize' }}>
            {crateEmoji} {tier} Crate
          </h4>
          <div className="subtle" style={{ fontSize: '0.9rem', marginBottom: 12 }}>
            Open for random rewards
          </div>
        </div>

        {isOpening && !selectedReward ? (
          <div className="loot-reward-display">
            <div className="reward-scroll" style={{ color: crateColor, fontSize: '1.5rem', fontWeight: 'bold' }}>
              {getRewardDisplay(rewards[scrollIndex])}
            </div>
          </div>
        ) : selectedReward ? (
          <div className="loot-reward-display" style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#22c55e' }}>
              {getRewardDisplay(selectedReward)}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: 8 }}>You won!</div>
          </div>
        ) : (
          <div style={{ fontSize: '3rem', margin: '12px 0' }}>{crateEmoji}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 12 }}>
          {selectedReward && !hideCloseButton ? (
            <button
              onClick={() => {
                setSelectedReward(null);
                setIsOpening(false);
              }}
              className="btn primary"
              style={{
                padding: '8px 16px',
                fontSize: '0.9rem',
                backgroundColor: 'var(--primary)',
                border: '1px solid var(--accent)',
                color: 'white',
                fontWeight: 'bold',
              }}
            >
              Close
            </button>
          ) : !isFree ? (
            <>
              <button
                onClick={handleOpen}
                disabled={isDisabled || isOpening}
                className="btn primary"
                style={{
                  padding: '8px 16px',
                  fontSize: '0.9rem',
                  opacity: isDisabled ? 0.5 : 1,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                }}
              >
                {isOpening ? '...' : 'Purchase'}
              </button>
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: costType === 'xp' ? '#6366f1' : '#ec4899' }}>
                {costType === 'xp' ? `${cost} XP` : `${cost} 💎`}
              </span>
            </>
          ) : (
            <>
              <button
                onClick={handleOpen}
                disabled={isOpening || timeRemaining > 0}
                className="btn primary"
                style={{
                  padding: '8px 16px',
                  fontSize: '0.9rem',
                  opacity: timeRemaining > 0 ? 0.5 : 1,
                  cursor: timeRemaining > 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {isOpening ? '...' : 'Open'}
              </button>
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#22c55e' }}>
                {timeRemaining > 0 ? formatTime(timeRemaining) : 'FREE'}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LootCrate;
