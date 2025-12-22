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

export function setXp(xp: number) {
  try {
    localStorage.setItem(XP_KEY, String(xp));
    // Sync to Firestore if user is logged in
    syncXpToFirestore(xp).catch(err => console.warn('Failed to sync XP to Firestore:', err));
  } catch {}
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

export function resetXp() {
  setXp(0);
  try {
    window.dispatchEvent(new CustomEvent('xp:reset', { detail: { xp: 0 } }));
  } catch {}
}
