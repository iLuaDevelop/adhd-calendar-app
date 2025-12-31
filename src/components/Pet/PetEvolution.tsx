import React from 'react';
import { Pet, getStageFromLevel } from '../../services/pet';

interface PetEvolutionProps {
  pet: Pet | null;
}

const evolutionPath = [
  { level: 1, stage: 'egg', emoji: '🥚', description: 'Just hatched!', traits: ['Vulnerable', 'Learning'] },
  { level: 2, stage: 'baby', emoji: '🐣', description: 'Growing and exploring', traits: ['Curious', 'Playful'] },
  { level: 3, stage: 'teen', emoji: '🐥', description: 'Becoming stronger', traits: ['Active', 'Energetic'] },
  { level: 4, stage: 'adult', emoji: '🐔', description: 'Full grown and wise', traits: ['Strong', 'Reliable'] },
  { level: 5, stage: 'legendary', emoji: '🦅', description: 'Legendary power awakened', traits: ['Mighty', 'Ancient'] },
  { level: 6, stage: 'mythic', emoji: '✨', description: 'Transcended into myth', traits: ['Immortal', 'Divine'] },
];

const PetEvolution: React.FC<PetEvolutionProps> = ({ pet }) => {
  if (!pet) return null;

  const currentStageIndex = evolutionPath.findIndex(p => p.stage === pet.stage);
  const nextStage = currentStageIndex < evolutionPath.length - 1 ? evolutionPath[currentStageIndex + 1] : null;

  return (
    <div className="space-y-6">
      {/* Current Evolution Info */}
      <div className="p-6 bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-lg border border-blue-500/30">
        <h3 className="font-semibold text-white mb-4">Current Evolution: {pet.stage.toUpperCase()}</h3>
        <div className="flex items-center gap-6">
          <div className="text-9xl">{evolutionPath[currentStageIndex].emoji}</div>
          <div className="flex-1">
            <p className="text-lg text-cyan-300 font-semibold mb-2">{evolutionPath[currentStageIndex].description}</p>
            <p className="text-sm text-gray-400 mb-3">Traits:</p>
            <div className="flex flex-wrap gap-2">
              {evolutionPath[currentStageIndex].traits.map((trait, idx) => (
                <span key={idx} className="px-3 py-1 bg-blue-900/50 rounded-full text-xs font-semibold text-blue-300">
                  {trait}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Evolution Progress */}
      {nextStage && (
        <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
          <h3 className="font-semibold text-white mb-4">📈 Progress to Next Evolution</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300">Level Progress</span>
                <span className="font-bold text-purple-300">{pet.level} → {nextStage.level}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-purple-500 h-3 rounded-full transition-all"
                  style={{ width: `${(pet.level / nextStage.level) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Reach Level {nextStage.level} to evolve to {nextStage.stage.toUpperCase()}
              </p>
            </div>

            {/* Next Stage Preview */}
            <div className="p-4 bg-purple-900/30 rounded-lg border border-purple-500/20">
              <p className="text-sm text-gray-400 mb-3">Next Evolution Preview:</p>
              <div className="flex items-start gap-4">
                <div className="text-6xl">{nextStage.emoji}</div>
                <div>
                  <p className="font-semibold text-white">{nextStage.stage.toUpperCase()}</p>
                  <p className="text-sm text-gray-300 mt-1">{nextStage.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {nextStage.traits.map((trait, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-purple-900/50 rounded text-xs text-purple-300">
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Evolution Timeline */}
      <div>
        <h3 className="font-semibold text-white mb-4">🔮 Complete Evolution Path</h3>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500" />

          {/* Timeline nodes */}
          <div className="space-y-4">
            {evolutionPath.map((stage, idx) => {
              const isReached = pet.level >= stage.level;
              const isCurrent = pet.stage === stage.stage;

              return (
                <div key={idx} className="relative pl-24">
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-0 w-16 h-16 rounded-full flex items-center justify-center text-4xl border-4 transition-all ${
                      isCurrent
                        ? 'border-yellow-400 bg-yellow-900/30 scale-110'
                        : isReached
                        ? 'border-green-400 bg-green-900/20'
                        : 'border-gray-600 bg-gray-900/20'
                    }`}
                  >
                    {stage.emoji}
                  </div>

                  {/* Content card */}
                  <div
                    className={`p-4 rounded-lg border transition-all ${
                      isCurrent
                        ? 'bg-yellow-900/20 border-yellow-500/30'
                        : isReached
                        ? 'bg-green-900/10 border-green-500/20'
                        : 'bg-gray-800/20 border-gray-700/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className={`font-semibold ${
                          isCurrent ? 'text-yellow-300' : isReached ? 'text-green-300' : 'text-gray-400'
                        }`}>
                          {stage.stage.toUpperCase()}
                        </h4>
                        <p className="text-sm text-gray-400 mt-1">{stage.description}</p>
                      </div>
                      <div className={`text-sm font-bold ${
                        isCurrent ? 'text-yellow-400' : isReached ? 'text-green-400' : 'text-gray-500'
                      }`}>
                        Lv. {stage.level}
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="mt-3 flex items-center gap-2">
                      {isCurrent && (
                        <span className="px-2 py-1 bg-yellow-900/50 rounded text-xs font-bold text-yellow-300">
                          ★ CURRENT
                        </span>
                      )}
                      {isReached && !isCurrent && (
                        <span className="px-2 py-1 bg-green-900/50 rounded text-xs font-bold text-green-300">
                          ✓ REACHED
                        </span>
                      )}
                      {!isReached && (
                        <span className="px-2 py-1 bg-gray-900/50 rounded text-xs font-bold text-gray-400">
                          LOCKED
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Evolution Bonuses Info */}
      <div className="p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
        <h3 className="font-semibold text-white mb-4">🎁 Evolution Benefits</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-xl">📊</span>
            <div>
              <p className="font-semibold text-white">Stat Bonuses</p>
              <p className="text-gray-400">Each evolution grants increased base stats and new abilities</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl">⚡</span>
            <div>
              <p className="font-semibold text-white">New Abilities</p>
              <p className="text-gray-400">Unlock powerful abilities at each evolution stage</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl">✨</span>
            <div>
              <p className="font-semibold text-white">Special Quests</p>
              <p className="text-gray-400">Evolved pets unlock unique quests and rewards</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl">🏆</span>
            <div>
              <p className="font-semibold text-white">Enhanced Bonuses</p>
              <p className="text-gray-400">Ability bonuses scale better with each evolution</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pet Customization Hint */}
      <div className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
        <p className="text-sm text-gray-400">
          💡 <span className="font-semibold">Tip:</span> Your pet will grow stronger as you interact with it. Keep feeding, playing, and bonding to unlock its full potential!
        </p>
      </div>
    </div>
  );
};

export default PetEvolution;
