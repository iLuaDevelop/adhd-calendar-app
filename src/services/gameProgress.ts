import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { getAuth } from 'firebase/auth';

export interface GameProgress {
  xp: number;
  gems: number;
  purchases: number[]; // Array of purchased item IDs
  pets: any[];
  currentPetId: string | null;
  unlockedSkills: string[];
  unlockedTitles: string[];
  selectedTitle: string | null;
  quests: any;
  streakData: any;
  lastUpdated: string;
}

/**
 * Save game progress to Firestore
 */
export const saveGameProgress = async (progress: Partial<GameProgress>) => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.warn('[gameProgress] No user logged in, not saving to Firestore');
      return;
    }

    const progressData = {
      ...progress,
      lastUpdated: new Date().toISOString(),
    };

    const userDocRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userDocRef, {
      gameProgress: progressData,
    });

    console.log('[gameProgress] Saved to Firestore:', progressData);
  } catch (error) {
    console.error('[gameProgress] Error saving to Firestore:', error);
    // Don't throw - allow game to continue even if save fails
  }
};

/**
 * Load game progress from Firestore
 */
export const loadGameProgress = async (): Promise<Partial<GameProgress> | null> => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.warn('[gameProgress] No user logged in, not loading from Firestore');
      return null;
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      console.warn('[gameProgress] User document not found');
      return null;
    }

    const userData = userDoc.data();
    const gameProgress = userData?.gameProgress;

    if (gameProgress) {
      console.log('[gameProgress] Loaded from Firestore:', gameProgress);
      return gameProgress;
    }

    return null;
  } catch (error) {
    console.error('[gameProgress] Error loading from Firestore:', error);
    return null;
  }
};

/**
 * Sync specific data to Firestore (for frequent updates like XP)
 */
export const syncXpToFirestore = async (xp: number) => {
  await saveGameProgress({ xp });
};

export const syncGemsToFirestore = async (gems: number) => {
  await saveGameProgress({ gems });
};

export const syncPurchasesToFirestore = async (purchases: number[]) => {
  await saveGameProgress({ purchases });
};

export const syncPetsToFirestore = async (pets: any[], currentPetId: string | null) => {
  await saveGameProgress({ pets, currentPetId });
};

export const syncSkillsToFirestore = async (unlockedSkills: string[]) => {
  await saveGameProgress({ unlockedSkills });
};

export const syncTitlesToFirestore = async (unlockedTitles: string[], selectedTitle: string | null) => {
  await saveGameProgress({ unlockedTitles, selectedTitle });
};
