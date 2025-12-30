import React, { useState, useEffect } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { getXp, getLevelFromXp } from '../../services/xp';
import { getSelectedTitle, getTitles, unlockTitle, setSelectedTitle as setSelectedTitleService, getUnlockedTitles, ALL_TITLES } from '../../services/titles';
import { getMedals } from '../../services/medals';
import { subscribeToUserProfile } from '../../services/messaging';
import { useToast } from '../../context/ToastContext';

interface AppProfileModalProps {
  open: boolean;
  onClose: () => void;
}

interface ProfileData {
  username: string;
  hashtag?: string;
  tasksCompleted: number;
  eventsCreated: number;
  avatar: string;
  customAvatarUrl?: string;
}

const AVATAR_OPTIONS = ['👤', '😊', '🧠', '🎯', '🌟', '✨', '🚀', '💪', '🎨', '📚', '🎭', '🧘', '🐸', '🦸', '👻', '🤖'];

const AppProfileModal: React.FC<AppProfileModalProps> = ({ open, onClose }) => {
  const auth = getAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<ProfileData>({
    username: 'Player',
    hashtag: '0000',
    tasksCompleted: 0,
    eventsCreated: 0,
    avatar: '👤',
  });
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(profile.username);
  const [editHashtagValue, setEditHashtagValue] = useState(profile.hashtag || '');
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [unlockedTitles, setUnlockedTitles] = useState<any[]>([]);
  const [selectedTitle, setSelectedTitle] = useState<any>(null);
  const [medals, setMedals] = useState<any[]>([]);
  const [streak, setStreak] = useState({ current: 0, longest: 0 });

  useEffect(() => {
    if (!open) return;

    // Load profile from localStorage
    const stored = localStorage.getItem('adhd_profile');
    if (stored) {
      setProfile(JSON.parse(stored));
    }

    // Load streak
    const streakStored = localStorage.getItem('adhd_streak');
    if (streakStored) {
      setStreak(JSON.parse(streakStored));
    }

    // Load titles and medals
    const titlesList = getUnlockedTitles();
    setUnlockedTitles(titlesList);
    
    const titleObj = getSelectedTitle();
    setSelectedTitle(titleObj);

    const medalsList = getMedals();
    setMedals(medalsList);

    // Subscribe to profile updates
    if (auth.currentUser) {
      const unsubscribe = subscribeToUserProfile(auth.currentUser.uid, (profileData) => {
        if (profileData) {
          setProfile({
            username: profileData.username || 'Player',
            hashtag: profileData.hashtag || '0000',
            tasksCompleted: profileData.tasksCompleted || 0,
            eventsCreated: profileData.eventsCreated || 0,
            avatar: profileData.avatar || '👤',
            customAvatarUrl: profileData.customAvatarUrl,
          });
        }
      });
      return () => unsubscribe();
    }
  }, [open, auth.currentUser?.uid]);

  const handleSaveName = () => {
    const newProfile = {
      ...profile,
      username: editNameValue || profile.username,
      hashtag: editHashtagValue || profile.hashtag,
    };
    setProfile(newProfile);
    localStorage.setItem('adhd_profile', JSON.stringify(newProfile));
    setEditingName(false);
  };

  const handleAvatarSelect = (avatar: string) => {
    const newProfile = { ...profile, avatar, customAvatarUrl: undefined };
    setProfile(newProfile);
    localStorage.setItem('adhd_profile', JSON.stringify(newProfile));
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      onClose();
      showToast('Logged out successfully', 'success');
    } catch (error: any) {
      showToast('Logout failed: ' + error.message, 'error');
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9998,
      }}
      onClick={onClose}
    >
      <div
        className="panel custom-scrollbar"
        style={{
          maxWidth: 500,
          padding: 24,
          backgroundColor: 'var(--panel)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          userSelect: 'none',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Profile Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          {editingAvatar ? (
            <div>
              <div style={{ marginBottom: 12 }}>
                <div className="subtle" style={{ fontSize: '0.8rem', marginBottom: 8 }}>
                  CHOOSE AVATAR
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  {AVATAR_OPTIONS.map((avatar) => (
                    <button
                      key={avatar}
                      className="btn ghost"
                      onClick={() => handleAvatarSelect(avatar)}
                      style={{
                        fontSize: 32,
                        padding: 8,
                        border: profile.avatar === avatar && !profile.customAvatarUrl ? '2px solid var(--accent)' : '2px solid transparent',
                      }}
                    >
                      {avatar}
                    </button>
                  ))}
                </div>
                <button className="btn ghost" onClick={() => setEditingAvatar(false)} style={{ width: '100%', marginTop: 12 }}>
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 40,
                  margin: '0 auto 12px',
                  cursor: 'pointer',
                  backgroundImage: profile.customAvatarUrl ? `url(${profile.customAvatarUrl})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  overflow: 'hidden',
                }}
                onClick={() => setEditingAvatar(true)}
              >
                {!profile.customAvatarUrl && profile.avatar}
              </div>
            </>
          )}
          {editingName ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Username"
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  autoFocus
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveName()}
                  style={{ flex: 1 }}
                />
                <input
                  type="text"
                  className="input"
                  placeholder="#1234"
                  value={editHashtagValue}
                  onChange={(e) => setEditHashtagValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveName()}
                  style={{ width: 100 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" onClick={handleSaveName} style={{ flex: 1 }}>
                  Save
                </button>
                <button className="btn ghost" onClick={() => setEditingName(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
              <h2 style={{ margin: 0 }}>
                {profile.username}
                <span style={{ color: 'var(--muted)', fontSize: '0.8em', marginLeft: 4 }}>#{profile.hashtag || '1000'}</span>
              </h2>
              <button
                className="btn ghost"
                onClick={() => {
                  setEditingName(true);
                  setEditNameValue(profile.username);
                  setEditHashtagValue(profile.hashtag || '');
                }}
                style={{ padding: '4px 8px', fontSize: '1rem' }}
              >
                ✏️
              </button>
            </div>
          )}
          <div className="subtle">Level {Math.floor(getXp() / 100) + 1} • {getXp()} XP</div>
          {selectedTitle && (
            <div style={{ fontSize: '0.9rem', marginTop: 4 }}>
              {selectedTitle.id === 'developer' ? (
                <span
                  style={{
                    background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: 'bold',
                  }}
                >
                  ✨ {selectedTitle.name}
                </span>
              ) : (
                <span style={{ color: 'var(--accent)' }}>✨ {selectedTitle.name}</span>
              )}
            </div>
          )}
        </div>

        {/* Streak Section */}
        <div style={{ backgroundColor: 'var(--bg)', borderRadius: 8, padding: 16, marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔥</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 500 }}>{streak.current} day streak</div>
          <div className="subtle" style={{ fontSize: '0.9rem', marginTop: 4 }}>
            Longest: {streak.longest} days
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{ backgroundColor: 'var(--bg)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
            <div className="subtle" style={{ fontSize: '0.8rem', marginBottom: 4 }}>
              Tasks Completed
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{profile.tasksCompleted}</div>
          </div>
          <div style={{ backgroundColor: 'var(--bg)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
            <div className="subtle" style={{ fontSize: '0.8rem', marginBottom: 4 }}>
              Events Created
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{profile.eventsCreated}</div>
          </div>
        </div>

        {/* Titles Section */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--muted)' }}>TITLES</h3>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: 8 }}>
              {unlockedTitles.length}/{ALL_TITLES.length}
            </div>
            <div
              style={{
                width: '100%',
                height: 6,
                background: 'var(--border)',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${(unlockedTitles.length / ALL_TITLES.length) * 100}%`,
                  background: 'linear-gradient(90deg, var(--accent), #a78bfa)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
          <div className="custom-scrollbar" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 12, maxHeight: '200px', overflowY: 'auto' }}>
            {ALL_TITLES.map((title) => {
              const isUnlocked = unlockedTitles.some((t) => t.id === title.id);
              const isSelected = selectedTitle?.id === title.id;
              return (
                <div
                  key={title.id}
                  onClick={() => isUnlocked && setSelectedTitleService(isSelected ? null : title.id)}
                  style={{
                    display: 'flex',
                    gap: 8,
                    padding: 10,
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(167, 139, 250, 0.3) 0%, rgba(147, 112, 219, 0.3) 100%)'
                      : isUnlocked
                      ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(22, 163, 74, 0.15) 100%)'
                      : 'rgba(0, 0, 0, 0.1)',
                    border: isSelected
                      ? '2px solid var(--accent)'
                      : isUnlocked
                      ? '1px solid rgba(34, 197, 94, 0.5)'
                      : '1px solid var(--border)',
                    borderRadius: 6,
                    cursor: isUnlocked ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ fontSize: '1.2rem', flexShrink: 0 }}>{isUnlocked ? '✨' : '🔒'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: 2 }}>
                      {title.id === 'developer' ? (
                        <span
                          style={{
                            background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                          }}
                        >
                          {title.name}
                        </span>
                      ) : (
                        title.name
                      )}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>{title.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Medals Section */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--muted)' }}>MEDALS</h3>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: 8 }}>
              {medals.filter((m) => m.earned).length}/{medals.length}
            </div>
            <div
              style={{
                width: '100%',
                height: 6,
                background: 'var(--border)',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${(medals.filter((m) => m.earned).length / medals.length) * 100}%`,
                  background: 'linear-gradient(90deg, var(--accent), #fbbf24)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
          <div className="custom-scrollbar" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 12, maxHeight: '200px', overflowY: 'auto' }}>
            {medals.map((medal) => (
              <div
                key={medal.id}
                style={{
                  display: 'flex',
                  gap: 8,
                  padding: 10,
                  background: medal.earned
                    ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)'
                    : 'rgba(0, 0, 0, 0.1)',
                  border: medal.earned ? '1px solid rgba(251, 191, 36, 0.5)' : '1px solid var(--border)',
                  borderRadius: 6,
                  transition: 'all 0.2s ease',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ fontSize: '1.2rem', flexShrink: 0 }}>{medal.earned ? medal.icon : '🔒'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: 2 }}>{medal.name}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>{medal.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Close and Logout Buttons */}
        <button className="btn ghost" onClick={handleLogout} style={{ width: '100%', marginBottom: 8, backgroundColor: 'rgba(255,68,68,0.2)', color: 'var(--text)' }}>
          Logout
        </button>
        <button className="btn" onClick={onClose} style={{ width: '100%' }}>
          Close
        </button>
      </div>
    </div>
  );
};

export default AppProfileModal;
