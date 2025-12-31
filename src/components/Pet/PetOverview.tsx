import React, { useState, useEffect } from 'react';
import { Pet, feedPet, playWithPet, healPet, cleanPet, getPet } from '../../services/pet';
import { getCurrentBondMilestone, getBondProgress, getAffinityMessage } from '../../services/petBonding';
import { useToast } from '../../context/ToastContext';

interface PetOverviewProps {
  pet: Pet | null;
  onUpdate?: () => void;
}

const PetOverview: React.FC<PetOverviewProps> = ({ pet, onUpdate }) => {
  const { showToast } = useToast();
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationType, setAnimationType] = useState<string | null>(null);

  const triggerAnimation = (type: string) => {
    setAnimationType(type);
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      setAnimationType(null);
    }, 600);
  };

  const handleFeed = () => {
    const updated = feedPet();
    if (updated) {
      triggerAnimation('feed');
      showToast('Fed your pet!', 'success');
      onUpdate?.();
    }
  };

  const handlePlay = () => {
    const updated = playWithPet();
    if (updated) {
      triggerAnimation('play');
      showToast('Played with your pet!', 'success');
      onUpdate?.();
    } else {
      showToast('Your pet is too tired!', 'warning');
    }
  };

  const handleHeal = () => {
    const updated = healPet();
    if (updated) {
      triggerAnimation('heal');
      showToast('Healed your pet!', 'success');
      onUpdate?.();
    }
  };

  const handleClean = () => {
    const updated = cleanPet();
    if (updated) {
      triggerAnimation('clean');
      showToast('Cleaned your pet!', 'success');
      onUpdate?.();
    }
  };

  if (!pet) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No pet yet...</p>
      </div>
    );
  }

  const bondMilestone = getCurrentBondMilestone(pet.bondLevel);
  const bondProgress = getBondProgress(pet.bondLevel);
  const affinityMessage = getAffinityMessage(pet);

  // Determine mood emoji and animation
  const moodEmojis: Record<string, string> = {
    happy: '😊',
    excited: '🤩',
    playful: '🎮',
    content: '😌',
    neutral: '😐',
    sad: '😢',
    sleepy: '😴',
  };

  const getMoodColor = (): string => {
    switch (pet.mood) {
      case 'excited':
      case 'happy':
        return 'text-yellow-400';
      case 'playful':
        return 'text-blue-400';
      case 'content':
        return 'text-green-400';
      case 'sad':
        return 'text-red-400';
      case 'sleepy':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Pet Display */}
      <div
        className="relative flex flex-col items-center justify-center p-8 bg-gradient-to-b from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-500/30"
        style={{
          animation: isAnimating ? `pulse 0.6s ease-in-out` : 'none',
        }}
      >
        {/* Pet Emoji - Large and centered */}
        <div className="relative mb-4">
          <div
            className="text-9xl transition-transform duration-300"
            style={{
              transform: isAnimating
                ? animationType === 'play'
                  ? 'scale(1.2) rotate(5deg)'
                  : animationType === 'feed'
                  ? 'scale(1.1)'
                  : animationType === 'heal'
                  ? 'scale(1.15)'
                  : 'scale(1)'
                : 'scale(1)',
            }}
          >
            {pet.emoji}
          </div>

          {/* Mood indicator */}
          <div className={`absolute top-0 right-0 text-5xl ${getMoodColor()}`}>
            {moodEmojis[pet.mood] || moodEmojis.neutral}
          </div>

          {/* Level badge */}
          <div className="absolute bottom-0 left-0 bg-blue-600 rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold text-white border-2 border-blue-400">
            {pet.level}
          </div>

          {/* Stage indicator */}
          <div className="absolute bottom-0 right-0 bg-purple-600 rounded-full px-3 py-1 text-xs font-bold text-white border-2 border-purple-400">
            {pet.stage.toUpperCase()}
          </div>
        </div>

        {/* Pet Name */}
        <h2 className="text-3xl font-bold text-white mb-2">{pet.name}</h2>

        {/* Affinity Message */}
        <p className="text-sm text-gray-300 italic mb-6 text-center max-w-xs">
          "{affinityMessage}"
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 w-full mb-6">
          {/* Hunger */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-300">🍖 Hunger</span>
              <span className="text-xs font-semibold text-gray-200">{pet.hunger}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all"
                style={{ width: `${pet.hunger}%` }}
              />
            </div>
          </div>

          {/* Happiness */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-300">💛 Happiness</span>
              <span className="text-xs font-semibold text-gray-200">{pet.happiness}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-yellow-400 h-2 rounded-full transition-all"
                style={{ width: `${pet.happiness}%` }}
              />
            </div>
          </div>

          {/* Health */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-300">❤️ Health</span>
              <span className="text-xs font-semibold text-gray-200">{pet.health}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${pet.health}%` }}
              />
            </div>
          </div>

          {/* Energy */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-300">⚡ Energy</span>
              <span className="text-xs font-semibold text-gray-200">{pet.energy}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-400 h-2 rounded-full transition-all"
                style={{ width: `${pet.energy}%` }}
              />
            </div>
          </div>

          {/* Cleanliness */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-300">✨ Cleanliness</span>
              <span className="text-xs font-semibold text-gray-200">{pet.cleanliness}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-cyan-400 h-2 rounded-full transition-all"
                style={{ width: `${pet.cleanliness}%` }}
              />
            </div>
          </div>

          {/* Bond Level */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-300">💖 Bond</span>
              <span className="text-xs font-semibold text-gray-200">{pet.bondLevel}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-pink-500 h-2 rounded-full transition-all"
                style={{ width: `${pet.bondLevel}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bond Milestone */}
        <div className="w-full p-4 bg-pink-900/30 border border-pink-500/30 rounded-lg mb-6">
          <div className="flex items-center gap-3 justify-center">
            <span className="text-2xl">{bondMilestone.emoji}</span>
            <div>
              <p className="font-semibold text-pink-300">{bondMilestone.name}</p>
              <p className="text-xs text-gray-400">{bondMilestone.description}</p>
            </div>
          </div>
          {bondProgress.progress < 100 && (
            <div className="mt-3">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-pink-500 h-2 rounded-full transition-all"
                  style={{ width: `${bondProgress.progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {bondProgress.progress}% to {bondProgress.next}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full grid grid-cols-2 gap-3">
          <button
            onClick={handleFeed}
            className="py-3 px-4 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-white transition-colors flex items-center justify-center gap-2"
          >
            🍖 Feed
          </button>
          <button
            onClick={handlePlay}
            className="py-3 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-white transition-colors flex items-center justify-center gap-2"
            disabled={pet.energy < 20}
          >
            🎮 Play
          </button>
          <button
            onClick={handleHeal}
            className="py-3 px-4 bg-green-600 hover:bg-green-700 rounded-lg font-semibold text-white transition-colors flex items-center justify-center gap-2"
          >
            ❤️ Heal
          </button>
          <button
            onClick={handleClean}
            className="py-3 px-4 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-semibold text-white transition-colors flex items-center justify-center gap-2"
          >
            ✨ Clean
          </button>
        </div>
      </div>

      {/* Interaction Stats */}
      <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
        <h3 className="font-semibold text-white mb-3">📊 Interaction Stats</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Total Interactions</p>
            <p className="text-xl font-bold text-white">{pet.totalInteractions}</p>
          </div>
          <div>
            <p className="text-gray-400">Times Fed</p>
            <p className="text-xl font-bold text-white">{pet.timesFeeding}</p>
          </div>
          <div>
            <p className="text-gray-400">Pet Level</p>
            <p className="text-xl font-bold text-white">{pet.level}</p>
          </div>
          <div>
            <p className="text-gray-400">Pet Age</p>
            <p className="text-xl font-bold text-white">
              {Math.floor((Date.now() - pet.createdAt) / 86400000)} days
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetOverview;
