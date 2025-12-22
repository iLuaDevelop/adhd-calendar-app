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
  getDoc
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
    const q = query(
      messagesRef,
      where('senderUid', 'in', [userUid, friendUid]),
      where('recipientUid', 'in', [userUid, friendUid]),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Filter messages between these two specific users
      const messages = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as FirebaseMessage))
        .filter(msg => 
          (msg.senderUid === userUid && msg.recipientUid === friendUid) ||
          (msg.senderUid === friendUid && msg.recipientUid === userUid)
        );
      
      callback(messages);
    });

    return unsubscribe;
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
    const messagesRef = collection(db, 'messages');
    
    // Get all messages involving this user
    const q = query(
      messagesRef,
      where('senderUid', '==', userUid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const conversationMap = new Map<string, Conversation>();

      // Process sent messages
      for (const msgDoc of snapshot.docs) {
        const msg = msgDoc.data();
        const friendUid = msg.recipientUid;
        const friendUsername = msg.recipientUsername;

        if (!conversationMap.has(friendUid)) {
          conversationMap.set(friendUid, {
            friendId: friendUid,
            friendUid: friendUid,
            friendUsername: friendUsername,
            lastMessage: msg.text,
            lastMessageTime: msg.timestamp,
            unreadCount: 0,
          });
        }
      }

      // Also get received messages
      const q2 = query(
        messagesRef,
        where('recipientUid', '==', userUid),
        orderBy('createdAt', 'desc')
      );

      const receivedSnapshot = await getDocs(q2);
      
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
            unreadCount: msg.read ? 0 : 1,
          });
        } else {
          const existing = conversationMap.get(friendUid)!;
          if (msg.timestamp.toMillis() > existing.lastMessageTime.toMillis()) {
            existing.lastMessage = msg.text;
            existing.lastMessageTime = msg.timestamp;
          }
        }
      }

      const conversations = Array.from(conversationMap.values())
        .sort((a, b) => b.lastMessageTime.toMillis() - a.lastMessageTime.toMillis());
      
      callback(conversations);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to conversations:', error);
    throw error;
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
 * Search for users by username (for adding friends)
 */
export const searchUsers = async (username: string): Promise<any[]> => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Get user profile to search by username
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('username', '==', username)
    );

    const snapshot = await getDocs(q);
    const results = snapshot.docs
      .map(doc => ({
        uid: doc.id,
        ...doc.data(),
      }))
      .filter(user => user.uid !== currentUser.uid); // Don't include self

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
