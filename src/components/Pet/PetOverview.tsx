import React, { useState } from 'react';
import { Pet, feedPet, playWithPet, healPet, cleanPet, getPetEmoji } from '../../services/pet';
import { getCurrentBondMilestone, getBondProgress, getAffinityMessage } from '../../services/petBonding';
import { useToast } from '../../context/ToastContext';

interface PetOverviewProps {
  pet: Pet | null;
  onUpdate?: () => void;
  allPets?: Pet[];
  currentPetId?: string;
  onPetSwitch?: (petId: string) => void;
}

const PetOverview: React.FC<PetOverviewProps> = ({ pet, onUpdate, allPets, currentPetId, onPetSwitch }) => {
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
      <div style={{ textAlign: 'center', padding: '32px 0', color: '#999' }}>
        <p>No pet yet...</p>
      </div>
    );
  }

  const bondMilestone = getCurrentBondMilestone(pet.bondLevel);
  const bondProgress = getBondProgress(pet.bondLevel);
  const affinityMessage = getAffinityMessage(pet);

  // Determine mood emoji
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
        return '#facc15';
      case 'playful':
        return '#60a5fa';
      case 'content':
        return '#22c55e';
      case 'sad':
        return '#ef4444';
      case 'sleepy':
        return '#a855f7';
      default:
        return '#9ca3af';
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
      {/* Main Pet Display */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
          background: 'linear-gradient(to bottom, rgba(147, 51, 234, 0.2), rgba(30, 58, 138, 0.2))',
          borderRadius: 12,
          border: '1px solid rgba(124, 92, 255, 0.3)',
          width: '100%',
          maxWidth: 500,
        }}
      >
        {/* Pet Emoji - Large */}
        <div style={{ position: 'relative', marginBottom: 32 }}>
          <div
            style={{
              fontSize: 160,
              lineHeight: 1,
              transition: 'transform 0.3s ease',
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
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              fontSize: 56,
              color: getMoodColor(),
            }}
          >
            {moodEmojis[pet.mood] || moodEmojis.neutral}
          </div>

          {/* Level badge */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              background: '#2563eb',
              borderRadius: '50%',
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 'bold',
              color: '#fff',
              border: '2px solid #60a5fa',
            }}
          >
            {pet.level}
          </div>

          {/* Stage indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              background: '#7c3aed',
              borderRadius: 6,
              padding: '4px 12px',
              fontSize: 10,
              fontWeight: 'bold',
              color: '#fff',
              border: '2px solid #a78bfa',
            }}
          >
            {pet.stage.toUpperCase()}
          </div>
        </div>

        {/* Pet Name */}
        <h2
          style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: '#fff',
            margin: '0 0 12px 0',
            textAlign: 'center',
          }}
        >
          {pet.name}
        </h2>

        {/* Affinity Message */}
        <p
          style={{
            fontSize: 14,
            color: '#d1d5db',
            fontStyle: 'italic',
            marginBottom: 24,
            textAlign: 'center',
            maxWidth: 400,
          }}
        >
          "{affinityMessage}"
        </p>

        {/* Stats Grid - 2 columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            width: '100%',
            marginBottom: 24,
          }}
        >
          {/* Hunger */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 12, color: '#d1d5db' }}>🍖 Hunger</span>
              <span style={{ fontSize: 12, fontWeight: 'bold', color: '#e5e7eb' }}>
                {pet.hunger}%
              </span>
            </div>
            <div
              style={{
                width: '100%',
                background: '#374151',
                borderRadius: 9999,
                height: 8,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  background: '#ef4444',
                  height: '100%',
                  transition: 'all 0.3s',
                  width: `${pet.hunger}%`,
                }}
              />
            </div>
          </div>

          {/* Happiness */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 12, color: '#d1d5db' }}>💛 Happiness</span>
              <span style={{ fontSize: 12, fontWeight: 'bold', color: '#e5e7eb' }}>
                {pet.happiness}%
              </span>
            </div>
            <div
              style={{
                width: '100%',
                background: '#374151',
                borderRadius: 9999,
                height: 8,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  background: '#facc15',
                  height: '100%',
                  transition: 'all 0.3s',
                  width: `${pet.happiness}%`,
                }}
              />
            </div>
          </div>

          {/* Health */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 12, color: '#d1d5db' }}>❤️ Health</span>
              <span style={{ fontSize: 12, fontWeight: 'bold', color: '#e5e7eb' }}>
                {pet.health}%
              </span>
            </div>
            <div
              style={{
                width: '100%',
                background: '#374151',
                borderRadius: 9999,
                height: 8,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  background: '#22c55e',
                  height: '100%',
                  transition: 'all 0.3s',
                  width: `${pet.health}%`,
                }}
              />
            </div>
          </div>

          {/* Energy */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 12, color: '#d1d5db' }}>⚡ Energy</span>
              <span style={{ fontSize: 12, fontWeight: 'bold', color: '#e5e7eb' }}>
                {pet.energy}%
              </span>
            </div>
            <div
              style={{
                width: '100%',
                background: '#374151',
                borderRadius: 9999,
                height: 8,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  background: '#60a5fa',
                  height: '100%',
                  transition: 'all 0.3s',
                  width: `${pet.energy}%`,
                }}
              />
            </div>
          </div>

          {/* Cleanliness */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 12, color: '#d1d5db' }}>✨ Cleanliness</span>
              <span style={{ fontSize: 12, fontWeight: 'bold', color: '#e5e7eb' }}>
                {pet.cleanliness}%
              </span>
            </div>
            <div
              style={{
                width: '100%',
                background: '#374151',
                borderRadius: 9999,
                height: 8,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  background: '#06b6d4',
                  height: '100%',
                  transition: 'all 0.3s',
                  width: `${pet.cleanliness}%`,
                }}
              />
            </div>
          </div>

          {/* Bond Level */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 12, color: '#d1d5db' }}>💖 Bond</span>
              <span style={{ fontSize: 12, fontWeight: 'bold', color: '#e5e7eb' }}>
                {pet.bondLevel}%
              </span>
            </div>
            <div
              style={{
                width: '100%',
                background: '#374151',
                borderRadius: 9999,
                height: 8,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  background: '#ec4899',
                  height: '100%',
                  transition: 'all 0.3s',
                  width: `${pet.bondLevel}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Bond Milestone */}
        <div
          style={{
            width: '100%',
            padding: 16,
            background: 'rgba(190, 24, 93, 0.2)',
            border: '1px solid rgba(236, 72, 153, 0.3)',
            borderRadius: 8,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 24 }}>{bondMilestone.emoji}</span>
            <div>
              <p
                style={{
                  fontWeight: 'bold',
                  color: '#f472b6',
                  margin: '0 0 4px 0',
                  fontSize: 14,
                }}
              >
                {bondMilestone.name}
              </p>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                {bondMilestone.description}
              </p>
            </div>
          </div>
          {bondProgress.progress < 100 && (
            <div>
              <div
                style={{
                  width: '100%',
                  background: '#374151',
                  borderRadius: 9999,
                  height: 6,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    background: '#ec4899',
                    height: '100%',
                    transition: 'all 0.3s',
                    width: `${bondProgress.progress}%`,
                  }}
                />
              </div>
              <p
                style={{
                  fontSize: 11,
                  color: '#9ca3af',
                  marginTop: 8,
                  textAlign: 'center',
                  margin: '8px 0 0 0',
                }}
              >
                {bondProgress.progress}% to {bondProgress.next}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            width: '100%',
          }}
        >
          <button
            onClick={handleFeed}
            style={{
              padding: '12px 16px',
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: 13,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#b91c1c')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#dc2626')}
          >
            🍖 Feed
          </button>
          <button
            onClick={handlePlay}
            disabled={pet.energy < 20}
            style={{
              padding: '12px 16px',
              background: pet.energy < 20 ? '#666' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 'bold',
              cursor: pet.energy < 20 ? 'not-allowed' : 'pointer',
              fontSize: 13,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: pet.energy < 20 ? 0.6 : 1,
            }}
            onMouseOver={(e) =>
              pet.energy >= 20 && (e.currentTarget.style.background = '#1d4ed8')
            }
            onMouseOut={(e) =>
              pet.energy >= 20 && (e.currentTarget.style.background = '#2563eb')
            }
          >
            🎮 Play
          </button>
          <button
            onClick={handleHeal}
            style={{
              padding: '12px 16px',
              background: '#16a34a',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: 13,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#15803d')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#16a34a')}
          >
            ❤️ Heal
          </button>
          <button
            onClick={handleClean}
            style={{
              padding: '12px 16px',
              background: '#0891b2',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: 13,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#0e7490')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#0891b2')}
          >
            ✨ Clean
          </button>
        </div>
      </div>

      {/* Pet Selector - Switch Pets */}
      {allPets && allPets.length > 1 && (
        <div style={{ width: '100%', maxWidth: 500 }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#d1d5db', marginBottom: 12, margin: '0 0 12px 0', textAlign: 'center' }}>Select Active Pet:</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8 }}>
            {allPets.map(p => (
              <div
                key={p.id}
                style={{
                  padding: 12,
                  textAlign: 'center',
                  cursor: 'pointer',
                  border: currentPetId === p.id ? '2px solid var(--accent)' : '1px solid rgba(124, 92, 255, 0.2)',
                  background: currentPetId === p.id ? 'rgba(124, 92, 255, 0.15)' : 'rgba(31, 41, 55, 0.5)',
                  borderRadius: 8,
                  transition: 'all 0.2s ease',
                }}
                onClick={() => onPetSwitch?.(p.id)}
              >
                <div style={{ fontSize: '1.8rem', marginBottom: 4 }}>{getPetEmoji(p.stage, p.color, p.emoji)}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff', marginBottom: 2 }}>{p.name}</div>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Lv {Math.floor((p.xp || 0) / 100) || 1}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interaction Stats */}
      <div
        style={{
          padding: 16,
          background: 'rgba(31, 41, 55, 0.5)',
          borderRadius: 8,
          border: '1px solid rgba(75, 85, 99, 0.5)',
          width: '100%',
          maxWidth: 500,
        }}
      >
        <h3
          style={{
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: 16,
            margin: '0 0 16px 0',
            fontSize: 14,
          }}
        >
          📊 Interaction Stats
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
          }}
        >
          <div>
            <p style={{ color: '#9ca3af', fontSize: 12, margin: '0 0 4px 0' }}>
              Total Interactions
            </p>
            <p style={{ fontSize: 18, fontWeight: 'bold', color: '#fff', margin: 0 }}>
              {pet.totalInteractions}
            </p>
          </div>
          <div>
            <p style={{ color: '#9ca3af', fontSize: 12, margin: '0 0 4px 0' }}>Times Fed</p>
            <p style={{ fontSize: 18, fontWeight: 'bold', color: '#fff', margin: 0 }}>
              {pet.timesFeeding}
            </p>
          </div>
          <div>
            <p style={{ color: '#9ca3af', fontSize: 12, margin: '0 0 4px 0' }}>Pet Level</p>
            <p style={{ fontSize: 18, fontWeight: 'bold', color: '#fff', margin: 0 }}>
              {pet.level}
            </p>
          </div>
          <div>
            <p style={{ color: '#9ca3af', fontSize: 12, margin: '0 0 4px 0' }}>Pet Age</p>
            <p style={{ fontSize: 18, fontWeight: 'bold', color: '#fff', margin: 0 }}>
              {Math.floor((Date.now() - pet.createdAt) / 86400000)} days
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetOverview;
