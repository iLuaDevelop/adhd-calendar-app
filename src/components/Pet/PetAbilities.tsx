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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Ability Overview */}
      <div style={{ padding: 16, background: 'rgba(147, 51, 234, 0.15)', borderRadius: 8, border: '1px solid rgba(147, 51, 234, 0.3)' }}>
        <h3 style={{ fontWeight: 600, color: '#fff', marginBottom: 16 }}>🎯 Ability Overview</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#d1d5db' }}>Level</span>
            <span style={{ fontWeight: 600, color: '#fff' }}>{pet.level} / 6</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#d1d5db' }}>Bond Level</span>
            <span style={{ fontWeight: 600, color: '#fff' }}>{pet.bondLevel} / 100</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#d1d5db' }}>Unlocked Abilities</span>
            <span style={{ fontWeight: 600, color: '#fff' }}>{petUnlockedAbilities.length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#d1d5db' }}>Available to Unlock</span>
            <span style={{ fontWeight: 600, color: '#fbbf24' }}>{lockableAbilities.length}</span>
          </div>
        </div>
      </div>

      {/* Unlocked Abilities */}
      {unlockedAbilities.length > 0 && (
        <div>
          <h3 style={{ fontWeight: 600, color: '#fff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            ✨ Unlocked Abilities ({unlockedAbilities.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {unlockedAbilities.map(ability => {
              const xpBonus = calculateTotalAbilityBonus(pet, ability.effect);
              return (
                <div
                  key={ability.id}
                  style={{ padding: 16, background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 8 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <h4 style={{ fontWeight: 600, color: '#86efac', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                        {ability.icon} {ability.name}
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 4, margin: 0 }}>{ability.description}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#4ade80' }}>
                        +{Math.round(xpBonus * 100) / 100}%
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Active Bonus</div>
                    </div>
                  </div>

                  {/* Bonus scaling info */}
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(34, 197, 94, 0.2)' }}>
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: 8, margin: 0 }}>Bonus scales with:</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div style={{ background: 'rgba(34, 197, 94, 0.2)', borderRadius: 4, padding: '8px 8px' }}>
                        <p style={{ fontSize: '0.75rem', color: '#d1d5db', margin: 0 }}>Bond: {pet.bondLevel}%</p>
                      </div>
                      <div style={{ background: 'rgba(34, 197, 94, 0.2)', borderRadius: 4, padding: '8px 8px' }}>
                        <p style={{ fontSize: '0.75rem', color: '#d1d5db', margin: 0 }}>Level: {pet.level}/6</p>
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
          <h3 style={{ fontWeight: 600, color: '#fff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            🔒 Available to Unlock ({lockableAbilities.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                  style={{
                    padding: 16,
                    borderRadius: 8,
                    background: canUnlock ? 'rgba(37, 99, 235, 0.1)' : 'rgba(55, 65, 81, 0.2)',
                    border: canUnlock ? '1px solid rgba(37, 99, 235, 0.3)' : '1px solid rgba(75, 85, 99, 0.3)',
                    opacity: canUnlock ? 1 : 0.5
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <h4 style={{ fontWeight: 600, color: canUnlock ? '#93c5fd' : '#9ca3af', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                        {ability.icon} {ability.name}
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 4, margin: 0 }}>{ability.description}</p>
                    </div>
                    {canUnlock ? (
                      <button
                        onClick={() => handleUnlockAbility(ability.id)}
                        style={{
                          padding: '8px 16px',
                          background: '#2563eb',
                          border: 'none',
                          borderRadius: 4,
                          fontWeight: 600,
                          color: '#fff',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Unlock
                      </button>
                    ) : (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af' }}>{lockReason}</div>
                      </div>
                    )}
                  </div>

                  {/* Requirements info */}
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(75, 85, 99, 0.3)' }}>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 8, margin: 0 }}>Requirements:</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div style={{
                        borderRadius: 4,
                        padding: '8px 8px',
                        fontSize: '0.75rem',
                        background: pet.level >= ability.levelRequirement ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: pet.level >= ability.levelRequirement ? '#86efac' : '#fca5a5'
                      }}>
                        Level {ability.levelRequirement} {pet.level >= ability.levelRequirement ? '✓' : '✗'}
                      </div>
                      {ability.evolutionRequirement && (
                        <div style={{
                          borderRadius: 4,
                          padding: '8px 8px',
                          fontSize: '0.75rem',
                          background: pet.stage === ability.evolutionRequirement ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: pet.stage === ability.evolutionRequirement ? '#86efac' : '#fca5a5'
                        }}>
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
        <div style={{ padding: 16, background: 'rgba(55, 65, 81, 0.3)', borderRadius: 8, border: '1px solid rgba(75, 85, 99, 0.3)', textAlign: 'center' }}>
          <p style={{ color: '#9ca3af', margin: 0 }}>No abilities available for your pet's level yet.</p>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 8, margin: 0 }}>Level up to unlock more abilities!</p>
        </div>
      )}

      {/* Future Abilities Preview */}
      {lockableAbilities.length < Object.keys(PET_ABILITIES).length && (
        <div style={{ padding: 16, background: 'rgba(147, 51, 234, 0.15)', border: '1px solid rgba(147, 51, 234, 0.3)', borderRadius: 8 }}>
          <h3 style={{ fontWeight: 600, color: '#d8b4fe', marginBottom: 12 }}>🔮 Future Abilities</h3>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: 12, margin: 0 }}>These abilities will become available as your pet grows:</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {Object.values(PET_ABILITIES)
              .filter(a => a.levelRequirement > pet.level)
              .map(ability => (
                <div key={ability.id} style={{ background: 'rgba(147, 51, 234, 0.2)', borderRadius: 4, padding: '12px', fontSize: '0.75rem' }}>
                  <p style={{ color: '#d8b4fe', fontWeight: 600, margin: 0 }}>{ability.icon} {ability.name}</p>
                  <p style={{ color: '#9ca3af', margin: '4px 0 0 0' }}>Level {ability.levelRequirement}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PetAbilities;
