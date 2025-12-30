import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getXp, getLevelFromXp } from '../../services/xp';
import { getSelectedTitle } from '../../services/titles';
import { subscribeToUserProfile } from '../../services/messaging';

const ProfileHeaderCard: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  const [username, setUsername] = useState('Player');
  const [xp, setXp] = useState(getXp());
  const [level, setLevel] = useState(getLevelFromXp(getXp()));
  const [selectedTitle, setSelectedTitleState] = useState('');
  const [avatar, setAvatar] = useState('👤');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const auth = getAuth();

  useEffect(() => {
    // Subscribe to XP updates
    const handleXpUpdate = () => {
      const newXp = getXp();
      setXp(newXp);
      setLevel(getLevelFromXp(newXp));
    };

    const handleTitleUpdate = () => {
      const titleObj = getSelectedTitle();
      if (titleObj) {
        setSelectedTitleState(titleObj.name);
      } else {
        setSelectedTitleState('');
      }
    };

    window.addEventListener('xp:update', handleXpUpdate as EventListener);
    window.addEventListener('titleUpdated', handleTitleUpdate as EventListener);

    // Get user profile
    if (auth.currentUser) {
      const unsubscribe = subscribeToUserProfile(auth.currentUser.uid, (profile) => {
        if (profile) {
          setUsername(profile.username || 'Player');
          setAvatar(profile.avatar || '👤');
          setCustomAvatarUrl(profile.customAvatarUrl || '');
        }
      });

      // Get initial selected title
      handleTitleUpdate();

      return () => {
        window.removeEventListener('xp:update', handleXpUpdate as EventListener);
        window.removeEventListener('titleUpdated', handleTitleUpdate as EventListener);
        unsubscribe();
      };
    }

    return () => {
      window.removeEventListener('xp:update', handleXpUpdate as EventListener);
      window.removeEventListener('titleUpdated', handleTitleUpdate as EventListener);
    };
  }, [auth.currentUser?.uid]);

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        borderRadius: 8,
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        color: 'var(--text)',
        fontSize: '0.9rem',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        minWidth: 'fit-content',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99, 102, 241, 0.6)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99, 102, 241, 0.3)';
      }}
    >
      {/* Avatar Circle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: !customAvatarUrl ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%)' : 'transparent',
          border: '2px solid rgba(99, 102, 241, 0.5)',
          fontSize: '1.3rem',
          flexShrink: 0,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {customAvatarUrl ? (
          <img 
            src={customAvatarUrl} 
            alt="avatar"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          avatar
        )}
      </div>

      {/* Profile Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Username */}
        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
          {username}
        </div>
        
        {/* Title (if exists) */}
        {selectedTitle && (
          <div style={{ 
            background: 'linear-gradient(135deg, var(--accent), #7c4dff)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}>
            ✨ {selectedTitle}
          </div>
        )}

        {/* Level and XP */}
        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 500 }}>
          Level {level} • {xp} XP
        </div>
      </div>
    </div>
  );
};

export default ProfileHeaderCard;
