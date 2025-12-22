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
  tasks: any[]; // Array of user's tasks
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

    const userDocRef = doc(db, 'users', currentUser.uid);
    
    // Load existing gameProgress first to merge properly
    const existingDoc = await getDoc(userDocRef);
    const existingGameProgress = existingDoc.exists() ? (existingDoc.data()?.gameProgress || {}) : {};
    
    // Merge new progress with existing data
    const mergedProgress = {
      ...existingGameProgress,
      ...progress,
      lastUpdated: new Date().toISOString(),
    };

    console.log('[gameProgress] Merging:', { 
      existing: existingGameProgress, 
      new: progress, 
      merged: mergedProgress,
      newTasks: progress?.tasks,
      mergedTasks: mergedProgress.tasks,
      newPets: progress?.pets,
      mergedPets: mergedProgress.pets,
      newCurrentPetId: progress?.currentPetId,
      mergedCurrentPetId: mergedProgress.currentPetId
    });
    
    // Use setDoc with merge to handle both new and existing docs
    await setDoc(userDocRef, { gameProgress: mergedProgress }, { merge: true });

    console.log('[gameProgress] ✅ Saved to Firestore:', mergedProgress);
  } catch (error) {
    console.error('[gameProgress] ❌ Error saving to Firestore:', error);
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
    console.log('[gameProgress] Full user doc data:', userData);
    const gameProgress = userData?.gameProgress;
    console.log('[gameProgress] gameProgress field:', gameProgress);
    console.log('[gameProgress] gameProgress.xp =', gameProgress?.xp);
    console.log('[gameProgress] gameProgress.tasks =', gameProgress?.tasks, '| type:', typeof gameProgress?.tasks);
    console.log('[gameProgress] gameProgress.pets =', gameProgress?.pets, '| length:', gameProgress?.pets?.length);
    console.log('[gameProgress] gameProgress.currentPetId =', gameProgress?.currentPetId);

    if (gameProgress) {
      console.log('[gameProgress] ✅ Loaded from Firestore:', gameProgress);
      return gameProgress;
    }

    console.warn('[gameProgress] No gameProgress field found in user document');
    return null;
  } catch (error) {
    console.error('[gameProgress] ❌ Error loading from Firestore:', error);
    return null;
  }
};

/**
 * Sync specific data to Firestore (for frequent updates like XP)
 */
export const syncXpToFirestore = async (xp: number) => {
  console.log('[syncXpToFirestore] Syncing XP:', xp, 'to Firestore...');
  try {
    await saveGameProgress({ xp });
    console.log('[syncXpToFirestore] ✅ XP sync complete');
  } catch (error) {
    console.error('[syncXpToFirestore] ❌ XP sync failed:', error);
    throw error;
  }
};

export const syncGemsToFirestore = async (gems: number) => {
  await saveGameProgress({ gems });
};

export const syncPurchasesToFirestore = async (purchases: number[]) => {
  await saveGameProgress({ purchases });
};

export const syncSkillsToFirestore = async (unlockedSkills: string[]) => {
  await saveGameProgress({ unlockedSkills });
};

export const syncTitlesToFirestore = async (unlockedTitles: string[], selectedTitle: string | null) => {
  await saveGameProgress({ unlockedTitles, selectedTitle });
};

export const syncTasksToFirestore = async (tasks: any[]) => {
  console.log('[syncTasksToFirestore] Syncing tasks to Firestore...');
  try {
    await saveGameProgress({ tasks });
    console.log('[syncTasksToFirestore] ✅ Tasks sync complete');
  } catch (error) {
    console.error('[syncTasksToFirestore] ❌ Tasks sync failed:', error);
    throw error;
  }
};

export const syncPetsToFirestore = async (pets: any[], currentPetId: string | null) => {
  console.log('[syncPetsToFirestore] 📤 Syncing pets to Firestore...', { petsCount: pets?.length, currentPetId, petIds: pets?.map(p => p.id) });
  try {
    const result = await saveGameProgress({ pets, currentPetId });
    console.log('[syncPetsToFirestore] ✅ Pets sync complete');
    return result;
  } catch (error) {
    console.error('[syncPetsToFirestore] ❌ Pets sync failed:', error);
    throw error;
  }
};
