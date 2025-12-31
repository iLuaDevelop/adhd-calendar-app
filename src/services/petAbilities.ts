import { PetAbility, Pet } from './pet';

export const PET_ABILITIES: Record<string, PetAbility> = {
  'xp-boost': {
    id: 'xp-boost',
    name: 'XP Amplifier',
    description: 'Increases XP gained from tasks and games by 5-25%',
    icon: '⚡',
    effect: 'xp-boost',
    bonus: 10,
    levelRequirement: 2,
    evolutionRequirement: 'baby',
  },
  'casino-luck': {
    id: 'casino-luck',
    name: 'Lucky Streak',
    description: 'Increases casino win probability by 8-35%',
    icon: '🍀',
    effect: 'casino-luck',
    bonus: 15,
    levelRequirement: 3,
    evolutionRequirement: 'teen',
  },
  'task-speed': {
    id: 'task-speed',
    name: 'Task Sprint',
    description: 'Allows tasks to be completed 10-40% faster',
    icon: '💨',
    effect: 'task-speed',
    bonus: 20,
    levelRequirement: 4,
    evolutionRequirement: 'adult',
  },
  'gem-magnet': {
    id: 'gem-magnet',
    name: 'Gem Attractor',
    description: 'Attracts 15-50% more gems from activities',
    icon: '💎',
    effect: 'gem-magnet',
    bonus: 25,
    levelRequirement: 5,
    evolutionRequirement: 'legendary',
  },
  'pet-telepathy': {
    id: 'pet-telepathy',
    name: 'Pet Telepathy',
    description: 'Unlocks secret quests and hidden pet interactions',
    icon: '🧠',
    effect: 'pet-telepathy',
    bonus: 30,
    levelRequirement: 6,
    evolutionRequirement: 'mythic',
  },
  'double-strike': {
    id: 'double-strike',
    name: 'Double Strike',
    description: '15-40% chance to gain double rewards from any activity',
    icon: '⚔️',
    effect: 'double-strike',
    bonus: 20,
    levelRequirement: 3,
  },
  'shield-wall': {
    id: 'shield-wall',
    name: 'Shield Wall',
    description: 'Reduces damage from failed tasks, prevents health loss',
    icon: '🛡️',
    effect: 'shield-wall',
    bonus: 15,
    levelRequirement: 2,
  },
  'healing-aura': {
    id: 'healing-aura',
    name: 'Healing Aura',
    description: 'Regenerates 5% health every time pet is interacted with',
    icon: '✨',
    effect: 'healing-aura',
    bonus: 10,
    levelRequirement: 4,
  },
};

// Get unlockable abilities for a specific level
export const getUnlockableAbilitiesForLevel = (level: number): PetAbility[] => {
  return Object.values(PET_ABILITIES).filter(ability => ability.levelRequirement === level);
};

// Get all unlockable abilities up to a certain level
export const getAvailableAbilities = (currentLevel: number): PetAbility[] => {
  return Object.values(PET_ABILITIES).filter(ability => ability.levelRequirement <= currentLevel);
};

// Check if ability can be unlocked for a pet
export const canUnlockAbility = (pet: Pet, ability: PetAbility): boolean => {
  // Already unlocked
  if (pet.unlockedAbilities.includes(ability.id)) return false;

  // Check level requirement
  if (pet.level < ability.levelRequirement) return false;

  // Check evolution requirement if exists
  if (ability.evolutionRequirement && pet.stage !== ability.evolutionRequirement) {
    return false;
  }

  return true;
};

// Get recommended abilities for next unlock
export const getNextAbilityUnlocks = (pet: Pet): PetAbility[] => {
  return getAvailableAbilities(pet.level).filter(
    ability => !pet.unlockedAbilities.includes(ability.id)
  );
};

// Calculate total bonus multiplier from all abilities
export const calculateTotalAbilityBonus = (pet: Pet, bonusType: string): number => {
  let total = 0;

  pet.unlockedAbilities.forEach(abilityId => {
    const ability = PET_ABILITIES[abilityId];
    if (!ability) return;

    if (ability.effect === bonusType) {
      // Scale bonus by bond level
      const bondMultiplier = 1 + (pet.bondLevel / 100) * 0.5; // 1.0x to 1.5x multiplier
      const levelMultiplier = 1 + ((pet.level - 1) / 5) * 0.25; // 1.0x to 1.25x multiplier
      total += (ability.bonus * bondMultiplier * levelMultiplier) / 100;
    }
  });

  return total;
};
