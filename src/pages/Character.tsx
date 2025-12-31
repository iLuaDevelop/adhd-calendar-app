import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getXp, getLevelFromXp, grantXp, setXp, getXpToNextLevel, getTotalXpForCurrentLevel, getXpIntoCurrentLevel } from '../services/xp';
import { getGems, addGems } from '../services/currency';
import { getPet, getAllPets, getCurrentPetId, setCurrentPet, feedPet, updatePetStats, getPetEmoji, createPet } from '../services/pet';
import { getMedals } from '../services/medals';
import { getSelectedTitle } from '../services/titles';
import { getInventory, getCratesByTier, removeFromInventory } from '../services/inventory';
import Button from '../components/UI/Button';
import { useToast } from '../context/ToastContext';
import PetOverview from '../components/Pet/PetOverview';
import PetAbilities from '../components/Pet/PetAbilities';
import PetQuests from '../components/Pet/PetQuests';
import PetStats from '../components/Pet/PetStats';
import PetEvolution from '../components/Pet/PetEvolution';
import InventoryCrateModal from '../components/InventoryCrateModal/InventoryCrateModal';

const Character: React.FC = () => {
  const location = useLocation();
  const auth = getAuth();
  const { showToast } = useToast();
  
  const [profile, setProfile] = useState<any>({ username: 'Player', avatar: '👤', tasksCompleted: 0 });
  const [level, setLevel] = useState(getLevelFromXp(getXp()));
  const [xp, setXp] = useState(getXp());
  const [gems, setGems] = useState(getGems());
  const [currentPetId, setCurrentPetId] = useState<string | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [inventory, setInventory] = useState(getInventory());
  const [selectedTab, setSelectedTab] = useState<'overview' | 'pets' | 'inventory' | 'insights'>(() => {
    // Check if we were navigated from dashboard to open pets tab
    const state = location.state as any;
    return state?.selectedTab === 'pets' ? 'pets' : 'overview';
  });
  const [petDetailsTab, setPetDetailsTab] = useState<'overview' | 'abilities' | 'quests' | 'stats' | 'evolution'>('overview');
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [medals, setMedals] = useState<any[]>([]);
  const [quests, setQuests] = useState<any[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<any>(null);
  const [crateModalOpen, setCrateModalOpen] = useState(false);
  const [selectedCrate, setSelectedCrate] = useState<any>(null);
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'bronze' | 'silver' | 'gold' | 'platinum'>('all');
  const [inventorySortBy, setInventorySortBy] = useState<'tier' | 'quantity'>('tier');
  const [hoveredControl, setHoveredControl] = useState<string | null>(null);

  // Handle navigation to open specific tabs (using localStorage since HashRouter doesn't support state)
  useEffect(() => {
    const shouldOpenPetsTab = localStorage.getItem('adhd_open_pets_tab');
    if (shouldOpenPetsTab === 'true') {
      setSelectedTab('pets');
      localStorage.removeItem('adhd_open_pets_tab');
    }
  }, []);

  // Load/reload pet data on mount to ensure fresh data
  useEffect(() => {
    let allPets = getAllPets();
    
    // If user has no pets, create a default starter pet
    if (allPets.length === 0) {
      createPet('Butterfly');
      allPets = getAllPets();
    }
    
    const currentId = getCurrentPetId();
    setPets(allPets);
    setCurrentPetId(currentId);
  }, []);

  useEffect(() => {
    // Load profile from localStorage as fallback
    const stored = localStorage.getItem('adhd_profile');
    if (stored) {
      setProfile(JSON.parse(stored));
    }

    // Subscribe to real-time profile updates from Firestore playerProfiles collection
    if (auth.currentUser) {
      const profileDoc = doc(db, 'playerProfiles', auth.currentUser.uid);
      const unsubscribe = onSnapshot(profileDoc, (snapshot) => {
        if (snapshot.exists()) {
          const profileData = snapshot.data();
          setProfile({
            username: profileData.username || 'Player',
            avatar: profileData.avatar || '👤',
            customAvatarUrl: profileData.customAvatarUrl || '',
            tasksCompleted: profileData.tasksCompleted || 0,
          });
          // Also update localStorage for consistency
          localStorage.setItem('adhd_profile', JSON.stringify({
            username: profileData.username || 'Player',
            avatar: profileData.avatar || '👤',
            customAvatarUrl: profileData.customAvatarUrl || '',
            tasksCompleted: profileData.tasksCompleted || 0,
          }));
        }
      });

      // Load streak
      const streakStored = localStorage.getItem('adhd_streak');
      if (streakStored) {
        setStreak(JSON.parse(streakStored));
      }

      // Load medals and title
      setMedals(getMedals());
      setSelectedTitle(getSelectedTitle());

      // Load quests
      const questsStr = localStorage.getItem('adhd_quests_progress');
      if (questsStr) {
        setQuests(JSON.parse(questsStr));
      }

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

      const handlePetUpdate = () => {
        const updated = getAllPets();
        const updatedId = getCurrentPetId();
        setPets(updated);
        setCurrentPetId(updatedId);
      };

      window.addEventListener('xp:update', handleXpUpdate as EventListener);
      window.addEventListener('inventory:update', handleInventoryUpdate as EventListener);
      window.addEventListener('currencyUpdated', handleCurrencyUpdate as EventListener);
      window.addEventListener('pet:update', handlePetUpdate as EventListener);

      return () => {
        unsubscribe();
        window.removeEventListener('xp:update', handleXpUpdate as EventListener);
        window.removeEventListener('inventory:update', handleInventoryUpdate as EventListener);
        window.removeEventListener('currencyUpdated', handleCurrencyUpdate as EventListener);
        window.removeEventListener('pet:update', handlePetUpdate as EventListener);
      };
    }

    // Load streak
    const streakStored = localStorage.getItem('adhd_streak');
    if (streakStored) {
      setStreak(JSON.parse(streakStored));
    }

    // Load medals and title
    setMedals(getMedals());
    setSelectedTitle(getSelectedTitle());

    // Load quests
    const questsStr = localStorage.getItem('adhd_quests_progress');
    if (questsStr) {
      setQuests(JSON.parse(questsStr));
    }

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

    const handlePetUpdate = () => {
      const updated = getAllPets();
      const updatedId = getCurrentPetId();
      setPets(updated);
      setCurrentPetId(updatedId);
    };

    window.addEventListener('xp:update', handleXpUpdate as EventListener);
    window.addEventListener('inventory:update', handleInventoryUpdate as EventListener);
    window.addEventListener('currencyUpdated', handleCurrencyUpdate as EventListener);
    window.addEventListener('pet:update', handlePetUpdate as EventListener);

    return () => {
      window.removeEventListener('xp:update', handleXpUpdate as EventListener);
      window.removeEventListener('inventory:update', handleInventoryUpdate as EventListener);
      window.removeEventListener('currencyUpdated', handleCurrencyUpdate as EventListener);
      window.removeEventListener('pet:update', handlePetUpdate as EventListener);
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
          {(['overview', 'pets', 'inventory', 'insights'] as const).map(tab => (
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
              {tab === 'insights' && '📈 In-Depth Insights'}
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

            {/* Current Pet Preview - QUICK OVERVIEW */}
            {currentPet && (
              <div className="panel" style={{ padding: 24 }}>
                <h3 style={{ margin: '0 0 16px 0' }}>🐾 Your Companion</h3>
                
                {/* Quick Pet Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  {/* Pet Emoji with Badges */}
                  <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ fontSize: '5rem' }}>{getPetEmoji(currentPet.stage, currentPet.color, currentPet.emoji)}</div>
                    
                    {/* Mood Indicator - Top Right */}
                    <div style={{ position: 'absolute', top: 0, right: 0, fontSize: '1.8rem' }}>
                      {currentPet.mood === 'happy' && '😊'}
                      {currentPet.mood === 'excited' && '🤩'}
                      {currentPet.mood === 'playful' && '🎮'}
                      {currentPet.mood === 'content' && '😌'}
                      {currentPet.mood === 'sad' && '😢'}
                      {currentPet.mood === 'sleepy' && '😴'}
                      {!currentPet.mood && '😐'}
                    </div>

                    {/* Level Circle - Bottom Left, right on edge */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        background: '#2563eb',
                        borderRadius: '50%',
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 17,
                        fontWeight: 'bold',
                        color: '#fff',
                        border: '2px solid #60a5fa',
                      }}
                    >
                      {currentPet.level}
                    </div>

                    {/* Stage Badge - Bottom Right, moved out */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: -5,
                        right: -5,
                        background: '#7c3aed',
                        borderRadius: 6,
                        padding: '4px 12px',
                        fontSize: 10,
                        fontWeight: 'bold',
                        color: '#fff',
                        border: '2px solid #a78bfa',
                      }}
                    >
                      {currentPet.stage.toUpperCase()}
                    </div>
                  </div>

                  {/* Pet Name & Level */}
                  <div style={{ textAlign: 'center' }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 'bold', color: '#fff' }}>{currentPet.name}</h4>
                  </div>

                  {/* Quick Stats - Just 3 key ones */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, width: '100%', fontSize: '0.8rem' }}>
                    <div style={{ textAlign: 'center', padding: 8, background: 'rgba(124, 92, 255, 0.1)', borderRadius: 6 }}>
                      <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.7rem' }}>Hunger</p>
                      <p style={{ margin: '4px 0 0 0', fontWeight: 'bold', color: '#ef4444' }}>{currentPet.hunger}%</p>
                    </div>
                    <div style={{ textAlign: 'center', padding: 8, background: 'rgba(124, 92, 255, 0.1)', borderRadius: 6 }}>
                      <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.7rem' }}>Happiness</p>
                      <p style={{ margin: '4px 0 0 0', fontWeight: 'bold', color: '#facc15' }}>{currentPet.happiness}%</p>
                    </div>
                    <div style={{ textAlign: 'center', padding: 8, background: 'rgba(124, 92, 255, 0.1)', borderRadius: 6 }}>
                      <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.7rem' }}>Health</p>
                      <p style={{ margin: '4px 0 0 0', fontWeight: 'bold', color: '#22c55e' }}>{currentPet.health}%</p>
                    </div>
                  </div>
                </div>
                
                {/* Pet Navigation */}
                {pets.length > 1 && (
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
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
          <div style={{ textAlign: 'center' }}>
            {/* Pet Details Section with Nested Tabs - NOW FIRST */}
            {currentPet && (
              <div style={{ marginTop: 0, marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <div className="panel" style={{ padding: 0, width: '100%', maxWidth: 900, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {/* Nested Pet Details Tab Navigation - Integrated into panel */}
                  <div style={{ 
                    display: 'flex', 
                    gap: 0, 
                    borderBottom: '2px solid var(--border)', 
                    flexWrap: 'wrap', 
                    justifyContent: 'center',
                    background: 'rgba(124, 92, 255, 0.05)',
                    padding: '16px 24px',
                  }}>
                    {(['overview', 'abilities', 'quests', 'stats', 'evolution'] as const).map((tab, idx) => (
                      <button
                        key={tab}
                        onClick={() => setPetDetailsTab(tab)}
                        style={{
                          padding: '10px 20px',
                          background: 'transparent',
                          color: petDetailsTab === tab ? 'var(--accent)' : 'var(--text-secondary)',
                          border: 'none',
                          borderBottom: petDetailsTab === tab ? '3px solid var(--accent)' : '3px solid transparent',
                          cursor: 'pointer',
                          fontWeight: petDetailsTab === tab ? '700' : '500',
                          fontSize: '0.95rem',
                          transition: 'all 0.2s ease',
                          marginBottom: '-16px',
                          paddingBottom: '16px',
                        }}
                      >
                        {tab === 'overview' && '📊 Overview'}
                        {tab === 'abilities' && '⚡ Abilities'}
                        {tab === 'quests' && '🗺️ Quests'}
                        {tab === 'stats' && '📈 Stats'}
                        {tab === 'evolution' && '🔮 Evolution'}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div style={{ padding: 24 }}>
                  {petDetailsTab === 'overview' && (
                    <div style={{ maxWidth: 600, margin: '0 auto', width: '100%' }}>
                      <PetOverview 
                        pet={currentPet}
                        allPets={pets}
                        currentPetId={currentPetId}
                        onPetSwitch={handleSwitchPet}
                        onUpdate={() => {
                          setPets(getAllPets());
                          setCurrentPetId(getCurrentPetId());
                        }} 
                      />
                    </div>
                  )}

                  {petDetailsTab === 'abilities' && (
                    <div style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>
                      <PetAbilities 
                        pet={currentPet} 
                        onAbilityUnlock={() => {
                          setPets(getAllPets());
                        }}
                      />
                    </div>
                  )}

                  {petDetailsTab === 'quests' && (
                    <div style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>
                      <PetQuests 
                        pet={currentPet} 
                        onQuestStart={() => {
                          setPets(getAllPets());
                        }}
                        onQuestComplete={() => {
                          setPets(getAllPets());
                        }}
                      />
                    </div>
                  )}

                  {petDetailsTab === 'stats' && (
                    <div style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>
                      <PetStats pet={currentPet} />
                    </div>
                  )}

                  {petDetailsTab === 'evolution' && (
                    <div style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>
                      <PetEvolution 
                        pet={currentPet} 
                        onEvolve={() => {
                          setPets(getAllPets());
                        }}
                      />
                    </div>
                  )}
                  </div>
                </div>
              </div>
            )}

            {/* Pet Selector Grid - NOW SECOND */}
            <div style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* All pets are now shown in the PetOverview component selector */}
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

        {/* Expanded Insights Details */}
        {selectedTab === 'insights' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Level & Progress */}
            <div className="panel" style={{ padding: 24 }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem' }}>🎯 Level Progress</h3>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem' }}>
                  <span>Level {level}</span>
                  <span className="subtle">{xpInLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP</span>
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
              <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                {xpToNextLevel.toLocaleString()} XP until next level
              </div>
            </div>

            {/* Inventory Summary */}
            <div className="panel" style={{ padding: 24 }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem' }}>🎁 Inventory Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--accent)' }}>{totalCrates}</div>
                  <div className="subtle" style={{ fontSize: '0.85rem' }}>Total Crates</div>
                </div>
                {Object.entries(cratesByTier).map(([tier, crates]: any) => (
                  <div key={tier} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 'bold', textTransform: 'capitalize', color: tier === 'gold' ? '#f59e0b' : tier === 'platinum' ? '#a78bfa' : 'var(--text)' }}>
                      {crates.reduce((sum: number, c: any) => sum + c.quantity, 0)}
                    </div>
                    <div className="subtle" style={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>{tier}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pet Companion Stats */}
            {currentPet && (
              <div className="panel" style={{ padding: 24 }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem' }}>🐾 Companion Status</h3>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>{getPetEmoji(currentPet.stage, currentPet.color, currentPet.emoji)}</div>
                  <div style={{ fontWeight: 'bold', marginBottom: 4 }}>{currentPet.name}</div>
                  <div className="subtle" style={{ fontSize: '0.9rem' }}>Level {Math.floor((currentPet.xp || 0) / 100) || 1}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.9rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>Hunger</span>
                      <span style={{ fontWeight: 'bold' }}>{currentPet.hunger || 0}%</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${currentPet.hunger || 0}%`, background: '#f59e0b' }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>Happiness</span>
                      <span style={{ fontWeight: 'bold' }}>{currentPet.happiness || 0}%</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${currentPet.happiness || 0}%`, background: '#ec4899' }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>Health</span>
                      <span style={{ fontWeight: 'bold' }}>{currentPet.health || 0}%</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${currentPet.health || 0}%`, background: '#22c55e' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Overall Summary */}
            <div className="panel" style={{ padding: 24 }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem' }}>📊 Overall Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                  <span>Days Active (Streak)</span>
                  <span style={{ fontWeight: 'bold', color: '#ec4899' }}>{streak.current} days</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                  <span>Best Streak</span>
                  <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>{streak.longest} days</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                  <span>Avg Tasks/Day</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{(profile.tasksCompleted / Math.max(streak.longest, 1)).toFixed(1)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Achievements</span>
                  <span style={{ fontWeight: 'bold', color: '#06b6d4' }}>{medals.filter(m => m.earned).length} / {medals.length}</span>
                </div>
              </div>
            </div>

            {/* Quests Summary */}
            <div className="panel" style={{ padding: 24, marginTop: 16 }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem' }}>🏆 Quest Progress</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ec4899' }}>
                    {quests.filter((q: any) => q.completed).length}/{quests.length}
                  </div>
                  <div className="subtle" style={{ fontSize: '0.9rem' }}>Quests Completed</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#ec4899', marginTop: 8 }}>
                    {quests.length > 0 ? `${Math.round((quests.filter((q: any) => q.completed).length / quests.length) * 100)}%` : '0%'}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                    {quests.length}
                  </div>
                  <div className="subtle" style={{ fontSize: '0.9rem' }}>Total Available</div>
                  <div className="subtle" style={{ fontSize: '0.85rem', marginTop: 8 }}>Keep working towards them!</div>
                </div>
              </div>
            </div>

            {/* Personal Observations Section */}
          <div className="panel" style={{ padding: 24, marginTop: 16 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem' }}>💡 Personal Observations</h3>
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: 8 }}>📈 Progress Trend</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                  {profile?.tasksCompleted > 20 
                    ? '🔥 You\'re on a roll! Your consistency is impressive.' 
                    : profile?.tasksCompleted > 10 
                    ? '💪 Great effort! You\'re building momentum.' 
                    : '🌱 Every journey starts with a single step. Keep going!'}
                </div>
              </div>

              <div style={{ paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: 8 }}>🔥 Streak Status</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                  {streak?.current > 7
                    ? `Amazing! You've maintained a ${streak.current}-day streak. Don't break it! 🎯`
                    : streak?.current > 0
                    ? `You're on a ${streak.current}-day streak. Keep the momentum going!`
                    : 'Start a new streak today and build consistency!'}
                </div>
              </div>

              <div style={{ paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: 8 }}>🏆 Quest Progress</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                  {quests.filter((q: any) => q.completed).length === quests.length && quests.length > 0
                    ? `Incredible! You've completed all available quests. You're a quest master! 🎉`
                    : quests.filter((q: any) => q.completed).length > 0
                    ? `You've completed ${quests.filter((q: any) => q.completed).length} quest${quests.filter((q: any) => q.completed).length > 1 ? 's' : ''}. Great work! Keep completing more.`
                    : 'Start completing quests to earn rewards and achievements!'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: 8 }}>🎖️ Achievement Status</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                  {medals.filter(m => m.earned).length === medals.length && medals.length > 0
                    ? `🌟 Perfect! You've unlocked all available medals. You are unstoppable!`
                    : medals.filter(m => m.earned).length > 0
                    ? `You've earned ${medals.filter(m => m.earned).length} medal${medals.filter(m => m.earned).length > 1 ? 's' : ''}. ${medals.length - medals.filter(m => m.earned).length} more to unlock!`
                    : 'Earn medals by completing tasks, quests, and achieving milestones.'}
                </div>
              </div>
            </div>
          </div>

          {/* Tips & Encouragement Section */}
          <div className="panel" style={{ padding: 24, marginTop: 16, background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem' }}>💭 Tips for Success</h3>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: '1.8', fontSize: '0.95rem' }}>
              <li>✨ Focus on consistency over perfection - every small task counts!</li>
              <li>🎯 Use streaks as motivation - they compound over time</li>
              <li>🏆 Complete quests regularly for extra rewards and badges</li>
              <li>🎖️ Work towards unlocking all medals for ultimate achievement</li>
              <li>💎 Collect gems and XP to unlock exclusive features in the store</li>
              <li>🔥 If you break a streak, don't give up - start a new one immediately</li>
            </ul>
          </div>
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
