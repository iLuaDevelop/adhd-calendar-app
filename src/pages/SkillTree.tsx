import { useState, useEffect } from 'react';
import { 
  getAllSkills, 
  getSkillsByTree, 
  purchaseSkill, 
  canUnlockSkill, 
  Skill, 
  SkillTree,
  isSkillPurchased,
  SKILLS
} from '../services/skillTree';
import { getXp } from '../services/xp';
import { getGems } from '../services/currency';
import { useToast } from '../context/ToastContext';

export default function SkillTreePage() {
  const { showToast } = useToast();
  const [activeTree, setActiveTree] = useState<SkillTree>('forgiveness');
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [currentXp, setCurrentXp] = useState(0);
  const [currentGems, setCurrentGems] = useState(0);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  useEffect(() => {
    refreshSkills();
  }, []);

  const refreshSkills = () => {
    setAllSkills(getAllSkills());
    setCurrentXp(getXp());
    setCurrentGems(getGems());
  };

  const handlePurchaseSkill = (skillId: string) => {
    const skill = SKILLS[skillId];
    if (!skill) return;

    // Check if already purchased
    if (isSkillPurchased(skillId)) {
      showToast('Skill already purchased!', 'warning');
      return;
    }

    // Check prerequisites
    if (!canUnlockSkill(skillId)) {
      const skill = SKILLS[skillId];
      showToast(`Prerequisites not met! You need to purchase prerequisite skills first.`, 'warning');
      return;
    }

    // Check cost
    const hasEnoughCost = 
      (skill.costType === 'xp' && currentXp >= skill.cost) ||
      (skill.costType === 'gems' && currentGems >= skill.cost);

    if (!hasEnoughCost) {
      showToast(`Not enough ${skill.costType.toUpperCase()} to purchase this skill!`, 'error');
      return;
    }

    // Purchase skill
    if (purchaseSkill(skillId)) {
      refreshSkills();
      setSelectedSkill(null);
    }
  };

  const skillsByTree = getSkillsByTree(activeTree);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>Skill Tree</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Unlock powerful skills to enhance your productivity and pet care
        </p>

        {/* Currency Display */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <span style={{ fontSize: '1.25rem' }}>⭐</span>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>XP Available</div>
              <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>{currentXp}</div>
            </div>
          </div>

          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <span style={{ fontSize: '1.25rem' }}>💎</span>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Gems Available</div>
              <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>{currentGems}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tree Selection Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
        <button
          onClick={() => setActiveTree('forgiveness')}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            backgroundColor: activeTree === 'forgiveness' ? '#3B82F6' : 'var(--panel)',
            color: activeTree === 'forgiveness' ? 'white' : 'var(--text)',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: activeTree === 'forgiveness' ? 'bold' : 'normal',
            transition: 'all 0.2s ease',
          }}
        >
          🤝 Forgiveness Tree
        </button>

        <button
          onClick={() => setActiveTree('xp_mastery')}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            backgroundColor: activeTree === 'xp_mastery' ? '#F59E0B' : 'var(--panel)',
            color: activeTree === 'xp_mastery' ? 'white' : 'var(--text)',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: activeTree === 'xp_mastery' ? 'bold' : 'normal',
            transition: 'all 0.2s ease',
          }}
        >
          🔥 XP Mastery
        </button>

        <button
          onClick={() => setActiveTree('pet_power')}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            backgroundColor: activeTree === 'pet_power' ? '#10B981' : 'var(--panel)',
            color: activeTree === 'pet_power' ? 'white' : 'var(--text)',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: activeTree === 'pet_power' ? 'bold' : 'normal',
            transition: 'all 0.2s ease',
          }}
        >
          🐾 Pet Power
        </button>
      </div>

      {/* Skills Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
        {skillsByTree.map(skill => {
          const isPurchased = skill.purchased;
          const canPurchase = canUnlockSkill(skill.id) && 
            ((skill.costType === 'xp' && currentXp >= skill.cost) ||
             (skill.costType === 'gems' && currentGems >= skill.cost));

          return (
            <div
              key={skill.id}
              onClick={() => setSelectedSkill(skill)}
              style={{
                padding: '1rem',
                backgroundColor: isPurchased ? 'var(--primary)10' : 'var(--panel)',
                border: isPurchased ? '2px solid var(--primary)' : '1px solid var(--border)',
                borderRadius: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                opacity: isPurchased ? 1 : 0.8,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {isPurchased && (
                <div style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  fontSize: '1.5rem',
                }}>
                  ✅
                </div>
              )}

              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                {skill.icon}
              </div>

              <h3 style={{ marginBottom: '0.25rem', fontSize: '0.95rem', fontWeight: 'bold' }}>
                {skill.name}
              </h3>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                {skill.description}
              </p>

              {/* Cost Display */}
              <div style={{
                padding: '0.5rem',
                backgroundColor: 'var(--background)',
                borderRadius: '0.5rem',
                marginBottom: '0.75rem',
                fontSize: '0.8rem',
                fontWeight: 'bold',
              }}>
                {skill.costType === 'xp' ? '⭐' : '💎'} {skill.cost} {skill.costType.toUpperCase()}
              </div>

              {/* Level Indicator */}
              {skill.level > 1 && (
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '0.5rem',
                }}>
                  Level {skill.level} Skill
                </div>
              )}

              {/* Prerequisites */}
              {skill.prerequisites && skill.prerequisites.length > 0 && !isPurchased && (
                <div style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '0.5rem',
                  padding: '0.4rem',
                  backgroundColor: 'var(--background)',
                  borderRadius: '0.25rem',
                }}>
                  Requires: {skill.prerequisites.map(id => SKILLS[id]?.name).join(', ')}
                </div>
              )}

              <div style={{ flex: 1 }} />

              {/* Purchase Button */}
              {!isPurchased && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePurchaseSkill(skill.id);
                  }}
                  disabled={!canPurchase}
                  style={{
                    width: '100%',
                    marginTop: '0.75rem',
                    padding: '0.6rem',
                    backgroundColor: canPurchase ? 'var(--primary)' : '#666',
                    color: 'white',
                    border: canPurchase ? '2px solid var(--primary)' : '2px solid #666',
                    borderRadius: '0.5rem',
                    cursor: canPurchase ? 'pointer' : 'not-allowed',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    opacity: canPurchase ? 1 : 0.6,
                    transition: 'all 0.2s ease',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                  onMouseEnter={(e) => {
                    if (canPurchase) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (canPurchase) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {!canUnlockSkill(skill.id) ? 'Locked' : 'Unlock'}
                </button>
              )}

              {isPurchased && (
                <div style={{
                  width: '100%',
                  marginTop: '0.75rem',
                  padding: '0.6rem',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  fontSize: '0.85rem',
                }}>
                  Unlocked
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Skill Detail Modal */}
      {selectedSkill && (
        <div
          onClick={() => setSelectedSkill(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--panel)',
              border: '1px solid var(--border)',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem' }}>{selectedSkill.icon}</div>
              <div>
                <h2 style={{ marginBottom: '0.25rem', fontSize: '1.5rem' }}>
                  {selectedSkill.name}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {selectedSkill.tree.replace('_', ' ')} Tree
                </p>
              </div>
            </div>

            <p style={{ marginBottom: '1.5rem', fontSize: '1rem', lineHeight: '1.6' }}>
              {selectedSkill.description}
            </p>

            {/* Effects */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '0.75rem', fontWeight: 'bold' }}>Effects:</h3>
              <ul style={{ marginLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                {selectedSkill.effects.map((effect, i) => (
                  <li key={i} style={{ marginBottom: '0.5rem' }}>
                    {effect}
                  </li>
                ))}
              </ul>
            </div>

            {/* Cost and Prerequisites */}
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--background)', borderRadius: '0.5rem' }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <strong>Cost:</strong> {selectedSkill.costType === 'xp' ? '⭐' : '💎'} {selectedSkill.cost} {selectedSkill.costType.toUpperCase()}
              </div>
              {selectedSkill.prerequisites && selectedSkill.prerequisites.length > 0 && (
                <div>
                  <strong>Prerequisites:</strong>
                  <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                    {selectedSkill.prerequisites.map(id => {
                      const prereq = SKILLS[id];
                      const isPurchased = isSkillPurchased(id);
                      return (
                        <li key={id} style={{ color: isPurchased ? 'var(--primary)' : 'var(--text-secondary)' }}>
                          {isPurchased ? '✅' : '⬜'} {prereq?.name}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              {!isSkillPurchased(selectedSkill.id) && (
                <button
                  onClick={() => {
                    handlePurchaseSkill(selectedSkill.id);
                  }}
                  disabled={!canUnlockSkill(selectedSkill.id) || 
                    ((selectedSkill.costType === 'xp' && currentXp < selectedSkill.cost) ||
                     (selectedSkill.costType === 'gems' && currentGems < selectedSkill.cost))}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    backgroundColor: (canUnlockSkill(selectedSkill.id) && 
                      ((selectedSkill.costType === 'xp' && currentXp >= selectedSkill.cost) ||
                       (selectedSkill.costType === 'gems' && currentGems >= selectedSkill.cost))) ? 'var(--primary)' : 'var(--text-secondary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    opacity: (canUnlockSkill(selectedSkill.id) && 
                      ((selectedSkill.costType === 'xp' && currentXp >= selectedSkill.cost) ||
                       (selectedSkill.costType === 'gems' && currentGems >= selectedSkill.cost))) ? 1 : 0.5,
                  }}
                >
                  {!canUnlockSkill(selectedSkill.id) ? 'Prerequisites Not Met' : 'Unlock Skill'}
                </button>
              )}
              <button
                onClick={() => setSelectedSkill(null)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  backgroundColor: 'var(--panel)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
