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
    console.log('[ProfileModal] useEffect triggered, open:', open, 'userId:', userId);
    if (!open || !userId) {
      console.log('[ProfileModal] Skipping load - open:', open, 'userId:', userId);
      return;
    }

    const loadProfile = async () => {
      console.log('[ProfileModal] Starting to load profile for user:', userId);
      setLoading(true);
      try {
        // Subscribe to messaging profile (real-time updates)
        console.log('[ProfileModal] Subscribing to user profile...');
        const unsubscribe = subscribeToUserProfile(userId, (data: UserProfile) => {
          console.log('[ProfileModal] Profile data received:', data);
          setProfileData(data);
        });

        // Get game progress data
        try {
          console.log('[ProfileModal] Fetching game progress for user:', userId);
          const gameProgressDoc = await getDoc(doc(db, 'gameProgress', userId));
          if (gameProgressDoc.exists()) {
            console.log('[ProfileModal] Game progress found:', gameProgressDoc.data());
            setGameProgress(gameProgressDoc.data());
          } else {
            console.log('[ProfileModal] No game progress document found');
          }
        } catch (e) {
          console.log('[ProfileModal] Error fetching game progress:', e);
        }

        setLoading(false);
        
        // Return cleanup function
        return unsubscribe;
      } catch (error) {
        console.log('[ProfileModal] Error loading profile:', error);
        setLoading(false);
      }
    };

    const unsubscribePromise = loadProfile();
    return () => {
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) {
          console.log('[ProfileModal] Cleaning up profile subscription');
          unsubscribe();
        }
      });
    };
  }, [open, userId]);

  return (
    <Modal open={open} onClose={onClose} title={`${username}'s Profile`}>
      <div style={{ padding: 16, maxHeight: '70vh', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading profile...</div>
        ) : (
          <>
            {/* Avatar and Basic Info */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 8 }}>
                {profileData?.avatar || avatar}
              </div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>
                {profileData?.username || username}
              </h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                #{profileData?.hashtag || '0000'}
              </p>
              {profileData?.email && (
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                  {profileData.email}
                </p>
              )}
            </div>

            {/* Game Progress Stats */}
            {gameProgress && (
              <>
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ margin: '0 0 12px 0', color: 'var(--accent)' }}>📊 Stats</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ padding: 12, background: 'var(--panel)', borderRadius: 6, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}>XP</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
                        {gameProgress.xp?.toLocaleString() || 0}
                      </div>
                    </div>
                    <div style={{ padding: 12, background: 'var(--panel)', borderRadius: 6, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Completed Tasks</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
                        {gameProgress.completedTasks || 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Titles */}
                {gameProgress.unlockedTitles && gameProgress.unlockedTitles.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <h4 style={{ margin: '0 0 12px 0', color: 'var(--accent)' }}>👑 Titles</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {gameProgress.unlockedTitles.map((title: string, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            padding: '4px 12px',
                            background: 'linear-gradient(135deg, var(--accent), #7c4dff)',
                            borderRadius: 12,
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
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
                  <div style={{ marginBottom: 20 }}>
                    <h4 style={{ margin: '0 0 12px 0', color: 'var(--accent)' }}>🏅 Medals</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {gameProgress.medals.map((medal: any, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 4,
                            padding: 8,
                            background: 'var(--panel)',
                            borderRadius: 6,
                            border: '1px solid var(--border)',
                            fontSize: '0.75rem',
                            textAlign: 'center',
                          }}
                        >
                          <div style={{ fontSize: '1.2rem' }}>{medal.icon || '🏅'}</div>
                          <div style={{ fontWeight: 'bold', maxWidth: 60, wordBreak: 'break-word' }}>
                            {medal.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Member Since */}
                {gameProgress.lastUpdated && (
                  <div style={{ padding: 12, background: 'var(--panel)', borderRadius: 6, border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Last active: {new Date(gameProgress.lastUpdated).toLocaleDateString()}
                  </div>
                )}
              </>
            )}

            {!gameProgress && (
              <div style={{ padding: 12, background: 'var(--panel)', borderRadius: 6, color: 'var(--text-secondary)', textAlign: 'center' }}>
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
