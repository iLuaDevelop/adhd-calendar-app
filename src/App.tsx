import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Route, Switch, useLocation } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from './services/stripe';
import Dashboard from './pages/Dashboard';
import DayView from './pages/DayView';
import WeekView from './pages/WeekView';
import MonthView from './pages/MonthView';
import Settings from './pages/Settings';
import Store from './pages/Store';
import Leaderboards from './pages/Leaderboards';
import Quests from './pages/Quests';
import PersonalInsights from './pages/PersonalInsights';
import SkillTree from './pages/SkillTree';
import MiniGames from './pages/MiniGames';
import Character from './pages/Character';
import XPBar from './components/UI/XPBar';
import Sidebar from './components/UI/Sidebar';
import SocialMenu from './components/UI/SocialMenu';
import QuestsMenu from './components/UI/QuestsMenu';
import TitleBar from './components/UI/TitleBar';
import CurrencyDisplay from './components/UI/CurrencyDisplay';
import ProfileHeaderCard from './components/UI/ProfileHeaderCard';
import AppProfileModal from './components/UI/AppProfileModal';
import ToastDisplay from './components/UI/ToastDisplay';
import DevMenuModal from './components/DevMenu/DevMenuModal';
import { subscribeToConversations, subscribeToPendingRequests } from './services/messaging';
import { initAudioContext } from './services/sounds';
import { useProfileModal } from './context/ProfileModalContext';

const ProfileHeaderCardWrapper: React.FC<{ currentAuthUser: any }> = ({ currentAuthUser }) => {
  const { openProfileModal } = useProfileModal();
  const location = useLocation();
  
  // Hide profile card on Character page since full profile is already displayed
  if (location.pathname === '#/character') {
    return null;
  }
  
  return (
    <ProfileHeaderCard 
      onClick={() => {
        if (currentAuthUser) {
          // Get profile data from localStorage to pass to modal
          const profileKey = 'adhd_profile';
          const stored = localStorage.getItem(profileKey);
          if (stored) {
            const profile = JSON.parse(stored);
            openProfileModal(currentAuthUser.uid, profile.username, profile.avatar);
          } else {
            openProfileModal(currentAuthUser.uid, 'Player', '👤');
          }
        }
      }} 
    />
  );
};

const App: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [socialMenuOpen, setSocialMenuOpen] = useState(false);
  const [questsMenuOpen, setQuestsMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [conversations, setConversations] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [currentAuthUser, setCurrentAuthUser] = useState<any>(null);
  const [forceRender, setForceRender] = useState(false);
  const keySequenceRef = React.useRef<string[]>([]);

  // Force re-render immediately on mount to ensure all elements display
  React.useLayoutEffect(() => {
    setForceRender(true);
  }, []);

  // Initialize AudioContext on first user interaction
  useEffect(() => {
    const handleUserInteraction = async () => {
      await initAudioContext();
      // Remove listener after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  // Global dev menu trigger with Ctrl+Alt+D+F
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only track D and F keys with Ctrl+Alt held
      if (e.ctrlKey && e.altKey) {
        if (e.key === 'd' || e.key === 'D') {
          keySequenceRef.current = ['d'];
        } else if (e.key === 'f' || e.key === 'F') {
          if (keySequenceRef.current.length === 1 && keySequenceRef.current[0] === 'd') {
            e.preventDefault();
            // Dispatch custom event to open dev menu
            window.dispatchEvent(new CustomEvent('devMenuKeyCombo'));
            keySequenceRef.current = [];
          }
        }
      } else {
        // Reset sequence if modifiers are released
        keySequenceRef.current = [];
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Monitor auth state
  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentAuthUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  // Global listener for conversations and friend requests (stays active even when menu is closed)
  useEffect(() => {
    if (!currentAuthUser) {
      setNotificationCount(0);
      setConversations([]);
      setFriendRequests([]);
      return;
    }

    // Subscribe to conversations globally
    const unsubscribeConversations = subscribeToConversations(currentAuthUser.uid, (convs) => {
      setConversations(convs);
    });

    // Subscribe to friend requests globally
    const unsubscribeRequests = subscribeToPendingRequests(currentAuthUser.uid, (requests) => {
      setFriendRequests(requests);
    });

    return () => {
      unsubscribeConversations();
      unsubscribeRequests();
    };
  }, [currentAuthUser]);

  // Calculate total notification count
  useEffect(() => {
    const unreadMessages = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
    const total = unreadMessages + friendRequests.length;
    setNotificationCount(total);
  }, [conversations, friendRequests]);

  return (
    <Router>
      <Elements stripe={getStripe()}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <TitleBar />
        {/* top-left triple-dash hamburger and top-right currency display */}
        <div className="topbar" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', paddingRight: 24, paddingLeft: 16, paddingTop: 16, paddingBottom: 0, overflow: 'hidden' }}>
          <div style={{width: 40, height: 40}}>
            {!menuOpen && (
              <button className="hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
                <span className="hamburger-line" />
                <span className="hamburger-line" />
                <span className="hamburger-line" />
              </button>
            )}
          </div>
          <div style={{flex: 1}} />
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <CurrencyDisplay />
            <ProfileHeaderCardWrapper currentAuthUser={currentAuthUser} />
          </div>
        </div>

        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

        <QuestsMenu open={questsMenuOpen} onClose={() => setQuestsMenuOpen(false)} />

        <SocialMenu 
          open={socialMenuOpen} 
          onClose={() => setSocialMenuOpen(false)} 
          onNotificationCountChange={setNotificationCount}
          initialConversations={conversations}
          initialFriendRequests={friendRequests}
        />

        <div style={{ 
          flex: 1, 
          marginBottom: '20px',
          marginTop: '-50px'
        }}>
          <Switch>
            <Route path="/" exact component={Dashboard} />
            <Route path="/day" component={DayView} />
            <Route path="/week" component={WeekView} />
            <Route path="/month" component={MonthView} />
            <Route path="/store" component={Store} />
            <Route path="/leaderboards" component={Leaderboards} />
            <Route path="/quests" component={Quests} />
            <Route path="/insights" component={PersonalInsights} />
            <Route path="/character" component={Character} />
            <Route path="/skills" component={SkillTree} />
            <Route path="/settings" component={Settings} />
          </Switch>
        </div>

        <XPBar key={currentAuthUser?.uid} />

        {/* Quests Menu Button - Bottom Right, Above Social Menu Button */}
        {!questsMenuOpen && !socialMenuOpen && (
          <button
            onClick={() => setQuestsMenuOpen(true)}
            className="btn"
            style={{
              position: 'fixed',
              bottom: 180,
              right: 24,
              width: 56,
              height: 56,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              zIndex: 100,
            }}
            aria-label="Open quests menu"
            title="Quests"
          >
            🏆
          </button>
        )}

        {/* Social Menu Button - Bottom Right, Above XP Bar */}
        {!socialMenuOpen && !questsMenuOpen && (
          <button
            onClick={() => setSocialMenuOpen(true)}
            className="btn"
            style={{
              position: 'fixed',
              bottom: 100,
              right: 24,
              width: 56,
              height: 56,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              zIndex: 100,
            }}
            aria-label="Open social menu"
            title="Social Menu"
          >
            👥
            {notificationCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -8,
                right: -8,
                background: '#ff4757',
                color: 'white',
                borderRadius: '50%',
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(255, 71, 87, 0.4)',
              }}>
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </button>
        )}

        <DevMenuModal />

        <AppProfileModalRenderer />

        <ToastDisplay />
      </div>
      </Elements>
    </Router>
  );
};

const AppProfileModalRenderer: React.FC = () => {
  const { isOpen, userId, closeProfileModal } = useProfileModal();
  const auth = getAuth();
  
  // Only show if it's the current user's profile (not a friend profile from social menu)
  return isOpen && userId && auth.currentUser && userId === auth.currentUser.uid ? (
    <AppProfileModal open={isOpen} onClose={closeProfileModal} />
  ) : null;
};

export default App;