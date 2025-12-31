import React, { useState, useEffect } from 'react';
import Button from './Button';
import { getGems, setGems } from '../../services/currency';
import { getXp, setXp } from '../../services/xp';
import { useToast } from '../../context/ToastContext';

const SPIN_WHEEL_KEY = 'adhd_spin_wheel_state';
const SPIN_HISTORY_KEY = 'adhd_spin_history';
const FREE_SPIN_COST = 0;
const PAID_SPIN_COST = 25; // Gems per spin after free spin

interface WheelSegment {
  id: number;
  label: string;
  icon: string;
  color: string;
  reward: { type: 'xp' | 'gems' | 'crate'; amount: number; tier?: string };
}

interface SpinState {
  lastFreeSpinDate: string;
  totalSpins: number;
  canSpinFree: boolean;
}

const segments: WheelSegment[] = [
  { id: 1, label: '50 XP', icon: '⭐', color: '#6366f1', reward: { type: 'xp', amount: 50 } },
  { id: 2, label: '100 XP', icon: '🌟', color: '#a78bfa', reward: { type: 'xp', amount: 100 } },
  { id: 3, label: '15 Gems', icon: '💎', color: '#ec4899', reward: { type: 'gems', amount: 15 } },
  { id: 4, label: '75 XP', icon: '✨', color: '#6366f1', reward: { type: 'xp', amount: 75 } },
  { id: 5, label: '20 Gems', icon: '💎', color: '#f59e0b', reward: { type: 'gems', amount: 20 } },
  { id: 6, label: 'Bronze Crate', icon: '📦', color: '#92400e', reward: { type: 'crate', amount: 1, tier: 'bronze' } },
  { id: 7, label: '150 XP', icon: '🎯', color: '#a78bfa', reward: { type: 'xp', amount: 150 } },
  { id: 8, label: '25 Gems', icon: '💎', color: '#ec4899', reward: { type: 'gems', amount: 25 } },
];

const DailySpinWheel: React.FC = () => {
  const { showToast } = useToast();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinState, setSpinState] = useState<SpinState>(() => {
    const stored = localStorage.getItem(SPIN_WHEEL_KEY);
    if (!stored) {
      return {
        lastFreeSpinDate: '',
        totalSpins: 0,
        canSpinFree: true,
      };
    }
    const state = JSON.parse(stored);
    const today = new Date().toDateString();
    return {
      ...state,
      canSpinFree: state.lastFreeSpinDate !== today,
    };
  });
  const [currentGems, setCurrentGems] = useState(getGems());
  const [currentXp, setCurrentXp] = useState(getXp());
  const [lastReward, setLastReward] = useState<WheelSegment | null>(null);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  const getTodayDate = () => new Date().toDateString();

  const handleSpin = (isPaid: boolean = false) => {
    if (isSpinning) return;

    // Check if user can afford paid spin
    if (isPaid && currentGems < PAID_SPIN_COST) {
      showToast('Not enough gems for a spin!', 'error');
      return;
    }

    // Check if free spin is available
    if (!isPaid && !spinState.canSpinFree) {
      setShowPayModal(true);
      return;
    }

    // If attempting to pay, show modal first
    if (isPaid) {
      setShowPayModal(true);
      return;
    }

    // Proceed with free spin
    executeSpin(false);
  };

  const executeSpin = (isPaid: boolean = false) => {
    setIsSpinning(true);
    setShowPayModal(false);

    // Deduct gems if paid spin
    if (isPaid) {
      const newGems = currentGems - PAID_SPIN_COST;
      setCurrentGems(newGems);
      setGems(newGems);
    }

    // Random segment selection (0-7)
    const winningIndex = Math.floor(Math.random() * segments.length);
    const winningSegment = segments[winningIndex];

    // Calculate rotation (each segment is 45 degrees, plus extra rotations for drama)
    // To bring segment N to the top (0°), rotate by: 360 - (N * 45)
    const segmentAngle = winningIndex * 45;
    const baseRotation = 360 - segmentAngle;
    const extraRotations = 360 * 5; // 5 full rotations
    const finalRotation = extraRotations + baseRotation;

    setRotation(finalRotation);

    // After spin animation completes
    setTimeout(() => {
      setIsSpinning(false);
      setLastReward(winningSegment);
      setShowRewardModal(true);

      // Award the reward
      switch (winningSegment.reward.type) {
        case 'xp':
          const newXp = currentXp + winningSegment.reward.amount;
          setCurrentXp(newXp);
          setXp(newXp);
          break;
        case 'gems':
          const newGemsAfterReward = currentGems + winningSegment.reward.amount;
          setCurrentGems(newGemsAfterReward);
          setGems(newGemsAfterReward);
          break;
        case 'crate':
          // Add crate to inventory
          const inventory = JSON.parse(localStorage.getItem('adhd_inventory') || '{}');
          const tierKey = `${winningSegment.reward.tier}Crates`;
          if (!inventory[tierKey]) inventory[tierKey] = [];
          inventory[tierKey].push({
            id: Date.now(),
            tier: winningSegment.reward.tier,
            unlocked: false,
            rewards: [],
          });
          localStorage.setItem('adhd_inventory', JSON.stringify(inventory));
          break;
      }

      // Update spin state
      const newSpinState: SpinState = {
        ...spinState,
        lastFreeSpinDate: !isPaid ? getTodayDate() : spinState.lastFreeSpinDate,
        canSpinFree: isPaid ? spinState.canSpinFree : false,
        totalSpins: spinState.totalSpins + 1,
      };
      setSpinState(newSpinState);
      localStorage.setItem(SPIN_WHEEL_KEY, JSON.stringify(newSpinState));
    }, 3500);
  };

  const spinsRemainingToday = spinState.canSpinFree ? 1 : 0;

  return (
    <div style={{ marginBottom: 32 }}>
      <div
        className="panel"
        style={{
          padding: 24,
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.1) 100%)',
          border: '2px solid rgba(168, 85, 247, 0.3)',
          borderRadius: 12,
        }}
      >
        <h2 style={{ margin: '0 0 8px 0', fontSize: '1.8rem', textAlign: 'center' }}>
          Daily Wheel Spin
        </h2>
        <div className="subtle" style={{ fontSize: '0.95rem', textAlign: 'center', marginBottom: 24 }}>
          {spinsRemainingToday > 0
            ? '🎉 You have a free spin available!'
            : 'Free spin used today. Spin again for 25 gems!'}
        </div>

        {/* Wheel Container */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <div style={{ position: 'relative', width: 320, height: 320 }}>
            {/* Pointer */}
            <div
              style={{
                position: 'absolute',
                top: -10,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '12px solid transparent',
                borderRight: '12px solid transparent',
                borderTop: '16px solid #ec4899',
                zIndex: 10,
              }}
            />

            {/* Wheel */}
            <svg
              width="320"
              height="320"
              viewBox="0 0 320 320"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? 'transform 3.5s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
                filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))',
                cursor: isSpinning ? 'default' : 'pointer',
              }}
            >
              <circle cx="160" cy="160" r="150" fill="url(#wheelGradient)" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />

              {/* Gradient Definition */}
              <defs>
                <linearGradient id="wheelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#ec4899', stopOpacity: 1 }} />
                </linearGradient>
              </defs>

              {/* Segments */}
              {segments.map((segment, index) => {
                const angle = (index * 360) / segments.length;
                const startAngle = angle - 22.5;
                const endAngle = angle + 22.5;
                const start = {
                  x: 160 + 150 * Math.cos(((startAngle - 90) * Math.PI) / 180),
                  y: 160 + 150 * Math.sin(((startAngle - 90) * Math.PI) / 180),
                };
                const end = {
                  x: 160 + 150 * Math.cos(((endAngle - 90) * Math.PI) / 180),
                  y: 160 + 150 * Math.sin(((endAngle - 90) * Math.PI) / 180),
                };
                const largeArc = endAngle - startAngle > 180 ? 1 : 0;

                return (
                  <g key={segment.id}>
                    {/* Segment Path */}
                    <path
                      d={`M 160 160 L ${start.x} ${start.y} A 150 150 0 ${largeArc} 1 ${end.x} ${end.y} Z`}
                      fill={segment.color}
                      stroke="rgba(0,0,0,0.2)"
                      strokeWidth="2"
                      opacity="0.85"
                    />

                    {/* Text Label - positioned closer to center with smaller font */}
                    <g transform={`translate(160, 160) rotate(${angle})`}>
                      <text
                        x="0"
                        y="-115"
                        textAnchor="middle"
                        fill="white"
                        fontSize="11"
                        fontWeight="bold"
                        style={{ userSelect: 'none', pointerEvents: 'none' }}
                      >
                        {segment.icon}
                      </text>
                      <text
                        x="0"
                        y="-103"
                        textAnchor="middle"
                        fill="white"
                        fontSize="10"
                        fontWeight="bold"
                        style={{ userSelect: 'none', pointerEvents: 'none' }}
                      >
                        {segment.label}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Center Circle - Clickable Button */}
              <g
                onClick={() => !isSpinning && handleSpin(spinState.canSpinFree ? false : true)}
                style={{ cursor: isSpinning ? 'default' : 'pointer' }}
              >
                <circle cx="160" cy="160" r="40" fill="rgba(0,0,0,0.2)" stroke="white" strokeWidth="2" />
                <circle 
                  cx="160" 
                  cy="160" 
                  r="35" 
                  fill={isSpinning ? '#a78bfa' : '#6366f1'} 
                  stroke={isSpinning ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.6)'} 
                  strokeWidth="2"
                  style={{ transition: 'all 0.3s ease' }}
                />
                <text
                  x="160"
                  y="165"
                  textAnchor="middle"
                  fill="white"
                  fontSize="20"
                  fontWeight="bold"
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  SPIN
                </text>
              </g>
            </svg>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: '0.85rem', color: 'var(--muted)' }}>
          Total Spins: {spinState.totalSpins}
        </div>
      </div>

      {/* Pay Gems Confirmation Modal */}
      {showPayModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowPayModal(false)}
        >
          <div
            className="panel"
            style={{
              padding: 40,
              textAlign: 'center',
              maxWidth: 400,
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.95) 0%, rgba(168, 85, 247, 0.95) 100%)',
              border: '3px solid rgba(236, 72, 153, 0.8)',
              animation: 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: '0 20px 60px rgba(236, 72, 153, 0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>💎</div>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.8rem', color: 'white' }}>Spin Again?</h2>
            <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.95)', marginBottom: 24 }}>
              Your free spin is used for today. Spin the wheel again for{' '}
              <span style={{ fontWeight: 'bold', color: '#fbbf24' }}>25 gems</span>?
            </div>
            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', marginBottom: 24 }}>
              Your gems: <span style={{ fontWeight: 'bold', color: '#ffffff' }}>{currentGems}</span>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowPayModal(false)}
                style={{
                  background: 'white',
                  padding: '10px 28px',
                  border: 'none',
                  color: '#6366f1',
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                  cursor: 'pointer',
                  borderRadius: '6px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => executeSpin(true)}
                disabled={currentGems < PAID_SPIN_COST}
                style={{
                  background: currentGems >= PAID_SPIN_COST ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : 'rgba(100,100,100,0.6)',
                  padding: '10px 28px',
                  border: 'none',
                  color: currentGems >= PAID_SPIN_COST ? '#000' : 'white',
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  boxShadow: currentGems >= PAID_SPIN_COST ? '0 4px 12px rgba(0, 0, 0, 0.3)' : 'none',
                  cursor: currentGems >= PAID_SPIN_COST ? 'pointer' : 'not-allowed',
                  borderRadius: '6px',
                }}
              >
                Spin Now 💎
              </button>
            </div>
          </div>
          <style>{`
            @keyframes scaleIn {
              from {
                opacity: 0;
                transform: scale(0.5);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
          `}</style>
        </div>
      )}

      {/* Reward Modal */}
      {showRewardModal && lastReward && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowRewardModal(false)}
        >
          <div
            className="panel"
            style={{
              padding: 40,
              textAlign: 'center',
              maxWidth: 400,
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.95) 0%, rgba(168, 85, 247, 0.95) 100%)',
              border: '3px solid rgba(236, 72, 153, 0.8)',
              animation: 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: '0 20px 60px rgba(236, 72, 153, 0.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>{lastReward.icon}</div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.8rem', color: 'white' }}>🎉 You Won!</h2>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: 16, color: '#fbbf24' }}>
              {lastReward.label}
            </div>
            <div style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.95)', marginBottom: 24 }}>
              {lastReward.reward.type === 'xp' && `+${lastReward.reward.amount} XP added to your profile!`}
              {lastReward.reward.type === 'gems' && `+${lastReward.reward.amount} Gems added to your collection!`}
              {lastReward.reward.type === 'crate' && `${lastReward.reward.tier?.toUpperCase()} crate added to your inventory!`}
            </div>
            <Button
              onClick={() => setShowRewardModal(false)}
              style={{
                background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                padding: '12px 32px',
              }}
            >
              Awesome! 🚀
            </Button>
          </div>
          <style>{`
            @keyframes scaleIn {
              from {
                opacity: 0;
                transform: scale(0.5);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default DailySpinWheel;
