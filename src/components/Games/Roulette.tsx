import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { getGems, addGems } from '../../services/currency';
import { recordCasinoGameResult, getCasinoStats, getStreakBonusGems } from '../../services/casinoStats';

interface RouletteProps {
  onCancel: () => void;
  onGameEnd: (gemsWon: number, gemsLost: number) => void;
}

export const Roulette: React.FC<RouletteProps> = ({ onCancel, onGameEnd }) => {
  const { showToast } = useToast();
  const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [bet, setBet] = useState(10);
  const [gems, setGems] = useState(getGems());
  const [selectedColor, setSelectedColor] = useState<'red' | 'black' | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [result, setResult] = useState<'win' | 'lose' | null>(null);
  const [winAmount, setWinAmount] = useState(0);
  const [rotation, setRotation] = useState(0);

  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

  const getColor = (num: number): 'red' | 'black' => {
    return redNumbers.includes(num) ? 'red' : 'black';
  };

  const spin = () => {
    if (!selectedColor) {
      showToast('Select Red or Black!', 'warning');
      return;
    }

    if (gems < bet) {
      showToast('Not enough gems!', 'error');
      return;
    }

    setSpinning(true);
    setGameState('spinning');

    // Deduct bet
    const newGems = gems - bet;
    setGems(newGems);
    addGems(-bet);

    // Generate random number
    const randomNum = Math.floor(Math.random() * 37); // 0-36
    const colorWon = randomNum === 0 ? null : getColor(randomNum);

    // Spin animation (3+ full rotations)
    const rotations = 360 * 3 + Math.floor(Math.random() * 360);
    
    // Use requestAnimationFrame to ensure transition is applied before rotation changes
    requestAnimationFrame(() => {
      setRotation(rotations);
    });

    setTimeout(() => {
      setWinningNumber(randomNum);
      setSpinning(false);
      setGameState('result');

      // Determine win/lose
      if (randomNum === 0) {
        // 0 (green) - always lose
        setResult('lose');
        recordCasinoGameResult(0, bet, 'roulette');
        showToast('0 (Green) - House wins!', 'error');
      } else if (colorWon === selectedColor) {
        // Win
        const baseWin = bet * 2 * (1 + (bet / 100) * 0.1); // 2x payout + bonus for high bets
        const stats = getCasinoStats();
        const streakBonus = getStreakBonusGems(stats.currentWinStreak, baseWin);
        const totalWin = baseWin + streakBonus;
        
        setWinAmount(Math.floor(totalWin));
        setResult('win');
        const finalGems = newGems + Math.floor(totalWin);
        setGems(finalGems);
        addGems(Math.floor(totalWin));
        
        recordCasinoGameResult(Math.floor(totalWin), bet, 'roulette');
        
        const bonusText = streakBonus > 0 ? ` + ${Math.floor(streakBonus)} streak bonus!` : '';
        showToast(`🎉 ${colorWon.toUpperCase()} ${randomNum}! Won ${Math.floor(totalWin)} gems!${bonusText}`, 'success');
      } else {
        // Lose
        setResult('lose');
        recordCasinoGameResult(0, bet, 'roulette');
        showToast(`Better luck next time! ${colorWon.toUpperCase()} ${randomNum}`, 'warning');
      }
    }, 2500);
  };

  const playAgain = () => {
    setResult(null);
    setWinningNumber(null);
    setSelectedColor(null);
    setSpinning(false);
    setGameState('betting');
    setRotation(0);
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
        <h1 style={{ fontSize: '2.5rem', margin: 0, color: 'white' }}>🎡 Roulette</h1>

        {/* Roulette Wheel */}
        <div style={{
          position: 'relative',
          width: 250,
          height: 250,
          perspective: '1000px',
        }}>
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'conic-gradient(from 0deg, red 0deg 9.73deg, black 9.73deg 19.46deg, red 19.46deg 29.19deg, black 29.19deg 38.92deg, red 38.92deg 48.65deg, black 48.65deg 58.38deg, red 58.38deg 68.11deg, black 68.11deg 77.84deg, red 77.84deg 87.57deg, black 87.57deg 97.3deg, red 97.3deg 107.03deg, black 107.03deg 116.76deg, red 116.76deg 126.49deg, black 126.49deg 136.22deg, red 136.22deg 145.95deg, black 145.95deg 155.68deg, red 155.68deg 165.41deg, black 165.41deg 175.14deg, green 175.14deg 180deg, black 180deg 189.73deg, red 189.73deg 199.46deg, black 199.46deg 209.19deg, red 209.19deg 218.92deg, black 218.92deg 228.65deg, red 228.65deg 238.38deg, black 238.38deg 248.11deg, red 248.11deg 257.84deg, black 257.84deg 267.57deg, red 267.57deg 277.3deg, black 277.3deg 287.03deg, red 287.03deg 296.76deg, black 296.76deg 306.49deg, red 306.49deg 316.22deg, black 316.22deg 325.95deg, red 325.95deg 335.68deg, black 335.68deg 345.41deg, red 345.41deg 355.14deg, black 355.14deg 365deg)',
              border: '8px solid gold',
              boxShadow: '0 0 30px rgba(251, 191, 36, 0.6)',
              transition: `transform 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
              transform: `rotate(${rotation}deg)`,
            }}
          />
          
          {/* Ball pointer at top */}
          <div
            style={{
              position: 'absolute',
              top: -15,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 30,
              height: 30,
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(255,255,255,0.2))',
              borderRadius: '50%',
              border: '3px solid gold',
              zIndex: 10,
            }}
          />
        </div>

        {winningNumber !== null && (
          <div style={{
            textAlign: 'center',
            animation: 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              color: winningNumber === 0 ? '#10b981' : (getColor(winningNumber) === 'red' ? '#ef4444' : '#ffffff'),
              margin: '0 0 12px 0',
            }}>
              {winningNumber === 0 ? '0 (Green)' : `${getColor(winningNumber).toUpperCase()} ${winningNumber}`}
            </h2>
            {result === 'win' && (
              <p style={{ fontSize: '1.5rem', color: '#10b981', margin: 0, fontWeight: 'bold' }}>
                🎉 YOU WON! +{winAmount} Gems
              </p>
            )}
            {result === 'lose' && (
              <p style={{ fontSize: '1.2rem', color: '#ef4444', margin: 0, fontWeight: 'bold' }}>
                Better luck next time!
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
              Play Again
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
      <h1 style={{ fontSize: '2.5rem', margin: 0, color: 'white' }}>🎡 Roulette</h1>

      <div style={{
        background: 'rgba(255,255,255,0.05)',
        padding: 24,
        borderRadius: 12,
        textAlign: 'center',
        border: '2px solid rgba(99, 102, 241, 0.3)',
      }}>
        <p style={{ color: 'rgba(255,255,255,0.8)', margin: '0 0 12px 0' }}>
          Pick Red or Black - 2x your bet if correct!
        </p>
        <p style={{ color: '#fbbf24', fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>
          Your gems: {gems}
        </p>
      </div>

      <div style={{
        display: 'flex',
        gap: 16,
        justifyContent: 'center',
      }}>
        <button
          onClick={() => setSelectedColor('red')}
          style={{
            padding: '16px 32px',
            background: selectedColor === 'red' ? '#ef4444' : 'rgba(239, 68, 68, 0.3)',
            border: selectedColor === 'red' ? '3px solid #fbbf24' : '2px solid rgba(239, 68, 68, 0.5)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          🔴 RED
        </button>
        <button
          onClick={() => setSelectedColor('black')}
          style={{
            padding: '16px 32px',
            background: selectedColor === 'black' ? '#1f2937' : 'rgba(31, 41, 55, 0.3)',
            border: selectedColor === 'black' ? '3px solid #fbbf24' : '2px solid rgba(100, 100, 100, 0.5)',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          ⬛ BLACK
        </button>
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
          disabled={gems < bet || !selectedColor}
          style={{
            padding: '12px 48px',
            background: (gems >= bet && selectedColor) ? 'linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)' : 'rgba(100,100,100,0.5)',
            border: 'none',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            borderRadius: 8,
            cursor: (gems >= bet && selectedColor) ? 'pointer' : 'not-allowed',
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
