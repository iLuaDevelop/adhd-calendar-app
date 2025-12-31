import React from 'react';
import { Pet } from '../../services/pet';

interface PetEvolutionProps {
  pet: Pet | null;
}

const PetEvolution: React.FC<PetEvolutionProps> = ({ pet }) => {
  if (!pet) {
    return <div style={{ padding: 16, color: '#9ca3af' }}>Loading pet data...</div>;
  }

  const evolutionStages = [
    { stage: 'Egg', emoji: '🥚', level: 1, trait: 'Beginning of a new journey' },
    { stage: 'Baby', emoji: '👶', level: 10, trait: 'Learning and growing quickly' },
    { stage: 'Teen', emoji: '🧒', level: 25, trait: 'Becoming stronger each day' },
    { stage: 'Adult', emoji: '🐉', level: 50, trait: 'Powerful and experienced' },
    { stage: 'Legendary', emoji: '⚡', level: 75, trait: 'Exceeding all expectations' },
    { stage: 'Mythic', emoji: '✨', level: 100, trait: 'The stuff of legends' },
  ];

  const currentStageIndex = Math.min(
    Math.floor(pet.level / 20),
    evolutionStages.length - 1
  );
  const currentStage = evolutionStages[currentStageIndex];
  const nextStage = evolutionStages[currentStageIndex + 1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 16 }}>
      {/* Current Evolution Info */}
      <div
        style={{
          textAlign: 'center',
          padding: 24,
          background: 'rgba(147, 51, 234, 0.15)',
          borderRadius: 8,
        }}
      >
        <div style={{ fontSize: '7rem', marginBottom: 16 }}>{currentStage.emoji}</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#ffffff', marginBottom: 8 }}>
          {currentStage.stage} Stage
        </h2>
        <p style={{ color: '#d1d5db', marginBottom: 16 }}>{currentStage.trait}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['Wise', 'Brave', 'Kindhearted'].map((trait) => (
            <span
              key={trait}
              style={{
                padding: '4px 12px',
                background: '#6b21a8',
                borderRadius: 16,
                fontSize: '0.875rem',
                color: '#e9d5ff',
              }}
            >
              {trait}
            </span>
          ))}
        </div>
      </div>

      {/* Evolution Progress */}
      {nextStage && (
        <div
          style={{
            padding: 16,
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: 8,
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#e5e7eb', fontSize: '0.875rem' }}>Evolution Progress</span>
              <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                Level {pet.level} / {nextStage.level}
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: 12,
                background: '#1f2937',
                borderRadius: 6,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${(pet.level / nextStage.level) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #3b82f6, #a855f7)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
          <p style={{ color: '#d1d5db', fontSize: '0.875rem' }}>
            Reach level {nextStage.level} to evolve to {nextStage.stage} stage!
          </p>
        </div>
      )}

      {/* Evolution Timeline */}
      <div style={{ position: 'relative', paddingLeft: 48, paddingRight: 16 }}>
        <div
          style={{
            position: 'absolute',
            left: 32,
            top: 0,
            bottom: 0,
            width: 2,
            background: 'linear-gradient(180deg, #3b82f6, #a855f7)',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {evolutionStages.map((stage, index) => {
            const isCurrent = index === currentStageIndex;
            const isReached = index <= currentStageIndex;
            const locked = index > currentStageIndex;

            return (
              <div key={stage.stage} style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: -40,
                    top: 0,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: isCurrent ? '#ffffff' : isReached ? '#a855f7' : '#6b7280',
                    border: isCurrent ? '2px solid #a855f7' : 'none',
                  }}
                />

                <div
                  style={{
                    padding: 12,
                    background: isCurrent
                      ? 'rgba(168, 85, 247, 0.2)'
                      : isReached
                        ? 'rgba(168, 85, 247, 0.1)'
                        : 'rgba(107, 114, 128, 0.3)',
                    border: isCurrent ? '1px solid #a855f7' : '1px solid transparent',
                    borderRadius: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                    <span style={{ fontSize: '1.5rem' }}>{stage.emoji}</span>
                    <div>
                      <h4 style={{ color: '#ffffff', fontWeight: '600', marginBottom: 2 }}>
                        {stage.stage}
                      </h4>
                      <p style={{ color: '#d1d5db', fontSize: '0.75rem' }}>Level {stage.level}+</p>
                    </div>
                  </div>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: 8 }}>
                    {stage.trait}
                  </p>

                  {isCurrent && (
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        background: '#a855f7',
                        borderRadius: 4,
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#ffffff',
                      }}
                    >
                      ✓ CURRENT
                    </span>
                  )}
                  {isReached && !isCurrent && (
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        background: '#6b21a8',
                        borderRadius: 4,
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#e9d5ff',
                      }}
                    >
                      ✓ REACHED
                    </span>
                  )}
                  {locked && (
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        background: 'rgba(107, 114, 128, 0.5)',
                        borderRadius: 4,
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#9ca3af',
                      }}
                    >
                      LOCKED
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Evolution Benefits */}
      <div
        style={{
          padding: 16,
          background: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: 8,
        }}
      >
        <h3 style={{ fontWeight: '600', color: '#ffffff', marginBottom: 16 }}>
          🎁 Evolution Benefits
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: '1.25rem' }}>📊</span>
            <div>
              <p style={{ fontWeight: '600', color: '#ffffff', marginBottom: 2 }}>Stat Bonuses</p>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                Each evolution grants increased base stats and new abilities
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: '1.25rem' }}>⚡</span>
            <div>
              <p style={{ fontWeight: '600', color: '#ffffff', marginBottom: 2 }}>New Abilities</p>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                Unlock powerful abilities at each evolution stage
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: '1.25rem' }}>✨</span>
            <div>
              <p style={{ fontWeight: '600', color: '#ffffff', marginBottom: 2 }}>Special Quests</p>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                Evolved pets unlock unique quests and rewards
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: '1.25rem' }}>🏆</span>
            <div>
              <p style={{ fontWeight: '600', color: '#ffffff', marginBottom: 2 }}>
                Enhanced Bonuses
              </p>
              <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                Ability bonuses scale better with each evolution
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Customization Hint */}
      <div
        style={{
          padding: 16,
          background: 'rgba(107, 114, 128, 0.2)',
          border: '1px solid rgba(107, 114, 128, 0.3)',
          borderRadius: 8,
        }}
      >
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
          💡 <span style={{ fontWeight: '600', color: '#e5e7eb' }}>Tip:</span> Your pet will grow
          stronger as you interact with it. Keep feeding, playing, and bonding to unlock its full
          potential!
        </p>
      </div>
    </div>
  );
};

export default PetEvolution;
