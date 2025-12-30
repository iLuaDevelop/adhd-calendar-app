import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { subscribeToUserProfile } from '../../services/messaging';
import { db } from '../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  avatar: string;
}

interface UserProfile {
  username: string;
  hashtag: string;
  avatar: string;
  email?: string;
  xp?: number;
  level?: number;
  medals?: string[];
  titles?: string[];
  createdAt?: number;
  lastUpdated?: string;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ open, onClose, userId, username, avatar }) => {
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [gameProgress, setGameProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !userId) {
      return;
    }

    setLoading(true);

    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    // Subscribe to messaging profile (real-time updates)
    try {
      unsubscribe = subscribeToUserProfile(userId, (data: UserProfile) => {
        if (isMounted) {
          setProfileData(data);
        }
      });
    } catch (error) {
      console.error('[ProfileModal] Error subscribing to profile:', error);
    }

    // Load game progress separately
    const loadGameProgress = async () => {
      try {
        const gameProgressDoc = await getDoc(doc(db, 'gameProgress', userId));
        if (gameProgressDoc.exists() && isMounted) {
          setGameProgress(gameProgressDoc.data());
        }
      } catch (e) {
        console.error('[ProfileModal] Error fetching game progress:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadGameProgress();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [open, userId]);

  return (
    <Modal isOpen={open} onClose={onClose} title={`${username}'s Profile`}>
      <div style={{ padding: '24px 16px', maxHeight: '70vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading profile...</div>
        ) : (
          <>
            {/* Avatar and Basic Info */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '4rem', marginBottom: 12 }}>
                {profileData?.avatar || avatar}
              </div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '1.3rem', fontWeight: 'bold' }}>
                {profileData?.username || username}
              </h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                #{profileData?.hashtag || '0000'}
              </p>
            </div>

            {/* Game Progress Stats */}
            {gameProgress && (
              <>
                <div>
                  <h4 style={{ margin: '0 0 12px 0', color: 'var(--accent)', textAlign: 'center', fontSize: '0.95rem', fontWeight: 'bold' }}>📊 Stats</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ padding: 12, background: 'var(--panel)', borderRadius: 8, border: '1px solid var(--border)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 6, fontWeight: '500' }}>XP</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                        {gameProgress.xp?.toLocaleString() || 0}
                      </div>
                    </div>
                    <div style={{ padding: 12, background: 'var(--panel)', borderRadius: 8, border: '1px solid var(--border)', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 6, fontWeight: '500' }}>Completed Tasks</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                        {gameProgress.completedTasks || 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Titles */}
                {gameProgress.unlockedTitles && gameProgress.unlockedTitles.length > 0 && (
                  <div>
                    <h4 style={{ margin: '0 0 12px 0', color: 'var(--accent)', textAlign: 'center', fontSize: '0.95rem', fontWeight: 'bold' }}>👑 Titles</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                      {gameProgress.unlockedTitles.map((title: string, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            padding: '6px 14px',
                            background: 'linear-gradient(135deg, var(--accent), #7c4dff)',
                            borderRadius: 16,
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            color: 'white',
                          }}
                        >
                          {title}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Medals */}
                {gameProgress.medals && gameProgress.medals.length > 0 && (
                  <div>
                    <h4 style={{ margin: '0 0 12px 0', color: 'var(--accent)', textAlign: 'center', fontSize: '0.95rem', fontWeight: 'bold' }}>🏅 Medals</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
                      {gameProgress.medals.map((medal: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 6,
                            padding: 10,
                            background: 'var(--panel)',
                            borderRadius: 8,
                            border: '1px solid var(--border)',
                            fontSize: '0.7rem',
                            textAlign: 'center',
                            minWidth: 70,
                          }}
                        >
                          <div style={{ fontSize: '1.4rem' }}>{medal.icon || '🏅'}</div>
                          <div style={{ fontWeight: '600', wordBreak: 'break-word', lineHeight: 1.2 }}>
                            {medal.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Member Since */}
                {gameProgress.lastUpdated && (
                  <div style={{ padding: 12, background: 'var(--panel)', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    Last active: {new Date(gameProgress.lastUpdated).toLocaleDateString()}
                  </div>
                )}
              </>
            )}

            {!gameProgress && (
              <div style={{ padding: 12, background: 'var(--panel)', borderRadius: 8, color: 'var(--text-secondary)', textAlign: 'center' }}>
                No game progress data available
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default ProfileModal;
