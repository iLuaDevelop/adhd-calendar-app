import React, { useState, useEffect } from 'react';
import { getXp, setXp, resetXp, grantXp } from '../../services/xp';
import { getGems, setGems, addGems } from '../../services/currency';
import { getPet, updatePetStats, feedPet, getAllPets, deletePet, createPet } from '../../services/pet';
import { unlockSkill, getAllSkills, getUnlockedSkills } from '../../services/skillTree';
import { unlockTitle, setSelectedTitle, getUnlockedTitles, getSelectedTitle, getTitles, ALL_TITLES } from '../../services/titles';
import { enableCriticalTestMode, disableCriticalTestMode, isCriticalTestModeEnabled, getCriticalChances, enableCrateTestMode, disableCrateTestMode, isCrateTestModeEnabled } from '../../services/critical';

const QUESTS_KEY = 'adhd_quests';

const DevMenuModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [passwordPrompt, setPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [criticalTestMode, setCriticalTestMode] = useState(isCriticalTestModeEnabled());
  const [crateTestMode, setCrateTestMode] = useState(isCrateTestModeEnabled());
  const [criticalChances, setCriticalChances] = useState(getCriticalChances());
  const [selectedTitle, setSelectedTitleState] = useState(() => getSelectedTitle());
  const [unlockedTitles, setUnlockedTitles] = useState(() => getUnlockedTitles());

  const BRONZE_CRATE_KEY = 'adhd_bronze_crate_last_opened';

  useEffect(() => {
    const handleDevMenuKeyCombo = () => {
      setPasswordPrompt(true);
      setPasswordInput('');
      setPasswordError('');
    };

    window.addEventListener('devMenuKeyCombo', handleDevMenuKeyCombo as EventListener);
    return () => window.removeEventListener('devMenuKeyCombo', handleDevMenuKeyCombo as EventListener);
  }, []);

  const handlePassword = () => {
    if (passwordInput === 'adhd123') {
      setIsOpen(true);
      setPasswordPrompt(false);
      setPasswordInput('');
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password');
      setPasswordInput('');
    }
  };

  if (!passwordPrompt && !isOpen) {
    return null;
  }

  if (passwordPrompt) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99998
      }}>
        <div className="panel" style={{maxWidth: 400, padding: 24, backgroundColor: 'var(--panel)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)'}}>
          <h2 style={{margin: '0 0 16px 0', textAlign: 'center'}}>Developer Menu</h2>
          <p style={{textAlign: 'center', color: 'var(--muted)', marginBottom: 16}}>Enter password to continue</p>
          <input
            type="password"
            className="input"
            placeholder="Password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePassword()}
            autoFocus
            style={{marginBottom: 12}}
          />
          {passwordError && (
            <div style={{color: '#ef4444', marginBottom: 12, fontSize: '0.9rem', textAlign: 'center'}}>
              {passwordError}
            </div>
          )}
          <div style={{display: 'flex', gap: 8}}>
            <button className="btn primary" onClick={handlePassword} style={{flex: 1}}>
              Unlock
            </button>
            <button className="btn ghost" onClick={() => { 
              setPasswordPrompt(false); 
              setPasswordInput(''); 
              setPasswordError(''); 
            }} style={{flex: 1}}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999
    }}>
      <div className="panel" style={{maxWidth: 500, maxHeight: '80vh', padding: 20, backgroundColor: 'var(--panel)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', userSelect: 'none', overflow: 'auto'}}>
        <h2 style={{margin: '0 0 12px 0', textAlign: 'center'}}>Development Menu</h2>
        <div style={{marginBottom: 16, fontSize: '0.9rem', color: 'var(--muted)'}}>
          <div>Current XP: {getXp()}</div>
        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
          {/* XP Controls */}
          <div style={{borderBottom: '1px solid var(--border)', paddingBottom: 12}}>
            <h3 style={{margin: '0 0 8px 0'}}>XP Controls</h3>
            <div style={{display: 'flex', gap: 8}}>
              <input
                type="number"
                className="input"
                placeholder="XP amount"
                id="devXpInput"
                style={{flex: 1}}
              />
              <button className="btn" onClick={() => {
                const input = (document.getElementById('devXpInput') as HTMLInputElement);
                const amount = parseInt(input.value) || 0;
                setXp(getXp() + amount);
                input.value = '';
              }}>Grant</button>
            </div>
            <button className="btn ghost" onClick={() => resetXp()} style={{marginTop: 8, width: '100%'}}>Reset XP</button>
          </div>

          {/* Gem Controls */}
          <div style={{borderBottom: '1px solid var(--border)', paddingBottom: 12}}>
            <h3 style={{margin: '0 0 8px 0'}}>Gem Controls</h3>
            <div style={{marginBottom: 8}}>
              <div style={{fontSize: '0.9rem', marginBottom: 8}}>Current Gems: <strong>{getGems()}</strong></div>
              <div style={{display: 'flex', gap: 8}}>
                <input
                  type="number"
                  className="input"
                  placeholder="Gem amount"
                  id="devGemInput"
                  style={{flex: 1}}
                />
                <button className="btn" onClick={() => {
                  const input = (document.getElementById('devGemInput') as HTMLInputElement);
                  const amount = parseInt(input.value);
                  if (!isNaN(amount) && amount > 0) {
                    addGems(amount);
                    input.value = '';
                    window.dispatchEvent(new Event('currencyUpdated'));
                  }
                }}>Add</button>
              </div>
            </div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8}}>
              <button className="btn ghost" onClick={() => {
                setGems(0);
                window.dispatchEvent(new Event('currencyUpdated'));
              }}>Set to 0</button>
              <button className="btn ghost" onClick={() => {
                setGems(1000);
                window.dispatchEvent(new Event('currencyUpdated'));
              }}>Set to 1000</button>
            </div>
          </div>

          {/* Skill Tree Controls */}
          <div style={{borderBottom: '1px solid var(--border)', paddingBottom: 12}}>
            <h3 style={{margin: '0 0 8px 0'}}>Skill Tree Controls</h3>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxHeight: 200, overflowY: 'auto'}}>
              {getAllSkills().map((skill) => (
                <button 
                  key={skill.id} 
                  className="btn ghost" 
                  onClick={() => unlockSkill(skill.id)}
                  style={{fontSize: '0.75rem', opacity: getUnlockedSkills().includes(skill.id) ? 1 : 0.5}}
                >
                  {getUnlockedSkills().includes(skill.id) ? '✓' : '✗'} {skill.name}
                </button>
              ))}
            </div>
          </div>

          {/* Pet Controls */}
          <div style={{borderBottom: '1px solid var(--border)', paddingBottom: 12}}>
            <h3 style={{margin: '0 0 8px 0'}}>Pet Controls</h3>
            <div style={{marginBottom: 12}}>
              <button className="btn ghost" onClick={() => {
                createPet('Your Pet');
                alert('Default pet created and synced to Firestore!');
              }} style={{fontSize: '0.8rem', width: '100%', marginBottom: 8}}>
                ✨ Create Default Pet
              </button>
            </div>
            <div style={{marginBottom: 12}}>
              <h4 style={{margin: '0 0 8px 0', fontSize: '0.8rem', color: 'var(--muted)'}}>Delete Pet</h4>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 6}}>
                {getAllPets().map(p => (
                  <button
                    key={p.id}
                    className="btn ghost"
                    onClick={() => {
                      if (window.confirm(`Delete ${p.name}?`)) {
                        deletePet(p.id);
                        alert(`${p.name} deleted!`);
                      }
                    }}
                    style={{fontSize: '0.7rem', padding: '4px 8px'}}
                  >
                    Delete {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Title Controls */}
          <div style={{borderBottom: '1px solid var(--border)', paddingBottom: 12}}>
            <h3 style={{margin: '0 0 8px 0'}}>Title Controls</h3>
            <div style={{marginBottom: 12}}>
              <button className="btn ghost" onClick={() => {
                unlockTitle('developer');
                alert('Developer title unlocked!');
              }} style={{fontSize: '0.8rem', width: '100%', marginBottom: 8}}>
                Unlock Developer Title
              </button>
              <button className="btn ghost" onClick={() => {
                setSelectedTitle('developer');
                alert('Developer title equipped!');
              }} style={{fontSize: '0.8rem', width: '100%'}}>
                Equip Developer Title
              </button>
            </div>
          </div>

          {/* Crate Timer Controls */}
          <div style={{borderBottom: '1px solid var(--border)', paddingBottom: 12}}>
            <h3 style={{margin: '0 0 8px 0'}}>Crate Timer Controls</h3>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8}}>
              <button className="btn ghost" onClick={() => {
                localStorage.setItem(BRONZE_CRATE_KEY, '0');
                alert('Bronze crate timer reset!');
              }} style={{fontSize: '0.8rem'}}>
                Reset Bronze Timer
              </button>
              <button className="btn ghost" onClick={() => {
                localStorage.setItem(BRONZE_CRATE_KEY, String(Date.now() - (12 * 60 * 60 * 1000)));
                alert('Bronze crate ready!');
              }} style={{fontSize: '0.8rem'}}>
                Bronze Ready Now
              </button>
            </div>
          </div>

          {/* Critical Hit Testing */}
          <div style={{borderBottom: '1px solid var(--border)', paddingBottom: 12}}>
            <h3 style={{margin: '0 0 8px 0'}}>Critical Hit Testing</h3>
            <div style={{marginBottom: 12, fontSize: '0.85rem', color: 'var(--muted)'}}>
              <div>2x XP Chance: <strong>{criticalChances.criticalHitChance}%</strong></div>
              <div>Crate Chance: <strong>{criticalChances.crateRewardChance}%</strong></div>
            </div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8}}>
              <button 
                className={`btn ${criticalTestMode ? 'primary' : 'ghost'}`}
                onClick={() => {
                  enableCriticalTestMode();
                  setCriticalTestMode(true);
                  setCriticalChances(getCriticalChances());
                  alert('Critical test mode enabled (100% chance)!');
                }} 
                style={{fontSize: '0.8rem'}}
              >
                {criticalTestMode ? '✓ ' : ''}Max Critical (100%)
              </button>
              <button 
                className="btn ghost"
                onClick={() => {
                  disableCriticalTestMode();
                  setCriticalTestMode(false);
                  setCriticalChances(getCriticalChances());
                  alert('Critical test mode disabled (normal chances)!');
                }} 
                style={{fontSize: '0.8rem'}}
              >
                Reset Critical
              </button>
            </div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8}}>
              <button 
                className={`btn ${crateTestMode ? 'primary' : 'ghost'}`}
                onClick={() => {
                  enableCrateTestMode();
                  setCrateTestMode(true);
                  setCriticalChances(getCriticalChances());
                  alert('Crate test mode enabled (100% chance)!');
                }} 
                style={{fontSize: '0.8rem'}}
              >
                {crateTestMode ? '✓ ' : ''}Max Crate (100%)
              </button>
              <button 
                className="btn ghost"
                onClick={() => {
                  disableCrateTestMode();
                  setCrateTestMode(false);
                  setCriticalChances(getCriticalChances());
                  alert('Crate test mode disabled (normal chances)!');
                }} 
                style={{fontSize: '0.8rem'}}
              >
                Reset Crate
              </button>
            </div>
            <button 
              className="btn ghost"
              onClick={() => {
                grantXp(10);
                alert('Granted 10 XP - check for critical!');
              }} 
              style={{fontSize: '0.8rem', width: '100%'}}
            >
              Test Grant 10 XP
            </button>
          </div>

          {/* Purchase Controls */}
          <div style={{borderBottom: '1px solid var(--border)', paddingBottom: 12}}>
            <h3 style={{margin: '0 0 8px 0'}}>Purchases</h3>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8}}>
              <button className="btn ghost" onClick={() => {
                const purchases = new Set(JSON.parse(localStorage.getItem('adhd_purchases') || '[]'));
                if (purchases.has(1)) purchases.delete(1);
                else purchases.add(1);
                localStorage.setItem('adhd_purchases', JSON.stringify(Array.from(purchases)));
                window.dispatchEvent(new Event('purchasesUpdated'));
              }} style={{fontSize: '0.8rem', opacity: (() => {
                const purchases = new Set(JSON.parse(localStorage.getItem('adhd_purchases') || '[]'));
                return purchases.has(1) ? 1 : 0.5;
              })()}}>
                ✓ Sunset Theme
              </button>
              <button className="btn ghost" onClick={() => {
                const purchases = new Set(JSON.parse(localStorage.getItem('adhd_purchases') || '[]'));
                if (purchases.has(2)) purchases.delete(2);
                else purchases.add(2);
                localStorage.setItem('adhd_purchases', JSON.stringify(Array.from(purchases)));
                window.dispatchEvent(new Event('purchasesUpdated'));
              }} style={{fontSize: '0.8rem', opacity: (() => {
                const purchases = new Set(JSON.parse(localStorage.getItem('adhd_purchases') || '[]'));
                return purchases.has(2) ? 1 : 0.5;
              })()}}>
                ✓ Ocean Theme
              </button>
              <button className="btn ghost" onClick={() => {
                const purchases = new Set(JSON.parse(localStorage.getItem('adhd_purchases') || '[]'));
                if (purchases.has(3)) purchases.delete(3);
                else purchases.add(3);
                localStorage.setItem('adhd_purchases', JSON.stringify(Array.from(purchases)));
                window.dispatchEvent(new Event('purchasesUpdated'));
              }} style={{fontSize: '0.8rem', opacity: (() => {
                const purchases = new Set(JSON.parse(localStorage.getItem('adhd_purchases') || '[]'));
                return purchases.has(3) ? 1 : 0.5;
              })()}}>
                ✓ Avatar Border
              </button>
              <button className="btn ghost" onClick={() => {
                const purchases = new Set(JSON.parse(localStorage.getItem('adhd_purchases') || '[]'));
                if (purchases.has(4)) purchases.delete(4);
                else purchases.add(4);
                localStorage.setItem('adhd_purchases', JSON.stringify(Array.from(purchases)));
                window.dispatchEvent(new Event('purchasesUpdated'));
              }} style={{fontSize: '0.8rem', opacity: (() => {
                const purchases = new Set(JSON.parse(localStorage.getItem('adhd_purchases') || '[]'));
                return purchases.has(4) ? 1 : 0.5;
              })()}}>
                ✓ Extra Slots
              </button>
              <button className="btn ghost" onClick={() => {
                const purchases = new Set(JSON.parse(localStorage.getItem('adhd_purchases') || '[]'));
                if (purchases.has(5)) purchases.delete(5);
                else purchases.add(5);
                localStorage.setItem('adhd_purchases', JSON.stringify(Array.from(purchases)));
                window.dispatchEvent(new Event('purchasesUpdated'));
              }} style={{fontSize: '0.8rem', opacity: (() => {
                const purchases = new Set(JSON.parse(localStorage.getItem('adhd_purchases') || '[]'));
                return purchases.has(5) ? 1 : 0.5;
              })()}}>
                ✓ Custom Avatar
              </button>
            </div>
          </div>

          {/* Social Testing */}
          <div style={{borderBottom: '1px solid var(--border)', paddingBottom: 12}}>
            <h3 style={{margin: '0 0 8px 0'}}>Social Testing</h3>
            <button className="btn ghost" onClick={() => {
              const friends = JSON.parse(localStorage.getItem('adhd_friends') || '[]');
              const testBot = { id: 'bot-9999', username: 'TestBot', discriminator: '9999', avatar: '🤖' };
              if (!friends.find((f: any) => f.id === testBot.id)) {
                friends.push(testBot);
                localStorage.setItem('adhd_friends', JSON.stringify(friends));
                window.dispatchEvent(new Event('friendsUpdated'));
                alert('Test friend added!');
              } else {
                alert('Test friend already exists!');
              }
            }} style={{width: '100%', fontSize: '0.8rem'}}>
              Add Test Friend (TestBot#9999)
            </button>
          </div>

          {/* Pet Controls */}
          <div style={{borderBottom: '1px solid var(--border)', paddingBottom: 12}}>
            <h3 style={{margin: '0 0 8px 0'}}>Pet Controls</h3>
            <button className="btn ghost" onClick={() => {
              createPet('Your Pet');
              alert('Default pet created and synced to Firestore!');
            }} style={{fontSize: '0.8rem', width: '100%', marginBottom: 8}}>
              ✨ Create Default Pet
            </button>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12}}>
              <button className="btn ghost" onClick={() => {
                const pet = getPet();
                if (pet) {
                  pet.hunger = 0;
                  const updatedPet = feedPet('gems');
                  if (updatedPet) {
                    window.dispatchEvent(new CustomEvent('petUpdated', { detail: { pet: updatedPet } }));
                    alert('Pet fed!');
                  }
                }
              }} style={{fontSize: '0.8rem'}}>
                Feed Pet
              </button>
              <button className="btn ghost" onClick={() => {
                const pet = getPet();
                if (pet) {
                  pet.happiness = 100;
                  const updatedPet = updatePetStats();
                  if (updatedPet) {
                    window.dispatchEvent(new CustomEvent('petUpdated', { detail: { pet: updatedPet } }));
                    alert('Happiness maxed!');
                  }
                }
              }} style={{fontSize: '0.8rem'}}>
                Max Happiness
              </button>
              <button className="btn ghost" onClick={() => {
                const pet = getPet();
                if (pet) {
                  pet.health = 100;
                  const updatedPet = updatePetStats();
                  if (updatedPet) {
                    window.dispatchEvent(new CustomEvent('petUpdated', { detail: { pet: updatedPet } }));
                    alert('Health maxed!');
                  }
                }
              }} style={{fontSize: '0.8rem'}}>
                Max Health
              </button>
              <button className="btn ghost" onClick={() => {
                const pet = getPet();
                if (pet) {
                  pet.level = Math.min(pet.level + 1, 10);
                  const updatedPet = updatePetStats();
                  if (updatedPet) {
                    window.dispatchEvent(new CustomEvent('petUpdated', { detail: { pet: updatedPet } }));
                    alert('Level increased!');
                  }
                }
              }} style={{fontSize: '0.8rem'}}>
                +1 Level
              </button>
            </div>
            <button className="btn ghost" onClick={() => {
              const pet = getPet();
              if (pet) {
                deletePet(pet.id);
                alert('Pet deleted!');
              }
            }} style={{fontSize: '0.8rem', width: '100%'}}>
              Delete Current Pet
            </button>
          </div>

          {/* Quest Controls */}
          <div style={{borderBottom: '1px solid var(--border)', paddingBottom: 12}}>
            <h3 style={{margin: '0 0 8px 0'}}>Quest Controls</h3>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8}}>
              <button className="btn ghost" onClick={() => {
                const quests = JSON.parse(localStorage.getItem(QUESTS_KEY) || '[]');
                quests.forEach((q: any) => q.completed = false);
                localStorage.setItem(QUESTS_KEY, JSON.stringify(quests));
                window.dispatchEvent(new CustomEvent('questsReset'));
                alert('All quests reset!');
              }} style={{fontSize: '0.8rem'}}>
                Reset All Quests
              </button>
              <button className="btn ghost" onClick={() => {
                const quests = JSON.parse(localStorage.getItem(QUESTS_KEY) || '[]');
                quests.forEach((q: any) => q.completed = true);
                localStorage.setItem(QUESTS_KEY, JSON.stringify(quests));
                window.dispatchEvent(new CustomEvent('questsReset'));
                alert('All quests completed!');
              }} style={{fontSize: '0.8rem'}}>
                Complete All Quests
              </button>
              <button className="btn ghost" onClick={() => {
                const quests = JSON.parse(localStorage.getItem(QUESTS_KEY) || '[]');
                const quest = quests.find((q: any) => q.id === 1);
                if (quest) quest.progress = 5;
                localStorage.setItem(QUESTS_KEY, JSON.stringify(quests));
                window.dispatchEvent(new CustomEvent('questsReset'));
                alert('Task Master quest progressed!');
              }} style={{fontSize: '0.8rem'}}>
                +5 Tasks (Q1)
              </button>
              <button className="btn ghost" onClick={() => {
                const quests = JSON.parse(localStorage.getItem(QUESTS_KEY) || '[]');
                const quest = quests.find((q: any) => q.id === 4);
                if (quest) quest.progress = 7;
                localStorage.setItem(QUESTS_KEY, JSON.stringify(quests));
                window.dispatchEvent(new CustomEvent('questsReset'));
                alert('Streak Keeper quest progressed!');
              }} style={{fontSize: '0.8rem'}}>
                +7 Streak (Q4)
              </button>
              <button className="btn ghost" onClick={() => {
                const quests = JSON.parse(localStorage.getItem(QUESTS_KEY) || '[]');
                const quest = quests.find((q: any) => q.id === 5);
                if (quest) quest.progress = 5;
                localStorage.setItem(QUESTS_KEY, JSON.stringify(quests));
                window.dispatchEvent(new CustomEvent('questsReset'));
                alert('Level Up quest progressed!');
              }} style={{fontSize: '0.8rem'}}>
                +Level 5 (Q5)
              </button>
            </div>
          </div>

          {/* Close */}
          <button className="btn" onClick={() => setIsOpen(false)} style={{width: '100%'}}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default DevMenuModal;
