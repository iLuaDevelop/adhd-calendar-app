import React from 'react';
import { Pet } from '../../services/pet';
import { getCurrentBondMilestone, getTimeSinceLastInteraction } from '../../services/petBonding';

interface PetStatsProps {
  pet: Pet | null;
}

const PetStats: React.FC<PetStatsProps> = ({ pet }) => {
  if (!pet) return null;

  const bondMilestone = getCurrentBondMilestone(pet.bondLevel);
  const stats = [
    { label: '🍖 Hunger', value: pet.hunger, max: 100, color: 'bg-red-500', description: 'Lower is better' },
    { label: '💛 Happiness', value: pet.happiness, max: 100, color: 'bg-yellow-400', description: 'Higher is better' },
    { label: '❤️ Health', value: pet.health, max: 100, color: 'bg-green-500', description: 'Higher is better' },
    { label: '⚡ Energy', value: pet.energy, max: 100, color: 'bg-blue-400', description: 'Higher is better' },
    { label: '✨ Cleanliness', value: pet.cleanliness, max: 100, color: 'bg-cyan-400', description: 'Higher is better' },
    { label: '💖 Bond Level', value: pet.bondLevel, max: 100, color: 'bg-pink-500', description: 'Higher is better' },
  ];

  return (
    <div className="space-y-6">
      {/* Pet Info Header */}
      <div className="p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg border border-blue-500/30">
        <h3 className="font-semibold text-white mb-4">📊 Detailed Statistics</h3>
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <p className="text-gray-400">Pet Name</p>
            <p className="text-lg font-bold text-white">{pet.name}</p>
          </div>
          <div>
            <p className="text-gray-400">Stage</p>
            <p className="text-lg font-bold text-purple-300">{pet.stage.toUpperCase()}</p>
          </div>
          <div>
            <p className="text-gray-400">Level</p>
            <p className="text-lg font-bold text-blue-300">{pet.level}</p>
          </div>
          <div>
            <p className="text-gray-400">Bond Milestone</p>
            <p className="text-lg font-bold text-pink-300">{bondMilestone.name}</p>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div>
        <h3 className="font-semibold text-white mb-4">Core Stats</h3>
        <div className="space-y-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-white">{stat.label}</p>
                  <p className="text-xs text-gray-400">{stat.description}</p>
                </div>
                <p className="text-lg font-bold text-white">{stat.value}%</p>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className={`${stat.color} h-3 rounded-full transition-all`}
                  style={{ width: `${stat.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Experience & Leveling */}
      <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <h3 className="font-semibold text-white mb-4">⭐ Experience & Leveling</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-300">Current Experience</span>
              <span className="font-bold text-blue-300">{pet.experience} XP</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-300">Next Level Progress</span>
              <span className="text-xs text-gray-400">
                Level {pet.level} → {pet.level + 1}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, (pet.experience / (pet.level * 100)) * 100)}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm mt-4">
            <div className="bg-blue-900/30 rounded px-3 py-2">
              <p className="text-gray-400">Total XP Spent</p>
              <p className="font-bold text-blue-300">{pet.totalXpSpent}</p>
            </div>
            <div className="bg-purple-900/30 rounded px-3 py-2">
              <p className="text-gray-400">Times Leveled Up</p>
              <p className="font-bold text-purple-300">{pet.level - 1}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bond & Affinity Info */}
      <div className="p-4 bg-pink-900/20 border border-pink-500/30 rounded-lg">
        <h3 className="font-semibold text-white mb-4">💕 Bond & Affinity</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300">Bond Milestone</span>
              <span className="text-xl">{bondMilestone.emoji}</span>
            </div>
            <p className="text-sm text-gray-400 mb-2">{bondMilestone.description}</p>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-pink-500 h-2 rounded-full transition-all"
                style={{ width: `${pet.bondLevel}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm mt-4">
            <div className="bg-pink-900/30 rounded px-3 py-2">
              <p className="text-gray-400">Bond Level</p>
              <p className="font-bold text-pink-300">{pet.bondLevel} / 100</p>
            </div>
            <div className="bg-purple-900/30 rounded px-3 py-2">
              <p className="text-gray-400">Affinity Points</p>
              <p className="font-bold text-purple-300">{pet.affinity}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Interaction History */}
      <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
        <h3 className="font-semibold text-white mb-4">📈 Interaction History</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-green-900/30 rounded px-3 py-2">
            <p className="text-gray-400">Total Interactions</p>
            <p className="font-bold text-green-300">{pet.totalInteractions}</p>
          </div>
          <div className="bg-green-900/30 rounded px-3 py-2">
            <p className="text-gray-400">Times Fed</p>
            <p className="font-bold text-green-300">{pet.timesFeeding}</p>
          </div>
          <div className="bg-green-900/30 rounded px-3 py-2">
            <p className="text-gray-400">Unlocked Abilities</p>
            <p className="font-bold text-green-300">{pet.unlockedAbilities.length}</p>
          </div>
          <div className="bg-green-900/30 rounded px-3 py-2">
            <p className="text-gray-400">Completed Quests</p>
            <p className="font-bold text-green-300">{pet.questHistory.filter(q => q.status === 'completed').length}</p>
          </div>
        </div>
      </div>

      {/* Timestamps */}
      <div className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
        <h3 className="font-semibold text-white mb-4">⏰ Timeline</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Pet Created</span>
            <span className="text-gray-300">
              {new Date(pet.createdAt).toLocaleDateString()} ({Math.floor((Date.now() - pet.createdAt) / 86400000)} days ago)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Last Fed</span>
            <span className="text-gray-300">
              {Math.floor((Date.now() - pet.lastFedAt) / 60000)} minutes ago
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Last Played</span>
            <span className="text-gray-300">
              {pet.lastPlayedAt ? getTimeSinceLastInteraction(pet.lastPlayedAt) : 'Never'}
            </span>
          </div>
        </div>
      </div>

      {/* Mood & Personality */}
      <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
        <h3 className="font-semibold text-white mb-4">😊 Current Mood</h3>
        <div className="space-y-3">
          <div>
            <p className="font-semibold text-white mb-2">Mood</p>
            <p className="text-2xl text-center py-3 px-4 bg-purple-900/30 rounded-lg text-white">
              {pet.mood.toUpperCase()}
            </p>
          </div>
          <div className="text-sm text-gray-400 text-center p-3 bg-gray-800/50 rounded-lg">
            <p>Mood is determined by your pet's current stats and well-being.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetStats;
