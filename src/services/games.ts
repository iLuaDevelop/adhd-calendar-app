import { db } from './firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { getCurrentUserId } from './auth';

export interface GameHistory {
  id: string;
  userId: string;
  gameType: 'pattern-memory' | 'reaction-test';
  score: number;
  xpEarned: number;
  difficulty: number;
  timestamp: any;
}

export interface GameState {
  lastPlayTime: number | null;
  gamesPlayedToday: number;
  dailyCap: number;
  cooldownSeconds: number;
  history: GameHistory[];
}

const DAILY_GAME_CAP = 5;
const COOLDOWN_SECONDS = 120; // 2 minutes between games
const STORAGE_KEY = 'adhd_game_state';

// Initialize game state from localStorage
export const initializeGameState = (): GameState => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const state = JSON.parse(stored);
    // Reset daily count if it's a new day
    const lastDate = localStorage.getItem('adhd_game_state_date');
    const today = new Date().toDateString();
    if (lastDate !== today) {
      state.gamesPlayedToday = 0;
      localStorage.setItem('adhd_game_state_date', today);
    }
    return state;
  }
  const newState: GameState = {
    lastPlayTime: null,
    gamesPlayedToday: 0,
    dailyCap: DAILY_GAME_CAP,
    cooldownSeconds: COOLDOWN_SECONDS,
    history: [],
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  localStorage.setItem('adhd_game_state_date', new Date().toDateString());
  return newState;
};

// Check if player can play a game right now
export const canPlayGame = (): { canPlay: boolean; reason: string; secondsUntilAvailable?: number } => {
  const state = initializeGameState();

  // Check daily cap
  if (state.gamesPlayedToday >= state.dailyCap) {
    return {
      canPlay: false,
      reason: 'daily-cap-reached',
    };
  }

  // Check cooldown
  if (state.lastPlayTime) {
    const secondsElapsed = (Date.now() - state.lastPlayTime) / 1000;
    if (secondsElapsed < state.cooldownSeconds) {
      const secondsUntilAvailable = Math.ceil(state.cooldownSeconds - secondsElapsed);
      return {
        canPlay: false,
        reason: 'cooldown-active',
        secondsUntilAvailable,
      };
    }
  }

  return { canPlay: true, reason: 'available' };
};

// Calculate XP based on game type, difficulty, and score
export const calculateXP = (gameType: 'pattern-memory' | 'reaction-test', difficulty: number, score: number): number => {
  let baseXP = 20;

  if (gameType === 'pattern-memory') {
    // More sequences completed = more XP
    baseXP = 20 + difficulty * 5;
    // Bonus for high score (sequence length)
    if (score > 5) baseXP += (score - 5) * 2;
  } else if (gameType === 'reaction-test') {
    // Faster reaction = more XP (score is reaction time in ms)
    // Under 200ms = 50 XP, 200-300ms = 40 XP, 300-400ms = 30 XP, etc.
    if (score < 200) baseXP = 50;
    else if (score < 300) baseXP = 40;
    else if (score < 400) baseXP = 35;
    else baseXP = 30;
  }

  // Difficulty multiplier (1x at level 1, 1.5x at level 5, etc.)
  const difficultyMultiplier = 1 + (difficulty - 1) * 0.1;
  const finalXP = Math.ceil(baseXP * difficultyMultiplier);

  return Math.min(finalXP, 50); // Cap at 50 XP per game
};

// Record a game completion
export const recordGameCompletion = async (
  gameType: 'pattern-memory' | 'reaction-test',
  score: number,
  difficulty: number
): Promise<{ success: boolean; xpEarned: number }> => {
  const canPlay = canPlayGame();
  if (!canPlay.canPlay) {
    return { success: false, xpEarned: 0 };
  }

  const xpEarned = calculateXP(gameType, difficulty, score);
  const userId = getCurrentUserId();

  try {
    // Record in Firebase
    if (userId) {
      await addDoc(collection(db, 'gameHistory'), {
        userId,
        gameType,
        score,
        xpEarned,
        difficulty,
        timestamp: serverTimestamp(),
      });
    }

    // Update localStorage
    const state = initializeGameState();
    state.lastPlayTime = Date.now();
    state.gamesPlayedToday += 1;
    state.history.push({
      id: `${Date.now()}`,
      userId: userId || 'anonymous',
      gameType,
      score,
      xpEarned,
      difficulty,
      timestamp: new Date(),
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    return { success: true, xpEarned };
  } catch (error) {
    console.error('Error recording game completion:', error);
    return { success: false, xpEarned: 0 };
  }
};

// Get remaining games for today
export const getRemainingGames = (): number => {
  const state = initializeGameState();
  return Math.max(0, state.dailyCap - state.gamesPlayedToday);
};

// Get game history for analytics
export const getGameHistory = async (userId: string, limit: number = 10): Promise<GameHistory[]> => {
  try {
    const q = query(
      collection(db, 'gameHistory'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const history = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as GameHistory))
      .sort((a, b) => (b.timestamp?.toDate?.() || 0) - (a.timestamp?.toDate?.() || 0))
      .slice(0, limit);

    return history;
  } catch (error) {
    console.error('Error fetching game history:', error);
    return [];
  }
};

// Reset game state (for testing or manual reset)
export const resetGameState = () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('adhd_game_state_date');
  initializeGameState();
};
