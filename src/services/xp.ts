import { calculateCritical } from './critical';
import { syncXpToFirestore } from './gameProgress';

export const XP_KEY = 'adhd_xp';

// Calculate XP needed to reach a specific level
export function getXpNeededForLevel(level: number): number {
  if (level <= 1) return 0;
  // XP requirement increases with each level: 100 + (level * 75)
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += 100 + (i * 75);
  }
  return total;
}

// Get current level from total XP
export function getLevelFromXp(totalXp: number): number {
  let level = 1;
  while (getXpNeededForLevel(level + 1) <= totalXp) {
    level++;
  }
  return level;
}

// Get XP needed to reach next level
export function getXpToNextLevel(totalXp: number): number {
  const currentLevel = getLevelFromXp(totalXp);
  const nextLevelXp = getXpNeededForLevel(currentLevel + 1);
  return Math.max(0, nextLevelXp - totalXp);
}

// Get XP progress into current level
export function getXpIntoCurrentLevel(totalXp: number): number {
  const currentLevel = getLevelFromXp(totalXp);
  const currentLevelXp = getXpNeededForLevel(currentLevel);
  return totalXp - currentLevelXp;
}

// Get total XP needed for current level
export function getTotalXpForCurrentLevel(totalXp: number): number {
  const currentLevel = getLevelFromXp(totalXp);
  const nextLevelXp = getXpNeededForLevel(currentLevel + 1);
  const currentLevelXp = getXpNeededForLevel(currentLevel);
  return nextLevelXp - currentLevelXp;
}

export function getXp(): number {
  try {
    const v = localStorage.getItem(XP_KEY);
    return v ? Number(v) : 0;
  } catch {
    return 0;
  }
}

export function setXp(xp: number, shouldSync: boolean = true) {
  try {
    const xpStr = String(xp);
    localStorage.setItem(XP_KEY, xpStr);
    const verifyStored = localStorage.getItem(XP_KEY);
    console.log('[XP] Setting XP to:', xp, '| Verified in localStorage:', verifyStored);
    
    // Sync to Firestore if user is logged in and shouldSync is true
    if (shouldSync) {
      console.log('[XP] ⬆️ Syncing XP', xp, 'to Firestore...');
      syncXpToFirestore(xp).catch(err => console.warn('[XP] ❌ Failed to sync:', err));
    } else {
      console.log('[XP] ⏭️ Skipping sync (logout in progress)');
    }
  } catch (err) {
    console.error('[XP] ❌ Error in setXp:', err);
  }
  window.dispatchEvent(new CustomEvent('xp:update', { detail: { xp } }));
}

export function grantXp(amount = 10) {
  const critical = calculateCritical();
  const finalAmount = amount * critical.xpMultiplier;
  
  const current = getXp();
  const next = current + finalAmount;
  setXp(next);
  
  window.dispatchEvent(new CustomEvent('xp:granted', { 
    detail: { 
      amount: finalAmount,
      baseAmount: amount,
      isCritical: critical.isCritical,
      crateReward: critical.crateReward
    } 
  }));
  return next;
}

export function resetXp(shouldSync: boolean = true) {
  setXp(0, shouldSync);
  try {
    window.dispatchEvent(new CustomEvent('xp:reset', { detail: { xp: 0 } }));
  } catch {}
}
