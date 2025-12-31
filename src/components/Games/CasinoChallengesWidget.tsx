import React, { useState, useEffect } from 'react';
import { getDailyChallenges, getChallengeBonus, getChallengeProgress } from '../../services/casinoChallenges';

export const CasinoChallengesWidget: React.FC = () => {
  const [challenges, setChallenges] = useState(getDailyChallenges());
  const [progress, setProgress] = useState(getChallengeProgress());
  const [bonus, setBonus] = useState(getChallengeBonus());
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      const updated = getDailyChallenges();
      setChallenges(updated);
      setProgress(getChallengeProgress());
      setBonus(getChallengeBonus());
    };

    window.addEventListener('casino:challengeUpdated', handleUpdate);
    window.addEventListener('casino:challengeCompleted', handleUpdate);

    return () => {
      window.removeEventListener('casino:challengeUpdated', handleUpdate);
      window.removeEventListener('casino:challengeCompleted', handleUpdate);
    };
  }, []);

  const completedCount = challenges.challenges.filter(c => c.completed).length;
  const totalCount = challenges.challenges.length;

  return (
    <div className="panel" style={{
      padding: 24,
      marginBottom: 24,
      background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(251, 146, 60, 0.05) 100%)',
      border: '2px solid rgba(251, 191, 36, 0.3)',
    }}>
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          marginBottom: expanded ? 16 : 12,
          position: 'relative',
          gap: 12,
        }}
      >
        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fbbf24', textAlign: 'center' }}>
          🎯 Daily Challenges
        </h3>
        <div style={{
          background: 'rgba(251, 191, 36, 0.2)',
          color: '#fbbf24',
          padding: '4px 12px',
          borderRadius: 12,
          fontSize: '0.85rem',
          fontWeight: 'bold',
        }}>
          {completedCount}/{totalCount}
        </div>
        <div style={{
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          transition: 'transform 0.2s',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          position: 'absolute',
          right: 0,
        }}>
          ▼
        </div>
      </div>

      {/* Compact View */}
      {!expanded && (
        <div style={{
          display: 'grid',
          gap: 12,
        }}>
          <div>
            <div style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              marginBottom: 6,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span>Progress</span>
              <span style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                {progress}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: 10,
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 5,
              overflow: 'hidden',
            }}>
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
          {bonus > 0 && (
            <div style={{
              textAlign: 'center',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: '#10b981',
              background: 'rgba(16, 185, 129, 0.15)',
              padding: '8px',
              borderRadius: 6,
            }}>
              +{bonus} 💎 Bonus Available
            </div>
          )}
        </div>
      )}

      {/* Expanded View */}
      {expanded && (
        <div style={{ display: 'grid', gap: 12 }}>
          {challenges.challenges.map(challenge => (
            <div
              key={challenge.id}
              style={{
                background: challenge.completed
                  ? 'rgba(16, 185, 129, 0.15)'
                  : 'rgba(0,0,0,0.2)',
                border: challenge.completed
                  ? '1px solid rgba(16, 185, 129, 0.4)'
                  : '1px solid transparent',
                borderRadius: 8,
                padding: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1 }}>
                <div style={{ fontSize: '1.5rem' }}>{challenge.icon}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontWeight: 'bold',
                    fontSize: '0.95rem',
                    marginBottom: 4,
                    textDecoration: challenge.completed ? 'line-through' : 'none',
                    color: challenge.completed ? 'var(--text-secondary)' : 'var(--text)',
                  }}>
                    {challenge.title}
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    marginBottom: 6,
                  }}>
                    {challenge.description}
                  </div>
                  {!challenge.completed && (
                    <div style={{
                      width: 150,
                      height: 6,
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min((challenge.current / challenge.target) * 100, 100)}%`,
                          background: challenge.difficulty === 'hard'
                            ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                            : challenge.difficulty === 'medium'
                            ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
                            : 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div style={{
                textAlign: 'right',
                minWidth: 80,
              }}>
                {challenge.completed ? (
                  <div style={{
                    color: '#10b981',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                  }}>
                    ✓
                  </div>
                ) : (
                  <>
                    <div style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      marginBottom: 4,
                    }}>
                      {challenge.current}/{challenge.target}
                    </div>
                    <div style={{
                      fontSize: '0.9rem',
                      color: '#fbbf24',
                      fontWeight: 'bold',
                    }}>
                      +{challenge.reward} 💎
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}

          {/* Summary */}
          <div style={{
            background: 'rgba(251, 191, 36, 0.2)',
            borderRadius: 8,
            padding: 12,
            textAlign: 'center',
            marginTop: 8,
            borderTop: '1px solid rgba(251, 191, 36, 0.3)',
          }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
              Total Daily Bonus
            </div>
            <div style={{
              fontSize: '1.3rem',
              fontWeight: 'bold',
              color: '#fbbf24',
            }}>
              +{bonus} Gems
            </div>
            {bonus > 0 && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                {completedCount < totalCount && `Complete ${totalCount - completedCount} more for full bonus!`}
                {completedCount === totalCount && '🎉 All challenges completed!'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CasinoChallengesWidget;
