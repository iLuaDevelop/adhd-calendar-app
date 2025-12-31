import React, { useState, useEffect } from 'react';
import { getAuth, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { getXp, getLevelFromXp } from '../../services/xp';
import { getSelectedTitle, getTitles, unlockTitle, setSelectedTitle as setSelectedTitleService, getUnlockedTitles, ALL_TITLES } from '../../services/titles';
import { getMedals } from '../../services/medals';
import { useToast } from '../../context/ToastContext';
import { initializeUserProfile } from '../../services/auth';
import { db } from '../../services/firebase';

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
  
  // Login form state
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
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
  const [xp, setXp] = useState(getXp());
  const [level, setLevel] = useState(getLevelFromXp(getXp()));
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      showToast('Logged in successfully!', 'success');
      setLoginEmail('');
      setLoginPassword('');
      onClose();
    } catch (error: any) {
      showToast('Login failed: ' + error.message, 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);
      // Initialize profile for new user
      await initializeUserProfile(userCredential.user.uid, {
        username: 'Player',
        hashtag: Math.random().toString().slice(2, 6),
        avatar: '👤',
        tasksCompleted: 0,
        eventsCreated: 0,
      });
      showToast('Account created and logged in!', 'success');
      setLoginEmail('');
      setLoginPassword('');
      onClose();
    } catch (error: any) {
      showToast('Registration failed: ' + error.message, 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    // Subscribe to XP updates
    const handleXpUpdate = () => {
      const newXp = getXp();
      setXp(newXp);
      setLevel(getLevelFromXp(newXp));
    };

    window.addEventListener('xp:update', handleXpUpdate as EventListener);

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

    // Subscribe to profile updates from Firebase
    let unsubscribe: (() => void) | null = null;
    if (auth.currentUser) {
      const profileDoc = doc(db, 'playerProfiles', auth.currentUser.uid);
      unsubscribe = onSnapshot(profileDoc, (snapshot) => {
        if (snapshot.exists()) {
          const profileData = snapshot.data();
          setProfile({
            username: profileData.username || 'Player',
            hashtag: profileData.hashtag || '0000',
            tasksCompleted: profileData.tasksCompleted || 0,
            eventsCreated: profileData.eventsCreated || 0,
            avatar: profileData.avatar || '👤',
            customAvatarUrl: profileData.customAvatarUrl,
          });
          // Also update localStorage when Firebase updates
          localStorage.setItem('adhd_profile', JSON.stringify({
            username: profileData.username || 'Player',
            hashtag: profileData.hashtag || '0000',
            tasksCompleted: profileData.tasksCompleted || 0,
            eventsCreated: profileData.eventsCreated || 0,
            avatar: profileData.avatar || '👤',
            customAvatarUrl: profileData.customAvatarUrl,
          }));
        }
      });
      return () => {
        window.removeEventListener('xp:update', handleXpUpdate as EventListener);
        if (unsubscribe) unsubscribe();
      };
    }

    return () => {
      window.removeEventListener('xp:update', handleXpUpdate as EventListener);
    };
  }, [open, auth.currentUser?.uid]);

  const handleSaveName = async () => {
    if (!auth.currentUser) return;
    
    setIsSavingProfile(true);
    try {
      const newProfile = {
        ...profile,
        username: editNameValue || profile.username,
        hashtag: editHashtagValue || profile.hashtag,
      };
      setProfile(newProfile);
      localStorage.setItem('adhd_profile', JSON.stringify(newProfile));
      
      // Save to Firebase playerProfiles collection - only include fields users can edit
      const updateData: any = {
        username: newProfile.username,
        hashtag: newProfile.hashtag,
        avatar: newProfile.avatar,
      };
      
      // Only include customAvatarUrl if it has a value
      if (newProfile.customAvatarUrl) {
        updateData.customAvatarUrl = newProfile.customAvatarUrl;
      }
      
      await setDoc(doc(db, 'playerProfiles', auth.currentUser.uid), updateData, { merge: true });
      
      showToast('Profile updated!', 'success');
      setEditingName(false);
    } catch (error: any) {
      showToast('Failed to save profile: ' + error.message, 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAvatarSelect = async (avatar: string) => {
    if (!auth.currentUser) return;
    
    try {
      const newProfile = { ...profile, avatar, customAvatarUrl: undefined };
      setProfile(newProfile);
      localStorage.setItem('adhd_profile', JSON.stringify(newProfile));
      
      // Save to Firebase - only include defined fields
      await setDoc(doc(db, 'playerProfiles', auth.currentUser.uid), {
        avatar,
      }, { merge: true });
    } catch (error: any) {
      showToast('Failed to update avatar: ' + error.message, 'error');
    }
  };

  const handleCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    // Create data URL
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (!auth.currentUser) return;
      
      try {
        const dataUrl = event.target?.result as string;
        const newProfile = { ...profile, customAvatarUrl: dataUrl };
        setProfile(newProfile);
        localStorage.setItem('adhd_profile', JSON.stringify(newProfile));
        
        // Save to Firebase
        await setDoc(doc(db, 'playerProfiles', auth.currentUser.uid), {
          customAvatarUrl: dataUrl,
        }, { merge: true });
        
        setUploadError('');
        showToast('Custom avatar uploaded!', 'success');
      } catch (error: any) {
        showToast('Failed to upload avatar: ' + error.message, 'error');
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  const handleTitleSelect = (titleId: string) => {
    const title = ALL_TITLES.find(t => t.id === titleId);
    if (!title) return;
    
    const isSelected = selectedTitle?.id === titleId;
    if (isSelected) {
      // Deselect
      setSelectedTitleService(null);
      setSelectedTitle(null);
    } else {
      // Select
      setSelectedTitleService(titleId);
      setSelectedTitle(title);
    }
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

  // Show login form if user is not authenticated
  if (!auth.currentUser) {
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
          className="panel"
          style={{
            maxWidth: 400,
            padding: 32,
            backgroundColor: 'var(--panel)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            userSelect: 'none',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 style={{ textAlign: 'center', marginBottom: 24 }}>
            {isLoginMode ? 'Login' : 'Create Account'}
          </h2>

          <form onSubmit={isLoginMode ? handleLogin : handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Email
              </label>
              <input
                type="email"
                className="input"
                placeholder="your@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                disabled={loginLoading}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Password
              </label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                disabled={loginLoading}
              />
            </div>

            <button
              type="submit"
              className="btn"
              disabled={loginLoading}
              style={{ marginTop: 8 }}
            >
              {loginLoading ? (isLoginMode ? 'Logging in...' : 'Creating account...') : (isLoginMode ? 'Login' : 'Create Account')}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {isLoginMode ? "Don't have an account?" : 'Already have an account?'}
            </p>
            <button
              className="btn ghost"
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setLoginEmail('');
                setLoginPassword('');
              }}
              style={{ width: '100%' }}
            >
              {isLoginMode ? 'Create Account' : 'Login'}
            </button>
          </div>

          <button
            className="btn ghost"
            onClick={onClose}
            style={{ width: '100%', marginTop: 12, opacity: 0.7 }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

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
                {(() => {
                  const purchases = new Set(JSON.parse(localStorage.getItem('adhd_purchases') || '[]'));
                  if (purchases.has(5)) {
                    return (
                      <div style={{ marginBottom: 12 }}>
                        <label
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '8px 12px',
                            background: 'var(--accent)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            marginBottom: 8,
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                          }}
                        >
                          📤 Upload Custom Avatar
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCustomAvatarUpload}
                            style={{ display: 'none' }}
                          />
                        </label>
                        {uploadError && <div style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: 8 }}>{uploadError}</div>}
                      </div>
                    );
                  }
                  return null;
                })()}
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
                <button className="btn" onClick={handleSaveName} disabled={isSavingProfile} style={{ flex: 1 }}>
                  {isSavingProfile ? 'Saving...' : 'Save'}
                </button>
                <button className="btn ghost" onClick={() => setEditingName(false)} disabled={isSavingProfile} style={{ flex: 1 }}>
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
          <div className="subtle">Level {level} • {xp} XP</div>
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
                  onClick={() => isUnlocked && handleTitleSelect(title.id)}
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
