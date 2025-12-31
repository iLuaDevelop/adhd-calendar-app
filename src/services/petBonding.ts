import { Pet } from './pet';

export interface BondMilestone {
  level: number;
  name: string;
  description: string;
  unlockedFeature: string;
  emoji: string;
}

export const BOND_MILESTONES: BondMilestone[] = [
  {
    level: 0,
    name: 'Stranger',
    description: 'You just met your pet',
    unlockedFeature: 'basic-care',
    emoji: '👤',
  },
  {
    level: 20,
    name: 'Acquaintance',
    description: 'Your pet is starting to know you',
    unlockedFeature: 'play-interaction',
    emoji: '👥',
  },
  {
    level: 40,
    name: 'Friend',
    description: 'Your pet trusts you',
    unlockedFeature: 'quest-system',
    emoji: '🤝',
  },
  {
    level: 60,
    name: 'Best Friend',
    description: 'Inseparable bond formed',
    unlockedFeature: 'ability-unlock-1',
    emoji: '💕',
  },
  {
    level: 80,
    name: 'Soulbound',
    description: 'A mystical connection exists between you',
    unlockedFeature: 'ability-unlock-2',
    emoji: '✨',
  },
  {
    level: 100,
    name: 'Perfect Bond',
    description: 'You and your pet are one',
    unlockedFeature: 'evolution-unlock',
    emoji: '👑',
  },
];

// Get current bond milestone
export const getCurrentBondMilestone = (bondLevel: number): BondMilestone => {
  const current = [...BOND_MILESTONES].reverse().find(m => bondLevel >= m.level);
  return current || BOND_MILESTONES[0];
};

// Get next bond milestone
export const getNextBondMilestone = (bondLevel: number): BondMilestone | null => {
  const next = BOND_MILESTONES.find(m => m.level > bondLevel);
  return next || null;
};

// Get progress to next milestone
export const getBondProgress = (bondLevel: number): { current: number; next: number; progress: number } => {
  const currentMilestone = getCurrentBondMilestone(bondLevel);
  const nextMilestone = getNextBondMilestone(bondLevel);

  if (!nextMilestone) {
    return { current: 100, next: 100, progress: 100 };
  }

  const progress = Math.round(
    ((bondLevel - currentMilestone.level) / (nextMilestone.level - currentMilestone.level)) * 100
  );

  return {
    current: currentMilestone.level,
    next: nextMilestone.level,
    progress: Math.min(100, progress),
  };
};

// Check if pet has unlocked a feature based on bond level
export const hasUnlockedFeature = (pet: Pet, feature: string): boolean => {
  const milestone = getCurrentBondMilestone(pet.bondLevel);
  const currentMilestoneIndex = BOND_MILESTONES.findIndex(m => m.level === milestone.level);

  // Check all unlocked milestones up to current
  return BOND_MILESTONES.slice(0, currentMilestoneIndex + 1).some(
    m => m.unlockedFeature === feature
  );
};

// Get affinity description (flavor text)
export const getAffinityDescription = (affinity: number): string => {
  if (affinity < 10) return "Your pet seems indifferent to you.";
  if (affinity < 30) return "Your pet is warming up to you.";
  if (affinity < 50) return "Your pet enjoys your company.";
  if (affinity < 70) return "Your pet adores you.";
  if (affinity < 90) return "Your pet is deeply attached to you.";
  return "Your pet would do anything for you.";
};

// Get bond level emoji
export const getBondLevelEmoji = (bondLevel: number): string => {
  if (bondLevel < 20) return '💭';
  if (bondLevel < 40) return '👀';
  if (bondLevel < 60) return '🙂';
  if (bondLevel < 80) return '😊';
  if (bondLevel < 100) return '😍';
  return '👑';
};

// Calculate bond gain from activity
export const calculateBondGain = (
  activity: 'feed' | 'play' | 'heal' | 'clean' | 'quest-complete',
  petLevel: number
): number => {
  const baseGain: Record<string, number> = {
    feed: 2,
    play: 8,
    heal: 5,
    clean: 3,
    'quest-complete': 15,
  };

  const gain = baseGain[activity] || 0;
  const levelMultiplier = 1 + petLevel * 0.05; // Higher level pets gain bond faster

  return Math.floor(gain * levelMultiplier);
};

// Get time since last interaction
export const getTimeSinceLastInteraction = (lastPlayedAt?: number): string => {
  if (!lastPlayedAt) return 'never';

  const now = Date.now();
  const diffMs = now - lastPlayedAt;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

// Pet affection messages based on bond level
export const getAffinityMessage = (pet: Pet): string => {
  const messages: Record<number, string[]> = {
    0: [
      "Your pet looks at you cautiously.",
      "Your pet seems unsure about you.",
      "Your pet keeps its distance.",
    ],
    20: [
      "Your pet tilts its head at you.",
      "Your pet shows mild interest.",
      "Your pet sniffs in your direction.",
    ],
    40: [
      "Your pet wags its tail slightly.",
      "Your pet approaches you.",
      "Your pet seems comfortable around you.",
    ],
    60: [
      "Your pet nuzzles against you.",
      "Your pet purrs happily.",
      "Your pet won't leave your side.",
    ],
    80: [
      "Your pet cuddles with you affectionately.",
      "Your pet looks at you with pure adoration.",
      "Your pet follows you everywhere.",
    ],
    100: [
      "Your pet is your soulmate.",
      "Your pet would protect you with its life.",
      "You are everything to your pet.",
    ],
  };

  const category = Math.floor(pet.bondLevel / 20) * 20;
  const categoryMessages = messages[category] || messages[0];

  return categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
};
