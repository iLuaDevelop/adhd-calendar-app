import React, { useState, useEffect } from 'react';
import Button from '../components/UI/Button';
import { getXp, grantXp, getLevelFromXp } from '../services/xp';
import { getGems, addGems } from '../services/currency';
import { useCalendar } from '../hooks/useCalendar';

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

const QUESTS: Quest[] = [
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

const Quests: React.FC = () => {
  const { tasks } = useCalendar();
  const [quests, setQuests] = useState<Quest[]>(() => {
    const stored = localStorage.getItem(QUESTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return QUESTS;
  });

  // Update quest progress based on real game state
  useEffect(() => {
    const tasksCompletedToday = tasks.filter(t => {
      const taskDate = new Date(t.dueDate).toDateString();
      const today = new Date().toDateString();
      return taskDate === today && t.completed;
    }).length;

    // Get streak from localStorage
    const streakData = JSON.parse(localStorage.getItem('adhd_streak') || '{"current": 0}');
    const currentStreak = streakData.current || 0;
    const currentLevel = getLevelFromXp(getXp());

    const updated = quests.map(quest => {
      let newProgress = quest.progress;
      let isCompleted = false;

      switch (quest.id) {
        case 1: // Task Master - Complete 5 tasks
          newProgress = Math.min(tasksCompletedToday, 5);
          isCompleted = newProgress >= 5;
          break;
        case 4: // Streak Keeper - 7 day streak
          newProgress = Math.min(currentStreak, 7);
          isCompleted = newProgress >= 7;
          break;
        case 5: // Level Up - Reach Level 5
          newProgress = Math.min(currentLevel, 5);
          isCompleted = newProgress >= 5;
          break;
        default:
          isCompleted = quest.completed;
          break;
      }

      return {
        ...quest,
        progress: newProgress,
        completed: quest.completed || isCompleted,
      };
    });

    setQuests(updated);
    localStorage.setItem(QUESTS_KEY, JSON.stringify(updated));
  }, [tasks]);

  const completeQuest = (questId: number) => {
    const quest = quests.find(q => q.id === questId);
    // Only allow completion if quest is not already completed AND progress meets target
    if (quest && !quest.completed && quest.progress >= quest.target) {
      grantXp(quest.reward.xp);
      addGems(quest.reward.gems);
      window.dispatchEvent(new Event('currencyUpdated'));
      
      const updated = quests.map(q =>
        q.id === questId ? { ...q, completed: true } : q
      );
      setQuests(updated);
      localStorage.setItem(QUESTS_KEY, JSON.stringify(updated));
    } else if (quest && quest.progress < quest.target) {
      console.warn('[Quests] Cannot complete quest - progress too low:', quest.title, `${quest.progress}/${quest.target}`);
    }
  };

  const dailyQuests = quests.filter(q => q.category === 'daily');
  const weeklyQuests = quests.filter(q => q.category === 'weekly');
  const longTermQuests = quests.filter(q => q.category === 'long-term');

  const renderQuestCard = (quest: Quest) => (
    <div
      key={quest.id}
      className="panel"
      style={{
        padding: 20,
        background: quest.completed
          ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)'
          : 'transparent',
        border: quest.completed
          ? '2px solid rgba(34, 197, 94, 0.5)'
          : '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        opacity: quest.completed ? 0.8 : 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'start', flex: 1 }}>
          <span style={{ fontSize: '1.5rem' }}>{quest.icon}</span>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 4px 0' }}>
              {quest.title}
              {quest.completed && ' ✓'}
            </h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted)' }}>
              {quest.description}
            </p>
          </div>
        </div>
      </div>

      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 6,
            fontSize: '0.85rem',
          }}
        >
          <span>Progress</span>
          <span>
            {quest.progress} / {quest.target}
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: 8,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, (quest.progress / quest.target) * 100)}%`,
              background: 'linear-gradient(90deg, var(--accent), var(--accent-2))',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.9rem',
        }}
      >
        <div style={{ display: 'flex', gap: 12 }}>
          <span>📦 +{quest.reward.xp} XP</span>
          <span>💎 +{quest.reward.gems} Gems</span>
        </div>
        <Button
          onClick={() => completeQuest(quest.id)}
          disabled={quest.completed || quest.progress < quest.target}
          variant={quest.completed ? 'ghost' : undefined}
          title={quest.progress < quest.target ? `Complete ${quest.target - quest.progress} more to claim` : ''}
        >
          {quest.completed ? 'Completed' : quest.progress < quest.target ? 'Incomplete' : 'Claim'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="container">
      <div style={{ maxWidth: 900, margin: '-40px auto', paddingBottom: 40 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: 8 }}>Quests</h1>
          <p style={{ color: 'var(--muted)', marginBottom: 0 }}>
            Complete quests to earn XP and Gems
          </p>
        </div>

        {/* Daily Quests */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            ☀️ Daily Quests
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {dailyQuests.map(renderQuestCard)}
          </div>
        </section>

        {/* Weekly Quests */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            📅 Weekly Quests
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {weeklyQuests.map(renderQuestCard)}
          </div>
        </section>

        {/* Long-term Quests */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            🏆 Long-term Quests
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {longTermQuests.map(renderQuestCard)}
          </div>
        </section>

        {/* Quest Statistics */}
        <section style={{ marginTop: 40 }}>
          <div
            className="panel"
            style={{
              padding: 24,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 20,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)', marginBottom: 4 }}>
                {quests.filter(q => q.completed).length}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>Quests Completed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#ec4899',
                  marginBottom: 4,
                }}
              >
                {quests.reduce((sum, q) => (q.completed ? sum + q.reward.xp : sum), 0)}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>Total XP Earned</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: '#06b6d4',
                  marginBottom: 4,
                }}
              >
                {quests.reduce((sum, q) => (q.completed ? sum + q.reward.gems : sum), 0)}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>Total Gems Earned</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Quests;
