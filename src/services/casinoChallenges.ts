/**
 * Daily Casino Challenges Service
 * Tracks and manages daily casino challenge missions with bonus rewards
 */

export interface CasinoChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number; // How many to achieve
  current: number; // Progress
  reward: number; // Bonus gems
  completed: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface DailyChallenges {
  date: string;
  challenges: CasinoChallenge[];
  totalCompleted: number;
}

const CASINO_CHALLENGES_KEY = 'adhd_casino_challenges';

// Generate challenges for the day
const generateDailyChallenges = (): CasinoChallenge[] => {
  const challenges: CasinoChallenge[] = [
    {
      id: 'win-3-games',
      title: 'Triple Winner',
      description: 'Win 3 casino games',
      icon: '🏆',
      target: 3,
      current: 0,
      reward: 100,
      completed: false,
      difficulty: 'easy',
    },
    {
      id: 'slots-jackpot',
      title: 'Slot Master',
      description: 'Land a 3-symbol jackpot in Slots',
      icon: '🎰',
      target: 1,
      current: 0,
      reward: 150,
      completed: false,
      difficulty: 'medium',
    },
    {
      id: 'roulette-color',
      title: 'Roulette Streak',
      description: 'Win 5 Roulette spins in a row',
      icon: '🎡',
      target: 5,
      current: 0,
      reward: 200,
      completed: false,
      difficulty: 'hard',
    },
    {
      id: 'win-500-gems',
      title: 'Big Earner',
      description: 'Win 500+ gems in one game',
      icon: '💎',
      target: 1,
      current: 0,
      reward: 250,
      completed: false,
      difficulty: 'hard',
    },
    {
      id: 'blackjack-5-wins',
      title: 'Blackjack Champion',
      description: 'Win 5 Blackjack games',
      icon: '♠️',
      target: 5,
      current: 0,
      reward: 180,
      completed: false,
      difficulty: 'medium',
    },
  ];

  return challenges;
};

// Get today's challenges
export const getDailyChallenges = (): DailyChallenges => {
  const today = new Date().toDateString();
  const stored = localStorage.getItem(CASINO_CHALLENGES_KEY);

  let dailyChallenges: DailyChallenges | null = null;

  if (stored) {
    dailyChallenges = JSON.parse(stored);
  }

  // Reset if new day or no challenges exist
  if (!dailyChallenges || dailyChallenges.date !== today) {
    dailyChallenges = {
      date: today,
      challenges: generateDailyChallenges(),
      totalCompleted: 0,
    };
    localStorage.setItem(CASINO_CHALLENGES_KEY, JSON.stringify(dailyChallenges));
  }

  return dailyChallenges;
};

// Progress a challenge
export const progressChallenge = (
  challengeId: string,
  amount: number = 1
): CasinoChallenge | null => {
  const daily = getDailyChallenges();
  const challenge = daily.challenges.find(c => c.id === challengeId);

  if (!challenge || challenge.completed) {
    return null;
  }

  challenge.current = Math.min(challenge.current + amount, challenge.target);

  if (challenge.current >= challenge.target) {
    challenge.completed = true;
    daily.totalCompleted += 1;
  }

  localStorage.setItem(CASINO_CHALLENGES_KEY, JSON.stringify(daily));

  // Dispatch event for UI updates
  window.dispatchEvent(
    new CustomEvent('casino:challengeUpdated', { detail: challenge })
  );

  return challenge;
};

// Get total bonus gems from completed challenges
export const getChallengeBonus = (): number => {
  const daily = getDailyChallenges();
  return daily.challenges
    .filter(c => c.completed)
    .reduce((sum, c) => sum + c.reward, 0);
};

// Check if all challenges are completed
export const areAllChallengesCompleted = (): boolean => {
  const daily = getDailyChallenges();
  return daily.challenges.every(c => c.completed);
};

// Get progress percentage
export const getChallengeProgress = (): number => {
  const daily = getDailyChallenges();
  const completed = daily.challenges.filter(c => c.completed).length;
  return Math.round((completed / daily.challenges.length) * 100);
};

// Mark challenge as completed
export const completeChallenge = (challengeId: string): CasinoChallenge | null => {
  const daily = getDailyChallenges();
  const challenge = daily.challenges.find(c => c.id === challengeId);

  if (!challenge) return null;

  challenge.completed = true;
  challenge.current = challenge.target;
  daily.totalCompleted += 1;

  localStorage.setItem(CASINO_CHALLENGES_KEY, JSON.stringify(daily));

  window.dispatchEvent(
    new CustomEvent('casino:challengeCompleted', { detail: challenge })
  );

  return challenge;
};

// Reset challenges (for testing)
export const resetChallenges = (): DailyChallenges => {
  const daily: DailyChallenges = {
    date: new Date().toDateString(),
    challenges: generateDailyChallenges(),
    totalCompleted: 0,
  };
  localStorage.setItem(CASINO_CHALLENGES_KEY, JSON.stringify(daily));
  return daily;
};
