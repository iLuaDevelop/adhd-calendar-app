import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getXp, getLevelFromXp, grantXp, setXp, getXpToNextLevel, getTotalXpForCurrentLevel, getXpIntoCurrentLevel } from '../services/xp';
import { getGems, addGems } from '../services/currency';
import { getPet, getAllPets, getCurrentPetId, setCurrentPet, getPetEmoji, feedPet, updatePetStats } from '../services/pet';
import { getMedals } from '../services/medals';
import { getSelectedTitle } from '../services/titles';
import { getInventory, getCratesByTier, removeFromInventory } from '../services/inventory';
import Button from '../components/UI/Button';
import { useToast } from '../context/ToastContext';
import InventoryCrateModal from '../components/InventoryCrateModal/InventoryCrateModal';

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
  const [crateModalOpen, setCrateModalOpen] = useState(false);
  const [selectedCrate, setSelectedCrate] = useState<any>(null);
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'bronze' | 'silver' | 'gold' | 'platinum'>('all');
  const [inventorySortBy, setInventorySortBy] = useState<'tier' | 'quantity'>('tier');
  const [hoveredControl, setHoveredControl] = useState<string | null>(null);

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
  const xpToNextLevel = getXpToNextLevel(xp);
  const xpInLevel = getXpIntoCurrentLevel(xp);
  const xpNeeded = getTotalXpForCurrentLevel(xp);
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
    // Find the crate in inventory
    const allCrates = Object.values(cratesByTier).flat();
    const crate = allCrates.find(c => c.id === itemId);
    
    if (!crate) return;
    
    // Set selected crate and open modal
    setSelectedCrate(crate);
    setCrateModalOpen(true);
  };

  const handleCrateRewardReceived = (reward: { type: 'xp' | 'gems'; amount: number }) => {
    // Award the reward to the player
    if (reward.type === 'xp') {
      const newXp = (getXp()) + reward.amount;
      setXp(newXp);
      setXp(newXp);
    } else {
      addGems(reward.amount);
      setGems(getGems());
    }
    
    // Show toast
    const rewardDisplay = reward.type === 'xp' ? `${reward.amount} XP` : `${reward.amount} 💎`;
    showToast(`You won ${rewardDisplay}!`, 'success');
    
    // Mark crate as opened (don't remove yet, let user close modal first)
    if (selectedCrate) {
      removeFromInventory(selectedCrate.id, 1);
      setInventory(getInventory());
    }
  };

  return (
    <div className="container">
      <div style={{ maxWidth: 1200, margin: '-25px auto' }}>
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
                {selectedTitle && (
                  <span
                    style={{
                      marginLeft: 12,
                      fontSize: '1.5rem',
                      background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    ✨ {selectedTitle.name}
                  </span>
                )}
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
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, paddingBottom: 16, justifyContent: 'center' }}>
          {(['overview', 'pets', 'inventory'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              style={{
                padding: '10px 20px',
                background: selectedTab === tab 
                  ? 'var(--accent)' 
                  : 'rgba(124, 92, 255, 0.08)',
                color: selectedTab === tab ? '#fff' : 'var(--text)',
                border: selectedTab === tab 
                  ? '1px solid var(--accent)' 
                  : '1px solid rgba(124, 92, 255, 0.25)',
                borderRadius: 20,
                cursor: 'pointer',
                fontWeight: selectedTab === tab ? '600' : '500',
                textTransform: 'capitalize',
                fontSize: '0.95rem',
                transition: 'all 0.25s ease',
                boxShadow: selectedTab === tab 
                  ? '0 0 12px rgba(124, 92, 255, 0.3)' 
                  : 'none',
              }}
              onMouseEnter={(e) => {
                if (selectedTab !== tab) {
                  e.currentTarget.style.background = 'rgba(124, 92, 255, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(124, 92, 255, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedTab !== tab) {
                  e.currentTarget.style.background = 'rgba(124, 92, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(124, 92, 255, 0.25)';
                }
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
                <div style={{ fontSize: '4rem', marginBottom: 16 }}>{getPetEmoji(currentPet.stage, currentPet.color, currentPet.emoji)}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: 8 }}>{currentPet.name}</div>
                <div style={{ color: 'var(--muted)', marginBottom: 16 }}>Level {Math.floor((currentPet.xp || 0) / 100) || 1}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.9rem', marginBottom: 16 }}>
                  <div>Hunger: {currentPet.hunger || 0}%</div>
                  <div>Happiness: {currentPet.happiness || 0}%</div>
                  <div>Health: {currentPet.health || 0}%</div>
                </div>

                {/* Pet Care Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                  <Button
                    variant="primary"
                    onClick={() => {
                      const updatedPet = feedPet(currentPet.id);
                      if (updatedPet) {
                        setPets(getAllPets());
                        setCurrentPetId(updatedPet.id);
                        showToast(`${currentPet.name} is happily eating! 😋`, 'success');
                      }
                    }}
                    style={{ fontSize: '0.85rem' }}
                  >
                    🍖 Feed
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      const updatedPet = updatePetStats(currentPet.id, {
                        happiness: Math.min((currentPet.happiness || 0) + 20, 100),
                        hunger: Math.min((currentPet.hunger || 0) + 10, 100),
                        xp: (currentPet.xp || 0) + 10,
                      });
                      setPets(getAllPets());
                      setCurrentPetId(currentPetId);
                      showToast(`${currentPet.name} had fun playing! 🎾`, 'success');
                    }}
                    style={{ fontSize: '0.85rem' }}
                  >
                    🎾 Play
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      const updatedPet = updatePetStats(currentPet.id, {
                        health: Math.min((currentPet.health || 0) + 25, 100),
                        hunger: Math.max((currentPet.hunger || 0) - 5, 0),
                      });
                      setPets(getAllPets());
                      setCurrentPetId(currentPetId);
                      showToast(`${currentPet.name} feels better! 💊`, 'success');
                    }}
                    style={{ fontSize: '0.85rem' }}
                  >
                    💊 Heal
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      const updatedPet = updatePetStats(currentPet.id, {
                        happiness: Math.min((currentPet.happiness || 0) + 10, 100),
                        xp: (currentPet.xp || 0) + 5,
                      });
                      setPets(getAllPets());
                      setCurrentPetId(currentPetId);
                      showToast(`${currentPet.name} is so loved! 💕`, 'success');
                    }}
                    style={{ fontSize: '0.85rem' }}
                  >
                    💕 Pet
                  </Button>
                </div>

                {pets.length > 1 && (
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <Button 
                      variant="ghost"
                      onClick={() => {
                        const currentIndex = pets.findIndex(p => p.id === currentPetId);
                        const nextPet = pets[(currentIndex - 1 + pets.length) % pets.length];
                        handleSwitchPet(nextPet.id);
                      }}
                      style={{ fontSize: '0.85rem' }}
                    >
                      ← Prev
                    </Button>
                    <Button 
                      variant="ghost"
                      onClick={() => setSelectedTab('pets')}
                      style={{ fontSize: '0.85rem' }}
                    >
                      View All Pets
                    </Button>
                    <Button 
                      variant="ghost"
                      onClick={() => {
                        const currentIndex = pets.findIndex(p => p.id === currentPetId);
                        const nextPet = pets[(currentIndex + 1) % pets.length];
                        handleSwitchPet(nextPet.id);
                      }}
                      style={{ fontSize: '0.85rem' }}
                    >
                      Next →
                    </Button>
                  </div>
                )}
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
                  <div style={{ fontSize: '3rem', marginBottom: 12 }}>{getPetEmoji(pet.stage, pet.color, pet.emoji)}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: 4 }}>{pet.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 12 }}>Level {Math.floor((pet.xp || 0) / 100) || 1}</div>
                  {currentPetId === pet.id && (
                    <div style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 'bold' }}>✓ Active</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'inventory' && (
          <div className="panel" style={{ padding: 24 }}>
            <h2 style={{ marginTop: 0, marginBottom: 20, textAlign: 'center', fontSize: '1.5rem', fontWeight: '600', paddingBottom: 16, borderBottom: '2px solid var(--accent)' }}>Inventory</h2>
            
            {/* Inventory Controls */}
            <div style={{ 
              marginBottom: 24, 
              padding: 16, 
              background: 'rgba(124, 92, 255, 0.06)', 
              borderRadius: 12, 
              border: '1px solid rgba(124, 92, 255, 0.15)',
              display: 'flex', 
              gap: 16, 
              flexWrap: 'wrap', 
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative'
            }}>
              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: 6, position: 'relative' }}>
                {(['all', 'bronze', 'silver', 'gold', 'platinum'] as const).map(filter => {
                  const tooltipLabels: Record<string, string> = {
                    all: 'Show All',
                    bronze: 'Bronze',
                    silver: 'Silver',
                    gold: 'Gold',
                    platinum: 'Platinum',
                  };
                  return (
                    <div key={filter} style={{ position: 'relative' }}>
                      <button
                        onClick={() => setInventoryFilter(filter)}
                        onMouseEnter={() => setHoveredControl(`filter-${filter}`)}
                        onMouseLeave={() => setHoveredControl(null)}
                        style={{
                          padding: '5px 12px',
                          fontSize: '0.8rem',
                          background: inventoryFilter === filter 
                            ? filter === 'all' ? 'var(--accent)' : (filter === 'bronze' ? '#b45309' : filter === 'silver' ? '#a1a1a1' : filter === 'gold' ? '#eab308' : '#60a5fa')
                            : 'rgba(100, 100, 100, 0.1)',
                          color: inventoryFilter === filter ? '#fff' : 'var(--text)',
                          border: 'none',
                          borderRadius: 14,
                          cursor: 'pointer',
                          fontWeight: inventoryFilter === filter ? '600' : '500',
                          transition: 'all 0.2s ease',
                          textTransform: 'capitalize',
                        }}
                      >
                        {filter === 'all' && '📦'}
                        {filter === 'bronze' && '🟤'}
                        {filter === 'silver' && '⚪'}
                        {filter === 'gold' && '🟨'}
                        {filter === 'platinum' && '🔵'}
                      </button>
                      {hoveredControl === `filter-${filter}` && (
                        <div style={{
                          position: 'absolute',
                          bottom: '-32px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'rgba(0, 0, 0, 0.85)',
                          color: '#7c5cff',
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: '0.75rem',
                          whiteSpace: 'nowrap',
                          fontWeight: '600',
                          zIndex: 1000,
                          border: '1px solid rgba(124, 92, 255, 0.4)',
                          pointerEvents: 'none',
                        }}>
                          {tooltipLabels[filter]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Divider */}
              <div style={{ width: '1px', height: '24px', background: 'rgba(124, 92, 255, 0.2)' }} />

              {/* Sort Controls */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', position: 'relative' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: '500' }}>Sort:</span>
                {(['tier', 'quantity'] as const).map(sort => {
                  const tooltipLabels: Record<string, string> = {
                    tier: 'Sort by Tier',
                    quantity: 'Sort by Quantity',
                  };
                  return (
                    <div key={sort} style={{ position: 'relative' }}>
                      <button
                        onClick={() => setInventorySortBy(sort)}
                        onMouseEnter={() => setHoveredControl(`sort-${sort}`)}
                        onMouseLeave={() => setHoveredControl(null)}
                        style={{
                          padding: '5px 11px',
                          fontSize: '0.8rem',
                          background: inventorySortBy === sort 
                            ? 'rgba(99, 102, 241, 0.4)' 
                            : 'rgba(100, 100, 100, 0.1)',
                          color: 'var(--text)',
                          border: inventorySortBy === sort 
                            ? '1px solid rgba(99, 102, 241, 0.4)' 
                            : 'none',
                          borderRadius: 10,
                          cursor: 'pointer',
                          fontWeight: inventorySortBy === sort ? '600' : '500',
                          transition: 'all 0.2s ease',
                          textTransform: 'capitalize',
                        }}
                      >
                        {sort === 'tier' && '⭐'}
                        {sort === 'quantity' && '📊'}
                      </button>
                      {hoveredControl === `sort-${sort}` && (
                        <div style={{
                          position: 'absolute',
                          bottom: '-32px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'rgba(0, 0, 0, 0.85)',
                          color: '#7c5cff',
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: '0.75rem',
                          whiteSpace: 'nowrap',
                          fontWeight: '600',
                          zIndex: 1000,
                          border: '1px solid rgba(124, 92, 255, 0.4)',
                          pointerEvents: 'none',
                        }}>
                          {tooltipLabels[sort]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {totalCrates === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>📦</div>
                <div>No crates yet! Complete tasks or purchase from the Store to get started.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {Object.entries(cratesByTier)
                  .filter(([tier]) => inventoryFilter === 'all' || inventoryFilter === tier)
                  .map(([tier, crates]) => {
                  const totalInTier = crates.reduce((sum, c) => sum + c.quantity, 0);
                  if (totalInTier === 0) return null;

                  const tierColors: Record<string, string> = {
                    bronze: '#b45309',
                    silver: '#a1a1a1',
                    gold: '#eab308',
                    platinum: '#60a5fa',
                  };

                  // Sort crates based on selected sort option
                  const sortedCrates = [...crates].sort((a, b) => {
                    if (inventorySortBy === 'quantity') {
                      return b.quantity - a.quantity;
                    }
                    return 0; // tier order is already correct
                  });

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
                        {sortedCrates.map(crate => (
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

      {/* Inventory Crate Modal */}
      {selectedCrate && (
        <InventoryCrateModal
          isOpen={crateModalOpen}
          tier={selectedCrate.tier}
          rewards={selectedCrate.rewards || [
            { type: 'xp', amount: Math.floor(Math.random() * 50) + 25 },
            { type: 'gems', amount: Math.floor(Math.random() * 10) + 5 },
          ]}
          onClose={() => {
            setCrateModalOpen(false);
            setSelectedCrate(null);
          }}
          onRewardReceived={handleCrateRewardReceived}
        />
      )}
    </div>
  );
};

export default Character;
