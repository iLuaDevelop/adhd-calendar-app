import React, { useState, useEffect } from 'react';

interface LeaderboardEntry {
  rank: number;
  username: string;
  value: number;
  icon: string;
}

interface CasinoLeaderboardProps {
  entries?: LeaderboardEntry[];
}

export const CasinoLeaderboard: React.FC<CasinoLeaderboardProps> = ({ entries }) => {
  const [activeTab, setActiveTab] = useState<'wins' | 'streak' | 'profit'>('wins');

  // Mock leaderboard data - in production this would come from Firebase
  const mockWinsLeaderboard: LeaderboardEntry[] = [
    { rank: 1, username: 'HighRoller', value: 5000, icon: '🏆' },
    { rank: 2, username: 'LuckyPlayer', value: 4200, icon: '🥈' },
    { rank: 3, username: 'CasinoKing', value: 3800, icon: '🥉' },
    { rank: 4, username: 'GemCollector', value: 3100, icon: '💎' },
    { rank: 5, username: 'RiskTaker', value: 2900, icon: '🎰' },
    { rank: 6, username: 'StreakMaster', value: 2500, icon: '⭐' },
    { rank: 7, username: 'YouPlayer', value: 1800, icon: '👤' },
    { rank: 8, username: 'NewPlayer', value: 850, icon: '🌱' },
    { rank: 9, username: 'Curious', value: 620, icon: '🔍' },
    { rank: 10, username: 'Beginner', value: 450, icon: '🚀' },
  ];

  const mockStreakLeaderboard: LeaderboardEntry[] = [
    { rank: 1, username: 'WinnerWinner', value: 27, icon: '🏆' },
    { rank: 2, username: 'OnARow', value: 19, icon: '🥈' },
    { rank: 3, username: 'Unstoppable', value: 15, icon: '🥉' },
    { rank: 4, username: 'Rolling', value: 12, icon: '🎲' },
    { rank: 5, username: 'FireFlow', value: 11, icon: '🔥' },
    { rank: 6, username: 'Momentum', value: 8, icon: '⚡' },
    { rank: 7, username: 'YouPlayer', value: 6, icon: '👤' },
    { rank: 8, username: 'BuildingUp', value: 4, icon: '📈' },
    { rank: 9, username: 'StartingOut', value: 2, icon: '🌟' },
    { rank: 10, username: 'FirstWin', value: 1, icon: '🎉' },
  ];

  const mockProfitLeaderboard: LeaderboardEntry[] = [
    { rank: 1, username: 'ProfitKing', value: 3200, icon: '🏆' },
    { rank: 2, username: 'SmartBetter', value: 2100, icon: '🥈' },
    { rank: 3, username: 'Calculated', value: 1800, icon: '🥉' },
    { rank: 4, username: 'GemGainer', value: 1500, icon: '💎' },
    { rank: 5, username: 'Lucky7', value: 1200, icon: '🍀' },
    { rank: 6, username: 'Bankroll', value: 950, icon: '💰' },
    { rank: 7, username: 'YouPlayer', value: 450, icon: '👤' },
    { rank: 8, username: 'Breaking', value: 120, icon: '📊' },
    { rank: 9, username: 'CloseCalls', value: -50, icon: '⚠️' },
    { rank: 10, username: 'Learning', value: -200, icon: '📚' },
  ];

  const leaderboards = {
    wins: mockWinsLeaderboard,
    streak: mockStreakLeaderboard,
    profit: mockProfitLeaderboard,
  };

  const currentLeaderboard = leaderboards[activeTab];

  const getMedalColor = (rank: number): string => {
    switch (rank) {
      case 1:
        return '#fbbf24'; // Gold
      case 2:
        return '#c0c0c0'; // Silver
      case 3:
        return '#cd7f32'; // Bronze
      default:
        return 'rgba(255,255,255,0.2)';
    }
  };

  const getMedalBg = (rank: number): string => {
    switch (rank) {
      case 1:
        return 'rgba(251, 191, 36, 0.15)';
      case 2:
        return 'rgba(192, 192, 192, 0.15)';
      case 3:
        return 'rgba(205, 127, 50, 0.15)';
      default:
        return 'rgba(255,255,255,0.05)';
    }
  };

  return (
    <div className="panel" style={{
      padding: 24,
      marginBottom: 24,
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(99, 102, 241, 0.05) 100%)',
      border: '2px solid rgba(59, 130, 246, 0.3)',
    }}>
      {/* Header */}
      <h3 style={{
        margin: '0 0 20px 0',
        fontSize: '1.3rem',
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}>
        🏅 Casino Leaderboards
      </h3>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 20,
        justifyContent: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: 12,
        flexWrap: 'wrap',
      }}>
        {(['wins', 'streak', 'profit'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              background: activeTab === tab
                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.5) 0%, rgba(99, 102, 241, 0.4) 100%)'
                : 'rgba(59, 130, 246, 0.1)',
              color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
              border: activeTab === tab
                ? '2px solid rgba(99, 102, 241, 0.8)'
                : '2px solid rgba(59, 130, 246, 0.3)',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: activeTab === tab ? '600' : '500',
              transition: 'all 0.2s ease',
              boxShadow: activeTab === tab
                ? '0 0 15px rgba(59, 130, 246, 0.3)'
                : 'none',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab) {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab) {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
              }
            }}
          >
            {tab === 'wins' && '💰 Biggest Wins'}
            {tab === 'streak' && '🔥 Win Streaks'}
            {tab === 'profit' && '📈 Net Profit'}
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div style={{ display: 'grid', gap: 8 }}>
        {currentLeaderboard.map((entry, index) => (
          <div
            key={`${activeTab}-${index}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              background: getMedalBg(entry.rank),
              border: `1px solid ${getMedalColor(entry.rank)}`,
              borderRadius: 8,
              transition: 'all 0.2s ease',
            }}
          >
            {/* Rank Badge */}
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: getMedalColor(entry.rank),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                color: entry.rank === 1 || entry.rank === 3 ? '#000' : '#fff',
                fontSize: '1.1rem',
              }}
            >
              {entry.rank}
            </div>

            {/* Player Info */}
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div style={{
                fontWeight: 'bold',
                fontSize: '0.95rem',
                marginBottom: 2,
              }}>
                {entry.username === 'YouPlayer' ? '👤 You' : entry.username}
              </div>
              <div style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
              }}>
                {entry.icon} Level {Math.floor(Math.random() * 40) + 10}
              </div>
            </div>

            {/* Score */}
            <div style={{
              textAlign: 'right',
            }}>
              <div style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: entry.value >= 0 ? '#10b981' : '#ef4444',
              }}>
                {activeTab === 'profit' ? (entry.value > 0 ? '+' : '') : ''}
                {activeTab === 'wins' ? entry.value : ''}
                {activeTab === 'streak' ? `${entry.value}x` : ''}
                {activeTab === 'profit' ? `${entry.value}` : ''}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                marginTop: 2,
              }}>
                {activeTab === 'wins' && 'gems'}
                {activeTab === 'streak' && 'wins'}
                {activeTab === 'profit' && 'gems'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div style={{
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: 8,
        padding: 12,
        marginTop: 16,
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
        textAlign: 'center',
      }}>
        💡 Leaderboards update in real-time. Keep playing to climb the ranks!
      </div>
    </div>
  );
};

export default CasinoLeaderboard;
