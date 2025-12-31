import React, { useState, useEffect } from 'react';
import {
  getCasinoStats,
  formatCasinoStats,
  getCasinoWinRate,
  getCasinoROI,
  getCasinoNetGems,
} from '../../services/casinoStats';

export const CasinoStatsWidget: React.FC = () => {
  const [stats, setStats] = useState(getCasinoStats());
  const [formatted, setFormatted] = useState(formatCasinoStats(stats));
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      const updated = getCasinoStats();
      setStats(updated);
      setFormatted(formatCasinoStats(updated));
    };

    window.addEventListener('casino:statsUpdated', handleUpdate);
    return () => window.removeEventListener('casino:statsUpdated', handleUpdate);
  }, []);

  const totalGamesPlayed = stats.totalWins + stats.totalLosses;
  const netGems = getCasinoNetGems();
  const roi = getCasinoROI();

  return (
    <div className="panel" style={{
      padding: 24,
      marginBottom: 24,
      background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(99, 102, 241, 0.05) 100%)',
      border: '2px solid rgba(168, 85, 247, 0.3)',
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          marginBottom: expanded ? 20 : 16,
          position: 'relative',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--accent)', textAlign: 'center' }}>
          📊 Your Casino Stats
        </h3>
        <div style={{
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          transition: 'transform 0.2s',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          position: 'absolute',
          right: 0,
        }}>
          ▼
        </div>
      </div>

      {/* Compact View */}
      {!expanded && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
        }}>
          <div style={{
            textAlign: 'center',
            padding: '12px',
            background: 'rgba(0,0,0,0.15)',
            borderRadius: 8,
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
              Total Games
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--accent)' }}>
              {totalGamesPlayed}
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '12px',
            background: 'rgba(16, 185, 129, 0.15)',
            borderRadius: 8,
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
              Win Rate
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#10b981' }}>
              {formatted.winRate}%
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '12px',
            background: 'rgba(251, 191, 36, 0.15)',
            borderRadius: 8,
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
              Streak
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#fbbf24' }}>
              {formatted.streak}
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '12px',
            background: netGems >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            borderRadius: 8,
          }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
              Net Profit
            </div>
            <div style={{
              fontSize: '1.4rem',
              fontWeight: 'bold',
              color: netGems >= 0 ? '#10b981' : '#ef4444',
            }}>
              {netGems >= 0 ? '+' : ''}{netGems}
            </div>
          </div>
        </div>
      )}

      {/* Expanded View */}
      {expanded && (
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Key Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
          }}>
            <div style={{
              background: 'rgba(0,0,0,0.2)',
              padding: 16,
              borderRadius: 8,
              border: '1px solid rgba(168, 85, 247, 0.3)',
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                Total Games Played
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                {totalGamesPlayed}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                {formatted.wins} wins • {formatted.losses} losses
              </div>
            </div>

            <div style={{
              background: 'rgba(0,0,0,0.2)',
              padding: 16,
              borderRadius: 8,
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                Win Rate
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#10b981' }}>
                {formatted.winRate}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                {totalGamesPlayed > 0 ? 'Based on play' : 'No games yet'}
              </div>
            </div>

            <div style={{
              background: 'rgba(0,0,0,0.2)',
              padding: 16,
              borderRadius: 8,
              border: '1px solid rgba(251, 191, 36, 0.3)',
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                Current Streak
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fbbf24' }}>
                {formatted.streak}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                Best: {formatted.bestStreak}
              </div>
            </div>

            <div style={{
              background: 'rgba(0,0,0,0.2)',
              padding: 16,
              borderRadius: 8,
              border: netGems >= 0 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                Net Profit
              </div>
              <div
                style={{
                  fontSize: '1.8rem',
                  fontWeight: 'bold',
                  color: netGems >= 0 ? '#10b981' : '#ef4444',
                }}
              >
                {netGems >= 0 ? '+' : ''}{netGems}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                ROI: {roi}%
              </div>
            </div>
          </div>

          {/* Gems Overview */}
          <div style={{
            background: 'rgba(0,0,0,0.2)',
            padding: 16,
            borderRadius: 8,
            border: '1px solid rgba(251, 191, 36, 0.3)',
          }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: 12 }}>
              💎 Gems Overview
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Total Wagered
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#ef4444' }}>
                  -{formatted.wagered}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                  Total Won
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#10b981' }}>
                  +{formatted.won}
                </div>
              </div>
            </div>
          </div>

          {/* Best Win */}
          {formatted.bestWin > 0 && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(251, 146, 60, 0.1) 100%)',
              padding: 16,
              borderRadius: 8,
              border: '1px solid rgba(251, 191, 36, 0.4)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                Biggest Single Win 🎉
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fbbf24' }}>
                +{formatted.bestWin}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                gems
              </div>
            </div>
          )}

          {/* Info Message */}
          {totalGamesPlayed === 0 && (
            <div style={{
              background: 'rgba(99, 102, 241, 0.15)',
              padding: 12,
              borderRadius: 8,
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              textAlign: 'center',
            }}>
              Play your first casino game to see your stats!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CasinoStatsWidget;
