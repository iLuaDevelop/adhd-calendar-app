import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  getDocs,
  Timestamp,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { getAuth } from 'firebase/auth';

export interface FirebaseMessage {
  id: string;
  senderUid: string;
  senderUsername: string;
  recipientUid: string;
  recipientUsername: string;
  text: string;
  timestamp: Timestamp;
  createdAt: number;
}

export interface Conversation {
  friendId: string;
  friendUid: string;
  friendUsername: string;
  lastMessage: string;
  lastMessageTime: Timestamp;
  unreadCount: number;
}

export interface FriendRequest {
  id: string;
  fromUid: string;
  fromUsername: string;
  toUid: string;
  toUsername: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

/**
 * Send a message to a friend
 */
export const sendMessage = async (
  recipientUid: string,
  recipientUsername: string,
  messageText: string,
  senderUsername: string
) => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const messagesRef = collection(db, 'messages');
    
    const newMessage = {
      senderUid: currentUser.uid,
      senderUsername: senderUsername,
      recipientUid: recipientUid,
      recipientUsername: recipientUsername,
      text: messageText,
      timestamp: Timestamp.now(),
      createdAt: Date.now(),
      read: false,
    };

    const docRef = await addDoc(messagesRef, newMessage);
    return { id: docRef.id, ...newMessage };
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Listen to messages between two users in real-time
 */
export const subscribeToConversation = (
  userUid: string,
  friendUid: string,
  callback: (messages: FirebaseMessage[]) => void
) => {
  try {
    const messagesRef = collection(db, 'messages');
    
    // Query for messages sent by user to friend OR sent by friend to user
    // We'll use two separate queries and merge results
    // Note: No orderBy in Firestore to avoid composite index requirement
    const q1 = query(
      messagesRef,
      where('senderUid', '==', userUid),
      where('recipientUid', '==', friendUid)
    );

    const q2 = query(
      messagesRef,
      where('senderUid', '==', friendUid),
      where('recipientUid', '==', userUid)
    );

    // Subscribe to both queries
    const unsubscribe1 = onSnapshot(q1, (snapshot1) => {
      const messages1 = snapshot1.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as FirebaseMessage));

      onSnapshot(q2, (snapshot2) => {
        const messages2 = snapshot2.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as FirebaseMessage));

        // Merge and sort by timestamp (done client-side)
        const allMessages = [...messages1, ...messages2].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        callback(allMessages);
      });
    });

    return unsubscribe1;
  } catch (error) {
    console.error('Error subscribing to conversation:', error);
    throw error;
  }
};

/**
 * Get all unique conversations for a user
 */
export const subscribeToConversations = (
  userUid: string,
  callback: (conversations: Conversation[]) => void
) => {
  try {
    console.log('[subscribeToConversations] Setting up listener for user:', userUid);
    const messagesRef = collection(db, 'messages');
    
    // Get all received messages (the important ones for unread count)
    const q = query(
      messagesRef,
      where('recipientUid', '==', userUid)
    );

    const unsubscribe = onSnapshot(q, (receivedSnapshot) => {
      console.log('[subscribeToConversations] Received update - received messages count:', receivedSnapshot.docs.length);
      const conversationMap = new Map<string, Conversation>();
      
      // Process received messages
      for (const msgDoc of receivedSnapshot.docs) {
        const msg = msgDoc.data();
        const friendUid = msg.senderUid;
        const friendUsername = msg.senderUsername;

        if (!conversationMap.has(friendUid)) {
          conversationMap.set(friendUid, {
            friendId: friendUid,
            friendUid: friendUid,
            friendUsername: friendUsername,
            lastMessage: msg.text,
            lastMessageTime: msg.timestamp,
            unreadCount: msg.read === false ? 1 : 0,
          });
        } else {
          const existing = conversationMap.get(friendUid)!;
          if (msg.timestamp.toMillis() > existing.lastMessageTime.toMillis()) {
            existing.lastMessage = msg.text;
            existing.lastMessageTime = msg.timestamp;
          }
          // Count unread messages from this friend
          if (msg.read === false) {
            existing.unreadCount = (existing.unreadCount || 0) + 1;
          }
        }
      }

      // Sort conversations client-side by last message time
      const conversations = Array.from(conversationMap.values())
        .sort((a, b) => b.lastMessageTime.toMillis() - a.lastMessageTime.toMillis());
      
      console.log('[subscribeToConversations] Calling callback with conversations:', conversations.length, 'unread summary:', conversations.map(c => ({ friend: c.friendUsername, unread: c.unreadCount })));
      callback(conversations);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to conversations:', error);
    throw error;
  }
};

/**
 * Mark all unread messages from a friend as read
 */
export const markMessagesAsRead = async (userUid: string, friendUid: string) => {
  try {
    const messagesRef = collection(db, 'messages');
    
    // Get all unread messages from this friend
    const q = query(
      messagesRef,
      where('recipientUid', '==', userUid),
      where('senderUid', '==', friendUid),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    console.log('[markMessagesAsRead] Found', snapshot.docs.length, 'unread messages to mark as read');
    
    const updatePromises = snapshot.docs.map(doc =>
      updateDoc(doc.ref, { read: true })
    );

    await Promise.all(updatePromises);
    console.log('[markMessagesAsRead] Successfully marked all messages as read');
  } catch (error) {
    console.error('[markMessagesAsRead] Error:', error);
  }
};

/**
 * Delete a conversation (all messages with a friend)
 */
export const deleteConversation = async (userUid: string, friendUid: string) => {
  try {
    const messagesRef = collection(db, 'messages');
    
    // Get all messages between these users
    const q = query(
      messagesRef,
      where('senderUid', 'in', [userUid, friendUid]),
      where('recipientUid', 'in', [userUid, friendUid])
    );

    const snapshot = await getDocs(q);
    
    // Delete each message
    const deletePromises = snapshot.docs
      .filter(doc => {
        const msg = doc.data();
        return (msg.senderUid === userUid && msg.recipientUid === friendUid) ||
               (msg.senderUid === friendUid && msg.recipientUid === userUid);
      })
      .map(doc => deleteDoc(doc.ref));

    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
};

/**
 * Search for users by username and hashtag
 */
export const searchUsers = async (username: string, hashtag: string): Promise<any[]> => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Get user profile to search by username first
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('username', '==', username)
    );

    const snapshot = await getDocs(q);
    
    // Try different hashtag formats to be flexible
    const hashtagVariants = [
      hashtag,
      hashtag.startsWith('#') ? hashtag : '#' + hashtag,
      hashtag.startsWith('#') ? hashtag.substring(1) : hashtag,
    ];
    
    console.log('Searching for username:', username);
    console.log('Hashtag variants to try:', hashtagVariants);
    console.log('Found users with this username:', snapshot.docs.length);
    
    const results = snapshot.docs
      .map(doc => ({
        uid: doc.id,
        ...doc.data(),
      }))
      .filter(user => {
        if (user.uid === currentUser.uid) return false; // Skip self
        console.log('Checking user:', user.username, 'with hashtag:', user.hashtag);
        return hashtagVariants.includes(user.hashtag);
      });

    console.log('Final matching results:', results);
    return results;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

/**
 * Get user profile by UID
 */
export const getUserProfile = async (uid: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { uid: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Send a friend request
 */
export const sendFriendRequest = async (
  toUid: string,
  toUsername: string,
  fromUsername: string
) => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Check if request already exists
    const requestsRef = collection(db, 'friendRequests');
    const existingQuery = query(
      requestsRef,
      where('fromUid', '==', currentUser.uid),
      where('toUid', '==', toUid)
    );
    
    const existing = await getDocs(existingQuery);
    if (!existing.empty) {
      const existingRequest = existing.docs[0].data();
      if (existingRequest.status === 'pending') {
        throw new Error('Friend request already sent');
      }
    }

    const newRequest = {
      fromUid: currentUser.uid,
      fromUsername: fromUsername,
      toUid: toUid,
      toUsername: toUsername,
      status: 'pending' as const,
      createdAt: Date.now(),
    };

    const docRef = await addDoc(requestsRef, newRequest);
    return { id: docRef.id, ...newRequest };
  } catch (error) {
    console.error('Error sending friend request:', error);
    throw error;
  }
};

/**
 * Accept a friend request
 */
export const acceptFriendRequest = async (requestId: string, fromUid: string, fromUsername: string) => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Update request status
    await updateDoc(doc(db, 'friendRequests', requestId), { status: 'accepted' });

    // Add friend to both users
    const currentUserProfile: any = await getUserProfile(currentUser.uid);
    const otherUserProfile: any = await getUserProfile(fromUid);

    if (currentUserProfile && otherUserProfile) {
      const currentFriends = currentUserProfile.friends || [];
      const otherFriends = otherUserProfile.friends || [];

      if (!currentFriends.find((f: any) => f.uid === fromUid)) {
        currentFriends.push({
          uid: fromUid,
          username: fromUsername,
          hashtag: otherUserProfile.hashtag,
          avatar: otherUserProfile.avatar,
        });
      }

      if (!otherFriends.find((f: any) => f.uid === currentUser.uid)) {
        otherFriends.push({
          uid: currentUser.uid,
          username: currentUserProfile.username,
          hashtag: currentUserProfile.hashtag,
          avatar: currentUserProfile.avatar,
        });
      }

      await updateDoc(doc(db, 'users', currentUser.uid), { friends: currentFriends });
      await updateDoc(doc(db, 'users', fromUid), { friends: otherFriends });
    }
  } catch (error) {
    console.error('Error accepting friend request:', error);
    throw error;
  }
};

/**
 * Reject a friend request
 */
export const rejectFriendRequest = async (requestId: string) => {
  try {
    await updateDoc(doc(db, 'friendRequests', requestId), { status: 'rejected' });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    throw error;
  }
};

/**
 * Get pending friend requests for a user
 */
export const subscribeToPendingRequests = (
  userUid: string,
  callback: (requests: FriendRequest[]) => void
) => {
  try {
    const requestsRef = collection(db, 'friendRequests');
    const q = query(
      requestsRef,
      where('toUid', '==', userUid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as FriendRequest));

      callback(requests);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to friend requests:', error);
    throw error;
  }
};

/**
 * Get friend request status between two users
 */
export const getFriendRequestStatus = async (
  fromUid: string,
  toUid: string
): Promise<'pending' | 'accepted' | 'rejected' | 'none'> => {
  try {
    const requestsRef = collection(db, 'friendRequests');
    const q = query(
      requestsRef,
      where('fromUid', '==', fromUid),
      where('toUid', '==', toUid)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return 'none';
    }

    const request = snapshot.docs[0].data();
    return request.status;
  } catch (error) {
    console.error('Error getting friend request status:', error);
    return 'none';
  }
};

/**
 * Remove a friend (removes from both users' friend lists)
 */
export const removeFriend = async (currentUserUid: string, friendUid: string) => {
  try {
    const currentUserProfile: any = await getUserProfile(currentUserUid);
    const friendProfile: any = await getUserProfile(friendUid);

    if (currentUserProfile && friendProfile) {
      // Remove friend from current user's list
      const currentFriends = (currentUserProfile.friends || []).filter(
        (f: any) => f.uid !== friendUid
      );

      // Remove current user from friend's list
      const friendFriends = (friendProfile.friends || []).filter(
        (f: any) => f.uid !== currentUserUid
      );

      // Update both users in Firestore
      await updateDoc(doc(db, 'users', currentUserUid), { friends: currentFriends });
      await updateDoc(doc(db, 'users', friendUid), { friends: friendFriends });
    }
  } catch (error) {
    console.error('Error removing friend:', error);
    throw error;
  }
};
/**
 * Subscribe to real-time profile changes for a user
 */
export const subscribeToUserProfile = (
  userUid: string,
  callback: (profile: any) => void
) => {
  try {
    const userDoc = doc(db, 'users', userUid);
    const unsubscribe = onSnapshot(userDoc, (snapshot) => {
      if (snapshot.exists()) {
        const fullData = snapshot.data();
        const profileData = { uid: snapshot.id, ...fullData };
        console.log('[Profile Listener] Firestore snapshot received for', userUid);
        console.log('[Profile Listener] Full document data:', fullData);
        console.log('[Profile Listener] Profile data to callback:', {
          avatar: profileData.avatar,
          username: profileData.username,
          hashtag: profileData.hashtag,
          timestamp: new Date().toISOString(),
        });
        callback(profileData);
      } else {
        console.log('[Profile Listener] ⚠️ User document does not exist:', userUid);
      }
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to user profile:', error);
    throw error;
  }
};