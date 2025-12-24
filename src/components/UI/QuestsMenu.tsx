import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

interface QuestMenuProps {
  open: boolean;
  onClose: () => void;
}

const QUESTS_KEY = 'adhd_quests_progress';

interface Quest {
  id: number;
  title: string;
  description: string;
  category: 'daily' | 'weekly' | 'long-term';
  progress: number;
  target: number;
  reward: { xp: number; gems: number };
  icon: string;
  completed: boolean;
}

const DEFAULT_QUESTS: Quest[] = [
  {
    id: 1,
    title: 'Task Master',
    description: 'Complete 5 tasks',
    category: 'daily',
    progress: 0,
    target: 5,
    reward: { xp: 50, gems: 10 },
    icon: '✅',
    completed: false,
  },
  {
    id: 2,
    title: 'Focus Time',
    description: 'Use the focus timer for 30 minutes',
    category: 'daily',
    progress: 0,
    target: 30,
    reward: { xp: 30, gems: 5 },
    icon: '⏱️',
    completed: false,
  },
  {
    id: 3,
    title: 'Social Butterfly',
    description: 'Add 3 friends to your social circle',
    category: 'weekly',
    progress: 0,
    target: 3,
    reward: { xp: 100, gems: 25 },
    icon: '👥',
    completed: false,
  },
  {
    id: 4,
    title: 'Streak Keeper',
    description: 'Maintain a 7-day streak',
    category: 'weekly',
    progress: 0,
    target: 7,
    reward: { xp: 150, gems: 30 },
    icon: '🔥',
    completed: false,
  },
  {
    id: 5,
    title: 'Level Up',
    description: 'Reach Level 5',
    category: 'long-term',
    progress: 0,
    target: 5,
    reward: { xp: 500, gems: 100 },
    icon: '⭐',
    completed: false,
  },
  {
    id: 6,
    title: 'Premium Journey',
    description: 'Subscribe to Plus for 30 days',
    category: 'long-term',
    progress: 0,
    target: 30,
    reward: { xp: 300, gems: 150 },
    icon: '💎',
    completed: false,
  },
];

const QuestsMenu: React.FC<QuestMenuProps> = ({ open, onClose }) => {
  const history = useHistory();
  const [quests, setQuests] = useState<Quest[]>(() => {
    const stored = localStorage.getItem(QUESTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return DEFAULT_QUESTS;
  });

  useEffect(() => {
    // Refresh quests when menu opens
    if (open) {
      const stored = localStorage.getItem(QUESTS_KEY);
      if (stored) {
        setQuests(JSON.parse(stored));
      } else {
        setQuests(DEFAULT_QUESTS);
      }
    }
  }, [open]);

  const completedCount = quests.filter(q => q.completed).length;
  const dailyQuests = quests.filter(q => q.category === 'daily' && !q.completed);
  const weeklyQuests = quests.filter(q => q.category === 'weekly' && !q.completed);

  return (
    <>
      <aside 
        className="sidebar custom-scrollbar"
        aria-hidden={!open} 
        style={{
          left: 'auto',
          right: 0,
          transform: open ? 'translateX(0)' : 'translateX(110%)',
        }}
      >
        <div className="sidebar-inner panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ margin: 0, flex: 1, fontSize: '1.3rem' }}>🏆 Quests</h4>
            <button 
              onClick={onClose}
              className="btn ghost"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          {/* Quest Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginBottom: 16,
            padding: 12,
            background: 'rgba(0, 0, 0, 0.1)',
            borderRadius: 8
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                {completedCount}/{quests.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Completed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#06b6d4' }}>
                {quests.filter(q => q.completed).reduce((sum, q) => sum + q.reward.gems, 0)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Gems Earned</div>
            </div>
          </div>

          {/* Daily Quests */}
          {dailyQuests.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h5 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--muted)' }}>☀️ DAILY</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dailyQuests.slice(0, 3).map(quest => (
                  <div
                    key={quest.id}
                    style={{
                      padding: 10,
                      background: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                    }}
                  >
                    <div style={{ display: 'flex', gap: 8, alignItems: 'start', marginBottom: 6 }}>
                      <span style={{ fontSize: '1.2rem' }}>{quest.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{quest.title}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{quest.description}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                      {quest.progress} / {quest.target}
                    </div>
                    <div style={{
                      width: '100%',
                      height: 4,
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 2,
                      marginTop: 4,
                      overflow: 'hidden'
                    }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(100, (quest.progress / quest.target) * 100)}%`,
                          background: 'var(--accent)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Quests */}
          {weeklyQuests.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h5 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--muted)' }}>📅 WEEKLY</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {weeklyQuests.slice(0, 3).map(quest => (
                  <div
                    key={quest.id}
                    style={{
                      padding: 10,
                      background: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                    }}
                  >
                    <div style={{ display: 'flex', gap: 8, alignItems: 'start', marginBottom: 6 }}>
                      <span style={{ fontSize: '1.2rem' }}>{quest.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{quest.title}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{quest.description}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                      {quest.progress} / {quest.target}
                    </div>
                    <div style={{
                      width: '100%',
                      height: 4,
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 2,
                      marginTop: 4,
                      overflow: 'hidden'
                    }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(100, (quest.progress / quest.target) * 100)}%`,
                          background: 'var(--accent)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {quests.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 16 }}>
              No quests yet. Check back later!
            </div>
          )}

          <button
            onClick={() => {
              history.push('/quests');
              onClose();
            }}
            className="btn"
            style={{
              width: '100%',
              marginTop: 16,
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.9rem',
            }}
          >
            View All Quests →
          </button>
        </div>
      </aside>

      <div 
        className="sidebar-backdrop"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={onClose} 
      />
    </>
  );
};

export default QuestsMenu;
