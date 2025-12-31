import React from 'react';
import { Pet } from '../../services/pet';
import { getCurrentBondMilestone } from '../../services/petBonding';

interface PetStatsProps {
  pet: Pet | null;
}

const PetStats: React.FC<PetStatsProps> = ({ pet }) => {
  if (!pet) return null;

  const hunger = pet.hunger ?? 50;
  const happiness = pet.happiness ?? 50;
  const health = pet.health ?? 100;
  const energy = pet.energy ?? 50;
  const cleanliness = pet.cleanliness ?? 50;
  const bondLevel = pet.bondLevel ?? 0;
  const totalInteractions = pet.totalInteractions ?? 0;

  const bondMilestone = getCurrentBondMilestone(bondLevel);
  const stats = [
    { label: '🍖 Hunger', value: hunger, max: 100, color: '#ef4444', description: 'Lower is better' },
    { label: '💛 Happiness', value: happiness, max: 100, color: '#facc15', description: 'Higher is better' },
    { label: '❤️ Health', value: health, max: 100, color: '#22c55e', description: 'Higher is better' },
    { label: '⚡ Energy', value: energy, max: 100, color: '#60a5fa', description: 'Higher is better' },
    { label: '✨ Cleanliness', value: cleanliness, max: 100, color: '#06b6d4', description: 'Higher is better' },
    { label: '💖 Bond Level', value: bondLevel, max: 100, color: '#ec4899', description: 'Higher is better' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Pet Info Header */}
      <div style={{ padding: 16, background: 'rgba(37, 99, 235, 0.15)', borderRadius: 8, border: '1px solid rgba(37, 99, 235, 0.3)' }}>
        <h3 style={{ fontWeight: 600, color: '#fff', marginBottom: 16, margin: 0 }}>📊 Detailed Statistics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: '0.875rem', marginTop: 16 }}>
          <div>
            <p style={{ color: '#9ca3af', margin: 0 }}>Pet Name</p>
            <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fff', margin: '4px 0 0 0' }}>{pet.name}</p>
          </div>
          <div>
            <p style={{ color: '#9ca3af', margin: 0 }}>Stage</p>
            <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#d8b4fe', margin: '4px 0 0 0' }}>{pet.stage.toUpperCase()}</p>
          </div>
          <div>
            <p style={{ color: '#9ca3af', margin: 0 }}>Level</p>
            <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#93c5fd', margin: '4px 0 0 0' }}>{pet.level}</p>
          </div>
          <div>
            <p style={{ color: '#9ca3af', margin: 0 }}>Bond Milestone</p>
            <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f472b6', margin: '4px 0 0 0' }}>{bondMilestone.name}</p>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div>
        <h3 style={{ fontWeight: 600, color: '#fff', marginBottom: 16, margin: 0 }}>Core Stats</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {stats.map((stat, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 600, color: '#fff', margin: 0 }}>{stat.label}</p>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '4px 0 0 0' }}>{stat.description}</p>
                </div>
                <p style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fff', margin: 0 }}>{stat.value}%</p>
              </div>
              <div style={{ width: '100%', background: '#4b5563', borderRadius: 9999, height: 12 }}>
                <div
                  style={{
                    background: stat.color,
                    height: 12,
                    borderRadius: 9999,
                    width: `${stat.value}%`,
                    transition: 'width 0.3s'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Experience & Leveling */}
      <div style={{ padding: 16, background: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.3)', borderRadius: 8 }}>
        <h3 style={{ fontWeight: 600, color: '#fff', marginBottom: 16, margin: 0 }}>⭐ Experience & Leveling</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: '#d1d5db' }}>Current Experience</span>
              <span style={{ fontWeight: 700, color: '#93c5fd' }}>{pet.experience} XP</span>
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: '#d1d5db' }}>Next Level Progress</span>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                Level {pet.level} → {pet.level + 1}
              </span>
            </div>
            <div style={{ width: '100%', background: '#4b5563', borderRadius: 9999, height: 8 }}>
              <div
                style={{
                  background: '#3b82f6',
                  height: 8,
                  borderRadius: 9999,
                  width: `${Math.min(100, (pet.experience / (pet.level * 100)) * 100)}%`,
                  transition: 'width 0.3s'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bond & Affinity Info */}
      <div style={{ padding: 16, background: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.3)', borderRadius: 8 }}>
        <h3 style={{ fontWeight: 600, color: '#fff', marginBottom: 16, margin: 0 }}>💕 Bond & Affinity</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: '#d1d5db' }}>Bond Milestone</span>
              <span style={{ fontSize: '1.25rem' }}>{bondMilestone.emoji}</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: 8, margin: 0 }}>{bondMilestone.description}</p>
            <div style={{ width: '100%', background: '#4b5563', borderRadius: 9999, height: 8 }}>
              <div
                style={{
                  background: '#ec4899',
                  height: 8,
                  borderRadius: 9999,
                  width: `${bondLevel}%`,
                  transition: 'width 0.3s'
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.75rem', color: '#9ca3af' }}>
              <span>0</span>
              <span style={{ fontWeight: 700, color: '#f472b6' }}>{bondLevel} / 100</span>
              <span>100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, fontSize: '0.875rem' }}>
        <div style={{ padding: 12, background: 'rgba(55, 65, 81, 0.3)', borderRadius: 8 }}>
          <p style={{ color: '#9ca3af', margin: 0 }}>Total Interactions</p>
          <p style={{ fontWeight: 700, color: '#22c55e', fontSize: '1.25rem', margin: '4px 0 0 0' }}>{totalInteractions}</p>
        </div>
        <div style={{ padding: 12, background: 'rgba(55, 65, 81, 0.3)', borderRadius: 8 }}>
          <p style={{ color: '#9ca3af', margin: 0 }}>Times Fed</p>
          <p style={{ fontWeight: 700, color: '#fbbf24', fontSize: '1.25rem', margin: '4px 0 0 0' }}>{pet.timesFeeding}</p>
        </div>
        <div style={{ padding: 12, background: 'rgba(55, 65, 81, 0.3)', borderRadius: 8 }}>
          <p style={{ color: '#9ca3af', margin: 0 }}>Current Level</p>
          <p style={{ fontWeight: 700, color: '#60a5fa', fontSize: '1.25rem', margin: '4px 0 0 0' }}>{pet.level}</p>
        </div>
        <div style={{ padding: 12, background: 'rgba(55, 65, 81, 0.3)', borderRadius: 8 }}>
          <p style={{ color: '#9ca3af', margin: 0 }}>Days Old</p>
          <p style={{ fontWeight: 700, color: '#c4b5fd', fontSize: '1.25rem', margin: '4px 0 0 0' }}>
            {Math.floor((Date.now() - pet.createdAt) / (1000 * 60 * 60 * 24))}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PetStats;
