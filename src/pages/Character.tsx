import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getXp, getLevelFromXp } from '../services/xp';
import { getGems } from '../services/currency';
import { getPet, getAllPets, getCurrentPetId, setCurrentPet, getPetEmoji } from '../services/pet';
import { getMedals } from '../services/medals';
import { getSelectedTitle } from '../services/titles';
import { getInventory, getCratesByTier, removeFromInventory } from '../services/inventory';
import Button from '../components/UI/Button';
import { useToast } from '../context/ToastContext';

const Character: React.FC = () => {
  const auth = getAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<any>({ username: 'Player', avatar: '👤', tasksCompleted: 0 });
  const [level, setLevel] = useState(getLevelFromXp(getXp()));
  const [xp, setXp] = useState(getXp());
  const [gems, setGems] = useState(getGems());
  const [currentPetId, setCurrentPetId] = useState(getCurrentPetId());
  const [pets, setPets] = useState(getAllPets());
  const [inventory, setInventory] = useState(getInventory());
  const [selectedTab, setSelectedTab] = useState<'overview' | 'pets' | 'inventory'>('overview');
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [medals, setMedals] = useState<any[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<any>(null);

  useEffect(() => {
    // Load profile
    const stored = localStorage.getItem('adhd_profile');
    if (stored) {
      setProfile(JSON.parse(stored));
    }

    // Load streak
    const streakStored = localStorage.getItem('adhd_streak');
    if (streakStored) {
      setStreak(JSON.parse(streakStored));
    }

    // Load medals and title
    setMedals(getMedals());
    setSelectedTitle(getSelectedTitle());

    // Set up event listeners
    const handleXpUpdate = () => {
      const newXp = getXp();
      setXp(newXp);
      setLevel(getLevelFromXp(newXp));
    };

    const handleInventoryUpdate = () => {
      setInventory(getInventory());
    };

    const handleCurrencyUpdate = () => {
      setGems(getGems());
    };

    window.addEventListener('xp:update', handleXpUpdate as EventListener);
    window.addEventListener('inventory:update', handleInventoryUpdate as EventListener);
    window.addEventListener('currencyUpdated', handleCurrencyUpdate as EventListener);

    return () => {
      window.removeEventListener('xp:update', handleXpUpdate as EventListener);
      window.removeEventListener('inventory:update', handleInventoryUpdate as EventListener);
      window.removeEventListener('currencyUpdated', handleCurrencyUpdate as EventListener);
    };
  }, []);

  const currentPet = pets.find(p => p.id === currentPetId);
  const xpToNextLevel = (level + 1) * 500 - xp;
  const xpInLevel = xp - (level * 500);
  const xpNeeded = 500;
  const progressPercent = (xpInLevel / xpNeeded) * 100;

  const cratesByTier = {
    bronze: getCratesByTier('bronze'),
    silver: getCratesByTier('silver'),
    gold: getCratesByTier('gold'),
    platinum: getCratesByTier('platinum'),
  };

  const totalCrates = Object.values(cratesByTier).reduce((sum, arr) => sum + arr.reduce((s, c) => s + c.quantity, 0), 0);

  const handleSwitchPet = (petId: string) => {
    setCurrentPet(petId);
    setCurrentPetId(petId);
    showToast(`Switched to ${pets.find(p => p.id === petId)?.name}!`, 'success');
  };

  const handleOpenCrate = async (itemId: string) => {
    // This will trigger the crate modal from the main loot crate system
    removeFromInventory(itemId, 1);
    setInventory(getInventory());
    showToast('Opening crate...', 'info');
  };

  return (
    <div className="container">
      <div style={{ maxWidth: 1200, margin: '24px auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
            <div style={{
              fontSize: '5rem',
              textShadow: '0 0 20px rgba(124, 92, 255, 0.5)',
            }}>
              {profile.customAvatarUrl ? (
                <img src={profile.customAvatarUrl} alt={profile.username} style={{
                  width: '5rem',
                  height: '5rem',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--accent)',
                }} />
              ) : (
                profile.avatar
              )}
            </div>
            <div>
              <h1 style={{ margin: '0 0 8px 0', fontSize: '2.5rem' }}>
                {profile.username}
                {selectedTitle && <span style={{ color: 'var(--accent)', marginLeft: 12, fontSize: '1.5rem' }}>👑 {selectedTitle.name}</span>}
              </h1>
              <div style={{ fontSize: '1.1rem', color: 'var(--muted)', marginBottom: 12 }}>
                Level {level} Character
              </div>
              <div style={{ display: 'flex', gap: 32, fontSize: '0.9rem', color: 'var(--muted)' }}>
                <div>Tasks Completed: <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{profile.tasksCompleted}</span></div>
                <div>Streaks: <span style={{ color: '#ec4899', fontWeight: 'bold' }}>🔥 {streak.current}</span></div>
                <div>Medals: <span style={{ color: '#06b6d4', fontWeight: 'bold' }}>{medals.filter(m => m.earned).length}/{medals.length}</span></div>
              </div>
            </div>
          </div>

          {/* XP Bar */}
          <div className="panel" style={{ padding: '16px', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem' }}>
              <span>Experience</span>
              <span style={{ color: 'var(--muted)' }}>{xp.toLocaleString()} XP / {xpToNextLevel} to next</span>
            </div>
            <div style={{ height: 12, background: 'rgba(255,255,255,0.1)', borderRadius: 6, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, var(--accent), var(--accent-2))',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          {/* Currency */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="panel" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>📦</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>{xp.toLocaleString()}</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>XP</div>
            </div>
            <div className="panel" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>💎</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#06b6d4' }}>{gems}</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>Gems</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
          {(['overview', 'pets', 'inventory'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              style={{
                padding: '8px 16px',
                background: selectedTab === tab ? 'var(--accent)' : 'transparent',
                color: selectedTab === tab ? '#fff' : 'var(--text)',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: selectedTab === tab ? 'bold' : 'normal',
                textTransform: 'capitalize',
              }}
            >
              {tab === 'overview' && '📊 Overview'}
              {tab === 'pets' && '🐾 Pets'}
              {tab === 'inventory' && `🎒 Inventory (${totalCrates})`}
            </button>
          ))}
        </div>

        {/* Content */}
        {selectedTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Stats Card */}
            <div className="panel" style={{ padding: 24 }}>
              <h3 style={{ margin: '0 0 16px 0' }}>📈 Statistics</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                  <span>Tasks Completed</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{profile.tasksCompleted}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                  <span>Current Streak</span>
                  <span style={{ fontWeight: 'bold', color: '#ec4899' }}>🔥 {streak.current} days</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                  <span>Longest Streak</span>
                  <span style={{ fontWeight: 'bold', color: '#ec4899' }}>🔥 {streak.longest} days</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                  <span>Medals Earned</span>
                  <span style={{ fontWeight: 'bold', color: '#06b6d4' }}>{medals.filter(m => m.earned).length}/{medals.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Crates in Inventory</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{totalCrates}</span>
                </div>
              </div>
            </div>

            {/* Current Pet Preview */}
            {currentPet && (
              <div className="panel" style={{ padding: 24, textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 16px 0' }}>🐾 Your Companion</h3>
                <div style={{ fontSize: '4rem', marginBottom: 16 }}>{getPetEmoji(currentPet.name)}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: 8 }}>{currentPet.name}</div>
                <div style={{ color: 'var(--muted)', marginBottom: 16 }}>Level {Math.floor(currentPet.xp / 100)}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.9rem' }}>
                  <div>Hunger: {currentPet.hunger}%</div>
                  <div>Happiness: {currentPet.happiness}%</div>
                  <div>Health: {currentPet.health}%</div>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'pets' && (
          <div>
            <h2 style={{ marginBottom: 24 }}>🐾 Your Pets</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {pets.map(pet => (
                <div
                  key={pet.id}
                  className="panel"
                  style={{
                    padding: 20,
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: currentPetId === pet.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                    background: currentPetId === pet.id ? 'rgba(124, 92, 255, 0.1)' : 'var(--panel)',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => handleSwitchPet(pet.id)}
                >
                  <div style={{ fontSize: '3rem', marginBottom: 12 }}>{getPetEmoji(pet.name)}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: 4 }}>{pet.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 12 }}>Level {Math.floor(pet.xp / 100)}</div>
                  {currentPetId === pet.id && (
                    <div style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 'bold' }}>✓ Active</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'inventory' && (
          <div>
            <h2 style={{ marginBottom: 24 }}>🎒 Inventory</h2>
            
            {totalCrates === 0 ? (
              <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>📦</div>
                <div>No crates yet! Complete tasks or purchase from the Store to get started.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {Object.entries(cratesByTier).map(([tier, crates]) => {
                  const totalInTier = crates.reduce((sum, c) => sum + c.quantity, 0);
                  if (totalInTier === 0) return null;

                  const tierColors: Record<string, string> = {
                    bronze: '#b45309',
                    silver: '#a1a1a1',
                    gold: '#eab308',
                    platinum: '#60a5fa',
                  };

                  return (
                    <div key={tier}>
                      <h3 style={{ 
                        margin: '0 0 12px 0', 
                        color: tierColors[tier],
                        textTransform: 'capitalize',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}>
                        {tier === 'bronze' && '🟤'}
                        {tier === 'silver' && '⚪'}
                        {tier === 'gold' && '🟨'}
                        {tier === 'platinum' && '🔵'}
                        {tier} Crates ({totalInTier})
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                        {crates.map(crate => (
                          <div
                            key={crate.id}
                            className="panel"
                            style={{
                              padding: 16,
                              textAlign: 'center',
                              border: `2px solid ${tierColors[tier]}`,
                              background: `${tierColors[tier]}15`,
                            }}
                          >
                            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📦</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: 4, textTransform: 'capitalize' }}>
                              {crate.name}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 12 }}>
                              ×{crate.quantity}
                            </div>
                            <Button
                              variant="ghost"
                              onClick={() => handleOpenCrate(crate.id)}
                              style={{ width: '100%', fontSize: '0.85rem' }}
                            >
                              Open
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Character;
