import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import {
  sendMessage as sendMessageService,
  subscribeToConversation,
  subscribeToConversations,
  deleteConversation as deleteConversationFirestore,
  searchUsers,
  getUserProfile,
  FirebaseMessage,
  Conversation,
  FriendRequest,
  sendFriendRequest,
  subscribeToPendingRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend as removeFriendService,
  subscribeToUserProfile,
} from '../../services/messaging';

interface SocialMenuProps {
  open: boolean;
  onClose: () => void;
  currentProfile?: any;
}

const FRIENDS_KEY = 'adhd_friends';
const PROFILE_KEY = 'adhd_profile';

interface Friend {
  id: string;
  uid: string;
  username: string;
  hashtag: string;
  avatar: string;
  customAvatarUrl?: string;
}

interface Message {
  id: string;
  from: string;
  to: string;
  text: string;
  timestamp: number;
}

const SocialMenu: React.FC<SocialMenuProps> = ({ open, onClose, currentProfile }) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'messages' | 'requests'>('friends');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [newFriendUsername, setNewFriendUsername] = useState('');
  const [newFriendHashtag, setNewFriendHashtag] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [messages, setMessages] = useState<FirebaseMessage[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friendToRemove, setFriendToRemove] = useState<Friend | null>(null);

  // Log whenever friends state changes
  useEffect(() => {
    console.log('[SocialMenu] RENDER: Friends state changed, now have', friends.length, 'friends:', friends.map(f => ({ uid: f.uid, avatar: f.avatar })));
  }, [friends]);
  const [isScrolledUp, setIsScrolledUp] = useState(false);

  const messagesContainerRef = React.useRef<HTMLDivElement>(null);

  // Common emojis for quick access
  const EMOJIS = ['😀', '😂', '😍', '🤔', '😎', '🎉', '🔥', '👍', '❤️', '✨', '🚀', '💪', '🤝', '😅', '🎊', '💯'];

  const auth = getAuth();
  const currentUser = auth.currentUser;


  // Load user profile from Firestore and set up conversation listener
  useEffect(() => {
    if (!currentUser) {
      setUserProfile(null);
      return;
    }

    const loadProfile = async () => {
      try {
        const profile = await getUserProfile(currentUser.uid);
        if (profile) {
          setUserProfile(profile);
          // Load friends from profile
          if (profile.friends) {
            setFriends(profile.friends);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadProfile();

    // Subscribe to user's own profile changes
    const unsubscribeOwnProfile = subscribeToUserProfile(currentUser.uid, (updatedProfile) => {
      console.log('[SocialMenu] Own profile updated:', { avatar: updatedProfile.avatar, customAvatarUrl: !!updatedProfile.customAvatarUrl });
      setUserProfile(prev => prev ? { ...prev, ...updatedProfile } : updatedProfile);
    });

    // Subscribe to conversations
    try {
      const unsubscribe = subscribeToConversations(currentUser.uid, (convs) => {
        setConversations(convs);
      });
      
      // Subscribe to friend requests
      const unsubscribeRequests = subscribeToPendingRequests(currentUser.uid, (requests) => {
        setFriendRequests(requests);
      });

      return () => {
        unsubscribe();
        unsubscribeRequests();
        unsubscribeOwnProfile();
      };
    } catch (error) {
      console.error('Error subscribing to conversations:', error);
    }
  }, [currentUser]);

  // Subscribe to profile changes for all friends to update avatars in real-time
  useEffect(() => {
    if (friends.length === 0) return;

    const unsubscribers: Array<() => void> = [];
    const friendUids = friends.map(f => f.uid);

    console.log('[SocialMenu] Setting up profile listeners for', friendUids.length, 'friends:', friendUids);

    friendUids.forEach(friendUid => {
      try {
        console.log('[SocialMenu] Setting up profile listener for friend:', friendUid);
        const unsubscribe = subscribeToUserProfile(friendUid, (updatedProfile) => {
          console.log('[SocialMenu] 🔔 Friend profile callback FIRED for:', friendUid);
          console.log('[SocialMenu] Callback received avatar:', updatedProfile.avatar);
          console.log('[SocialMenu] Callback received full profile:', {
            avatar: updatedProfile.avatar,
            username: updatedProfile.username,
            hashtag: updatedProfile.hashtag,
            uid: updatedProfile.uid,
          });
          
          setFriends(prevFriends => {
            console.log('[SocialMenu] Before state update - current friends:', prevFriends.map(f => ({ uid: f.uid, avatar: f.avatar })));
            
            const updated = prevFriends.map(f =>
              f.uid === friendUid
                ? {
                    ...f,
                    avatar: updatedProfile.avatar || f.avatar,
                    customAvatarUrl: updatedProfile.customAvatarUrl || f.customAvatarUrl,
                    username: updatedProfile.username || f.username,
                    hashtag: updatedProfile.hashtag || f.hashtag,
                  }
                : f
            );
            
            const friend = updated.find(f => f.uid === friendUid);
            if (friend) {
              console.log('[SocialMenu] ✅ Updated friend in state:', {
                uid: friendUid,
                oldAvatar: prevFriends.find(f => f.uid === friendUid)?.avatar,
                newAvatar: friend.avatar,
              });
            }
            
            console.log('[SocialMenu] After state update - new friends:', updated.map(f => ({ uid: f.uid, avatar: f.avatar })));
            return updated;
          });

          // Also update selected friend if it's this user
          if (selectedFriend?.uid === friendUid) {
            console.log('[SocialMenu] Updating selectedFriend avatar from', selectedFriend.avatar, 'to', updatedProfile.avatar);
            setSelectedFriend(prev =>
              prev
                ? {
                    ...prev,
                    avatar: updatedProfile.avatar || prev.avatar,
                    customAvatarUrl: updatedProfile.customAvatarUrl || prev.customAvatarUrl,
                    username: updatedProfile.username || prev.username,
                    hashtag: updatedProfile.hashtag || prev.hashtag,
                  }
                : prev
            );
          }
        });

        unsubscribers.push(unsubscribe);
      } catch (error) {
        console.error('[SocialMenu] Error subscribing to friend profile:', error);
      }
    });

    return () => {
      console.log('[SocialMenu] Cleaning up profile listeners for friends:', friendUids);
      unsubscribers.forEach(unsub => unsub());
    };
  }, [friends.map(f => f.uid).join(','), selectedFriend?.uid]);  const addFriend = async () => {
    setErrorMessage('');
    
    if (!newFriendUsername.trim()) {
      setErrorMessage('Username is required');
      return;
    }

    if (!newFriendHashtag.trim()) {
      setErrorMessage('Hashtag is required');
      return;
    }

    if (!currentUser || !userProfile) {
      setErrorMessage('You must be logged in');
      return;
    }

    try {
      setLoading(true);
      
      console.log('Adding friend - Username:', newFriendUsername.trim(), 'Hashtag:', newFriendHashtag.trim());
      
      // Search for user in Firestore by username and hashtag
      const results = await searchUsers(newFriendUsername.trim(), newFriendHashtag.trim());
      
      if (results.length === 0) {
        setErrorMessage('User not found');
        return;
      }

      const foundUser = results[0];
      
      // Check if already a friend
      if (friends.some(f => f.uid === foundUser.uid)) {
        setErrorMessage('Already friends with this user');
        return;
      }

      // Check if request already pending
      if (friendRequests.some(r => r.fromUid === currentUser.uid && r.toUid === foundUser.uid)) {
        setErrorMessage('Friend request already sent');
        return;
      }

      // Send friend request instead of directly adding
      await sendFriendRequest(foundUser.uid, foundUser.username, userProfile.username);
      
      setNewFriendUsername('');
      setNewFriendHashtag('');
      setErrorMessage('');
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      setErrorMessage(error.message || 'Failed to send friend request');
    } finally {
      setLoading(false);
    }
  };

  const removeFriend = (friend: Friend) => {
    setFriendToRemove(friend);
  };

  const confirmRemoveFriend = async () => {
    if (!friendToRemove || !currentUser) return;

    try {
      setLoading(true);
      
      // Remove from Firestore (both users' friend lists)
      await removeFriendService(currentUser.uid, friendToRemove.uid);
      
      // Remove from current user's friends list
      const updatedFriends = friends.filter(f => f.uid !== friendToRemove.uid);
      setFriends(updatedFriends);

      // Save to localStorage as backup
      const friendsSet = new Set(updatedFriends.map(f => f.uid));
      localStorage.setItem(FRIENDS_KEY, JSON.stringify(Array.from(friendsSet)));
      
      if (selectedFriend?.uid === friendToRemove.uid) {
        setSelectedFriend(null);
      }

      setFriendToRemove(null);
    } catch (error) {
      console.error('Error removing friend:', error);
      setErrorMessage('Failed to remove friend');
    } finally {
      setLoading(false);
    }
  };

  const cancelRemoveFriend = () => {
    setFriendToRemove(null);
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedFriend || !currentUser || !userProfile) return;

    try {
      setLoading(true);
      
      await sendMessageService(
        selectedFriend.uid,
        selectedFriend.username,
        messageText,
        userProfile.username
      );

      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
      setErrorMessage('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const addEmoji = (emoji: string) => {
    setMessageText(messageText + emoji);
    setShowEmojiPicker(false);
  };

  const deleteConversation = async (friendUid: string) => {
    if (!currentUser) return;

    try {
      await deleteConversationFirestore(currentUser.uid, friendUid);
      if (selectedFriend?.uid === friendUid) {
        setSelectedFriend(null);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      setErrorMessage('Failed to delete conversation');
    }
  };

  const handleAcceptRequest = async (request: FriendRequest) => {
    try {
      setLoading(true);
      await acceptFriendRequest(request.id, request.fromUid, request.fromUsername);
      // Reload profile to get updated friends list
      if (currentUser) {
        const profile = await getUserProfile(currentUser.uid);
        if (profile && profile.friends) {
          setFriends(profile.friends);
        }
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      setErrorMessage('Failed to accept friend request');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      setLoading(true);
      await rejectFriendRequest(requestId);
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      setErrorMessage('Failed to reject friend request');
    } finally {
      setLoading(false);
    }
  };

  // Set up listener for selected conversation
  useEffect(() => {
    if (!selectedFriend || !currentUser) {
      setMessages([]);
      return;
    }

    try {
      const unsubscribe = subscribeToConversation(
        currentUser.uid,
        selectedFriend.uid,
        (msgs) => {
          setMessages(msgs);
        }
      );
      return () => unsubscribe();
    } catch (error) {
      console.error('Error subscribing to conversation:', error);
    }
  }, [selectedFriend, currentUser]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          setIsScrolledUp(false);
        }
      }, 0);
    }
  }, [messages, selectedFriend]);

  // Handle scroll detection for showing "scroll to bottom" button
  const handleMessagesScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setIsScrolledUp(!isAtBottom);
    }
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      setIsScrolledUp(false);
    }
  };

  return (
    <>
      <aside 
        className={`sidebar ${open ? 'open' : ''}`} 
        aria-hidden={!open} 
        style={{
          left: 'auto',
          right: 0,
          transform: open ? 'translateX(0)' : 'translateX(110%)',
        }}
      >
        <div className="sidebar-inner panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, textAlign: 'center' }}>
            <h4 style={{ margin: 0, flex: 1, fontSize: '1.3rem' }}>👥 Social</h4>
            <button 
              onClick={() => {
                console.log('Close button clicked, calling onClose');
                onClose();
              }} 
              className="btn ghost"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          {/* Tab Switcher */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
            <button
              onClick={() => setActiveTab('friends')}
              style={{
                flex: 1,
                padding: '6px 12px',
                border: 'none',
                background: activeTab === 'friends' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'friends' ? 'white' : 'var(--text)',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: activeTab === 'friends' ? 'bold' : 'normal',
                fontSize: '0.9rem',
              }}
            >
              Friends
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              style={{
                flex: 1,
                padding: '6px 12px',
                border: 'none',
                background: activeTab === 'requests' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'requests' ? 'white' : 'var(--text)',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: activeTab === 'requests' ? 'bold' : 'normal',
                fontSize: '0.9rem',
                position: 'relative',
              }}
            >
              Requests
              {friendRequests.length > 0 && (
                <span style={{ position: 'absolute', top: -8, right: -8, background: 'var(--danger, #ff6b6b)', color: 'white', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  {friendRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              style={{
                flex: 1,
                padding: '6px 12px',
                border: 'none',
                background: activeTab === 'messages' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'messages' ? 'white' : 'var(--text)',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: activeTab === 'messages' ? 'bold' : 'normal',
                fontSize: '0.9rem',
              }}
            >
              Messages
            </button>
          </div>

          {/* Friends Tab */}
          {activeTab === 'friends' && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    type="text"
                    placeholder="Username"
                    value={newFriendUsername}
                    onChange={(e) => {setNewFriendUsername(e.target.value); setErrorMessage('');}}
                    onKeyPress={(e) => e.key === 'Enter' && addFriend()}
                    className="input"
                    style={{ flex: 1 }}
                    disabled={loading}
                  />
                  <input
                    type="text"
                    placeholder="Hashtag"
                    value={newFriendHashtag}
                    onChange={(e) => {setNewFriendHashtag(e.target.value); setErrorMessage('');}}
                    onKeyPress={(e) => e.key === 'Enter' && addFriend()}
                    className="input"
                    style={{ flex: 1 }}
                    disabled={loading}
                  />
                </div>
                {errorMessage && (
                  <div style={{ color: 'var(--danger, #ff6b6b)', fontSize: '0.85rem', padding: 8, background: 'rgba(255, 107, 107, 0.1)', borderRadius: 4, marginBottom: 8 }}>
                    {errorMessage}
                  </div>
                )}
                <button
                  onClick={addFriend}
                  className="btn"
                  style={{ width: '100%' }}
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Friend'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto' }}>
                {/* User Profile Card */}
                {userProfile && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: 12,
                      background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)',
                      borderRadius: 8,
                      border: '2px solid var(--accent-2)',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Banner glow effect */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      right: -20,
                      width: 100,
                      height: 100,
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '50%',
                      pointerEvents: 'none'
                    }} />
                    
                    {userProfile.customAvatarUrl ? (
                      <img src={userProfile.customAvatarUrl} alt={userProfile.username} style={{ width: '2rem', height: '2rem', borderRadius: '50%', objectFit: 'cover', position: 'relative', zIndex: 1 }} />
                    ) : (
                      <div style={{ fontSize: '1.5rem', position: 'relative', zIndex: 1 }}>{userProfile.avatar}</div>
                    )}
                    <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'white' }}>{userProfile.username}<span style={{ color: 'rgba(255,255,255,0.8)', marginLeft: 4 }}>#{userProfile.hashtag}</span></div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: 500, letterSpacing: 0.5 }}>YOU</div>
                    </div>
                  </div>
                )}

                {/* Friends List */}
                {friends.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 16 }}>
                    No friends yet. Add one to get started!
                  </div>
                ) : (
                  friends.map(friend => {
                    console.log('[SocialMenu] Rendering friend card:', { uid: friend.uid, avatar: friend.avatar, username: friend.username });
                    return (
                    <div
                      key={friend.uid}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: 8,
                        background: 'var(--panel)',
                        borderRadius: 6,
                        border: '1px solid var(--border)',
                      }}
                    >
                      {friend.customAvatarUrl ? (
                        <img src={friend.customAvatarUrl} alt={friend.username} style={{ width: '1.5rem', height: '1.5rem', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ fontSize: '1.2rem' }}>{friend.avatar}</div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{friend.username}<span style={{ color: 'var(--muted)', marginLeft: 4 }}>#{friend.hashtag}</span></div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedFriend(friend);
                          setActiveTab('messages');
                        }}
                        className="btn ghost"
                        style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                      >
                        💬
                      </button>
                      <button
                        onClick={() => removeFriend(friend)}
                        className="btn ghost"
                        style={{ padding: '4px 8px', fontSize: '0.8rem', color: 'var(--danger, #ff6b6b)' }}
                      >
                        ✕
                      </button>
                    </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Friend Requests Tab */}
          {activeTab === 'requests' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 'calc(100% - 60px)', overflowY: 'auto' }}>
              {friendRequests.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 16 }}>
                  No pending friend requests
                </div>
              ) : (
                friendRequests.map(request => (
                  <div
                    key={request.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      padding: 12,
                      background: 'var(--panel)',
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: '1.2rem' }}>👤</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{request.fromUsername}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {new Date(request.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleAcceptRequest(request)}
                        className="btn"
                        style={{ flex: 1, fontSize: '0.85rem', padding: '6px 8px' }}
                        disabled={loading}
                      >
                        ✓ Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        className="btn ghost"
                        style={{ flex: 1, fontSize: '0.85rem', padding: '6px 8px', color: 'var(--danger, #ff6b6b)' }}
                        disabled={loading}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 60px)' }}>
              {selectedFriend ? (
                <>
                  <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                    <button
                      onClick={() => setSelectedFriend(null)}
                      className="btn ghost"
                      style={{ marginBottom: 8 }}
                    >
                      ← Back
                    </button>
                    <div style={{ fontWeight: 'bold' }}>
                      {selectedFriend.username}<span style={{ color: 'var(--muted)', marginLeft: 4 }}>#{selectedFriend.hashtag}</span>
                    </div>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12, minHeight: 200, maxHeight: 300, padding: 8, background: 'var(--panel)', borderRadius: 6, position: 'relative' }} ref={messagesContainerRef} onScroll={handleMessagesScroll}>
                    {messages.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 16 }}>
                        No messages yet. Start a conversation!
                      </div>
                    ) : (
                      messages.map(msg => (
                        <div
                          key={msg.id}
                          style={{
                            marginBottom: 8,
                            padding: 8,
                            background: msg.senderUid === currentUser?.uid ? 'var(--primary)' : 'var(--border)',
                            borderRadius: 6,
                            color: msg.senderUid === currentUser?.uid ? 'white' : 'var(--text)',
                            textAlign: msg.senderUid === currentUser?.uid ? 'right' : 'left',
                          }}
                        >
                          <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: 4 }}>
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </div>
                          <div>{msg.text}</div>
                        </div>
                      ))
                    )}

                    {/* Scroll to Bottom Button */}
                    {isScrolledUp && (
                      <button
                        onClick={scrollToBottom}
                        style={{
                          position: 'sticky',
                          bottom: 8,
                          right: 8,
                          background: 'var(--primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 20,
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          zIndex: 10,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                          transition: 'all 0.2s',
                          width: 'fit-content',
                          marginLeft: 'auto',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--accent)';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--primary)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        ↓ Bottom
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      placeholder="Type message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="input"
                      style={{ flex: 1 }}
                      disabled={loading}
                    />
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="btn ghost"
                      style={{ padding: '8px 12px' }}
                      title="Add emoji"
                    >
                      😊
                    </button>
                    <button
                      onClick={sendMessage}
                      className="btn"
                      style={{ padding: '8px 12px' }}
                      disabled={loading}
                    >
                      {loading ? '...' : 'Send'}
                    </button>
                  </div>
                  
                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: 6,
                      padding: 8,
                      background: 'var(--panel)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      marginTop: 8,
                    }}>
                      {EMOJIS.map((emoji, idx) => (
                        <button
                          key={idx}
                          onClick={() => addEmoji(emoji)}
                          style={{
                            padding: '6px',
                            fontSize: '1.5rem',
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            borderRadius: 4,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--primary)';
                            e.currentTarget.style.transform = 'scale(1.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
                  {conversations.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 16 }}>
                      No messages yet. Start a conversation from the Friends tab!
                    </div>
                  ) : (
                    conversations.map(conv => {
                      const friend = friends.find(f => f.uid === conv.friendUid);
                      if (!friend) return null;

                      return (
                        <div
                          key={conv.friendUid}
                          style={{
                            display: 'flex',
                            gap: 12,
                            alignItems: 'center',
                          }}
                        >
                          <button
                            onClick={() => setSelectedFriend(friend)}
                            style={{
                              display: 'flex',
                              gap: 12,
                              padding: 12,
                              background: 'linear-gradient(135deg, var(--accent) 0%, rgba(99, 102, 241, 0.1) 100%)',
                              border: '1px solid var(--accent)',
                              borderRadius: 8,
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.2s',
                              alignItems: 'center',
                              flex: 1,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, var(--accent) 0%, rgba(99, 102, 241, 0.2) 100%)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'linear-gradient(135deg, var(--accent) 0%, rgba(99, 102, 241, 0.1) 100%)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            {friend.customAvatarUrl ? (
                              <img src={friend.customAvatarUrl} alt={friend.username} style={{ width: '2rem', height: '2rem', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                            ) : (
                              <div style={{ fontSize: '2rem', flexShrink: 0, lineHeight: 1 }}>
                                {friend.avatar}
                              </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'white', marginBottom: 4 }}>
                                {friend.username}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4 }}>
                                <span style={{ fontWeight: '500' }}>
                                  {conv.lastMessage.substring(0, 30)}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                                {new Date(conv.lastMessageTime.toMillis()).toLocaleDateString()}
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={() => deleteConversation(conv.friendUid)}
                            className="btn ghost"
                            style={{
                              padding: '6px 8px',
                              fontSize: '1rem',
                              color: 'var(--danger, #ff6b6b)',
                              flexShrink: 0,
                              transition: 'all 0.2s',
                            }}
                            title="Delete conversation"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 107, 107, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Remove Friend Confirmation Modal */}
        {friendToRemove && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              background: 'var(--panel)',
              border: '2px solid var(--border)',
              borderRadius: 8,
              padding: 24,
              maxWidth: 300,
              textAlign: 'center',
            }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>Remove Friend?</h3>
              <div style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '0.9rem' }}>
                Remove <strong>{friendToRemove.username}</strong> from your friends list?
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={confirmRemoveFriend}
                  className="btn"
                  style={{ flex: 1, background: 'var(--danger, #ff6b6b)', color: 'white' }}
                  disabled={loading}
                >
                  {loading ? 'Removing...' : 'Remove'}
                </button>
                <button
                  onClick={cancelRemoveFriend}
                  className="btn ghost"
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>

      <div 
        className={`sidebar-backdrop ${open ? 'open' : ''}`} 
        onClick={onClose} 
      />
    </>
  );
};

export default SocialMenu;
