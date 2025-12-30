import React, { useState, useEffect } from 'react';
import { PatternMemory } from '../components/Games/PatternMemory';
import { ReactionTest } from '../components/Games/ReactionTest';
import { useLanguage } from '../context/LanguageContext';
import {
  canPlayGame,
  recordGameCompletion,
  getRemainingGames,
  GameHistory,
  getGameHistory,
} from '../services/games';
import { addXP, getCurrentUserData } from '../services/xp';
import { awardPetXP } from '../services/pet';
import { getCurrentUserId } from '../services/auth';

type GameType = 'pattern-memory' | 'reaction-test' | null;

export const MiniGames: React.FC = () => {
  const { t } = useLanguage();
  const [activeGame, setActiveGame] = useState<GameType>(null);
  const [difficulty, setDifficulty] = useState(1);
  const [canPlay, setCanPlay] = useState(true);
  const [cooldownMessage, setCooldownMessage] = useState('');
  const [remainingGames, setRemainingGames] = useState(5);
  const [showResult, setShowResult] = useState(false);
  const [lastXP, setLastXP] = useState(0);
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [cooldownTimer, setCooldownTimer] = useState<number | null>(null);

  const userId = getCurrentUserId();

  // Load game state
  useEffect(() => {
    loadGameState();
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (!cooldownTimer) return;

    const interval = setInterval(() => {
      setCooldownTimer(prev => {
        if (prev && prev > 1) {
          setCooldownMessage(`Next game available in ${prev - 1}s`);
          return prev - 1;
        } else {
          setCanPlay(true);
          setCooldownMessage('');
          return null;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownTimer]);

  const loadGameState = async () => {
    const playCheck = canPlayGame();
    setCanPlay(playCheck.canPlay);

    if (!playCheck.canPlay) {
      if (playCheck.reason === 'cooldown-active') {
        setCooldownMessage(`Next game available in ${playCheck.secondsUntilAvailable}s`);
        setCooldownTimer(playCheck.secondsUntilAvailable);
      } else if (playCheck.reason === 'daily-cap-reached') {
        setCooldownMessage('Daily limit reached! Come back tomorrow.');
      }
    }

    setRemainingGames(getRemainingGames());

    // Load history
    if (userId) {
      const gameHistory = await getGameHistory(userId, 5);
      setHistory(gameHistory);
    }
  };

  const handleGameEnd = async (score: number) => {
    const result = await recordGameCompletion(activeGame!, score, difficulty);

    if (result.success) {
      setLastXP(result.xpEarned);

      // Award XP to player
      const userData = await getCurrentUserData();
      if (userData) {
        await addXP(result.xpEarned, 'mini-game');
      }

      // Award pet XP (10-20% of game XP)
      const petXP = Math.ceil(result.xpEarned * 0.15);
      await awardPetXP(petXP);

      setShowResult(true);
      setActiveGame(null);

      // Reset UI after result
      setTimeout(() => {
        setShowResult(false);
        loadGameState();
      }, 3000);
    }
  };

  const startGame = (gameType: GameType) => {
    const playCheck = canPlayGame();
    if (!playCheck.canPlay) {
      setCooldownMessage(
        playCheck.reason === 'daily-cap-reached'
          ? 'Daily limit reached!'
          : `Please wait ${playCheck.secondsUntilAvailable}s`
      );
      return;
    }
    setActiveGame(gameType);
  };

  // Game is active - show game component
  if (activeGame === 'pattern-memory') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-8">
        <PatternMemory
          difficulty={difficulty}
          onGameEnd={handleGameEnd}
          onCancel={() => setActiveGame(null)}
        />
      </div>
    );
  }

  if (activeGame === 'reaction-test') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-8">
        <ReactionTest
          difficulty={difficulty}
          onGameEnd={handleGameEnd}
          onCancel={() => setActiveGame(null)}
        />
      </div>
    );
  }

  // Result screen
  if (showResult) {
    return (
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
        <div style={{ maxWidth: '500px' }}>
          {/* Celebration Container */}
          <div className="panel" style={{
            padding: 48,
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(74, 222, 128, 0.05) 100%)',
            border: '2px solid rgba(34, 197, 94, 0.4)',
            borderRadius: 20,
            marginBottom: 24
          }}>
            {/* Celebration Emoji */}
            <div style={{ fontSize: '4rem', marginBottom: 16, animation: 'bounce 1s infinite' }}>
              🎉
            </div>

            {/* XP Display */}
            <div style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: '3.5rem',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, var(--accent) 0%, #4ade80 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: 8
              }}>
                +{lastXP} XP
              </div>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: 0 }}>
                + {Math.ceil(lastXP * 0.15)} Pet XP
              </p>
            </div>

            {/* Message */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: '1.3rem', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                Awesome! 🚀
              </p>
              <p className="subtle" style={{ fontSize: '1rem', margin: 0 }}>
                You're crushing it! Keep playing to earn more.
              </p>
            </div>
          </div>

          {/* Status Message */}
          <p className="subtle" style={{ fontSize: '0.95rem', fontStyle: 'italic', margin: 0 }}>
            Returning to game selection...
          </p>
        </div>

        {/* Hidden style for bounce animation */}
        <style>{`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }
        `}</style>
      </div>
    );
  }

  // Main games menu
  return (
    <div className="container">
      <div style={{ textAlign: 'center', maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ margin: '0 0 12px 0', fontSize: '2.5rem', fontWeight: 'bold' }}>🎮 Brain Games</h1>
          <p className="subtle" style={{ fontSize: '1.1rem', marginBottom: 24 }}>
            Quick mind-sharpening games to earn XP fast!
          </p>
        </div>

        {/* Status Section */}
        <div className="panel" style={{ padding: 24, marginBottom: 24, textAlign: 'center' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 16 }}>
            <div>
              <div className="subtle" style={{ fontSize: '0.9rem', marginBottom: 8 }}>Games Left Today</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>{remainingGames}</div>
            </div>
            <div>
              <div className="subtle" style={{ fontSize: '0.9rem', marginBottom: 8 }}>Status</div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: canPlay ? 'var(--accent)' : 'var(--muted)'
              }}>
                {canPlay ? '✓ Ready' : cooldownMessage}
              </div>
            </div>
          </div>
        </div>

        {/* Difficulty Selector */}
        {canPlay && (
          <div className="panel" style={{ padding: 24, marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem' }}>Difficulty Level</h3>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
              {[1, 2, 3, 4, 5].map(level => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={difficulty === level ? 'btn primary' : 'btn ghost'}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    transition: 'all 0.2s',
                    transform: difficulty === level ? 'scale(1.1)' : 'scale(1)'
                  }}
                  title={`Level ${level}`}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="subtle" style={{ fontSize: '0.9rem', margin: 0 }}>
              Higher level = Faster gameplay & More XP
            </p>
          </div>
        )}

        {/* Game Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 32 }}>
          {/* Pattern Memory Card */}
          <div className="panel" style={{
            padding: 24,
            background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
            border: '2px solid rgba(147, 51, 234, 0.3)',
            borderRadius: 12,
            textAlign: 'left'
          }}>
            <h2 style={{ margin: '0 0 12px 0', fontSize: '1.4rem', color: 'var(--accent)' }}>🎨 Pattern Memory</h2>
            <p className="subtle" style={{ fontSize: '0.95rem', marginBottom: 16, minHeight: 48 }}>
              Watch colorful tiles light up in sequence. Repeat it back before it gets too long!
            </p>
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: '0.9rem' }}>
              <div style={{ marginBottom: 8 }}>⏱️ <strong>30 sec - 2 min</strong></div>
              <div style={{ marginBottom: 8 }}>⭐ <strong>20-50 XP</strong></div>
              <div>📈 <strong>Scales with difficulty</strong></div>
            </div>
            <button
              onClick={() => startGame('pattern-memory')}
              disabled={!canPlay}
              className="btn primary"
              style={{ width: '100%', opacity: canPlay ? 1 : 0.5, cursor: canPlay ? 'pointer' : 'not-allowed' }}
            >
              Play →
            </button>
          </div>

          {/* Reaction Test Card */}
          <div className="panel" style={{
            padding: 24,
            background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.1) 0%, rgba(251, 146, 60, 0.05) 100%)',
            border: '2px solid rgba(217, 119, 6, 0.3)',
            borderRadius: 12,
            textAlign: 'left'
          }}>
            <h2 style={{ margin: '0 0 12px 0', fontSize: '1.4rem', color: 'var(--accent-2)' }}>⚡ Reaction Test</h2>
            <p className="subtle" style={{ fontSize: '0.95rem', marginBottom: 16, minHeight: 48 }}>
              Wait for the screen to light up, then click as fast as you can! Test your reflexes.
            </p>
            <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: '0.9rem' }}>
              <div style={{ marginBottom: 8 }}>⏱️ <strong>~30 seconds</strong></div>
              <div style={{ marginBottom: 8 }}>⭐ <strong>30-50 XP</strong></div>
              <div>📈 <strong>Difficulty affects timing</strong></div>
            </div>
            <button
              onClick={() => startGame('reaction-test')}
              disabled={!canPlay}
              className="btn primary"
              style={{ width: '100%', opacity: canPlay ? 1 : 0.5, cursor: canPlay ? 'pointer' : 'not-allowed' }}
            >
              Play →
            </button>
          </div>
        </div>

        {/* Recent History */}
        {history.length > 0 && (
          <div className="panel" style={{ padding: 24, marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', textAlign: 'center' }}>📊 Recent Games</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              {history.map((game, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(0,0,0,0.2)',
                  padding: 12,
                  borderRadius: 8,
                  fontSize: '0.9rem'
                }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                      {game.gameType === 'pattern-memory' ? '🎨 Pattern' : '⚡ Reaction'}
                    </div>
                    <div className="subtle">Level {game.difficulty} • Score: {game.score}</div>
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent)' }}>+{game.xpEarned}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily Cap Info */}
        <div className="subtle" style={{
          textAlign: 'center',
          fontSize: '0.9rem',
          lineHeight: 1.6,
          marginBottom: 24
        }}>
          <p style={{ margin: '0 0 8px 0' }}>Daily limit: <strong>{5 - remainingGames}/5</strong> games • Cooldown: <strong>2 min</strong> between</p>
          <p style={{ margin: 0 }}>Earn XP + pet XP on top of your tasks! 🚀</p>
        </div>
      </div>
    </div>
  );
};

export default MiniGames;
