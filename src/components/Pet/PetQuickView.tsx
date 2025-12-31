import React, { useState } from 'react';
import { Pet, getPetEmoji } from '../../services/pet';
import { getCurrentBondMilestone } from '../../services/petBonding';

interface PetQuickViewProps {
  pet: Pet | null;
  onViewDetails?: () => void;
  allPets?: Pet[];
  currentPetId?: string;
  onPetSwitch?: (petId: string) => void;
}

const PetQuickView: React.FC<PetQuickViewProps> = ({ 
  pet, 
  onViewDetails, 
  allPets, 
  currentPetId, 
  onPetSwitch 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!pet || !allPets) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af' }}>
        <p style={{ margin: 0, fontSize: '0.875rem' }}>No pet yet...</p>
      </div>
    );
  }

  const hunger = pet.hunger ?? 50;
  const happiness = pet.happiness ?? 50;
  const health = pet.health ?? 100;
  
  // Get hunger color
  const hungerColor = hunger > 70 ? '#ef4444' : hunger > 40 ? '#facc15' : '#22c55e';
  const happinessColor = happiness > 70 ? '#22c55e' : happiness > 40 ? '#facc15' : '#ef4444';
  const healthColor = health > 70 ? '#22c55e' : health > 40 ? '#facc15' : '#ef4444';

  const currentPetIndex = allPets.findIndex(p => p.id === currentPetId);
  const displayIndex = currentPetIndex >= 0 ? currentPetIndex : 0;
  
  const handlePrev = () => {
    const newIndex = displayIndex === 0 ? allPets.length - 1 : displayIndex - 1;
    onPetSwitch?.(allPets[newIndex].id);
  };

  const handleNext = () => {
    const newIndex = displayIndex === allPets.length - 1 ? 0 : displayIndex + 1;
    onPetSwitch?.(allPets[newIndex].id);
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#d1d5db', marginBottom: 8 }}>
        <span style={{ fontSize: '1.25rem' }}>👾</span>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Your Companion</h3>
      </div>

      {/* Pet Emoji */}
      <div style={{ fontSize: '5rem', lineHeight: 1, marginBottom: 8 }}>
        {getPetEmoji(pet.stage, pet.color, pet.emoji)}
      </div>

      {/* Pet Name and Level */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', fontWeight: '600', color: '#ffffff' }}>
          {pet.name}
        </h2>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#9ca3af' }}>
          Level {pet.level} • {pet.stage.charAt(0).toUpperCase() + pet.stage.slice(1)}
        </p>
      </div>

      {/* Stats Grid - 3 columns */}
      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        {/* Hunger */}
        <div
          style={{
            padding: 12,
            background: 'rgba(31, 41, 55, 0.6)',
            borderRadius: 8,
            border: '1px solid rgba(75, 85, 99, 0.3)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: 4 }}>
            Hunger
          </div>
          <div
            style={{
              width: '100%',
              height: 4,
              background: '#374151',
              borderRadius: 2,
              overflow: 'hidden',
              marginBottom: 6,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.max(0, 100 - hunger)}%`,
                background: hungerColor,
              }}
            />
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: hungerColor }}>
            {100 - hunger}%
          </div>
        </div>

        {/* Happiness */}
        <div
          style={{
            padding: 12,
            background: 'rgba(31, 41, 55, 0.6)',
            borderRadius: 8,
            border: '1px solid rgba(75, 85, 99, 0.3)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: 4 }}>
            Happiness
          </div>
          <div
            style={{
              width: '100%',
              height: 4,
              background: '#374151',
              borderRadius: 2,
              overflow: 'hidden',
              marginBottom: 6,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${happiness}%`,
                background: happinessColor,
              }}
            />
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: happinessColor }}>
            {happiness}%
          </div>
        </div>

        {/* Health */}
        <div
          style={{
            padding: 12,
            background: 'rgba(31, 41, 55, 0.6)',
            borderRadius: 8,
            border: '1px solid rgba(75, 85, 99, 0.3)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: 4 }}>
            Health
          </div>
          <div
            style={{
              width: '100%',
              height: 4,
              background: '#374151',
              borderRadius: 2,
              overflow: 'hidden',
              marginBottom: 6,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${health}%`,
                background: healthColor,
              }}
            />
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: healthColor }}>
            {health}%
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      {allPets && allPets.length > 1 && (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 12 }}>
          <button
            onClick={handlePrev}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              border: 'none',
              color: '#a78bfa',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '600',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#c4b5fd')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#a78bfa')}
          >
            ← Prev
          </button>
          <button
            onClick={onViewDetails}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '500',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#d1d5db')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#9ca3af')}
          >
            View All Pets
          </button>
          <button
            onClick={handleNext}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              border: 'none',
              color: '#a78bfa',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '600',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#c4b5fd')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#a78bfa')}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default PetQuickView;
