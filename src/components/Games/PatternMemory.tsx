import React, { useState, useEffect, useCallback } from 'react';

interface PatternMemoryProps {
  difficulty: number;
  onGameEnd: (score: number) => void;
  onCancel: () => void;
}

export const PatternMemory: React.FC<PatternMemoryProps> = ({ difficulty, onGameEnd, onCancel }) => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [gameActive, setGameActive] = useState(true);
  const [activeTile, setActiveTile] = useState<number | null>(null);

  const tileColors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'];
  const tileSounds = [440, 554, 659, 784]; // Musical notes in Hz

  // Play a single tile
  const playTile = useCallback(async (index: number) => {
    setActiveTile(index);
    // Play sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = tileSounds[index];
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);

    setTimeout(() => setActiveTile(null), 300);
  }, []);

  // Play the full sequence for the player
  const playSequence = useCallback(async () => {
    setIsPlayingSequence(true);
    setPlayerSequence([]);

    // Wait a bit before starting
    await new Promise(r => setTimeout(r, 500));

    for (let i = 0; i < sequence.length; i++) {
      await new Promise(r => setTimeout(r, 600));
      await playTile(sequence[i]);
    }

    setIsPlayingSequence(false);
  }, [sequence, playTile]);

  // Start a new game round
  const startNewRound = useCallback(async () => {
    const newSequence = [...sequence, Math.floor(Math.random() * 4)];
    setSequence(newSequence);
    setPlayerSequence([]);

    // Difficulty affects speed - higher difficulty = faster sequence
    const delayBetweenRounds = 1000 - difficulty * 100;
    await new Promise(r => setTimeout(r, Math.max(delayBetweenRounds, 300)));

    setIsPlayingSequence(true);
    setPlayerSequence([]);

    for (let i = 0; i < newSequence.length; i++) {
      await new Promise(r => setTimeout(r, 600 - difficulty * 50));
      await playTile(newSequence[i]);
    }

    setIsPlayingSequence(false);
  }, [sequence, playTile, difficulty]);

  // Initialize game
  useEffect(() => {
    startNewRound();
  }, []);

  // Handle player tile click
  const handleTileClick = useCallback(
    async (index: number) => {
      if (isPlayingSequence || !gameActive) return;

      await playTile(index);
      const newPlayerSequence = [...playerSequence, index];
      setPlayerSequence(newPlayerSequence);

      // Check if player's move is correct
      if (newPlayerSequence[newPlayerSequence.length - 1] !== sequence[newPlayerSequence.length - 1]) {
        // Wrong! Game over
        setGameActive(false);
        onGameEnd(sequence.length - 1);
        return;
      }

      // Check if player completed the sequence
      if (newPlayerSequence.length === sequence.length) {
        // Correct! Start new round
        await new Promise(r => setTimeout(r, 1000));
        startNewRound();
      }
    },
    [playerSequence, sequence, isPlayingSequence, gameActive, playTile, startNewRound, onGameEnd]
  );

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '90vh' }}>
      <div style={{ maxWidth: '600px', width: '100%', textAlign: 'center' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '2rem', fontWeight: 'bold' }}>🎨 Pattern Memory</h2>
          <p className="subtle" style={{ fontSize: '1rem', marginBottom: 16 }}>
            Watch the tiles light up, then repeat the sequence!
          </p>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent)' }}>
            Sequence: <span style={{ fontSize: '1.5rem' }}>{sequence.length}</span>
          </div>
        </div>

        {/* Game Grid */}
        <div className="panel" style={{
          padding: 32,
          marginBottom: 24,
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
          border: '2px solid rgba(99, 102, 241, 0.2)',
          borderRadius: 16
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16,
            justifyContent: 'center',
            maxWidth: '300px',
            margin: '0 auto'
          }}>
            {tileColors.map((color, index) => (
              <button
                key={index}
                onClick={() => handleTileClick(index)}
                disabled={isPlayingSequence || !gameActive}
                style={{
                  aspect: '1',
                  borderRadius: 16,
                  border: 'none',
                  cursor: !gameActive || isPlayingSequence ? 'not-allowed' : 'pointer',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  transition: 'all 0.1s ease',
                  boxShadow: activeTile === index ? '0 0 30px rgba(255,255,255,0.5), inset 0 0 20px rgba(255,255,255,0.3)' : '0 4px 12px rgba(0,0,0,0.3)',
                  opacity: activeTile === index ? 1 : gameActive ? 0.9 : 0.6,
                  transform: activeTile === index ? 'scale(0.95)' : 'scale(1)',
                  background: color === 'bg-red-500' ? '#ef4444' : color === 'bg-blue-500' ? '#3b82f6' : color === 'bg-green-500' ? '#22c55e' : '#eab308'
                }}
              />
            ))}
          </div>
        </div>

        {/* Status */}
        <div style={{ marginBottom: 24, minHeight: 60 }}>
          {isPlayingSequence && (
            <div style={{ fontSize: '1.1rem', color: 'var(--accent)', fontWeight: 'bold' }}>
              👀 Watch the sequence...
            </div>
          )}
          {!gameActive && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#ef4444', marginBottom: 8 }}>
                Game Over!
              </div>
              <p className="subtle">You reached sequence <strong style={{ color: 'var(--accent)' }}>{sequence.length}</strong></p>
            </div>
          )}
          {gameActive && !isPlayingSequence && (
            <div style={{ fontSize: '1.1rem', color: 'var(--accent)', fontWeight: 'bold' }}>
              ✓ Your turn!
            </div>
          )}
        </div>

        {/* Difficulty Info */}
        <div className="subtle" style={{ fontSize: '0.9rem', marginBottom: 20 }}>
          <p style={{ margin: '0 0 8px 0' }}>Difficulty: <strong>Level {difficulty}</strong></p>
          <p style={{ margin: 0 }}>Speed: <strong>{Math.round(difficulty * 1.5)}%</strong> faster than level 1</p>
        </div>

        {/* Cancel Button */}
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
      </div>
    </div>
  );
};
