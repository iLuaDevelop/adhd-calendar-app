/**
 * Casino Stats & Win Streak Tracking Service
 * Tracks wins, losses, streaks, and best performances for casino games
 */

interface CasinoStats {
  totalWins: number;
  totalLosses: number;
  currentWinStreak: number;
  bestWinStreak: number;
  totalGemsWagered: number;
  totalGemsWon: number;
  bestSingleWin: number;
  lastGameResult: 'win' | 'lose' | null;
  lastUpdated: string;
}

const CASINO_STATS_KEY = 'adhd_casino_stats';
const CASINO_TODAY_KEY = 'adhd_casino_today';

// Initialize or get casino stats
export const getCasinoStats = (): CasinoStats => {
  const today = new Date().toDateString();
  const storedDate = localStorage.getItem(CASINO_TODAY_KEY);

  // Reset if new day
  if (storedDate !== today) {
    const newStats: CasinoStats = {
      totalWins: 0,
      totalLosses: 0,
      currentWinStreak: 0,
      bestWinStreak: 0,
      totalGemsWagered: 0,
      totalGemsWon: 0,
      bestSingleWin: 0,
      lastGameResult: null,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(CASINO_STATS_KEY, JSON.stringify(newStats));
    localStorage.setItem(CASINO_TODAY_KEY, today);
    return newStats;
  }

  const stored = localStorage.getItem(CASINO_STATS_KEY);
  if (!stored) {
    const newStats: CasinoStats = {
      totalWins: 0,
      totalLosses: 0,
      currentWinStreak: 0,
      bestWinStreak: 0,
      totalGemsWagered: 0,
      totalGemsWon: 0,
      bestSingleWin: 0,
      lastGameResult: null,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(CASINO_STATS_KEY, JSON.stringify(newStats));
    return newStats;
  }

  return JSON.parse(stored);
};

// Record a game result (win or lose)
export const recordCasinoGameResult = (
  gemsWon: number,
  gemsLost: number,
  gameName: string
): CasinoStats => {
  const stats = getCasinoStats();
  const isWin = gemsWon > 0;

  if (isWin) {
    stats.totalWins += 1;
    stats.currentWinStreak += 1;
    stats.totalGemsWon += gemsWon;
    stats.lastGameResult = 'win';

    // Update best streak if needed
    if (stats.currentWinStreak > stats.bestWinStreak) {
      stats.bestWinStreak = stats.currentWinStreak;
    }

    // Update best single win
    if (gemsWon > stats.bestSingleWin) {
      stats.bestSingleWin = gemsWon;
    }
  } else {
    stats.totalLosses += 1;
    stats.currentWinStreak = 0; // Reset streak on loss
    stats.lastGameResult = 'lose';
  }

  stats.totalGemsWagered += gemsLost;
  stats.lastUpdated = new Date().toISOString();

  localStorage.setItem(CASINO_STATS_KEY, JSON.stringify(stats));

  // Dispatch event for UI updates
  window.dispatchEvent(
    new CustomEvent('casino:statsUpdated', { detail: stats })
  );

  return stats;
};

// Get win streak multiplier (progressive bonus)
export const getStreakMultiplier = (winStreak: number): number => {
  if (winStreak < 2) return 1.0;
  if (winStreak < 5) return 1.1; // 10% bonus
  if (winStreak < 10) return 1.2; // 20% bonus
  if (winStreak < 20) return 1.3; // 30% bonus
  return 1.5; // 50% bonus for 20+ streak
};

// Get win streak bonus gems
export const getStreakBonusGems = (winStreak: number, baseWin: number): number => {
  const multiplier = getStreakMultiplier(winStreak);
  return Math.floor(baseWin * (multiplier - 1));
};

// Reset stats (for testing or new player)
export const resetCasinoStats = (): CasinoStats => {
  const newStats: CasinoStats = {
    totalWins: 0,
    totalLosses: 0,
    currentWinStreak: 0,
    bestWinStreak: 0,
    totalGemsWagered: 0,
    totalGemsWon: 0,
    bestSingleWin: 0,
    lastGameResult: null,
    lastUpdated: new Date().toISOString(),
  };
  localStorage.setItem(CASINO_STATS_KEY, JSON.stringify(newStats));
  return newStats;
};

// Get win rate percentage
export const getCasinoWinRate = (): number => {
  const stats = getCasinoStats();
  const total = stats.totalWins + stats.totalLosses;
  if (total === 0) return 0;
  return Math.round((stats.totalWins / total) * 100);
};

// Get net gems (won - wagered)
export const getCasinoNetGems = (): number => {
  const stats = getCasinoStats();
  return stats.totalGemsWon - stats.totalGemsWagered;
};

// Get ROI (return on investment) percentage
export const getCasinoROI = (): number => {
  const stats = getCasinoStats();
  if (stats.totalGemsWagered === 0) return 0;
  const net = stats.totalGemsWon - stats.totalGemsWagered;
  return Math.round((net / stats.totalGemsWagered) * 100);
};

// Format stats for display
export const formatCasinoStats = (stats: CasinoStats) => {
  return {
    wins: stats.totalWins,
    losses: stats.totalLosses,
    streak: stats.currentWinStreak,
    bestStreak: stats.bestWinStreak,
    wagered: stats.totalGemsWagered,
    won: stats.totalGemsWon,
    net: stats.totalGemsWon - stats.totalGemsWagered,
    bestWin: stats.bestSingleWin,
    winRate: getCasinoWinRate(),
    roi: getCasinoROI(),
  };
};
