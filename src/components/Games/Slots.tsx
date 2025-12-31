import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { getGems, addGems } from '../../services/currency';
import { recordCasinoGameResult, getCasinoStats, getStreakBonusGems } from '../../services/casinoStats';

interface SlotsProps {
  onCancel: () => void;
  onGameEnd: (gemsWon: number, gemsLost: number) => void;
}

export const Slots: React.FC<SlotsProps> = ({ onCancel, onGameEnd }) => {
  const { showToast } = useToast();
  const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [bet, setBet] = useState(10);
  const [gems, setGems] = useState(getGems());
  const [reels, setReels] = useState<string[]>(['🍒', '🍒', '🍒']);
  const [spinning, setSpin] = useState<boolean[]>([false, false, false]);
  const [result, setResult] = useState<'win' | 'lose' | null>(null);
  const [winAmount, setWinAmount] = useState(0);

  const symbols = ['🍒', '🍋', '🍊', '🍇', '💎', '👑', '⭐', '🎰'];

  const getPayouts = (symbols: string[]): number => {
    const [r1, r2, r3] = symbols;
    
    if (r1 === r2 && r2 === r3) {
      // All three match
      if (r1 === '💎' || r1 === '👑') return 500; // Jackpot symbols
      if (r1 === '⭐') return 250;
      if (r1 === '🎰') return 200;
      return 100; // Regular symbols
    }
    
    if (r1 === r2 || r2 === r3) {
      // Two match
      return 25;
    }
    
    return 0; // No match
  };

  const spin = () => {
    if (gems < bet) {
      showToast('Not enough gems!', 'error');
      return;
    }

    setGameState('spinning');
    setSpin([true, true, true]);

    // Deduct bet
    const newGems = gems - bet;
    setGems(newGems);
    addGems(-bet);

    // Spin animation timing
    const spinDurations = [400, 500, 600];
    const newReels: string[] = [];

    spinDurations.forEach((duration, index) => {
      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * symbols.length);
        newReels[index] = symbols[randomIndex];
        setSpin(prev => {
          const updated = [...prev];
          updated[index] = false;
          return updated;
        });

        // After last reel stops, calculate result
        if (index === 2) {
          setTimeout(() => {
            setReels(newReels);
            const payout = getPayouts(newReels);
            
            if (payout > 0) {
              const baseWin = payout * (1 + Math.floor(bet / 25) * 0.1);
              const stats = getCasinoStats();
              const streakBonus = getStreakBonusGems(stats.currentWinStreak, baseWin);
              const totalWin = baseWin + streakBonus;
              
              setWinAmount(totalWin);
              setResult('win');
              const finalGems = newGems + totalWin;
              setGems(finalGems);
              addGems(totalWin);
              
              // Record to casino stats
              recordCasinoGameResult(Math.floor(totalWin), bet, 'slots');
              
              const bonusText = streakBonus > 0 ? ` + ${Math.floor(streakBonus)} streak bonus!` : '';
              showToast(`🎰 JACKPOT! Won ${Math.floor(totalWin)} gems!${bonusText}`, 'success');
            } else {
              setResult('lose');
              recordCasinoGameResult(0, bet, 'slots');
              showToast('Better luck next time!', 'warning');
            }

            setGameState('result');
          }, 100);
        }
      }, duration);
    });
  };

  const playAgain = () => {
    setResult(null);
    setGameState('betting');
    setBet(10);
  };

  const handleExit = () => {
    onGameEnd(result === 'win' ? winAmount : 0, result === 'lose' ? bet : 0);
    onCancel();
  };

  if (gameState === 'spinning' || gameState === 'result') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        gap: 24,
      }}>
        <h1 style={{ fontSize: '2.5rem', margin: 0, color: 'white' }}>🎰 Slots</h1>

        {/* Reels */}
        <div style={{
          display: 'flex',
          gap: 20,
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 150,
        }}>
          {reels.map((symbol, idx) => (
            <div
              key={idx}
              style={{
                width: 100,
                height: 100,
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
                border: '3px solid rgba(99, 102, 241, 0.5)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
                animation: spinning[idx] ? 'spinReel 0.1s infinite' : 'none',
              }}
            >
              {spinning[idx] ? symbols[Math.floor(Math.random() * symbols.length)] : symbol}
            </div>
          ))}
        </div>

        {result && (
          <div style={{
            textAlign: 'center',
            animation: 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            <h2 style={{
              fontSize: result === 'win' ? '2rem' : '1.5rem',
              color: result === 'win' ? '#10b981' : '#ef4444',
              margin: '0 0 12px 0',
            }}>
              {result === 'win' ? '🎉 YOU WON!' : '😢 You Lost'}
            </h2>
            {result === 'win' && (
              <p style={{ fontSize: '1.5rem', color: '#fbbf24', margin: 0, fontWeight: 'bold' }}>
                +{Math.floor(winAmount)} Gems
              </p>
            )}
          </div>
        )}

        {gameState === 'result' && (
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={playAgain}
              style={{
                padding: '10px 28px',
                background: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)',
                border: 'none',
                color: 'white',
                fontWeight: 'bold',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Spin Again
            </button>
            <button
              onClick={handleExit}
              style={{
                padding: '10px 28px',
                background: 'rgba(255,255,255,0.2)',
                border: '2px solid rgba(255,255,255,0.4)',
                color: 'white',
                fontWeight: 'bold',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Exit
            </button>
          </div>
        )}

        <style>{`
          @keyframes spinReel {
            0%, 100% { transform: rotateY(0deg); }
            50% { transform: rotateY(180deg); }
          }
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
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      gap: 24,
    }}>
      <h1 style={{ fontSize: '2.5rem', margin: 0, color: 'white' }}>🎰 Slots</h1>

      <div style={{
        background: 'rgba(255,255,255,0.05)',
        padding: 24,
        borderRadius: 12,
        textAlign: 'center',
        border: '2px solid rgba(99, 102, 241, 0.3)',
      }}>
        <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 12px 0' }}>
          Match symbols to win! Bigger bets = Bigger wins
        </p>
        <p style={{ color: '#fbbf24', fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>
          Your gems: {gems}
        </p>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        alignItems: 'center',
      }}>
        <div>
          <label style={{ color: 'white', marginRight: 12 }}>Bet Amount:</label>
          <input
            type="range"
            min="10"
            max={Math.min(gems, 500)}
            step="10"
            value={bet}
            onChange={(e) => setBet(parseInt(e.target.value))}
            style={{ width: 200 }}
          />
          <span style={{ color: '#fbbf24', marginLeft: 12, fontWeight: 'bold' }}>
            {bet} gems
          </span>
        </div>

        <button
          onClick={spin}
          disabled={gems < bet}
          style={{
            padding: '12px 48px',
            background: gems >= bet ? 'linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)' : 'rgba(100,100,100,0.5)',
            border: 'none',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            borderRadius: 8,
            cursor: gems >= bet ? 'pointer' : 'not-allowed',
          }}
        >
          SPIN
        </button>
      </div>

      <button
        onClick={onCancel}
        style={{
          padding: '10px 28px',
          background: 'transparent',
          border: '2px solid rgba(255,255,255,0.3)',
          color: 'white',
          fontWeight: 'bold',
          borderRadius: 6,
          cursor: 'pointer',
        }}
      >
        Cancel
      </button>
    </div>
  );
};
