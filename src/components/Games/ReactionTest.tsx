import React, { useState, useEffect, useCallback } from 'react';

interface ReactionTestProps {
  difficulty: number;
  onGameEnd: (reactionTime: number) => void;
  onCancel: () => void;
}

export const ReactionTest: React.FC<ReactionTestProps> = ({ difficulty, onGameEnd, onCancel }) => {
  const [gameState, setGameState] = useState<'waiting' | 'ready' | 'active' | 'result'>('waiting');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [message, setMessage] = useState('Get ready...');

  // Start the test after a random delay
  useEffect(() => {
    if (gameState !== 'waiting') return;

    // Random delay between 1-4 seconds (adjusted by difficulty - harder = less wait)
    const minDelay = Math.max(800, 2000 - difficulty * 200);
    const maxDelay = Math.max(1800, 4000 - difficulty * 200);
    const delay = Math.random() * (maxDelay - minDelay) + minDelay;

    const timer = setTimeout(() => {
      setGameState('active');
      setMessage('CLICK NOW!');
      setStartTime(Date.now());

      // Play a beep sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 880; // Higher pitch for "ready"
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    }, delay);

    return () => clearTimeout(timer);
  }, [gameState, difficulty]);

  // Handle click during test
  const handleClick = useCallback(() => {
    if (gameState === 'active' && startTime) {
      const time = Date.now() - startTime;
      setReactionTime(time);
      setGameState('result');
      setMessage(`${time}ms - Great!`);

      // Play success sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 523.25; // C note
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } else if (gameState === 'waiting') {
      setMessage('Too early! Wait for the signal.');
      // Play fail sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 200;
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    }
  }, [gameState, startTime]);

  const handleNext = () => {
    if (reactionTime !== null) {
      onGameEnd(reactionTime);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '90vh' }}>
      <div style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '2rem', fontWeight: 'bold' }}>⚡ Reaction Test</h2>
          <p className="subtle" style={{ fontSize: '1rem' }}>
            Click as fast as you can when the screen flashes!
          </p>
        </div>

        {/* Main Test Area */}
        <div
          onClick={handleClick}
          className="panel"
          style={{
            width: '100%',
            aspectRatio: '1',
            maxWidth: '280px',
            margin: '0 auto 32px',
            borderRadius: 24,
            cursor: gameState === 'active' ? 'pointer' : gameState === 'waiting' ? 'pointer' : 'default',
            transition: 'all 0.1s ease',
            border: '3px solid',
            borderColor: gameState === 'active' ? 'var(--accent)' : 'rgba(99, 102, 241, 0.3)',
            background: gameState === 'active'
              ? 'linear-gradient(135deg, var(--accent) 0%, rgba(99, 102, 241, 0.8) 100%)'
              : gameState === 'result'
                ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
            boxShadow: gameState === 'active' ? '0 0 40px rgba(99, 102, 241, 0.6), inset 0 0 30px rgba(255,255,255,0.1)' : '0 4px 12px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 12
          }}
        >
          <div style={{ fontSize: '1rem', fontWeight: 'bold', color: gameState === 'active' ? 'white' : 'var(--text-secondary)' }}>
            {gameState === 'active' ? '✓ CLICK!' : gameState === 'waiting' ? '⏳ Wait...' : message}
          </div>
          {reactionTime && (
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: 'var(--accent)',
              marginTop: 8
            }}>
              {reactionTime}ms
            </div>
          )}
        </div>

        {/* Status and Tips */}
        <div className="subtle" style={{
          fontSize: '0.9rem',
          marginBottom: 24,
          minHeight: 60,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          {gameState === 'result' ? (
            <>
              <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>Reaction Time: <span style={{ color: 'var(--accent)', fontSize: '1.1rem' }}>{reactionTime}ms</span></p>
              <p style={{ margin: 0 }}>
                {reactionTime && reactionTime < 200 ? '🔥 Incredible!' : reactionTime && reactionTime < 300 ? '⚡ Excellent!' : '✓ Good!'}
              </p>
            </>
          ) : gameState === 'waiting' ? (
            <p style={{ margin: 0, animation: 'pulse 1.5s infinite' }}>Waiting for signal...</p>
          ) : (
            <p style={{ margin: 0 }}>Level {difficulty} • Avg: {difficulty <= 2 ? '150-200ms' : difficulty <= 4 ? '180-250ms' : '200-300ms'}</p>
          )}
        </div>

        {/* Result Button */}
        {gameState === 'result' && (
          <button
            onClick={handleNext}
            className="btn primary"
            style={{
              padding: '12px 32px',
              fontSize: '1rem',
              borderRadius: 8,
              minWidth: 140,
              marginBottom: 16
            }}
          >
            Next Game →
          </button>
        )}

        {/* Cancel Button */}
        {gameState !== 'result' && (
          <button
            onClick={onCancel}
            className="btn ghost"
            style={{
              padding: '10px 24px',
              fontSize: '0.95rem',
              borderRadius: 8,
              minWidth: 120
            }}
          >
            ← Back
          </button>
        )}

        {/* Tip */}
        {gameState === 'waiting' && (
          <p style={{
            fontSize: '0.8rem',
            color: 'var(--muted)',
            marginTop: 16,
            fontStyle: 'italic'
          }}>
            Keep your finger ready... the flash could come any second!
          </p>
        )}
      </div>
    </div>
  );
};
