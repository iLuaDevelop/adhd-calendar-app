import { grantXp, getXp, setXp } from './xp';
import { addGems, getGems } from './currency';
import { syncPetsToFirestore } from './gameProgress';

const PET_KEY = 'adhd_pet';
const PETS_KEY = 'adhd_pets'; // For multiple pets
const CURRENT_PET_KEY = 'adhd_current_pet_id'; // Track which pet is active

// Helper to dispatch pet update event
const dispatchPetUpdate = () => {
  window.dispatchEvent(new CustomEvent('pet:update'));
};

export type PetColor = 'default' | 'golden' | 'cosmic' | 'forest' | 'sunset' | 'ocean' | 'rose';
export type PetSkin = 'default' | 'fluffy' | 'shiny' | 'mystical';

export interface PetEvolution {
  level: number;
  stage: 'egg' | 'baby' | 'teen' | 'adult' | 'legendary' | 'mythic';
  emoji: string;
  bonusStats: { hunger: number; happiness: number; health: number };
}

export interface PetAbility {
  id: string;
  name: string;
  description: string;
  icon: string;
  effect: string; // e.g., "xp-boost", "casino-luck", "task-speed"
  bonus: number; // Percentage or flat bonus (e.g., 10 for 10% XP boost)
  levelRequirement: number;
  evolutionRequirement?: 'baby' | 'teen' | 'adult' | 'legendary' | 'mythic';
}

export interface PetQuest {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  duration: number; // Duration in milliseconds
  rewards: {
    gems: number;
    xp: number;
    petXp: number;
  };
  riskFactor: number; // 0-1 (higher = more risk of failure)
  startTime?: number;
  completedAt?: number;
  status: 'available' | 'active' | 'completed' | 'failed';
}

export interface Pet {
  id: string;
  name: string;
  level: number;
  experience: number;
  hunger: number; // 0-100 (0 = full, 100 = starving)
  happiness: number; // 0-100
  health: number; // 0-100
  energy: number; // 0-100 (new)
  cleanliness: number; // 0-100 (new)
  timesFeeding: number;
  totalXpSpent: number; // Track XP spent on feeding
  lastFedAt: number;
  lastPlayedAt?: number; // For energy recovery
  createdAt: number;
  stage: 'egg' | 'baby' | 'teen' | 'adult' | 'legendary' | 'mythic';
  color: PetColor;
  skin: PetSkin;
  favoriteFood?: string; // Pet's favorite food type
  mood: 'happy' | 'content' | 'neutral' | 'sad' | 'excited' | 'sleepy' | 'playful';
  emoji?: string; // Store pet's emoji (from shop)
  bondLevel: number; // 0-100 (new)
  affinity: number; // Points towards bonding
  unlockedAbilities: string[]; // Array of ability IDs (new)
  activeQuests: PetQuest[]; // Currently active quests (new)
  questHistory: PetQuest[]; // Completed quests (new)
  totalInteractions: number; // Track total play/feed/heal interactions (new)
  evolutionPath?: PetEvolution[]; // Custom evolution path for future
}

// XP per level threshold
const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000];

// Feed costs
const FEED_COST_GEMS = 5;
const FEED_COST_XP = 30; // Alternative: feed with XP instead of gems

// XP gained per feed
const XP_PER_FEED = 50;

// Pet colors and skins
export const PET_COLORS: Record<PetColor, { name: string; emoji: string }> = {
  default: { name: 'Default', emoji: '🐔' },
  golden: { name: 'Golden', emoji: '✨' },
  cosmic: { name: 'Cosmic', emoji: '🌌' },
  forest: { name: 'Forest', emoji: '🌿' },
  sunset: { name: 'Sunset', emoji: '🌅' },
  ocean: { name: 'Ocean', emoji: '💙' },
  rose: { name: 'Rose', emoji: '🌹' },
};

export const PET_SKINS: Record<PetSkin, { name: string; description: string }> = {
  default: { name: 'Default', description: 'Classic pet' },
  fluffy: { name: 'Fluffy', description: 'Extra fluffy and soft' },
  shiny: { name: 'Shiny', description: 'Sparkly and bright' },
  mystical: { name: 'Mystical', description: 'Magical aura' },
};

// Create a new pet
export const createPet = (name: string = 'My Pet'): Pet => {
  const pet: Pet = {
    id: 'pet_' + Date.now(),
    name,
    level: 1,
    experience: 0,
    hunger: 30,
    happiness: 80,
    health: 100,
    energy: 80,
    cleanliness: 80,
    timesFeeding: 0,
    totalXpSpent: 0,
    lastFedAt: Date.now(),
    lastPlayedAt: Date.now(),
    createdAt: Date.now(),
    stage: 'egg',
    color: 'default',
    skin: 'default',
    favoriteFood: 'treats',
    mood: 'happy',
    bondLevel: 0,
    affinity: 0,
    unlockedAbilities: [],
    activeQuests: [],
    questHistory: [],
    totalInteractions: 0,
  };
  localStorage.setItem(PET_KEY, JSON.stringify(pet));
  
  // Add to multi-pet system
  const allPets = getAllPets();
  // Only add if not already there
  if (!allPets.find(p => p.id === pet.id)) {
    allPets.push(pet);
    localStorage.setItem(PETS_KEY, JSON.stringify(allPets));
  }
  
  // Set as current pet
  localStorage.setItem(CURRENT_PET_KEY, pet.id);
  
  // Also sync default pet to Firestore so it persists across logout/login
  syncPetsToFirestore(allPets, pet.id).catch(err => {
    console.error('[pet] ❌ Failed to sync default pet:', err);
  });
  
  dispatchPetUpdate();
  return pet;
};

// Get current pet (legacy - for backwards compatibility)
export const getPet = (): Pet | null => {
  // Try new multi-pet system first
  const currentId = getCurrentPetId();
  if (currentId) {
    const allPets = getAllPets();
    const currentPet = allPets.find(p => p.id === currentId);
    if (currentPet) return currentPet;
  }
  
  // Fall back to legacy single-pet system
  const petStr = localStorage.getItem(PET_KEY);
  if (!petStr) return null;
  return JSON.parse(petStr);
};

// Feed the pet (costs gems or XP, gains XP)
export const feedPet = (method: 'gems' | 'xp' = 'gems'): Pet | null => {
  const pet = getPet();
  if (!pet) return null;

  const currentXp = getXp();
  const gems = getGems();

  if (method === 'gems') {
    if (gems < FEED_COST_GEMS) {
      console.warn('Not enough gems to feed pet');
      return pet;
    }
    addGems(-FEED_COST_GEMS);
  } else if (method === 'xp') {
    if (currentXp < FEED_COST_XP) {
      console.warn('Not enough XP to feed pet');
      return pet;
    }
    setXp(currentXp - FEED_COST_XP);
    pet.totalXpSpent += FEED_COST_XP;
  }

  // Update pet stats
  pet.hunger = Math.max(0, pet.hunger - 30);
  pet.happiness = Math.min(100, pet.happiness + 10);
  pet.health = Math.min(100, pet.health + 5);
  pet.timesFeeding += 1;
  pet.lastFedAt = Date.now();

  // Gain XP
  pet.experience += XP_PER_FEED;
  grantXp(XP_PER_FEED); // Also add to player XP

  // Check for level up
  while (pet.experience >= LEVEL_THRESHOLDS[pet.level] && pet.level < LEVEL_THRESHOLDS.length) {
    pet.level += 1;
  }

  // Update stage based on level
  pet.stage = getStageFromLevel(pet.level);

  // Update mood based on stats
  pet.mood = getMoodFromStats(pet);

  savePet(pet);
  window.dispatchEvent(new CustomEvent('petUpdated', { detail: { pet } }));
  return pet;
};

// Passive decay over time (call periodically or on page load)
export const updatePetStats = (): Pet | null => {
  const pet = getPet();
  if (!pet) return null;

  const now = Date.now();
  const timeSinceLastFed = (now - pet.lastFedAt) / 1000 / 60; // minutes
  const timeSinceLastPlayed = pet.lastPlayedAt ? (now - pet.lastPlayedAt) / 1000 / 60 : 0; // minutes

  // Hunger increases over time (~1 hunger per minute, capped at 10 per update)
  if (timeSinceLastFed > 1) {
    const hungerIncrease = Math.min(10, Math.floor(timeSinceLastFed / 10));
    pet.hunger = Math.min(100, pet.hunger + hungerIncrease);
    pet.happiness = Math.max(0, pet.happiness - 1); // Slow happiness decay
  }

  // Energy recovers slowly over time (~1% per minute)
  if (timeSinceLastPlayed > 1) {
    const energyRecovery = Math.min(10, Math.floor(timeSinceLastPlayed / 10));
    pet.energy = Math.min(100, pet.energy + energyRecovery);
  }

  // Cleanliness decreases over time
  pet.cleanliness = Math.max(0, pet.cleanliness - 1);

  // Health decreases if too hungry
  if (pet.hunger > 80) {
    pet.health = Math.max(0, pet.health - 2);
  }

  // Health decreases if too dirty
  if (pet.cleanliness < 20) {
    pet.health = Math.max(0, pet.health - 1);
  }

  // If health is 0, reset to egg stage as a penalty
  if (pet.health <= 0) {
    pet.stage = 'egg';
    pet.level = 1;
    pet.experience = 0;
    pet.health = 50;
  }

  savePet(pet);
  return pet;
};

// Get pet stage based on level
export const getStageFromLevel = (level: number): 'egg' | 'baby' | 'teen' | 'adult' | 'legendary' | 'mythic' => {
  if (level === 1) return 'egg';
  if (level <= 2) return 'baby';
  if (level <= 3) return 'teen';
  if (level <= 4) return 'adult';
  if (level <= 5) return 'legendary';
  return 'mythic';
};

// Get pet emoji based on stage and color
export const getPetEmoji = (stage: string, color: PetColor = 'default', storedEmoji?: string): string => {
  // If pet has a stored emoji (from shop), use that
  if (storedEmoji) {
    return storedEmoji;
  }
  if (color !== 'default' && PET_COLORS[color]) {
    return PET_COLORS[color].emoji;
  }
  switch (stage) {
    case 'egg':
      return '🥚';
    case 'baby':
      return '🐣';
    case 'teen':
      return '🐥';
    case 'adult':
      return '🐔';
    case 'legendary':
      return '🦅';
    default:
      return '🐾';
  }
};

// Get pet mood based on stats
export const getMoodFromStats = (pet: Pet): 'happy' | 'content' | 'neutral' | 'sad' | 'excited' | 'sleepy' | 'playful' => {
  if (pet.energy < 20) return 'sleepy';
  if (pet.happiness > 80 && pet.hunger < 30 && pet.energy > 60) return 'excited';
  if (pet.happiness > 70 && pet.bondLevel > 50) return 'playful';
  if (pet.happiness > 60 && pet.health > 70) return 'happy';
  if (pet.happiness > 40 && pet.hunger < 70) return 'content';
  if (pet.health < 30) return 'sad';
  return 'neutral';
};

// Update pet name
export const renamePet = (newName: string): Pet | null => {
  const pet = getPet();
  if (!pet) return null;
  pet.name = newName.trim();
  savePet(pet);
  return pet;
};

// Change pet color
export const changePetColor = (color: PetColor): Pet | null => {
  const pet = getPet();
  if (!pet) return null;
  pet.color = color;
  savePet(pet);
  return pet;
};

// Change pet skin
export const changePetSkin = (skin: PetSkin): Pet | null => {
  const pet = getPet();
  if (!pet) return null;
  pet.skin = skin;
  savePet(pet);
  return pet;
};

// Get XP needed for next level
export const getXpToNextLevel = (level: number): number => {
  if (level >= LEVEL_THRESHOLDS.length) return 0;
  return LEVEL_THRESHOLDS[level];
};

// ===== MAIN SAVE FUNCTION =====

// Save pet to localStorage (uses forward references to functions defined below)
const savePet = (pet: Pet) => {
  // Save to legacy system
  localStorage.setItem(PET_KEY, JSON.stringify(pet));
  
  // Also save to multi-pet system - always try to update the pet in the array
  const petsStr = localStorage.getItem(PETS_KEY);
  const allPets: Pet[] = petsStr ? JSON.parse(petsStr) : [];
  const index = allPets.findIndex(p => p.id === pet.id);
  if (index >= 0) {
    allPets[index] = pet;
    localStorage.setItem(PETS_KEY, JSON.stringify(allPets));
    dispatchPetUpdate();
  } else {
  }
};

// Reset pet (for testing)
export const resetPet = () => {
  localStorage.removeItem(PET_KEY);
};

// ===== MULTI-PET SYSTEM =====

export interface PetSlot {
  petId: string;
  name: string;
  emoji: string;
  presetLevel: number;
  cost: number; // XP cost to unlock
}

export const PET_SHOP: PetSlot[] = [
  {
    petId: 'dragon',
    name: 'Dragon',
    emoji: '🐉',
    presetLevel: 3,
    cost: 500,
  },
  {
    petId: 'phoenix',
    name: 'Phoenix',
    emoji: '🔥',
    presetLevel: 4,
    cost: 750,
  },
  {
    petId: 'unicorn',
    name: 'Unicorn',
    emoji: '🦄',
    presetLevel: 5,
    cost: 1000,
  },
  {
    petId: 'robot',
    name: 'Robot',
    emoji: '🤖',
    presetLevel: 2,
    cost: 300,
  },
  {
    petId: 'butterfly',
    name: 'Butterfly',
    emoji: '🦋',
    presetLevel: 2,
    cost: 250,
  },
  {
    petId: 'lion',
    name: 'Lion',
    emoji: '🦁',
    presetLevel: 4,
    cost: 800,
  },
];

// Get all owned pets
// Migrate pet data to ensure all required fields exist
const migratePetData = (pet: any): Pet => {
  return {
    ...pet,
    unlockedAbilities: pet.unlockedAbilities || [],
    activeQuests: pet.activeQuests || [],
    questHistory: pet.questHistory || [],
    totalInteractions: pet.totalInteractions || 0,
    bondLevel: pet.bondLevel || 0,
    affinity: pet.affinity || 0,
    energy: pet.energy || 50,
    cleanliness: pet.cleanliness || 50,
    emoji: pet.emoji || '🐔',
    mood: pet.mood || 'happy'
  };
};

export const getAllPets = (): Pet[] => {
  try {
    const petsStr = localStorage.getItem(PETS_KEY);
    if (!petsStr) return [];
    const pets = JSON.parse(petsStr);
    // Migrate each pet to ensure all required properties exist
    return Array.isArray(pets) ? pets.map(migratePetData) : [];
  } catch {
    return [];
  }
};

// Get current active pet ID
export const getCurrentPetId = (): string | null => {
  return localStorage.getItem(CURRENT_PET_KEY);
};

// Set current active pet
export const setCurrentPet = (petId: string): void => {
  localStorage.setItem(CURRENT_PET_KEY, petId);
  
  // Sync to Firestore
  const allPets = getAllPets();
  syncPetsToFirestore(allPets, petId).catch(err => console.warn('[pet] Failed to sync current pet:', err));
  
  window.dispatchEvent(new CustomEvent('petSwitched', { detail: { petId } }));
  dispatchPetUpdate();
};

// Buy a new pet from the shop
export const buyPet = async (petShopId: string, customName?: string): Promise<Pet | null> => {
  console.log('[pet] 🛍️ buyPet called with petShopId:', petShopId);
  const petShop = PET_SHOP.find(p => p.petId === petShopId);
  if (!petShop) {
    console.warn('[pet] ❌ Pet shop item not found:', petShopId);
    return null;
  }

  const currentXp = getXp();
  if (currentXp < petShop.cost) {
    console.warn('[pet] ❌ Not enough XP to buy pet. Need:', petShop.cost, 'Have:', currentXp);
    return null;
  }

  // Deduct XP
  setXp(currentXp - petShop.cost);

  // Create new pet with preset stats
  const newPet: Pet = {
    id: 'pet_' + Date.now(),
    name: customName || petShop.name,
    level: petShop.presetLevel,
    experience: 0,
    hunger: 30,
    happiness: 80,
    health: 100,
    energy: 80,
    cleanliness: 80,
    timesFeeding: 0,
    totalXpSpent: 0,
    lastFedAt: Date.now(),
    lastPlayedAt: Date.now(),
    createdAt: Date.now(),
    stage: getStageFromLevel(petShop.presetLevel),
    color: 'default',
    skin: 'default',
    favoriteFood: 'treats',
    mood: 'happy',
    emoji: petShop.emoji,
    bondLevel: 0,
    affinity: 0,
    unlockedAbilities: [],
    activeQuests: [],
    questHistory: [],
    totalInteractions: 0,
  };

  // Add to pets list
  const allPets = getAllPets();
  allPets.push(newPet);
  console.log('[pet] ✅ Pet purchased, total pets now:', allPets.length);
  localStorage.setItem(PETS_KEY, JSON.stringify(allPets));

  // Sync to Firestore FIRST with all pets + new pet as current
  console.log('[pet] 📤 Syncing new pet purchase to Firestore:', newPet.id);
  await syncPetsToFirestore(allPets, newPet.id);
  
  // Set as current pet in localStorage and dispatch event
  localStorage.setItem(CURRENT_PET_KEY, newPet.id);
  window.dispatchEvent(new CustomEvent('petSwitched', { detail: { petId: newPet.id } }));

  console.log('[pet] ✅ Pet bought successfully:', newPet.name);
  return newPet;
};

// Delete a pet (remove from collection)
export const deletePet = (petId: string): void => {
  const allPets = getAllPets();
  const filtered = allPets.filter(p => p.id !== petId);
  localStorage.setItem(PETS_KEY, JSON.stringify(filtered));

  // If deleted pet was current, switch to first available
  let newCurrentPetId: string | null = null;
  if (getCurrentPetId() === petId) {
    if (filtered.length > 0) {
      newCurrentPetId = filtered[0].id;
      setCurrentPet(filtered[0].id);
    } else {
      localStorage.removeItem(CURRENT_PET_KEY);
      newCurrentPetId = null;
    }
  }
  
  // Sync deletion to Firestore
  console.log('[pet] Syncing pet deletion to Firestore:', petId);
  syncPetsToFirestore(filtered, newCurrentPetId).catch(err => console.warn('[pet] Failed to sync pet deletion:', err));
};

// Check if player has bought a pet with given shop ID
export const hasBoughtPetType = (petShopId: string): boolean => {
  const allPets = getAllPets();
  return allPets.some(p => p.name === PET_SHOP.find(ps => ps.petId === petShopId)?.name);
};

// Get emoji for pet by ID
export const getPetEmojiBySkin = (pet: Pet): string => {
  return '🐔'; // Default, can be customized based on pet type
};

// ===== NEW PET SYSTEMS =====

// Play with the pet (increases happiness, decreases energy)
export const playWithPet = (): Pet | null => {
  const pet = getPet();
  if (!pet) return null;

  if (pet.energy < 20) {
    console.warn('[pet] Pet is too tired to play');
    return pet;
  }

  pet.happiness = Math.min(100, pet.happiness + 20);
  pet.energy = Math.max(0, pet.energy - 25);
  pet.bondLevel = Math.min(100, pet.bondLevel + 5);
  pet.affinity = Math.min(100, pet.affinity + 3);
  pet.totalInteractions += 1;
  pet.lastPlayedAt = Date.now();

  // Small XP bonus to pet
  pet.experience += 10;
  while (pet.experience >= LEVEL_THRESHOLDS[pet.level] && pet.level < LEVEL_THRESHOLDS.length) {
    pet.level += 1;
  }
  pet.stage = getStageFromLevel(pet.level);

  savePet(pet);
  window.dispatchEvent(new CustomEvent('petUpdated', { detail: { pet } }));
  return pet;
};

// Heal the pet (costs gems or XP)
export const healPet = (method: 'gems' | 'xp' = 'gems'): Pet | null => {
  const pet = getPet();
  if (!pet) return null;

  const healCostGems = 10;
  const healCostXp = 50;

  const currentXp = getXp();
  const gems = getGems();

  if (method === 'gems') {
    if (gems < healCostGems) {
      console.warn('Not enough gems to heal pet');
      return pet;
    }
    addGems(-healCostGems);
  } else if (method === 'xp') {
    if (currentXp < healCostXp) {
      console.warn('Not enough XP to heal pet');
      return pet;
    }
    setXp(currentXp - healCostXp);
    pet.totalXpSpent += healCostXp;
  }

  pet.health = Math.min(100, pet.health + 50);
  pet.happiness = Math.min(100, pet.happiness + 15);
  pet.bondLevel = Math.min(100, pet.bondLevel + 3);
  pet.totalInteractions += 1;

  savePet(pet);
  window.dispatchEvent(new CustomEvent('petUpdated', { detail: { pet } }));
  return pet;
};

// Clean the pet (restores cleanliness)
export const cleanPet = (): Pet | null => {
  const pet = getPet();
  if (!pet) return null;

  const gems = getGems();
  const cleanCost = 3;

  if (gems < cleanCost) {
    console.warn('Not enough gems to clean pet');
    return pet;
  }

  addGems(-cleanCost);
  pet.cleanliness = 100;
  pet.happiness = Math.min(100, pet.happiness + 5);
  pet.bondLevel = Math.min(100, pet.bondLevel + 2);
  pet.totalInteractions += 1;

  savePet(pet);
  window.dispatchEvent(new CustomEvent('petUpdated', { detail: { pet } }));
  return pet;
};

// Increase bond level (through repeated interactions)
export const increaseBond = (amount: number = 5): Pet | null => {
  const pet = getPet();
  if (!pet) return null;

  pet.bondLevel = Math.min(100, pet.bondLevel + amount);
  pet.affinity = Math.min(100, pet.affinity + amount * 2);

  if (pet.bondLevel >= 100 && pet.level < 5) {
    pet.level += 1;
    pet.stage = getStageFromLevel(pet.level);
  }

  savePet(pet);
  return pet;
};

// Unlock a pet ability
export const unlockAbility = (abilityId: string): Pet | null => {
  const pet = getPet();
  if (!pet) return null;

  if (!pet.unlockedAbilities.includes(abilityId)) {
    pet.unlockedAbilities.push(abilityId);
    pet.bondLevel = Math.min(100, pet.bondLevel + 10);
    savePet(pet);
    window.dispatchEvent(new CustomEvent('petUpdated', { detail: { pet } }));
  }

  return pet;
};

// Get pet's active ability bonuses
export const getPetAbilityBonuses = (pet: Pet): Record<string, number> => {
  const bonuses: Record<string, number> = {
    xpBoost: 0,
    casinoLuck: 0,
    taskSpeed: 0,
    gemMagnet: 0,
  };

  // Bonuses scale with bond level and level
  const bondMultiplier = pet.bondLevel / 100;
  const levelMultiplier = pet.level / 6; // Scales from 0 to 1 as pet levels up

  if (pet.unlockedAbilities.includes('xp-boost')) {
    bonuses.xpBoost = Math.floor(5 * bondMultiplier * levelMultiplier);
  }
  if (pet.unlockedAbilities.includes('casino-luck')) {
    bonuses.casinoLuck = Math.floor(8 * bondMultiplier * levelMultiplier);
  }
  if (pet.unlockedAbilities.includes('task-speed')) {
    bonuses.taskSpeed = Math.floor(10 * bondMultiplier * levelMultiplier);
  }
  if (pet.unlockedAbilities.includes('gem-magnet')) {
    bonuses.gemMagnet = Math.floor(15 * bondMultiplier * levelMultiplier);
  }

  return bonuses;
};
