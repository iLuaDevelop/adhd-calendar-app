import { 
  db, 
  auth 
} from './firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getXp } from './xp';
import { getGems } from './currency';

export interface LeaderboardPlayer {
  id: string;
  userId: string;
  username: string;
  email?: string;
  avatar: string;
  xp: number;
  level: number;
  tasksCompleted: number;
  currentStreak: number;
  longestStreak: number;
  month: string;
  lastUpdated: Date;
  rank?: number;
}

const LEADERBOARD_COLLECTION = 'leaderboard';
const GAME_PROGRESS_COLLECTION = 'gameProgress';
const PLAYER_PROFILES_COLLECTION = 'playerProfiles';

// Get current month string (YYYY-MM)
const getCurrentMonth = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${month}`;
};

/**
 * SECURITY: Sync player game progress to Firestore (not directly to leaderboard)
 * Cloud Function validates and updates leaderboard server-side
 * This prevents client-side manipulation of rankings
 * 
 * TEMPORARY: Until Cloud Function is deployed, we write directly to leaderboard
 */
export const syncPlayerToLeaderboard = async (): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return;
    }

    const profileStr = localStorage.getItem('adhd_profile');
    const profile = profileStr ? JSON.parse(profileStr) : {};
    
    const streakStr = localStorage.getItem('adhd_streak');
    const streak = streakStr ? JSON.parse(streakStr) : { current: 0, longest: 0 };

    const xp = getXp();
    const gems = getGems();

    const profileDataStr = localStorage.getItem('adhd_game_progress');
    const profileData = profileDataStr ? JSON.parse(profileDataStr) : { tasksCompleted: 0 };

    // Import medals from medals service
    const { getMedals } = await import('./medals');
    const medals = getMedals();

    const gameProgressData = {
      xp: xp || 0,
      gems: gems || 0,
      tasksCompleted: profileData.tasksCompleted || 0,
      currentStreak: streak.current || 0,
      longestStreak: streak.longest || 0,
      medals: medals, // Include all medals (earned and unearned for personal view)
      lastUpdated: Date.now(),
    };

    // Write to gameProgress collection (Cloud Function will update leaderboard)
    const gameProgressRef = doc(db, GAME_PROGRESS_COLLECTION, user.uid);
    await setDoc(gameProgressRef, gameProgressData, { merge: true });

    // TEMPORARY: Also write directly to leaderboard for now (until Cloud Function deployed)
    const currentMonth = getCurrentMonth();
    const leaderboardRef = doc(db, LEADERBOARD_COLLECTION, `${user.uid}_${currentMonth}`);
    await setDoc(leaderboardRef, {
      userId: user.uid,
      username: profile.username || user.email?.split('@')[0] || 'Player',
      avatar: profile.avatar || '👤',
      xp: xp || 0,
      level: Math.floor((xp || 0) / 500) + 1,
      gems: gems || 0,
      tasksCompleted: profileData.tasksCompleted || 0,
      currentStreak: streak.current || 0,
      longestStreak: streak.longest || 0,
      month: currentMonth,
      lastUpdated: new Date(),
    }, { merge: true });

    // Also update player profile (for friend requests, etc)
    const profileRef = doc(db, PLAYER_PROFILES_COLLECTION, user.uid);
    await setDoc(profileRef, {
      username: profile.username || user.email?.split('@')[0] || 'Player',
      avatar: profile.avatar || '👤',
      userId: user.uid,
      lastSeen: serverTimestamp(),
    }, { merge: true });

  } catch (error) {
    console.error('[Leaderboard] Error syncing player:', error);
  }
};

// Get global leaderboard (top 50 players for current month) - READ ONLY (safe)
export const getGlobalLeaderboard = async (): Promise<LeaderboardPlayer[]> => {
  try {
    const currentMonth = getCurrentMonth();
    
    const q = query(
      collection(db, LEADERBOARD_COLLECTION),
      where('month', '==', currentMonth),
      orderBy('xp', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    const players: LeaderboardPlayer[] = [];

    snapshot.forEach((doc, index) => {
      const data = doc.data() as any;
      players.push({
        ...data,
        rank: index + 1,
        lastUpdated: data.lastUpdated?.toDate?.() || new Date(),
      });
    });

    return players;
  } catch (error) {
    console.error('[Leaderboard] Error fetching global leaderboard:', error);
    return [];
  }
};

// Get friends leaderboard (top 50 from friend list) - READ ONLY (safe)
export const getFriendsLeaderboard = async (friendUserIds: string[]): Promise<LeaderboardPlayer[]> => {
  try {
    if (friendUserIds.length === 0) {
      return [];
    }

    const currentMonth = getCurrentMonth();
    
    const q = query(
      collection(db, LEADERBOARD_COLLECTION),
      where('month', '==', currentMonth),
      where('userId', 'in', friendUserIds),
      orderBy('xp', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(q);
    const players: LeaderboardPlayer[] = [];

    snapshot.forEach((doc, index) => {
      const data = doc.data() as any;
      players.push({
        ...data,
        rank: index + 1,
        lastUpdated: data.lastUpdated?.toDate?.() || new Date(),
      });
    });

    return players;
  } catch (error) {
    console.error('[Leaderboard] Error fetching friends leaderboard:', error);
    return [];
  }
};

// Get player rank for current month - READ ONLY (safe)
export const getPlayerRank = async (): Promise<number> => {
  try {
    const user = auth.currentUser;
    if (!user) return 0;

    const currentMonth = getCurrentMonth();
    
    const q = query(
      collection(db, LEADERBOARD_COLLECTION),
      where('month', '==', currentMonth),
      orderBy('xp', 'desc')
    );

    const snapshot = await getDocs(q);
    const rank = snapshot.docs.findIndex(doc => doc.data().userId === user.uid) + 1;
    
    return rank > 0 ? rank : 0;
  } catch (error) {
    console.error('[Leaderboard] Error fetching player rank:', error);
    return 0;
  }
};

// Subscribe to real-time leaderboard updates - READ ONLY (safe)
export const subscribeToLeaderboard = (
  callback: (players: LeaderboardPlayer[]) => void,
  friendUserIds?: string[]
): (() => void) => {
  try {
    const currentMonth = getCurrentMonth();
    
    let q;
    if (friendUserIds && friendUserIds.length > 0) {
      q = query(
        collection(db, LEADERBOARD_COLLECTION),
        where('month', '==', currentMonth),
        where('userId', 'in', friendUserIds),
        orderBy('xp', 'desc'),
        limit(50)
      );
    } else {
      q = query(
        collection(db, LEADERBOARD_COLLECTION),
        where('month', '==', currentMonth),
        orderBy('xp', 'desc'),
        limit(50)
      );
    }

    getDocs(q).then((snapshot) => {
      const players: LeaderboardPlayer[] = [];
      snapshot.forEach((doc, index) => {
        const data = doc.data() as any;
        players.push({
          ...data,
          rank: index + 1,
          lastUpdated: data.lastUpdated?.toDate?.() || new Date(),
        });
      });
      callback(players);
    });

    return () => {};
  } catch (error) {
    console.error('[Leaderboard] Error subscribing to leaderboard:', error);
    return () => {};
  }
};
