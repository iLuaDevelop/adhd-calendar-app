import React from 'react';
import { Pet, unlockAbility } from '../../services/pet';
import { PET_ABILITIES, getAvailableAbilities, canUnlockAbility, calculateTotalAbilityBonus } from '../../services/petAbilities';
import { useToast } from '../../context/ToastContext';

interface PetAbilitiesProps {
  pet: Pet | null;
  onUpdate?: () => void;
}

const PetAbilities: React.FC<PetAbilitiesProps> = ({ pet, onUpdate }) => {
  const { showToast } = useToast();

  if (!pet) return null;

  const petUnlockedAbilities = pet.unlockedAbilities || [];
  const availableAbilities = getAvailableAbilities(pet.level);
  const unlockedAbilities = availableAbilities.filter(a => petUnlockedAbilities.includes(a.id));
  const lockableAbilities = availableAbilities.filter(a => !petUnlockedAbilities.includes(a.id));

  const handleUnlockAbility = (abilityId: string) => {
    const updated = unlockAbility(abilityId);
    if (updated) {
      showToast('Ability unlocked!', 'success');
      onUpdate?.();
    }
  };

  return (
    <div className="space-y-6">
      {/* Ability Overview */}
      <div className="p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg border border-purple-500/30">
        <h3 className="font-semibold text-white mb-4">🎯 Ability Overview</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Level</span>
            <span className="font-semibold text-white">{pet.level} / 6</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Bond Level</span>
            <span className="font-semibold text-white">{pet.bondLevel} / 100</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Unlocked Abilities</span>
            <span className="font-semibold text-white">{pet.unlockedAbilities.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Available to Unlock</span>
            <span className="font-semibold text-yellow-400">{lockableAbilities.length}</span>
          </div>
        </div>
      </div>

      {/* Unlocked Abilities */}
      {unlockedAbilities.length > 0 && (
        <div>
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            ✨ Unlocked Abilities ({unlockedAbilities.length})
          </h3>
          <div className="space-y-3">
            {unlockedAbilities.map(ability => {
              const xpBonus = calculateTotalAbilityBonus(pet, ability.effect);
              return (
                <div
                  key={ability.id}
                  className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg hover:border-green-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-green-300 flex items-center gap-2">
                        {ability.icon} {ability.name}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">{ability.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-400">
                        +{Math.round(xpBonus * 100) / 100}%
                      </div>
                      <div className="text-xs text-gray-400">Active Bonus</div>
                    </div>
                  </div>

                  {/* Bonus scaling info */}
                  <div className="mt-3 pt-3 border-t border-green-500/20">
                    <p className="text-xs text-gray-400 mb-2">Bonus scales with:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-green-900/30 rounded px-2 py-1">
                        <p className="text-xs text-gray-300">Bond: {pet.bondLevel}%</p>
                      </div>
                      <div className="bg-green-900/30 rounded px-2 py-1">
                        <p className="text-xs text-gray-300">Level: {pet.level}/6</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lockable Abilities */}
      {lockableAbilities.length > 0 && (
        <div>
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            🔒 Available to Unlock ({lockableAbilities.length})
          </h3>
          <div className="space-y-3">
            {lockableAbilities.map(ability => {
              const canUnlock = canUnlockAbility(pet, ability);
              const lockReason = (() => {
                if (pet.level < ability.levelRequirement) {
                  return `Reach Level ${ability.levelRequirement}`;
                }
                if (ability.evolutionRequirement && pet.stage !== ability.evolutionRequirement) {
                  return `Evolve to ${ability.evolutionRequirement}`;
                }
                return null;
              })();

              return (
                <div
                  key={ability.id}
                  className={`p-4 rounded-lg border transition-all ${
                    canUnlock
                      ? 'bg-blue-900/20 border-blue-500/30 hover:border-blue-500/50 cursor-pointer'
                      : 'bg-gray-800/30 border-gray-700/30 opacity-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className={`font-semibold flex items-center gap-2 ${canUnlock ? 'text-blue-300' : 'text-gray-400'}`}>
                        {ability.icon} {ability.name}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">{ability.description}</p>
                    </div>
                    {canUnlock ? (
                      <button
                        onClick={() => handleUnlockAbility(ability.id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold text-white text-sm transition-colors whitespace-nowrap"
                      >
                        Unlock
                      </button>
                    ) : (
                      <div className="text-right">
                        <div className="text-xs font-semibold text-gray-400">{lockReason}</div>
                      </div>
                    )}
                  </div>

                  {/* Requirements info */}
                  <div className="mt-3 pt-3 border-t border-gray-700/30">
                    <p className="text-xs text-gray-500 mb-2">Requirements:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className={`rounded px-2 py-1 text-xs ${
                        pet.level >= ability.levelRequirement
                          ? 'bg-green-900/30 text-green-300'
                          : 'bg-red-900/30 text-red-300'
                      }`}>
                        Level {ability.levelRequirement} {pet.level >= ability.levelRequirement ? '✓' : '✗'}
                      </div>
                      {ability.evolutionRequirement && (
                        <div className={`rounded px-2 py-1 text-xs ${
                          pet.stage === ability.evolutionRequirement
                            ? 'bg-green-900/30 text-green-300'
                            : 'bg-red-900/30 text-red-300'
                        }`}>
                          {ability.evolutionRequirement} {pet.stage === ability.evolutionRequirement ? '✓' : '✗'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Abilities Info */}
      {unlockedAbilities.length === 0 && lockableAbilities.length === 0 && (
        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 text-center">
          <p className="text-gray-400">No abilities available for your pet's level yet.</p>
          <p className="text-xs text-gray-500 mt-2">Level up to unlock more abilities!</p>
        </div>
      )}

      {/* Future Abilities Preview */}
      {lockableAbilities.length < Object.keys(PET_ABILITIES).length && (
        <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
          <h3 className="font-semibold text-purple-300 mb-3">🔮 Future Abilities</h3>
          <p className="text-xs text-gray-400 mb-3">These abilities will become available as your pet grows:</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(PET_ABILITIES)
              .filter(a => a.levelRequirement > pet.level)
              .map(ability => (
                <div key={ability.id} className="bg-purple-900/30 rounded px-3 py-2 text-xs">
                  <p className="text-purple-300 font-semibold">{ability.icon} {ability.name}</p>
                  <p className="text-gray-500">Level {ability.levelRequirement}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PetAbilities;
