import { db } from './firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';

export interface Update {
  id: string;
  icon: string;
  title: string;
  desc: string;
  timestamp: any;
  active: boolean;
  commitHash?: string;
}

/**
 * Real-time listener for active updates
 * Returns up to 5 most recent active updates
 */
export const subscribeToUpdates = (callback: (updates: Update[]) => void) => {
  const updatesRef = collection(db, 'updates');
  const q = query(
    updatesRef,
    where('active', '==', true),
    orderBy('timestamp', 'desc'),
    limit(5)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const updates: Update[] = [];
    snapshot.forEach((doc) => {
      updates.push({
        id: doc.id,
        ...doc.data()
      } as Update);
    });
    callback(updates);
  });

  return unsubscribe;
};

/**
 * Add a new update (used by automation/admin)
 */
export const addUpdate = async (
  icon: string,
  title: string,
  desc: string,
  commitHash?: string
) => {
  const updatesRef = collection(db, 'updates');
  return addDoc(updatesRef, {
    icon,
    title,
    desc,
    active: true,
    timestamp: serverTimestamp(),
    commitHash: commitHash || null
  });
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatUpdateTime = (timestamp: any): string => {
  if (!timestamp) return 'just now';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
};
