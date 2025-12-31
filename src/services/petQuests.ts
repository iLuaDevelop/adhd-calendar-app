import { PetQuest } from './pet';

export const QUEST_TEMPLATES: Record<string, PetQuest> = {
  'forest-gather': {
    id: 'forest-gather',
    name: '🌲 Forest Gathering',
    description: 'Gather herbs from the enchanted forest',
    difficulty: 'easy',
    duration: 3600000, // 1 hour
    rewards: {
      gems: 15,
      xp: 50,
      petXp: 25,
    },
    riskFactor: 0.1,
    status: 'available',
  },
  'treasure-hunt': {
    id: 'treasure-hunt',
    name: '🏴‍☠️ Treasure Hunt',
    description: 'Search for hidden treasure on a remote island',
    difficulty: 'medium',
    duration: 14400000, // 4 hours
    rewards: {
      gems: 50,
      xp: 150,
      petXp: 75,
    },
    riskFactor: 0.25,
    status: 'available',
  },
  'dragon-duel': {
    id: 'dragon-duel',
    name: '🐉 Dragon Duel',
    description: 'Battle a mighty dragon for glory and riches',
    difficulty: 'hard',
    duration: 28800000, // 8 hours
    rewards: {
      gems: 150,
      xp: 500,
      petXp: 250,
    },
    riskFactor: 0.5,
    status: 'available',
  },
  'spirit-walk': {
    id: 'spirit-walk',
    name: '👻 Spirit Walk',
    description: 'Journey through the spirit realm to gain wisdom',
    difficulty: 'medium',
    duration: 7200000, // 2 hours
    rewards: {
      gems: 30,
      xp: 100,
      petXp: 50,
    },
    riskFactor: 0.2,
    status: 'available',
  },
  'ocean-quest': {
    id: 'ocean-quest',
    name: '🌊 Ocean Quest',
    description: 'Dive deep to discover underwater mysteries',
    difficulty: 'hard',
    duration: 21600000, // 6 hours
    rewards: {
      gems: 100,
      xp: 400,
      petXp: 200,
    },
    riskFactor: 0.4,
    status: 'available',
  },
  'shadow-mission': {
    id: 'shadow-mission',
    name: '🌙 Shadow Mission',
    description: 'Infiltrate enemy stronghold under cover of darkness',
    difficulty: 'extreme',
    duration: 43200000, // 12 hours
    rewards: {
      gems: 300,
      xp: 1000,
      petXp: 500,
    },
    riskFactor: 0.7,
    status: 'available',
  },
  'food-run': {
    id: 'food-run',
    name: '🍖 Food Run',
    description: 'Gather delicious snacks and treats',
    difficulty: 'easy',
    duration: 1800000, // 30 minutes
    rewards: {
      gems: 10,
      xp: 25,
      petXp: 15,
    },
    riskFactor: 0.05,
    status: 'available',
  },
  'magic-ritual': {
    id: 'magic-ritual',
    name: '✨ Magic Ritual',
    description: 'Perform an ancient magic ritual to gain power',
    difficulty: 'medium',
    duration: 10800000, // 3 hours
    rewards: {
      gems: 40,
      xp: 120,
      petXp: 60,
    },
    riskFactor: 0.3,
    status: 'available',
  },
};

// Generate a random quest for the pet
export const generateRandomQuest = (): PetQuest => {
  const templates = Object.values(QUEST_TEMPLATES);
  const template = templates[Math.floor(Math.random() * templates.length)];

  return {
    ...template,
    id: 'quest_' + Date.now(),
  };
};

// Get available quests (exclude active/completed)
export const getAvailableQuests = (): PetQuest[] => {
  return Object.values(QUEST_TEMPLATES).map(template => ({
    ...template,
    id: template.id,
  }));
};

// Start a quest (move from available to active)
export const startQuest = (questTemplate: PetQuest): PetQuest => {
  return {
    ...questTemplate,
    startTime: Date.now(),
    status: 'active' as const,
  };
};

// Complete a quest with success/failure
export const completeQuest = (quest: PetQuest): PetQuest => {
  // Determine success/failure based on risk factor
  const success = Math.random() > quest.riskFactor;

  return {
    ...quest,
    completedAt: Date.now(),
    status: success ? ('completed' as const) : ('failed' as const),
  };
};

// Get time remaining on active quest
export const getQuestTimeRemaining = (quest: PetQuest): number | null => {
  if (!quest.startTime || quest.status !== 'active') return null;

  const elapsed = Date.now() - quest.startTime;
  const remaining = quest.duration - elapsed;

  return Math.max(0, remaining);
};

// Format remaining time as human-readable string
export const formatQuestTime = (ms: number): string => {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return 'Starting...';
};

// Get quest difficulty color
export const getQuestDifficultyColor = (
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
): string => {
  switch (difficulty) {
    case 'easy':
      return '#10b981'; // green
    case 'medium':
      return '#3b82f6'; // blue
    case 'hard':
      return '#f59e0b'; // amber
    case 'extreme':
      return '#ef4444'; // red
  }
};

// Get quest difficulty emoji
export const getQuestDifficultyEmoji = (
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
): string => {
  switch (difficulty) {
    case 'easy':
      return '⭐';
    case 'medium':
      return '⭐⭐';
    case 'hard':
      return '⭐⭐⭐';
    case 'extreme':
      return '⭐⭐⭐⭐';
  }
};
