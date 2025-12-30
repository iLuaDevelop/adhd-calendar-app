import { db } from './firebase';
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const GAME_PROGRESS_COLLECTION = 'gameProgress';
const LEADERBOARD_COLLECTION = 'leaderboard';
const PLAYER_PROFILES_COLLECTION = 'playerProfiles';
const USERS_COLLECTION = 'users';

/**
 * INITIALIZE PLAYERS: Create default gameProgress for all users in the database
 * This gives every player a baseline entry (0 XP, 0 gems, etc) on the leaderboard
 * Users who haven't earned anything yet will show as level 1 with 0 XP
 */
export const seedTestGameProgress = async (): Promise<void> => {
  try {
    
    // Get all users from users collection
    const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));

    let initializedCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      try {
        // Check if gameProgress already exists
        const existingProgress = await getDocs(collection(db, GAME_PROGRESS_COLLECTION))
          .then(snap => snap.docs.find(d => d.id === userId));

        if (existingProgress) {
          continue;
        }

        // Create DEFAULT game progress data (actual starting stats, not random)
        const gameProgressData = {
          xp: 0,
          gems: 0,
          tasksCompleted: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastUpdated: serverTimestamp(),
        };

        const gameProgressRef = doc(db, GAME_PROGRESS_COLLECTION, userId);
        await setDoc(gameProgressRef, gameProgressData, { merge: true });
        
        initializedCount++;
      } catch (error) {
        console.error(`[Init] Error initializing user ${userId}:`, error);
      }
    }

  } catch (error) {
    console.error('[Init] Fatal error during initialization:', error);
  }
};

/**
 * ONE-TIME MIGRATION: Populate leaderboard from existing gameProgress data
 * Run this once to sync all existing players to the new leaderboard system
 * After this, the Cloud Function (or manual syncs) will keep it updated
 */
export const migrateExistingPlayersToLeaderboard = async (): Promise<void> => {
  try {
    
    const getCurrentMonth = (): string => {
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      return `${now.getFullYear()}-${month}`;
    };

    const currentMonth = getCurrentMonth();
    let migratedCount = 0;

    // Get all gameProgress documents
    const gameProgressSnapshot = await getDocs(collection(db, GAME_PROGRESS_COLLECTION));
    

    for (const gameProgressDoc of gameProgressSnapshot.docs) {
      const userId = gameProgressDoc.id;
      const gameProgressData = gameProgressDoc.data();

      try {
        // Get player profile from users collection
        const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
        const userProfile = usersSnapshot.docs.find(d => d.id === userId)?.data();

        if (!userProfile) {
          console.warn(`[Migration] No user profile found for user ${userId}, skipping`);
          continue;
        }

        const level = Math.floor((gameProgressData.xp || 0) / 100) + 1;
        const leaderboardDocId = `${userId}_${currentMonth}`;

        // Create leaderboard entry
        const leaderboardEntry = {
          id: leaderboardDocId,
          userId: userId,
          username: userProfile.username || 'Player',
          avatar: userProfile.avatar || '👤',
          xp: gameProgressData.xp || 0,
          level: level,
          tasksCompleted: gameProgressData.tasksCompleted || 0,
          currentStreak: gameProgressData.currentStreak || 0,
          longestStreak: gameProgressData.longestStreak || 0,
          month: currentMonth,
          lastUpdated: serverTimestamp(),
        };

        const leaderboardRef = doc(db, LEADERBOARD_COLLECTION, leaderboardDocId);
        await setDoc(leaderboardRef, leaderboardEntry, { merge: true });
        
        migratedCount++;
      } catch (error) {
        console.error(`[Migration] Error migrating user ${userId}:`, error);
      }
    }

  } catch (error) {
    console.error('[Migration] Fatal error during migration:', error);
  }
};
