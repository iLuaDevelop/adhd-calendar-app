import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

interface GameProgress {
  xp: number;
  gems: number;
  tasksCompleted: number;
  currentStreak: number;
  longestStreak: number;
  lastUpdated: number;
}

/**
 * SECURITY: This Cloud Function validates and syncs player data to leaderboard
 * Triggered when gameProgress is written to Firestore
 * Prevents client-side manipulation of leaderboard rankings
 */
export const updateLeaderboardOnGameProgress = functions
  .firestore
  .document('gameProgress/{userId}')
  .onWrite(async (change, context) => {
    const userId = context.params.userId;
    
    try {
      // Get the updated game progress
      const gameProgressData = change.after.data() as GameProgress;
      
      if (!gameProgressData) {
        console.log(`[Cloud Function] gameProgress deleted for user ${userId}`);
        return null;
      }

      // Validate data integrity
      if (!validateGameProgress(gameProgressData)) {
        console.warn(`[Cloud Function] Invalid game progress data for user ${userId}:`, gameProgressData);
        return null;
      }

      // Get user profile for username and avatar
      const userDoc = await db.collection('playerProfiles').doc(userId).get();
      const userData = userDoc.data();
      
      if (!userData) {
        console.warn(`[Cloud Function] No profile found for user ${userId}`);
        return null;
      }

      // Calculate level from XP
      const level = Math.floor(gameProgressData.xp / 100) + 1;
      const currentMonth = getCurrentMonth();

      // Create/Update leaderboard entry
      const leaderboardDocId = `${userId}_${currentMonth}`;
      const leaderboardEntry = {
        id: leaderboardDocId,
        userId: userId,
        username: userData.username || 'Player',
        email: userData.email,
        avatar: userData.avatar || '👤',
        xp: gameProgressData.xp,
        level: level,
        tasksCompleted: gameProgressData.tasksCompleted,
        currentStreak: gameProgressData.currentStreak,
        longestStreak: gameProgressData.longestStreak,
        month: currentMonth,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Write to leaderboard (this is server-side, so it bypasses security rules)
      await db.collection('leaderboard').doc(leaderboardDocId).set(leaderboardEntry, { merge: true });
      
      console.log(`[Cloud Function] Leaderboard updated for ${userData.username} (${userId}): ${gameProgressData.xp} XP`);
      
      return null;
    } catch (error) {
      console.error(`[Cloud Function] Error updating leaderboard for ${userId}:`, error);
      return null;
    }
  });

/**
 * Validate game progress data to prevent obvious manipulation
 */
function validateGameProgress(data: any): data is GameProgress {
  if (!data || typeof data !== 'object') return false;
  
  // Check required fields
  if (typeof data.xp !== 'number' || typeof data.gems !== 'number' || typeof data.tasksCompleted !== 'number') {
    return false;
  }

  // Check reasonable bounds
  const MAX_XP = 1000000; // 1 million XP max
  const MAX_GEMS = 100000;
  const MAX_TASKS = 100000;

  if (data.xp < 0 || data.xp > MAX_XP) return false;
  if (data.gems < 0 || data.gems > MAX_GEMS) return false;
  if (data.tasksCompleted < 0 || data.tasksCompleted > MAX_TASKS) return false;

  // Check streak is reasonable
  const streak = data.currentStreak || 0;
  if (streak < 0 || streak > 1000) return false;

  return true;
}

/**
 * Get current month string (YYYY-MM)
 */
function getCurrentMonth(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${month}`;
}

/**
 * Cleanup old leaderboard data (older than 3 months)
 * Run monthly via Cloud Scheduler
 */
export const cleanupOldLeaderboardData = functions
  .pubsub
  .schedule('0 0 1 * *') // First day of every month at midnight
  .timeZone('America/New_York')
  .onRun(async (context) => {
    try {
      const threeMonthsAgo = getMonthsAgo(3);
      
      const snapshot = await db.collection('leaderboard')
        .where('month', '<', threeMonthsAgo)
        .get();

      let deleted = 0;
      const batch = db.batch();
      
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
        deleted++;
      });

      await batch.commit();
      console.log(`[Cloud Function] Cleaned up ${deleted} old leaderboard entries`);
      
      return null;
    } catch (error) {
      console.error('[Cloud Function] Error cleaning up leaderboard:', error);
      return null;
    }
  });

/**
 * Get month string from N months ago
 */
function getMonthsAgo(months: number): string {
  const now = new Date();
  now.setMonth(now.getMonth() - months);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${month}`;
}
