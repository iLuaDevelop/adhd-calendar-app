import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import Dashboard from './pages/Dashboard';
import DayView from './pages/DayView';
import WeekView from './pages/WeekView';
import MonthView from './pages/MonthView';
import Settings from './pages/Settings';
import Store from './pages/Store';
import Leaderboards from './pages/Leaderboards';
import Quests from './pages/Quests';
import PersonalInsights from './pages/PersonalInsights';
import Pet from './pages/Pet';
import SkillTree from './pages/SkillTree';
import XPBar from './components/UI/XPBar';
import Sidebar from './components/UI/Sidebar';
import SocialMenu from './components/UI/SocialMenu';
import QuestsMenu from './components/UI/QuestsMenu';
import CurrencyDisplay from './components/UI/CurrencyDisplay';
import DevMenuModal from './components/DevMenu/DevMenuModal';
import { subscribeToConversations, subscribeToPendingRequests } from './services/messaging';
import { playMessageNotificationSound, playFriendRequestSound } from './services/sounds';

const App: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [socialMenuOpen, setSocialMenuOpen] = useState(false);
  const [questsMenuOpen, setQuestsMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [conversations, setConversations] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const keySequenceRef = React.useRef<string[]>([]);

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

  // Global listener for conversations and friend requests (stays active even when menu is closed)
  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setNotificationCount(0);
      setConversations([]);
      setFriendRequests([]);
      return;
    }

    console.log('[App] Setting up global conversation and friend request listeners');

    // Subscribe to conversations globally
    const unsubscribeConversations = subscribeToConversations(currentUser.uid, (convs) => {
      console.log('[App] Conversations updated globally:', convs.length, 'conversations');
      setConversations(convs);
      const unreadCount = convs.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      setNotificationCount(prev => prev - (conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)) + unreadCount);
      playMessageNotificationSound();
    });

    // Subscribe to friend requests globally
    const unsubscribeRequests = subscribeToPendingRequests(currentUser.uid, (requests) => {
      console.log('[App] Friend requests updated globally:', requests.length, 'requests');
      setFriendRequests(requests);
      if (requests.length > friendRequests.length) {
        playFriendRequestSound();
      }
      setNotificationCount(prev => prev - friendRequests.length + requests.length);
    });

    return () => {
      unsubscribeConversations();
      unsubscribeRequests();
    };
  }, []);

  return (
    <Router>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* top-left triple-dash hamburger and top-right currency display */}
        <div className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 120, paddingLeft: 16 }}>
          <div style={{width: 40, height: 40}}>
            {!menuOpen && (
              <button className="hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
                <span className="hamburger-line" />
                <span className="hamburger-line" />
                <span className="hamburger-line" />
              </button>
            )}
          </div>
          <CurrencyDisplay />
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
          marginBottom: '120px'
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
            <Route path="/pet" component={Pet} />
            <Route path="/skills" component={SkillTree} />
            <Route path="/settings" component={Settings} />
          </Switch>
        </div>

        <XPBar />

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
        )}}

        <DevMenuModal />
      </div>
    </Router>
  );
};

export default App;