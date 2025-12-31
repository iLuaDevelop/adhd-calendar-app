import React, { useState, useEffect } from 'react';
import { Pet } from '../../services/pet';
import { QUEST_TEMPLATES, formatQuestTime, getQuestDifficultyColor, getQuestDifficultyEmoji, getQuestTimeRemaining, completeQuest } from '../../services/petQuests';
import { useToast } from '../../context/ToastContext';
import { addGems } from '../../services/currency';
import { grantXp } from '../../services/xp';

interface PetQuestsProps {
  pet: Pet | null;
  onUpdate?: () => void;
}

const PetQuests: React.FC<PetQuestsProps> = ({ pet, onUpdate }) => {
  const { showToast } = useToast();
  const [selectedQuest, setSelectedQuest] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<Record<string, number>>({});

  // Update timer for active quests
  useEffect(() => {
    if (!pet || pet.activeQuests.length === 0) return;

    const interval = setInterval(() => {
      const newTimes: Record<string, number> = {};
      pet.activeQuests.forEach(quest => {
        const remaining = getQuestTimeRemaining(quest);
        if (remaining !== null) {
          newTimes[quest.id] = remaining;

          // Check if quest is complete
          if (remaining <= 0) {
            completeActiveQuest(quest.id);
          }
        }
      });
      setTimeRemaining(newTimes);
    }, 1000);

    return () => clearInterval(interval);
  }, [pet?.activeQuests]);

  const completeActiveQuest = (questId: string) => {
    // This would update the pet state, but since we're in a component,
    // we'll just show a toast for now
    const quest = pet?.activeQuests.find(q => q.id === questId);
    if (quest) {
      const success = Math.random() > quest.riskFactor;
      if (success) {
        showToast(`Quest Complete: ${quest.name}! Rewards earned!`, 'success');
        // Award gems and XP would happen here in the service
      } else {
        showToast(`Quest Failed: ${quest.name}`, 'error');
      }
    }
  };

  if (!pet) return null;

  const availableQuests = Object.values(QUEST_TEMPLATES);

  return (
    <div className="space-y-6">
      {/* Quest Overview */}
      <div className="p-4 bg-gradient-to-r from-orange-900/30 to-yellow-900/30 rounded-lg border border-orange-500/30">
        <h3 className="font-semibold text-white mb-4">📜 Quest Overview</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Active Quests</p>
            <p className="text-2xl font-bold text-orange-400">{pet.activeQuests.length}</p>
          </div>
          <div>
            <p className="text-gray-400">Completed Quests</p>
            <p className="text-2xl font-bold text-green-400">{pet.questHistory.length}</p>
          </div>
          <div>
            <p className="text-gray-400">Success Rate</p>
            <p className="text-2xl font-bold text-blue-400">
              {pet.questHistory.length > 0
                ? Math.round((pet.questHistory.filter(q => q.status === 'completed').length / pet.questHistory.length) * 100)
                : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Active Quests */}
      {pet.activeQuests.length > 0 && (
        <div>
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            ⚔️ Active Quests ({pet.activeQuests.length})
          </h3>
          <div className="space-y-3">
            {pet.activeQuests.map(quest => {
              const timeLeft = timeRemaining[quest.id] ?? getQuestTimeRemaining(quest) ?? 0;
              const formattedTime = formatQuestTime(timeLeft);
              const isComplete = timeLeft <= 0;

              return (
                <div
                  key={quest.id}
                  className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg"
                  style={{ borderColor: getQuestDifficultyColor(quest.difficulty) }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-yellow-300 flex items-center gap-2">
                        {quest.name}
                        <span className="text-sm">{getQuestDifficultyEmoji(quest.difficulty)}</span>
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">{quest.description}</p>
                    </div>
                    {isComplete && (
                      <button
                        onClick={() => {
                          const completed = completeQuest(quest);
                          showToast(
                            `${completed.status === 'completed' ? '✨ Quest Complete!' : '❌ Quest Failed!'}`,
                            completed.status === 'completed' ? 'success' : 'error'
                          );
                          if (completed.status === 'completed') {
                            addGems(quest.rewards.gems);
                            grantXp(quest.rewards.xp);
                          }
                          // Remove from active quests and add to history
                          onUpdate?.();
                        }}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded font-semibold text-white text-sm transition-colors whitespace-nowrap"
                      >
                        Claim
                      </button>
                    )}
                  </div>

                  {/* Progress Timer */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-400">Progress</span>
                      <span className={`text-sm font-bold ${isComplete ? 'text-green-400' : 'text-yellow-400'}`}>
                        {isComplete ? '✓ Ready' : formattedTime}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${isComplete ? 'bg-green-500' : 'bg-yellow-500'}`}
                        style={{
                          width: `${Math.max(0, Math.min(100, 100 - (timeLeft / quest.duration) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Rewards */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-yellow-900/40 rounded px-2 py-1">
                      <p className="text-gray-400">Gems</p>
                      <p className="font-bold text-yellow-300">{quest.rewards.gems}</p>
                    </div>
                    <div className="bg-blue-900/40 rounded px-2 py-1">
                      <p className="text-gray-400">XP</p>
                      <p className="font-bold text-blue-300">{quest.rewards.xp}</p>
                    </div>
                    <div className="bg-purple-900/40 rounded px-2 py-1">
                      <p className="text-gray-400">Pet XP</p>
                      <p className="font-bold text-purple-300">{quest.rewards.petXp}</p>
                    </div>
                  </div>

                  {/* Risk Factor */}
                  <div className="mt-3 pt-3 border-t border-yellow-500/20">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400">Risk Level</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-700 rounded-full h-1.5">
                          <div
                            className="bg-red-500 h-1.5 rounded-full"
                            style={{ width: `${quest.riskFactor * 100}%` }}
                          />
                        </div>
                        <span className="text-gray-400">{Math.round(quest.riskFactor * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Quests */}
      <div>
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          🗺️ Available Quests ({availableQuests.length})
        </h3>
        <div className="space-y-3">
          {availableQuests.map(quest => (
            <div
              key={quest.id}
              className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg hover:border-gray-600/50 transition-colors cursor-pointer"
              onClick={() => setSelectedQuest(selectedQuest === quest.id ? null : quest.id)}
              style={{
                borderColor:
                  selectedQuest === quest.id ? getQuestDifficultyColor(quest.difficulty) : undefined,
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    {quest.name}
                    <span className="text-sm">{getQuestDifficultyEmoji(quest.difficulty)}</span>
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">{quest.description}</p>
                </div>
                <div className="text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      showToast(`Started quest: ${quest.name}!`, 'success');
                      // Add quest to active quests in the service
                      onUpdate?.();
                    }}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-semibold text-white transition-colors"
                  >
                    Start
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedQuest === quest.id && (
                <div className="mt-4 pt-4 border-t border-gray-700/50 space-y-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Duration</p>
                    <p className="font-semibold text-white">{formatQuestTime(quest.duration)}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-2">Rewards</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-yellow-900/40 rounded px-2 py-1">
                        <p className="text-gray-400">Gems</p>
                        <p className="font-bold text-yellow-300">{quest.rewards.gems}</p>
                      </div>
                      <div className="bg-blue-900/40 rounded px-2 py-1">
                        <p className="text-gray-400">XP</p>
                        <p className="font-bold text-blue-300">{quest.rewards.xp}</p>
                      </div>
                      <div className="bg-purple-900/40 rounded px-2 py-1">
                        <p className="text-gray-400">Pet XP</p>
                        <p className="font-bold text-purple-300">{quest.rewards.petXp}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-400">Risk Level</span>
                      <span className="text-xs font-semibold text-gray-300">{Math.round(quest.riskFactor * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${quest.riskFactor * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quest History */}
      {pet.questHistory.length > 0 && (
        <div>
          <h3 className="font-semibold text-white mb-3">📋 Quest History (Last 10)</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {pet.questHistory.slice(-10).reverse().map(quest => (
              <div
                key={quest.id}
                className={`p-3 rounded-lg text-xs ${
                  quest.status === 'completed'
                    ? 'bg-green-900/20 border border-green-500/30'
                    : 'bg-red-900/20 border border-red-500/30'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-white">{quest.name}</p>
                    <p className="text-gray-400">
                      {quest.status === 'completed' ? '✓ Completed' : '✗ Failed'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400">
                      {new Date(quest.completedAt || 0).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PetQuests;
