import React, { useState, useEffect } from 'react';
import {
  getPet,
  createPet,
  feedPet,
  updatePetStats,
  getPetEmoji,
  getXpToNextLevel,
  Pet,
  resetPet as resetPetService,
  renamePet,
  changePetColor,
  changePetSkin,
  PET_COLORS,
  PET_SKINS,
  PetColor,
  PetSkin,
  getMoodFromStats,
  getAllPets,
  getCurrentPetId,
  setCurrentPet,
} from '../services/pet';
import { getGems } from '../services/currency';
import { getXp } from '../services/xp';
import { useToast } from '../context/ToastContext';
import PetOverview from '../components/Pet/PetOverview';
import PetAbilities from '../components/Pet/PetAbilities';
import PetQuests from '../components/Pet/PetQuests';
import PetStats from '../components/Pet/PetStats';
import PetEvolution from '../components/Pet/PetEvolution';

const PetPage: React.FC = () => {
  const { showToast } = useToast();
  const [pet, setPet] = useState<Pet | null>(null);
  const [gems, setGems] = useState(0);
  const [xp, setXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isRenamingMode, setIsRenamingMode] = useState(false);
  const [newName, setNewName] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSkinPicker, setShowSkinPicker] = useState(false);
  const [ownedPets, setOwnedPets] = useState<Pet[]>([]);
  const [currentPetId, setCurrentPetIdState] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'abilities' | 'quests' | 'stats' | 'evolution'>('overview');

  const feedCostGems = 5;
  const feedCostXp = 30;

  useEffect(() => {
    // Load all pets and get current pet
    const allStorePets = getAllPets();
    
    let legacyPet = getPet();
    
    // If no legacy pet exists and no store pets exist, create a default one
    if (!legacyPet && allStorePets.length === 0) {
      legacyPet = createPet('Your Pet');
    } else if (!legacyPet && allStorePets.length > 0) {
      // If legacy pet doesn't exist but store pets do, use the first one
      legacyPet = allStorePets[0];
    } else if (legacyPet) {
      // Update stats on page load for legacy pet
      legacyPet = updatePetStats();
      // Ensure pet has mood and customization
      if (!legacyPet.mood) {
        legacyPet.mood = getMoodFromStats(legacyPet);
      }
      if (!legacyPet.color) {
        legacyPet.color = 'default';
      }
      if (!legacyPet.skin) {
        legacyPet.skin = 'default';
      }
    }
    
    // Combine all pets (legacy FIRST as default, then store pets)
    let allPetsToShow: Pet[] = [legacyPet];
    
    // Add store pets (skip if they have the same ID as legacy pet)
    allStorePets.forEach(storePet => {
      if (storePet.id !== legacyPet!.id) {
        allPetsToShow.push(storePet);
      }
    });
    
    setOwnedPets(allPetsToShow);
    
    const currentId = getCurrentPetId();
    setCurrentPetIdState(currentId);
    
    let currentPet: Pet | null = null;
    
    // If we have a current pet ID from store, use it; otherwise use legacy
    if (currentId && allStorePets.some(p => p.id === currentId)) {
      currentPet = allStorePets.find(p => p.id === currentId) || legacyPet;
    } else {
      currentPet = legacyPet;
    }
    
    setPet(currentPet);
    setNewName(currentPet?.name || '');
    setGems(getGems());
    setXp(getXp());
    setLoading(false);
  }, []);

  useEffect(() => {
    // Listen for pet restoration on login
    const handlePetsRestored = () => {
      const allStorePets = getAllPets();
      let legacyPet = getPet();
      
      if (!legacyPet) {
        legacyPet = createPet('Your Pet');
      } else {
        legacyPet = updatePetStats();
        if (!legacyPet.mood) {
          legacyPet.mood = getMoodFromStats(legacyPet);
        }
        if (!legacyPet.color) {
          legacyPet.color = 'default';
        }
        if (!legacyPet.skin) {
          legacyPet.skin = 'default';
        }
      }
      
      let allPetsToShow: Pet[] = [legacyPet];
      allStorePets.forEach(storePet => {
        if (storePet.id !== legacyPet!.id) {
          allPetsToShow.push(storePet);
        }
      });
      
      setOwnedPets(allPetsToShow);
      
      const currentId = getCurrentPetId();
      setCurrentPetIdState(currentId);
      
      let currentPet: Pet | null = null;
      if (currentId && allStorePets.some(p => p.id === currentId)) {
        currentPet = allStorePets.find(p => p.id === currentId) || legacyPet;
      } else {
        currentPet = legacyPet;
      }
      
      setPet(currentPet);
      setNewName(currentPet?.name || '');
      setGems(getGems());
      setXp(getXp());
    };

    // Listen for pet clearing on logout
    const handlePetsCleared = () => {
      setPet(null);
      setOwnedPets([]);
      setCurrentPetIdState(null);
      setNewName('');
    };

    window.addEventListener('pets:restored', handlePetsRestored as EventListener);
    window.addEventListener('pets:cleared', handlePetsCleared as EventListener);

    return () => {
      window.removeEventListener('pets:restored', handlePetsRestored as EventListener);
      window.removeEventListener('pets:cleared', handlePetsCleared as EventListener);
    };
  }, []);

  // Helper to reload current pet from storage to get latest state
  const reloadCurrentPet = (petId: string) => {
    const allPets = getAllPets();
    
    const petToLoad = allPets.find(p => p.id === petId);
    if (petToLoad) {
      setPet(petToLoad);
      setNewName(petToLoad.name);
      setGems(getGems());
      setXp(getXp());
      return petToLoad;
    }
    
    // If not found in allPets, try getPet (legacy)
    const legacyPet = getPet();
    if (legacyPet && legacyPet.id === petId) {
      setPet(legacyPet);
      setNewName(legacyPet.name);
      setGems(getGems());
      setXp(getXp());
      return legacyPet;
    }
    
    return null;
  };

  const handleFeed = (method: 'gems' | 'xp') => {
    if (method === 'gems' && gems < feedCostGems) {
      showToast('Not enough gems! You need 5 gems to feed your pet.', 'error');
      return;
    }
    if (method === 'xp' && xp < feedCostXp) {
      showToast('Not enough XP! You need 30 XP to feed your pet.', 'error');
      return;
    }

    const updatedPet = feedPet(method);
    if (updatedPet) {
      setPet(updatedPet);
      setGems(getGems());
      setXp(getXp());
    }
  };

  const handleRename = () => {
    if (newName.trim() && pet) {
      const updated = renamePet(newName.trim());
      if (updated) {
        setPet(updated);
        setIsRenamingMode(false);
      }
    }
  };

  const handleChangeColor = (color: PetColor) => {
    const updated = changePetColor(color);
    if (updated) {
      setPet(updated);
      setShowColorPicker(false);
    }
  };

  const handleChangeSkin = (skin: PetSkin) => {
    const updated = changePetSkin(skin);
    if (updated) {
      setPet(updated);
      setShowSkinPicker(false);
    }
  };

  const handleResetPet = () => {
    if (window.confirm('Are you sure? This will reset your pet to an egg.')) {
      if (pet) {
        // Reset the current pet to egg state
        pet.stage = 'egg';
        pet.level = 1;
        pet.experience = 0;
        pet.health = 50;
        pet.hunger = 30;
        pet.happiness = 80;
        
        // Save the reset pet
        const updated = updatePetStats(); // This will call savePet internally
        if (updated) {
          setPet(updated);
          setOwnedPets(prevPets => 
            prevPets.map(p => p.id === updated.id ? updated : p)
          );
        }
      }
    }
  };

  if (loading || !pet) {
    return (
      <div className="container" style={{ padding: '24px', textAlign: 'center' }}>
        <p>Loading your pet...</p>
      </div>
    );
  }

  const xpToNextLevel = getXpToNextLevel(pet.level);
  const xpProgress = xpToNextLevel > 0 ? (pet.experience / xpToNextLevel) * 100 : 100;
  const hungerColor = pet.hunger < 30 ? '#22c55e' : pet.hunger < 70 ? '#eab308' : '#ef4444';
  const happinessColor = pet.happiness > 70 ? '#22c55e' : pet.happiness > 40 ? '#eab308' : '#ef4444';
  const healthColor = pet.health > 70 ? '#22c55e' : pet.health > 40 ? '#eab308' : '#ef4444';

  const moodEmojis = {
    happy: '😄',
    content: '😊',
    neutral: '😐',
    sad: '😢',
    excited: '🤩',
  };

  return (
    <div className="container">
      <div style={{ maxWidth: 700, margin: '24px auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: 8 }}>Your Pet</h1>
          <p style={{ color: 'var(--muted)', marginBottom: 0 }}>
            Care, customize, and grow your companion
          </p>
        </div>

        {/* Pet Switcher */}
        {ownedPets.length > 0 && (
          <div className="panel" style={{ padding: 16, marginBottom: 24 }}>
            <div style={{ marginBottom: 12 }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--muted)' }}>YOUR PETS ({ownedPets.length})</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', gap: 8 }}>
                {ownedPets.map(p => {
                  const isSelected = pet?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        // Set current pet in localStorage
                        setCurrentPet(p.id);
                        setCurrentPetIdState(p.id);
                        // Reload the pet from storage to get current state
                        reloadCurrentPet(p.id);
                      }}
                      style={{
                        padding: '8px',
                        borderRadius: 6,
                        border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                        background: isSelected ? 'rgba(167, 139, 250, 0.2)' : 'var(--bg)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: '0.85rem',
                        color: 'var(--text)',
                        fontWeight: isSelected ? 'bold' : 'normal'
                      }}
                    >
                      <div style={{ fontSize: '1.5rem' }}>{getPetEmoji(p.stage, p.color || 'default', p.emoji)}</div>
                      <div>{p.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Pet Display & Mood */}
        <div className="panel" style={{ padding: 40, textAlign: 'center', marginBottom: 24, background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(90, 208, 168, 0.1) 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ fontSize: '5rem', animation: 'pulse 2s infinite' }}>
              {getPetEmoji(pet.stage, pet.color || 'default', pet.emoji)}
            </div>
          </div>

          {/* Pet Name & Rename */}
          <div style={{ marginBottom: 16 }}>
            {isRenamingMode ? (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <input
                  type="text"
                  className="input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                  autoFocus
                  style={{ maxWidth: 200 }}
                />
                <button className="btn primary" onClick={handleRename} style={{ padding: '6px 12px' }}>
                  Save
                </button>
                <button className="btn ghost" onClick={() => { setIsRenamingMode(false); setNewName(pet.name); }} style={{ padding: '6px 12px' }}>
                  Cancel
                </button>
              </div>
            ) : (
              <h2 style={{ fontSize: '1.8rem', marginBottom: 8, cursor: 'pointer' }} onClick={() => { setIsRenamingMode(true); setNewName(pet.name); }}>
                {pet.name}
              </h2>
            )}
          </div>

          <p style={{ color: 'var(--muted)', marginBottom: 8 }}>
            Level <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{pet.level}</span> {pet.stage.charAt(0).toUpperCase() + pet.stage.slice(1)}
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            Mood: <span style={{ fontWeight: 'bold' }}>{(pet.mood || 'neutral').charAt(0).toUpperCase() + (pet.mood || 'neutral').slice(1)}</span> {moodEmojis[pet.mood || 'neutral']}
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
            Fed <span style={{ fontWeight: 'bold' }}>{pet.timesFeeding}</span> times • Skin: <span style={{ fontWeight: 'bold' }}>{PET_SKINS[pet.skin || 'default']?.name || 'Default'}</span>
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
          {/* Hunger */}
          <div className="panel" style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>🍖</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 4 }}>Hunger</div>
            <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginBottom: 4 }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.max(0, 100 - pet.hunger)}%`,
                  background: hungerColor,
                  borderRadius: 2,
                  transition: 'width 0.3s',
                }}
              />
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: hungerColor }}>
              {Math.round(100 - pet.hunger)}%
            </div>
          </div>

          {/* Happiness */}
          <div className="panel" style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>😊</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 4 }}>Happiness</div>
            <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginBottom: 4 }}>
              <div
                style={{
                  height: '100%',
                  width: `${pet.happiness}%`,
                  background: happinessColor,
                  borderRadius: 2,
                  transition: 'width 0.3s',
                }}
              />
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: happinessColor }}>
              {pet.happiness}%
            </div>
          </div>

          {/* Health */}
          <div className="panel" style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>💚</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 4 }}>Health</div>
            <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginBottom: 4 }}>
              <div
                style={{
                  height: '100%',
                  width: `${pet.health}%`,
                  background: healthColor,
                  borderRadius: 2,
                  transition: 'width 0.3s',
                }}
              />
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: healthColor }}>
              {pet.health}%
            </div>
          </div>
        </div>

        {/* XP Progress */}
        <div className="panel" style={{ padding: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem' }}>
            <span>Experience</span>
            <span style={{ color: 'var(--muted)' }}>
              {pet.experience} / {xpToNextLevel} XP
            </span>
          </div>
          <div style={{ height: 8, background: 'var(--border)', borderRadius: 4 }}>
            <div
              style={{
                height: '100%',
                width: `${xpProgress}%`,
                background: 'linear-gradient(90deg, #6366f1, #5ad0a8)',
                borderRadius: 4,
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>

        {/* Feed Button */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => handleFeed('gems')}
            disabled={gems < feedCostGems}
            className="btn primary"
            style={{
              padding: '14px',
              opacity: gems < feedCostGems ? 0.5 : 1,
              cursor: gems < feedCostGems ? 'not-allowed' : 'pointer',
              textAlign: 'center',
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Feed with Gems</div>
            <div style={{ fontSize: '0.85rem', color: 'inherit', opacity: 0.9 }}>
              💎 {feedCostGems} (have {gems})
            </div>
          </button>

          <button
            onClick={() => handleFeed('xp')}
            disabled={xp < feedCostXp}
            className="btn primary"
            style={{
              padding: '14px',
              opacity: xp < feedCostXp ? 0.5 : 1,
              cursor: xp < feedCostXp ? 'not-allowed' : 'pointer',
              textAlign: 'center',
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Feed with XP</div>
            <div style={{ fontSize: '0.85rem', color: 'inherit', opacity: 0.9 }}>
              ⭐ {feedCostXp} (have {xp})
            </div>
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: 12,
          marginBottom: 24,
          borderBottom: '1px solid var(--border)',
          overflowX: 'auto',
          paddingBottom: 0,
        }}>
          {[
            { id: 'overview', label: '📊 Overview', icon: '📊' },
            { id: 'abilities', label: '⚡ Abilities', icon: '⚡' },
            { id: 'quests', label: '🗺️ Quests', icon: '🗺️' },
            { id: 'stats', label: '📈 Stats', icon: '📈' },
            { id: 'evolution', label: '🔮 Evolution', icon: '🔮' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              style={{
                padding: '12px 16px',
                background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--muted)',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ marginBottom: 24 }}>
          {activeTab === 'overview' && <PetOverview pet={pet} onUpdate={() => {
            reloadCurrentPet(pet?.id || '');
          }} />}
          {activeTab === 'abilities' && <PetAbilities pet={pet} onUpdate={() => {
            reloadCurrentPet(pet?.id || '');
          }} />}
          {activeTab === 'quests' && <PetQuests pet={pet} onUpdate={() => {
            reloadCurrentPet(pet?.id || '');
          }} />}
          {activeTab === 'stats' && <PetStats pet={pet} />}
          {activeTab === 'evolution' && <PetEvolution pet={pet} />}
        </div>

        {/* Old Customization Section - Hidden but kept for reference */}
        <div className="panel" style={{ padding: 20, marginBottom: 24, display: 'none' }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>🎨 Customize Your Pet</h3>

          {/* Color Picker */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: 8 }}>Pet Color</div>
            {showColorPicker ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {(Object.entries(PET_COLORS) as Array<[PetColor, any]>).map(([color, data]) => (
                  <button
                    key={color}
                    onClick={() => handleChangeColor(color)}
                    className="btn ghost"
                    style={{
                      padding: '12px',
                      border: pet.color === color ? '2px solid var(--accent)' : '2px solid transparent',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <div style={{ fontSize: '1.5rem' }}>{data.emoji}</div>
                    <div style={{ fontSize: '0.75rem' }}>{data.name}</div>
                  </button>
                ))}
              </div>
            ) : (
              <button className="btn ghost" onClick={() => setShowColorPicker(true)} style={{ width: '100%' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{getPetEmoji(pet.stage, pet.color || 'default', pet.emoji)}</div>
                <div>{PET_COLORS[pet.color || 'default']?.name || 'Default'}</div>
              </button>
            )}
          </div>

          {/* Skin Picker */}
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: 8 }}>Pet Skin</div>
            {showSkinPicker ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(Object.entries(PET_SKINS) as Array<[PetSkin, any]>).map(([skin, data]) => (
                  <button
                    key={skin}
                    onClick={() => handleChangeSkin(skin)}
                    className="btn ghost"
                    style={{
                      padding: '12px',
                      border: pet.skin === skin ? '2px solid var(--accent)' : '2px solid transparent',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: 2 }}>{data.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{data.description}</div>
                  </button>
                ))}
              </div>
            ) : (
              <button className="btn ghost" onClick={() => setShowSkinPicker(true)} style={{ width: '100%', textAlign: 'left' }}>
                <div style={{ fontWeight: 'bold', marginBottom: 2 }}>{PET_SKINS[pet.skin || 'default']?.name || 'Default'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{PET_SKINS[pet.skin || 'default']?.description || 'Classic pet'}</div>
              </button>
            )}
          </div>
        </div>

        {/* Pet Info */}
        <div className="panel" style={{ padding: 16, marginBottom: 24 }}>
          <h3 style={{ marginTop: 0 }}>💡 Pet Care Tips</h3>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.9rem', lineHeight: '1.6' }}>
            <li>Feed your pet regularly to keep it happy and healthy</li>
            <li>Choose between gems or XP to feed your pet (both work!)</li>
            <li>Your pet gains XP whenever you feed it, helping it grow</li>
            <li>Each pet stage unlocks at specific levels: Baby (2), Teen (3), Adult (4), Legendary (5+)</li>
            <li>Customize your pet's color and skin to make it unique!</li>
            <li>Pet mood depends on hunger, happiness, and health</li>
          </ul>
        </div>

        {/* Reset Button (small, at bottom) */}
        <button
          onClick={handleResetPet}
          className="btn ghost"
          style={{
            width: '100%',
            padding: '8px',
            fontSize: '0.85rem',
            color: 'var(--muted)',
          }}
        >
          Reset Pet
        </button>
      </div>
    </div>
  );
};

export default PetPage;
