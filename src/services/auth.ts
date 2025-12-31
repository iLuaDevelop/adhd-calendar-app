import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { auth, db } from "./firebase";

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  hashtag: string;
  avatar: string;
  customAvatarUrl?: string;
  createdAt: number;
}

// Sign up with email and password
export const signUpWithEmail = async (
  email: string,
  password: string,
  username: string,
  hashtag: string
): Promise<UserProfile> => {
  // Check if username already exists
  const usersRef = collection(db, "users");
  const usernameQuery = query(usersRef, where("username", "==", username));
  const usernameSnapshot = await getDocs(usernameQuery);
  
  if (!usernameSnapshot.empty) {
    throw new Error("Username already taken");
  }

  // Create user with email/password
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Create user profile document
  const userProfile: UserProfile = {
    uid: user.uid,
    email: user.email || email,
    username,
    hashtag,
    avatar: "👤",
    createdAt: Date.now(),
  };

  await setDoc(doc(db, "users", user.uid), userProfile);

  return userProfile;
};

// Sign in with email and password
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<UserProfile> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Get user profile
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists()) {
    throw new Error("User profile not found");
  }

  return userDoc.data() as UserProfile;
};

// Sign out
export const signOutUser = async (): Promise<void> => {
  await signOut(auth);
};

// Listen to auth state changes
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user profile
export const getCurrentUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userDoc = await getDoc(doc(db, "users", uid));
  return userDoc.exists() ? (userDoc.data() as UserProfile) : null;
};

// Sign in as guest anonymously
export const signInAsGuest = async (): Promise<User> => {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error: any) {
    throw error;
  }
};
// Initialize user profile after registration
export const initializeUserProfile = async (
  uid: string,
  profileData: {
    username: string;
    hashtag: string;
    avatar: string;
    tasksCompleted?: number;
    eventsCreated?: number;
  }
): Promise<void> => {
  const userProfile = {
    uid,
    username: profileData.username,
    hashtag: profileData.hashtag,
    avatar: profileData.avatar,
    customAvatarUrl: undefined,
    tasksCompleted: profileData.tasksCompleted || 0,
    eventsCreated: profileData.eventsCreated || 0,
    createdAt: Date.now(),
  };

  // Save to playerProfiles collection (for leaderboard/public profile)
  await setDoc(doc(db, "playerProfiles", uid), userProfile);
  
  // Also save to localStorage
  localStorage.setItem('adhd_profile', JSON.stringify({
    username: profileData.username,
    hashtag: profileData.hashtag,
    avatar: profileData.avatar,
    tasksCompleted: profileData.tasksCompleted || 0,
    eventsCreated: profileData.eventsCreated || 0,
  }));
};