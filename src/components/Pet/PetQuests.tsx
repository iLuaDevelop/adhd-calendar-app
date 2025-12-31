import React, { useState, useEffect } from 'react';
import { Pet } from '../../services/pet';
import { QUEST_TEMPLATES, formatQuestTime, getQuestDifficultyColor, getQuestDifficultyEmoji, getQuestTimeRemaining, completeQuest } from '../../services/petQuests';
import { useToast } from '../../context/ToastContext';
import { addGems } from '../../services/currency';
import { grantXp } from '../../services/xp';

interface PetQuestsProps {
  pet: Pet | null;
  onUpdate?: () => void;
}

const PetQuests: React.FC<PetQuestsProps> = ({ pet, onUpdate }) => {
  const { showToast } = useToast();
  const [selectedQuest, setSelectedQuest] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<Record<string, number>>({});

  // Safe defaults for potentially undefined arrays
  const activeQuests = pet?.activeQuests || [];
  const questHistory = pet?.questHistory || [];

  // Update timer for active quests
  useEffect(() => {
    if (!pet || activeQuests.length === 0) return;

    const interval = setInterval(() => {
      const newTimes: Record<string, number> = {};
      activeQuests.forEach(quest => {
        const remaining = getQuestTimeRemaining(quest);
        if (remaining !== null) {
          newTimes[quest.id] = remaining;

          // Check if quest is complete
          if (remaining <= 0) {
            completeActiveQuest(quest.id);
          }
        }
      });
      setTimeRemaining(newTimes);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeQuests]);

  const completeActiveQuest = (questId: string) => {
    // This would update the pet state, but since we're in a component,
    // we'll just show a toast for now
    const quest = pet?.activeQuests.find(q => q.id === questId);
    if (quest) {
      const success = Math.random() > quest.riskFactor;
      if (success) {
        showToast(`Quest Complete: ${quest.name}! Rewards earned!`, 'success');
        // Award gems and XP would happen here in the service
      } else {
        showToast(`Quest Failed: ${quest.name}`, 'error');
      }
    }
  };

  if (!pet) return null;

  const availableQuests = Object.values(QUEST_TEMPLATES);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Quest Overview */}
      <div style={{ padding: 16, background: 'rgba(180, 83, 9, 0.15)', borderRadius: 8, border: '1px solid rgba(180, 83, 9, 0.3)' }}>
        <h3 style={{ fontWeight: 600, color: '#fff', marginBottom: 16 }}>📜 Quest Overview</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, fontSize: '0.875rem' }}>
          <div>
            <p style={{ color: '#9ca3af', margin: 0 }}>Active Quests</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fb923c', margin: '4px 0 0 0' }}>{activeQuests.length}</p>
          </div>
          <div>
            <p style={{ color: '#9ca3af', margin: 0 }}>Completed Quests</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#4ade80', margin: '4px 0 0 0' }}>{questHistory.length}</p>
          </div>
          <div>
            <p style={{ color: '#9ca3af', margin: 0 }}>Success Rate</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#60a5fa', margin: '4px 0 0 0' }}>
              {questHistory.length > 0
                ? Math.round((questHistory.filter(q => q.status === 'completed').length / questHistory.length) * 100)
                : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Active Quests */}
      {activeQuests.length > 0 && (
        <div>
          <h3 style={{ fontWeight: 600, color: '#fff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            ⚔️ Active Quests ({activeQuests.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activeQuests.map(quest => {
              const timeLeft = timeRemaining[quest.id] ?? getQuestTimeRemaining(quest) ?? 0;
              const formattedTime = formatQuestTime(timeLeft);
              const isComplete = timeLeft <= 0;

              return (
                <div
                  key={quest.id}
                  style={{
                    padding: 16,
                    background: 'rgba(180, 83, 9, 0.1)',
                    border: `1px solid ${getQuestDifficultyColor(quest.difficulty)}`,
                    borderRadius: 8
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <h4 style={{ fontWeight: 600, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                        {quest.name}
                        <span style={{ fontSize: '0.875rem' }}>{getQuestDifficultyEmoji(quest.difficulty)}</span>
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 4, margin: 0 }}>{quest.description}</p>
                    </div>
                    {isComplete && (
                      <button
                        onClick={() => {
                          const completed = completeQuest(quest);
                          showToast(
                            `${completed.status === 'completed' ? '✨ Quest Complete!' : '❌ Quest Failed!'}`,
                            completed.status === 'completed' ? 'success' : 'error'
                          );
                          if (completed.status === 'completed') {
                            addGems(quest.rewards.gems);
                            grantXp(quest.rewards.xp);
                          }
                          onUpdate?.();
                        }}
                        style={{
                          padding: '8px 16px',
                          background: '#b45309',
                          border: 'none',
                          borderRadius: 4,
                          fontWeight: 600,
                          color: '#fff',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Claim
                      </button>
                    )}
                  </div>

                  {/* Progress Timer */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Progress</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: isComplete ? '#4ade80' : '#fbbf24' }}>
                        {isComplete ? '✓ Ready' : formattedTime}
                      </span>
                    </div>
                    <div style={{ width: '100%', background: '#4b5563', borderRadius: 9999, height: 8 }}>
                      <div
                        style={{
                          height: 8,
                          borderRadius: 9999,
                          background: isComplete ? '#22c55e' : '#eab308',
                          width: `${Math.max(0, Math.min(100, 100 - (timeLeft / quest.duration) * 100))}%`,
                          transition: 'all 0.2s'
                        }}
                      />
                    </div>
                  </div>

                  {/* Rewards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: '0.75rem' }}>
                    <div style={{ background: 'rgba(180, 83, 9, 0.3)', borderRadius: 4, padding: '8px' }}>
                      <p style={{ color: '#9ca3af', margin: 0 }}>Gems</p>
                      <p style={{ fontWeight: 700, color: '#fcd34d', margin: '4px 0 0 0' }}>{quest.rewards.gems}</p>
                    </div>
                    <div style={{ background: 'rgba(37, 99, 235, 0.3)', borderRadius: 4, padding: '8px' }}>
                      <p style={{ color: '#9ca3af', margin: 0 }}>XP</p>
                      <p style={{ fontWeight: 700, color: '#60a5fa', margin: '4px 0 0 0' }}>{quest.rewards.xp}</p>
                    </div>
                    <div style={{ background: 'rgba(147, 51, 234, 0.3)', borderRadius: 4, padding: '8px' }}>
                      <p style={{ color: '#9ca3af', margin: 0 }}>Pet XP</p>
                      <p style={{ fontWeight: 700, color: '#d8b4fe', margin: '4px 0 0 0' }}>{quest.rewards.petXp}</p>
                    </div>
                  </div>

                  {/* Risk Factor */}
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(180, 83, 9, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                      <span style={{ color: '#9ca3af' }}>Risk Level</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 64, background: '#4b5563', borderRadius: 9999, height: 6 }}>
                          <div
                            style={{
                              background: '#ef4444',
                              height: 6,
                              borderRadius: 9999,
                              width: `${quest.riskFactor * 100}%`
                            }}
                          />
                        </div>
                        <span style={{ color: '#9ca3af' }}>{Math.round(quest.riskFactor * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Quests */}
      <div>
        <h3 style={{ fontWeight: 600, color: '#fff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          🗺️ Available Quests ({availableQuests.length})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {availableQuests.map(quest => (
            <div
              key={quest.id}
              style={{
                padding: 16,
                background: 'rgba(55, 65, 81, 0.3)',
                border: selectedQuest === quest.id ? `1px solid ${getQuestDifficultyColor(quest.difficulty)}` : '1px solid rgba(75, 85, 99, 0.3)',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => setSelectedQuest(selectedQuest === quest.id ? null : quest.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                    {quest.name}
                    <span style={{ fontSize: '0.875rem' }}>{getQuestDifficultyEmoji(quest.difficulty)}</span>
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 4, margin: 0 }}>{quest.description}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    showToast(`Started quest: ${quest.name}!`, 'success');
                    onUpdate?.();
                  }}
                  style={{
                    padding: '4px 12px',
                    background: '#2563eb',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#fff',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Start
                </button>
              </div>

              {/* Expanded Details */}
              {selectedQuest === quest.id && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(75, 85, 99, 0.3)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: 8, margin: 0 }}>Duration</p>
                    <p style={{ fontWeight: 600, color: '#fff', margin: 0 }}>{formatQuestTime(quest.duration)}</p>
                  </div>

                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: 8, margin: 0 }}>Rewards</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: '0.75rem' }}>
                      <div style={{ background: 'rgba(180, 83, 9, 0.3)', borderRadius: 4, padding: '8px' }}>
                        <p style={{ color: '#9ca3af', margin: 0 }}>Gems</p>
                        <p style={{ fontWeight: 700, color: '#fcd34d', margin: '4px 0 0 0' }}>{quest.rewards.gems}</p>
                      </div>
                      <div style={{ background: 'rgba(37, 99, 235, 0.3)', borderRadius: 4, padding: '8px' }}>
                        <p style={{ color: '#9ca3af', margin: 0 }}>XP</p>
                        <p style={{ fontWeight: 700, color: '#60a5fa', margin: '4px 0 0 0' }}>{quest.rewards.xp}</p>
                      </div>
                      <div style={{ background: 'rgba(147, 51, 234, 0.3)', borderRadius: 4, padding: '8px' }}>
                        <p style={{ color: '#9ca3af', margin: 0 }}>Pet XP</p>
                        <p style={{ fontWeight: 700, color: '#d8b4fe', margin: '4px 0 0 0' }}>{quest.rewards.petXp}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Risk Level</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#d1d5db' }}>{Math.round(quest.riskFactor * 100)}%</span>
                    </div>
                    <div style={{ width: '100%', background: '#4b5563', borderRadius: 9999, height: 8 }}>
                      <div
                        style={{
                          background: '#ef4444',
                          height: 8,
                          borderRadius: 9999,
                          width: `${quest.riskFactor * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quest History */}
      {questHistory.length > 0 && (
        <div>
          <h3 style={{ fontWeight: 600, color: '#fff', marginBottom: 12 }}>📋 Quest History (Last 10)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 256, overflowY: 'auto' }}>
            {questHistory.slice(-10).reverse().map(quest => (
              <div
                key={quest.id}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  fontSize: '0.75rem',
                  background: quest.status === 'completed' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: quest.status === 'completed' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontWeight: 600, color: '#fff', margin: 0 }}>{quest.name}</p>
                    <p style={{ color: '#9ca3af', margin: '4px 0 0 0' }}>
                      {quest.status === 'completed' ? '✓ Completed' : '✗ Failed'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#9ca3af', margin: 0 }}>
                      {new Date(quest.completedAt || 0).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PetQuests;
