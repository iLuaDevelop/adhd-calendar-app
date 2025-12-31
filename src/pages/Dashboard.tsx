import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { useCalendar } from '../hooks/useCalendar';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { useProfileModal } from '../context/ProfileModalContext';
import TaskCard from '../components/Task/TaskCard';
import Calendar from '../components/Calendar/Calendar';
import Button from '../components/UI/Button';
import QuickAdd from '../components/Task/QuickAdd';
import PetQuickView from '../components/Pet/PetQuickView';
import { grantXp, getXp, setXp, resetXp } from '../services/xp';
import { getGems, setGems, addGems } from '../services/currency';
import { getMedals } from '../services/medals';
import { getPet, updatePetStats, getPetEmoji, feedPet, getAllPets, getCurrentPetId, setCurrentPet, deletePet } from '../services/pet';
import { getUnlockedSkills, unlockSkill, getAllSkills } from '../services/skillTree';
import { getTitles, unlockTitle, setSelectedTitle, getUnlockedTitles, ALL_TITLES, getSelectedTitle } from '../services/titles';
import { enableCriticalTestMode, disableCriticalTestMode, isCriticalTestModeEnabled, getCriticalChances, enableCrateTestMode, disableCrateTestMode, isCrateTestModeEnabled } from '../services/critical';
import { signUpWithEmail, signInWithEmail, signOutUser, onAuthChange, getCurrentUserProfile, signInAsGuest } from '../services/auth';
import { auth, db } from '../services/firebase';
import { loadGameProgress } from '../services/gameProgress';

const PURCHASES_KEY = 'adhd_purchases';
const DAILY_CREATIONS_KEY = 'adhd_daily_creations';
const PROFILE_KEY = 'adhd_profile';
const STREAK_KEY = 'adhd_streak';
const USERS_KEY = 'adhd_users';
const CURRENT_USER_KEY = 'adhd_current_user';
const BRONZE_CRATE_KEY = 'adhd_bronze_crate_last_opened';
const QUESTS_KEY = 'adhd_quests_progress';

const AVATAR_OPTIONS = ['👤', '😊', '🧠', '🎯', '🌟', '✨', '🚀', '💪', '🎨', '📚', '🎭', '🧘', '🐸', '🦸', '👻', '🤖'];

interface ProfileData {
    username: string;
    hashtag?: string;
    tasksCompleted: number;
    eventsCreated: number;
    avatar: string;
    customAvatarUrl?: string;
}

const getDefaultProfile = (): ProfileData => ({
    username: 'Guest',
    hashtag: '0000',
    tasksCompleted: 0,
    eventsCreated: 0,
    avatar: '👤',
    customAvatarUrl: undefined,
});

// Streak tracking function (must be outside component to use in useState)
const getStreakData = () => {
    const stored = localStorage.getItem(STREAK_KEY);
    const data = stored ? JSON.parse(stored) : { current: 0, lastDate: null, longest: 0 };
    return data;
};

const Dashboard: React.FC = () => {
    const { tasks, events, addTask, updateTask, removeTask } = useCalendar();
    const { showToast } = useToast();
    const { t } = useLanguage();
    const { isOpen: showProfile, closeProfileModal: setShowProfileFalse, openProfileModal } = useProfileModal();
    const history = useHistory();
    const [adding, setAdding] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<{title: string, xp: number} | null>(null);
    const [templateDueDate, setTemplateDueDate] = useState<string>('');
    const [templateHour, setTemplateHour] = useState<number>(9);
    const [templateMinute, setTemplateMinute] = useState<number>(0);
    const [templateAmPm, setTemplateAmPm] = useState<'AM' | 'PM'>('AM');
    const [view, setView] = useState<'day' | 'week' | 'month'>('month');
    const [isInitialLoginModal, setIsInitialLoginModal] = useState(false);
    const [profile, setProfile] = useState<ProfileData>(() => {
        const stored = localStorage.getItem(PROFILE_KEY);
        return stored ? JSON.parse(stored) : getDefaultProfile();
    });
    const [editingName, setEditingName] = useState(false);
    const [editNameValue, setEditNameValue] = useState(profile.username);
    const [editingHashtag, setEditingHashtag] = useState(false);
    const [editHashtagValue, setEditHashtagValue] = useState(profile.hashtag || '');
    const [editingAvatar, setEditingAvatar] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [streak, setStreak] = useState(() => getStreakData());
    const [purchases, setPurchases] = useState<Set<number>>(() => {
        const stored = localStorage.getItem(PURCHASES_KEY);
        return stored ? new Set(JSON.parse(stored)) : new Set();
    });
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [signupUsername, setSignupUsername] = useState('');
    const [signupHashtag, setSignupHashtag] = useState('');
    const [signupError, setSignupError] = useState('');
    const [currentGems, setCurrentGems] = useState(getGems());
    const [currentXp, setCurrentXp] = useState(getXp());
    const [gemInput, setGemInput] = useState('');
    const [medals, setMedals] = useState(() => getMedals());
    const [pet, setPet] = useState(getPet);
    const [gems, setGemsState] = useState(getGems());
    const [unlockedTitles, setUnlockedTitles] = useState(() => getUnlockedTitles());
    const [selectedTitle, setSelectedTitleState] = useState(() => getSelectedTitle());
    const [ownedPets, setOwnedPets] = useState(() => getAllPets());
    const [currentPetId, setCurrentPetIdState] = useState(() => getCurrentPetId());
    const [criticalTestMode, setCriticalTestMode] = useState(isCriticalTestModeEnabled());
    const [crateTestMode, setCrateTestMode] = useState(isCrateTestModeEnabled());
    const [criticalChances, setCriticalChances] = useState(getCriticalChances());

    const taskLimit = purchases.has(4) ? 6 : 3;
    const displayedTasks = tasks.slice(0, taskLimit);

    // Show login modal on initial load if not authenticated
    useEffect(() => {
        // Check if user is already logged in
        const unsubscribe = onAuthChange((user) => {
            // Show modal only if no user AND not already shown
            // Don't show if user is anonymous (isAnonymous = true)
            if (!user) {
                openProfileModal('', '', '');
                setIsInitialLoginModal(true);
            } else if (user.isAnonymous) {
                // Guest user - hide modal
                setShowProfileFalse();
                setIsInitialLoginModal(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // Anti-spam: Track daily task creations (not affected by deletions)
    const getTodayDate = () => new Date().toDateString();
    const getDailyCreationCount = () => {
        const stored = localStorage.getItem(DAILY_CREATIONS_KEY);
        const data = stored ? JSON.parse(stored) : {};
        const today = getTodayDate();
        return data[today] || 0;
    };

    const getRemainingGames = () => {
        const DAILY_GAME_CAP = 5;
        const STORAGE_KEY = 'adhd_game_state';
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return DAILY_GAME_CAP;
        
        const state = JSON.parse(stored);
        const lastDate = localStorage.getItem('adhd_game_state_date');
        const today = new Date().toDateString();
        
        // Reset if new day
        if (lastDate !== today) {
            return DAILY_GAME_CAP;
        }
        
        return Math.max(0, DAILY_GAME_CAP - (state.gamesPlayedToday || 0));
    };
    
    const incrementDailyCreation = () => {
        const stored = localStorage.getItem(DAILY_CREATIONS_KEY);
        const data = stored ? JSON.parse(stored) : {};
        const today = getTodayDate();
        data[today] = (data[today] || 0) + 1;
        // Clean up old dates (older than 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        Object.keys(data).forEach(date => {
            if (new Date(date) < thirtyDaysAgo) {
                delete data[date];
            }
        });
        localStorage.setItem(DAILY_CREATIONS_KEY, JSON.stringify(data));
    };

    const handleAdd = (title: string, due?: string) => {
        if (tasks.length >= taskLimit) {
            showToast(`Task limit reached (${taskLimit}). Unlock more in the Store!`, 'warning');
            return;
        }
        
        const dailyLimit = purchases.has(4) ? 6 : 3;
        const dailyCreations = getDailyCreationCount();
        
        if (dailyCreations >= dailyLimit) {
            showToast(`Daily task creation limit reached (${dailyLimit}). Try again tomorrow or unlock more in the Store!`, 'warning');
            return;
        }
        
        const task = { id: Date.now(), title, description: '', dueDate: due || '', completed: false } as any;
        addTask(task);
        incrementDailyCreation();
        setAdding(false);
    };

    // Streak tracking
    const updateStreak = () => {
        const streakData = getStreakData();
        const today = new Date().toDateString();
        const lastDate = streakData.lastDate;

        if (lastDate === today) {
            // Already updated today
            return;
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (lastDate === yesterdayStr) {
            // Continue streak
            streakData.current += 1;
        } else {
            // Start new streak
            streakData.current = 1;
        }

        streakData.longest = Math.max(streakData.longest, streakData.current);
        streakData.lastDate = today;
        localStorage.setItem(STREAK_KEY, JSON.stringify(streakData));
    };

    // Firebase Auth listener
    useEffect(() => {
        const unsubscribe = onAuthChange(async (firebaseUser) => {
            if (firebaseUser) {
                // User is logged in - load their profile and game progress from Firestore
                setIsLoggedIn(true);
                try {
                    const userProfile = await getCurrentUserProfile(firebaseUser.uid);
                    if (userProfile) {
                        setProfile(userProfile);
                        localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile));
                    }

                    // Load game progress
                    const gameProgress = await loadGameProgress();
                    if (gameProgress) {
                        // Restore XP
                        if (gameProgress.xp !== undefined && gameProgress.xp !== null) {
                            setXp(gameProgress.xp, false); // Don't sync - data is already from Firestore
                        }
                        // Restore gems
                        if (gameProgress.gems !== undefined) {
                            setGems(gameProgress.gems);
                            setCurrentGems(gameProgress.gems);
                        }
                        // Restore purchases
                        if (gameProgress.purchases) {
                            setPurchases(new Set(gameProgress.purchases));
                        }
                        // Restore pets
                        if (gameProgress.pets) {
                            setOwnedPets(gameProgress.pets);
                            if (gameProgress.currentPetId) {
                                setCurrentPet(gameProgress.currentPetId);
                            }
                        }
                        // Restore skills
                        if (gameProgress.unlockedSkills) {
                            // Note: would need to save this to localStorage too
                            const skillsKey = 'adhd_unlocked_skills';
                            localStorage.setItem(skillsKey, JSON.stringify(gameProgress.unlockedSkills));
                        }
                        // Restore titles
                        if (gameProgress?.unlockedTitles?.length || gameProgress?.selectedTitle) {
                            const titlesKey = 'adhd_titles';
                            if (gameProgress.unlockedTitles && gameProgress.unlockedTitles.length > 0) {
                                // Store as the full titles object to match what titles.ts expects
                                const titlesObj = {
                                    unlockedIds: gameProgress.unlockedTitles,
                                    selectedTitleId: gameProgress.selectedTitle || null
                                };
                                localStorage.setItem(titlesKey, JSON.stringify(titlesObj));
                            }
                            // Fire event to notify UI to reload titles
                            window.dispatchEvent(new CustomEvent('titles:restored'));
                        }
                        // Restore pets
                        if (gameProgress?.pets && Array.isArray(gameProgress.pets)) {
                            // Save all pets (default + shop pets) to adhd_pets
                            localStorage.setItem('adhd_pets', JSON.stringify(gameProgress.pets));
                            
                            // Extract and set the default pet (usually the first one or with id starting with 'pet_')
                            if (gameProgress.pets.length > 0) {
                                // Find the first pet that looks like a default pet (created before any shop purchases)
                                const firstPet = gameProgress.pets[0];
                                localStorage.setItem('adhd_pet', JSON.stringify(firstPet));
                            }
                            
                            if (gameProgress.currentPetId) {
                                localStorage.setItem('adhd_current_pet_id', gameProgress.currentPetId);
                            }
                            // Fire event to notify Pet page to reload
                            window.dispatchEvent(new CustomEvent('pets:restored'));
                        }
                        // Restore tasks
                        if (gameProgress.tasks && Array.isArray(gameProgress.tasks)) {
                            localStorage.setItem('adhd_tasks', JSON.stringify(gameProgress.tasks));
                            // Fire event to notify useCalendar to reload from localStorage
                            window.dispatchEvent(new CustomEvent('tasks:restored'));
                        }
                    }
                } catch (error) {
                    console.error('[Auth] Error loading profile/progress from Firestore:', error);
                }
            } else {
                // User is logged out - reset profile to guest
                setIsLoggedIn(false);
                setProfile({
                    username: 'Guest',
                    hashtag: '0000',
                    avatar: '👤',
                    customAvatarUrl: undefined,
                    tasksCompleted: 0,
                    eventsCreated: 0
                });
                
                // Clear all game data from localStorage
                localStorage.removeItem(PROFILE_KEY);
                localStorage.removeItem(PURCHASES_KEY);
                localStorage.removeItem(DAILY_CREATIONS_KEY);
                localStorage.removeItem(STREAK_KEY);
                localStorage.removeItem(USERS_KEY);
                localStorage.removeItem(CURRENT_USER_KEY);
                localStorage.removeItem(BRONZE_CRATE_KEY);
                localStorage.removeItem(QUESTS_KEY);
                localStorage.removeItem('adhd_tasks'); // Clear tasks on logout
                localStorage.removeItem('adhd_titles'); // Clear titles on logout
                localStorage.removeItem('adhd_pets'); // Clear pets on logout
                localStorage.removeItem('adhd_current_pet_id'); // Clear current pet ID on logout

                // Fire event to notify UI to clear titles
                window.dispatchEvent(new CustomEvent('titles:cleared'));
                // Fire event to notify useCalendar to clear tasks
                window.dispatchEvent(new CustomEvent('tasks:cleared'));
                // Fire event to notify Pet page to clear pets
                window.dispatchEvent(new CustomEvent('pets:cleared'));
                
                // Reset all game state
                resetXp(false); // Don't sync - we're logging out
                setGems(0);
                setPet(null);
                setOwnedPets([]);
                setPurchases(new Set());
                setStreak(() => getStreakData());
                setCurrentGems(0);
            }
        });

        return () => unsubscribe();
    }, []);

    // Update streak when task is completed
    useEffect(() => {
        const checkAndUpdateStreak = () => {
            // Check if we completed a task today
            const tasksCompletedToday = profile.tasksCompleted;
            if (tasksCompletedToday > 0) {
                const streakData = getStreakData();
                if (streakData.lastDate !== new Date().toDateString()) {
                    updateStreak();
                }
            }
        };
        checkAndUpdateStreak();
    }, [profile.tasksCompleted]);

    // Refresh medals and titles when profile modal opens
    useEffect(() => {
        if (showProfile) {
            setMedals(getMedals());
            setUnlockedTitles(getUnlockedTitles());
            setSelectedTitleState(getSelectedTitle());
        }
    }, [showProfile]);

    // Listen for pet updates
    useEffect(() => {
        const handlePetUpdate = () => {
            setPet(getPet());
        };

        window.addEventListener('petUpdated', handlePetUpdate as EventListener);
        return () => window.removeEventListener('petUpdated', handlePetUpdate as EventListener);
    }, []);

    // Listen for title changes
    useEffect(() => {
        const handleTitleChange = () => {
            setSelectedTitleState(getSelectedTitle());
        };
        
        const handleTitlesRestored = () => {
            setUnlockedTitles(getUnlockedTitles());
            setSelectedTitleState(getSelectedTitle());
        };
        
        const handleTitlesCleared = () => {
            setUnlockedTitles([]);
            setSelectedTitleState(null);
        };

        window.addEventListener('selectedTitleChanged', handleTitleChange as EventListener);
        window.addEventListener('titles:restored', handleTitlesRestored);
        window.addEventListener('titles:cleared', handleTitlesCleared);
        return () => {
            window.removeEventListener('selectedTitleChanged', handleTitleChange as EventListener);
            window.removeEventListener('titles:restored', handleTitlesRestored);
            window.removeEventListener('titles:cleared', handleTitlesCleared);
        };
    }, []);

    // Listen for pet switches
    useEffect(() => {
        const handlePetSwitch = () => {
            setCurrentPetIdState(getCurrentPetId());
            setPet(getPet);
            setOwnedPets(getAllPets());
        };

        window.addEventListener('petSwitched', handlePetSwitch as EventListener);
        return () => window.removeEventListener('petSwitched', handlePetSwitch as EventListener);
    }, []);

    // Dev menu is now handled globally in App.tsx with Ctrl+Alt+D+F keyboard shortcut

    const devAddXp = (amount: number) => {
        grantXp(amount);
        setDevXpInput('');
    };

    const devResetDailyLimit = () => {
        const stored = localStorage.getItem(DAILY_CREATIONS_KEY);
        const data = stored ? JSON.parse(stored) : {};
        const today = getTodayDate();
        delete data[today];
        localStorage.setItem(DAILY_CREATIONS_KEY, JSON.stringify(data));
    };

    const devTogglePurchase = (id: number) => {
        const newPurchases = new Set(purchases);
        if (newPurchases.has(id)) {
            newPurchases.delete(id);
        } else {
            newPurchases.add(id);
        }
        setPurchases(newPurchases);
        localStorage.setItem(PURCHASES_KEY, JSON.stringify(Array.from(newPurchases)));
    };

    const devAddStreak = () => {
        const updatedStreak = getStreakData();
        updatedStreak.current += 1;
        updatedStreak.longest = Math.max(updatedStreak.longest, updatedStreak.current);
        localStorage.setItem(STREAK_KEY, JSON.stringify(updatedStreak));
        setStreak(updatedStreak);
    };

    const devRemoveStreak = () => {
        const updatedStreak = getStreakData();
        if (updatedStreak.current > 0) {
            updatedStreak.current -= 1;
        }
        localStorage.setItem(STREAK_KEY, JSON.stringify(updatedStreak));
        setStreak(updatedStreak);
    };

    const devResetStreak = () => {
        const updatedStreak = { current: 0, lastDate: null, longest: 0 };
        localStorage.setItem(STREAK_KEY, JSON.stringify(updatedStreak));
        setStreak(updatedStreak);
    };

    const devAddTestFriend = () => {
        // Register test friend in users list
        const usersStr = localStorage.getItem(USERS_KEY);
        const users = usersStr ? JSON.parse(usersStr) : [];
        
        const testFriend = {
            id: 'testbot',
            username: 'TestBot',
            hashtag: '9999',
            avatar: '🤖'
        };
        
        // Remove if already exists
        const filteredUsers = users.filter((user: any) => user.id !== 'testbot');
        filteredUsers.push(testFriend);
        
        localStorage.setItem(USERS_KEY, JSON.stringify(filteredUsers));
        showToast('Test Friend (TestBot#9999) added to the user registry. You can now add them as a friend!', 'success');
    };
    const handleAvatarClick = () => {
        if (auth.currentUser) {
            openProfileModal(auth.currentUser.uid, profile.username, profile.avatar);
        }
    };

    const saveProfile = async (data: ProfileData) => {
        // Update local state immediately for UI responsiveness
        setProfile(data);
        localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
        
        // Sync to Firestore if logged in
        if (auth.currentUser) {
            try {
                const updatePayload = {
                    username: data.username,
                    hashtag: data.hashtag || '1000',
                    avatar: data.avatar,
                    customAvatarUrl: data.customAvatarUrl || null,
                    updatedAt: new Date().toISOString()
                };
                await updateDoc(doc(db, 'users', auth.currentUser.uid), updatePayload);
                // After successful save, update state again to ensure it's persisted
                setProfile(data);
            } catch (error) {
                console.error('Error updating profile in Firestore:', error);
                // Revert to localStorage version on error
                const stored = localStorage.getItem(PROFILE_KEY);
                if (stored) {
                    setProfile(JSON.parse(stored));
                }
            }
        }
        
        // Dispatch event to notify other components
        window.dispatchEvent(new Event('profileUpdated'));
        
        // Register user in users list
        const usersStr = localStorage.getItem(USERS_KEY);
        const users = usersStr ? JSON.parse(usersStr) : [];
        
        // Remove old entry if exists
        const filteredUsers = users.filter((user: any) => user.id !== data.username.toLowerCase().replace(/\s+/g, '_'));
        
        // Add/update user
        filteredUsers.push({
            id: data.username.toLowerCase().replace(/\s+/g, '_'),
            username: data.username,
            hashtag: data.hashtag || '1000',
            avatar: data.avatar
        });
        
        localStorage.setItem(USERS_KEY, JSON.stringify(filteredUsers));
    };

    const handleLogin = async () => {
        setLoginError('');
        
        if (!loginEmail.trim() || !loginPassword.trim()) {
            setLoginError('Email and password are required');
            return;
        }

        try {
            await signInWithEmail(loginEmail, loginPassword);
            setLoginEmail('');
            setLoginPassword('');
            setIsLoggedIn(true);
            setIsInitialLoginModal(false);
        } catch (error: any) {
            setLoginError(error.message || 'Login failed. Check your email and password.');
        }
    };

    const handleLogout = async () => {
        try {
            // Clear all game data immediately before signing out
            setProfile({
                username: 'Guest',
                hashtag: '0000',
                avatar: '👤',
                customAvatarUrl: undefined,
                tasksCompleted: 0,
                eventsCreated: 0
            });
            setIsLoggedIn(false);
            setShowProfileFalse();
            setLoginError('');
            setLoginEmail('');
            setLoginPassword('');
            
            // Clear all game data from localStorage
            localStorage.removeItem(PROFILE_KEY);
            localStorage.removeItem(PURCHASES_KEY);
            localStorage.removeItem(DAILY_CREATIONS_KEY);
            localStorage.removeItem(STREAK_KEY);
            localStorage.removeItem(USERS_KEY);
            localStorage.removeItem(CURRENT_USER_KEY);
            localStorage.removeItem(BRONZE_CRATE_KEY);
            localStorage.removeItem(QUESTS_KEY);
            localStorage.removeItem('adhd_tasks'); // Clear tasks on logout
            localStorage.removeItem('adhd_titles'); // Clear titles on logout
            localStorage.removeItem('adhd_pets'); // Clear pets on logout
            localStorage.removeItem('adhd_current_pet_id'); // Clear current pet ID on logout
            
            // Fire event to notify useCalendar to clear tasks
            window.dispatchEvent(new CustomEvent('tasks:cleared'));
            
            // Fire event to notify UI to clear titles
            window.dispatchEvent(new CustomEvent('titles:cleared'));
            
            // Fire event to notify Pet page to clear pets
            window.dispatchEvent(new CustomEvent('pets:cleared'));
            
            // Reset all game state WITHOUT syncing to Firestore
            resetXp(false); // Don't sync the reset to Firestore
            setGems(0);
            setPet(null);
            setOwnedPets([]);
            setPurchases(new Set());
            setStreak(() => getStreakData());
            setCurrentGems(0);
            
            // Now sign out from Firebase
            await signOutUser();
        } catch (error: any) {
            setLoginError('Logout failed');
        }
    };

    const handleGuestSignIn = async () => {
        setLoginError('');
        try {
            await signInAsGuest();
            setLoginEmail('');
            setLoginPassword('');
            setIsInitialLoginModal(false);
            setShowProfileFalse();
        } catch (error: any) {
            setLoginError('Guest sign-in failed. Please try again.');
        }
    };

    const handleSignUp = async () => {
        setSignupError('');

        if (!signupEmail.trim() || !signupPassword.trim()) {
            setSignupError('Email and password are required');
            return;
        }

        if (!signupUsername.trim()) {
            setSignupError('Username is required');
            return;
        }

        // Validate hashtag format
        const finalHashtag = signupHashtag.trim() || String(Math.floor(Math.random() * 9000) + 1000);
        if (!/^\d{1,6}$/.test(finalHashtag)) {
            setSignupError('Hashtag must be 1-6 digits (e.g., 1234)');
            return;
        }

        try {
            await signUpWithEmail(signupEmail, signupPassword, signupUsername, finalHashtag);
            
            // Create local profile
            const newProfile: ProfileData = {
                username: signupUsername.trim(),
                hashtag: finalHashtag,
                tasksCompleted: 0,
                eventsCreated: 0,
                avatar: AVATAR_OPTIONS[0],
                customAvatarUrl: undefined
            };
            setProfile(newProfile);
            localStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
            window.dispatchEvent(new Event('profileUpdated'));

            setSignupEmail('');
            setSignupPassword('');
            setSignupUsername('');
            setSignupHashtag('');
            setIsLoggedIn(true);
            setIsInitialLoginModal(false);
            setShowProfileFalse();
        } catch (error: any) {
            setSignupError(error.message || 'Sign up failed. Try again.');
        }
    };

    const handleSaveName = async () => {
        if (editNameValue.trim()) {
            await saveProfile({ ...profile, username: editNameValue.trim() });
        }
    };

    const handleSaveHashtag = async () => {
        if (editHashtagValue.trim()) {
            await saveProfile({ ...profile, hashtag: editHashtagValue.trim() });
        }
    };

    const handleSaveNameAndHashtag = async () => {
        // Combine both changes into a single object to avoid state race conditions
        const updatedProfile = { 
            ...profile, 
            username: editNameValue.trim() || profile.username,
            hashtag: editHashtagValue.trim() || profile.hashtag
        };
        await saveProfile(updatedProfile);
        setEditingName(false);
    };

    const handleAvatarSelect = async (avatar: string) => {
        await saveProfile({ ...profile, avatar, customAvatarUrl: undefined });
        setEditingAvatar(false);
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUploadError('');
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setUploadError('Please upload an image file');
            return;
        }

        // Validate file size (max 500KB)
        if (file.size > 500 * 1024) {
            setUploadError('Image must be smaller than 500KB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            saveProfile({ ...profile, customAvatarUrl: dataUrl });
            setEditingAvatar(false);
        };
        reader.onerror = () => {
            setUploadError('Failed to read file');
        };
        reader.readAsDataURL(file);
    };

    // Recommended tasks: incomplete tasks sorted by due date (urgent first)
    const getRecommendedTasks = () => {
        const incomplete = tasks.filter(t => !t.completed);
        const now = new Date();
        return incomplete.sort((a, b) => {
            const aTime = new Date(a.dueDate).getTime();
            const bTime = new Date(b.dueDate).getTime();
            return aTime - bTime;
        }).slice(0, 3); // Show top 3
    };

    // Common task templates
    const COMMON_TASKS = [
        { title: 'Brush teeth', icon: '🪥', xp: 10 },
        { title: 'Pay bills', icon: '💰', xp: 50 },
        { title: 'Take out trash', icon: '🗑️', xp: 15 },
        { title: 'Clean house', icon: '🏠', xp: 40 },
        { title: 'Take medication', icon: '💊', xp: 10 },
        { title: 'Shower', icon: '🚿', xp: 15 },
        { title: 'Call friend', icon: '📞', xp: 25 },
        { title: 'Take a break', icon: '🎮', xp: 5 },
        { title: 'Eat something', icon: '🍎', xp: 10 },
        { title: 'Drink water', icon: '💧', xp: 5 },
        { title: 'Tidy desk', icon: '🧹', xp: 20 },
        { title: 'Check email', icon: '📧', xp: 15 },
    ];

    const handleQuickAddTemplate = (title: string, xpAmount: number = 20) => {
        setSelectedTemplate({ title, xp: xpAmount });
        setTemplateDueDate(new Date().toISOString().split('T')[0]); // Default to today
        setTemplateHour(9);
        setTemplateMinute(0);
    };

    const confirmQuickAddTemplate = () => {
        if (!selectedTemplate) return;
        
        if (tasks.length >= taskLimit) {
            showToast(`Task limit reached (${taskLimit}). Unlock more in the Store!`, 'warning');
            return;
        }
        
        const dailyLimit = purchases.has(4) ? 6 : 3;
        const dailyCreations = getDailyCreationCount();
        
        if (dailyCreations >= dailyLimit) {
            showToast(`Daily task creation limit reached (${dailyLimit}). Try again tomorrow or unlock more in the Store!`, 'warning');
            return;
        }
        
        // Convert 12-hour to 24-hour format
        let hour24 = templateHour;
        if (templateAmPm === 'PM' && templateHour !== 12) {
            hour24 = templateHour + 12;
        } else if (templateAmPm === 'AM' && templateHour === 12) {
            hour24 = 0;
        }
        
        // Combine date and time into ISO format
        const dateTime = new Date(`${templateDueDate}T${String(hour24).padStart(2, '0')}:${String(templateMinute).padStart(2, '0')}:00`).toISOString();
        const task = { id: Date.now(), title: selectedTemplate.title, description: '', dueDate: dateTime, completed: false, templateXp: selectedTemplate.xp } as any;
        addTask(task);
        incrementDailyCreation();
        setSelectedTemplate(null);
        setTemplateDueDate('');
        setTemplateAmPm('AM');
        setShowTemplates(false);
    };

    const recommendedTasks = getRecommendedTasks();

    return (
        <div className="container">
            <div className="header">
                <h1>{t('dashboard.title')}</h1>
                <div className="subtle">{t('dashboard.planYourDay')}</div>
            </div>

            {/* Quick Game Break Card */}
            {getRemainingGames() > 0 && (
                <div className="panel" style={{
                    padding: 24,
                    marginBottom: 24,
                    background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
                    border: '2px solid rgba(147, 51, 234, 0.3)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h3 style={{margin: '0 0 8px 0', fontSize: '1.1rem'}}>🎮 Quick Game Break</h3>
                        <p className="subtle" style={{margin: 0}}>Earn quick XP! {getRemainingGames()} game{getRemainingGames() !== 1 ? 's' : ''} left today</p>
                    </div>
                    <Button onClick={() => history.push('/games')} style={{minWidth: 120}}>Play →</Button>
                </div>
            )}

            {/* Recommended Tasks Section */}
            <div className="app-grid">
                <aside className="panel">
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12, gap: 24, flexWrap: 'nowrap'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8, whiteSpace: 'nowrap', minWidth: 0}}>
                            <h3 style={{margin:0}}>{t('dashboard.yourTasks')}</h3>
                            <span className="subtle" style={{fontSize:'0.875rem'}}>{getDailyCreationCount()}/{purchases.has(4) ? 6 : 3}</span>
                        </div>
                        <div style={{display:'flex', gap:8}}>
                            <Button onClick={() => setShowTemplates(true)} title="Quick add from templates">{t('dashboard.quickAdd')}</Button>
                            <Button onClick={() => setAdding((s) => !s)} disabled={getDailyCreationCount() >= (purchases.has(4) ? 6 : 3) && !adding}>{adding ? t('dashboard.close') : `+ ${t('dashboard.add')}`}</Button>
                        </div>
                    </div>

                    {adding && <QuickAdd onAdd={handleAdd} />}

                    <div className="tasks-list" style={{maxHeight: '400px', overflowY: 'auto'}}>
                        {tasks.length === 0 && <div className="subtle">{t('dashboard.noTasks')}</div>}
                        {displayedTasks.map((task:any) => {
                            // Anti-spam: Check if task is at least 5 minutes old before granting XP
                            // Existing tasks without createdAt are allowed to grant XP immediately
                            const taskAge = task.createdAt ? Date.now() - task.createdAt : Infinity;
                            const canGrantXp = taskAge >= 5 * 60 * 1000;
                            const timeUntilXp = task.createdAt ? Math.max(0, 5 * 60 * 1000 - taskAge) : 0;
                            return (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    timeUntilXp={timeUntilXp}
                                    xpAmount={(task as any).templateXp || 20}
                                    onUpdate={(t) => updateTask(t)}
                                    onComplete={() => {
                                        removeTask(task.id);
                                        if (canGrantXp) {
                                            const xpAmount = (task as any).templateXp || 20;
                                            grantXp(xpAmount);
                                            saveProfile({ ...profile, tasksCompleted: profile.tasksCompleted + 1 });
                                            updateStreak();
                                        }
                                    }}
                                    onRemove={() => removeTask(task.id)}
                                />
                            );
                        })}
                        {tasks.length > taskLimit && (
                            <div className="subtle" style={{marginTop:8,fontSize:'0.875rem'}}>
                                +{tasks.length - taskLimit} more {tasks.length - taskLimit === 1 ? 'task' : 'tasks'} (unlock in Store)
                            </div>
                        )}
                    </div>
                </aside>

                <main className="panel">
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                        <div>
                            <h3 style={{margin:0}}>{t('dashboard.upcomingEvents')}</h3>
                            <div className="subtle">{new Date().toLocaleDateString()}</div>
                        </div>
                        <div style={{display:'flex',gap:8}}>
                            <Button variant={view === 'day' ? undefined : 'ghost'} onClick={() => setView('day')}>{t('calendar.day')}</Button>
                            <Button variant={view === 'week' ? undefined : 'ghost'} onClick={() => setView('week')}>{t('calendar.week')}</Button>
                            <Button variant={view === 'month' ? undefined : 'ghost'} onClick={() => setView('month')}>{t('calendar.month')}</Button>
                        </div>
                    </div>

                    <Calendar view={view} />
                </main>

                {/* Pet Widget - Compact Quick View */}
                {pet && (
                    <aside className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 16 }}>
                        <PetQuickView 
                            pet={pet} 
                            allPets={ownedPets}
                            currentPetId={currentPetId}
                            onViewDetails={() => history.push('/pet')}
                            onPetSwitch={(petId) => {
                                setCurrentPet(petId);
                                const updated = getPet();
                                if (updated) setPet(updated);
                            }}
                        />
                    </aside>
                )}
            </div>

            {/* Quick Add Templates Popup */}
            {showTemplates && !selectedTemplate && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div className="panel" style={{maxWidth: 500, padding: 20, backgroundColor: 'var(--panel)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)'}}>
                        <h2 style={{margin: '0 0 16px 0', textAlign: 'center'}}>Quick Add Templates</h2>
                        <div style={{display:'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16}}>
                            {COMMON_TASKS.map((template, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        handleQuickAddTemplate(template.title, template.xp);
                                    }}
                                    disabled={getDailyCreationCount() >= (purchases.has(4) ? 6 : 3)}
                                    style={{
                                        padding: '5px 4px',
                                        borderRadius: 8,
                                        backgroundColor: 'var(--bg)',
                                        border: '2px solid var(--border)',
                                        color: 'var(--text)',
                                        cursor: getDailyCreationCount() >= (purchases.has(4) ? 6 : 3) ? 'not-allowed' : 'pointer',
                                        fontSize: '0.8rem',
                                        fontWeight: 500,
                                        transition: 'all 0.2s',
                                        opacity: getDailyCreationCount() >= (purchases.has(4) ? 6 : 3) ? 0.5 : 1,
                                        textAlign: 'center',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 2,
                                        userSelect: 'none',
                                    }}
                                    onMouseOver={(e) => {
                                        if (getDailyCreationCount() < (purchases.has(4) ? 6 : 3)) {
                                            (e.target as HTMLElement).style.backgroundColor = 'var(--accent)';
                                            (e.target as HTMLElement).style.color = 'var(--bg)';
                                            (e.target as HTMLElement).style.borderColor = 'var(--accent)';
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        (e.target as HTMLElement).style.backgroundColor = 'var(--bg)';
                                        (e.target as HTMLElement).style.color = 'var(--text)';
                                        (e.target as HTMLElement).style.borderColor = 'var(--border)';
                                    }}
                                >
                                    {template.title}
                                    <span className="subtle" style={{fontSize: '0.75rem', fontWeight: 400, userSelect: 'none', pointerEvents: 'none'}}>+{template.xp} XP</span>
                                </button>
                            ))}
                        </div>
                        <button className="btn" onClick={() => setShowTemplates(false)} style={{width: '100%'}}>Close</button>
                    </div>
                </div>
            )}

            {/* Template Date/Time Picker */}
            {selectedTemplate && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div className="panel" style={{width: '95vw', maxWidth: 450, padding: 20, backgroundColor: 'var(--panel)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)'}}>
                        <h2 style={{margin: '0 0 16px 0', textAlign: 'center'}}>{selectedTemplate.title}</h2>
                        <div style={{marginBottom: 16}}>
                            <label style={{display: 'block', marginBottom: 8, fontSize: '0.9rem', fontWeight: 500}}>Due Date</label>
                            <input 
                                type="date" 
                                className="input" 
                                value={templateDueDate}
                                onChange={(e) => setTemplateDueDate(e.target.value)}
                            />
                        </div>
                        <div style={{marginBottom: 20}}>
                            <label style={{display: 'block', marginBottom: 8, fontSize: '0.9rem', fontWeight: 500}}>Time</label>
                            <div style={{display: 'flex', gap: 12}}>
                                <select 
                                    className="input" 
                                    value={templateHour}
                                    onChange={(e) => setTemplateHour(Number(e.target.value))}
                                    style={{flex: 1, color: 'var(--text)', backgroundColor: 'var(--bg)'}}
                                >
                                    {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
                                        <option key={i} value={i} style={{color: 'white', backgroundColor: 'var(--panel)'}}>{String(i).padStart(2, '0')}</option>
                                    ))}
                                </select>
                                <select 
                                    className="input" 
                                    value={templateAmPm}
                                    onChange={(e) => setTemplateAmPm(e.target.value as 'AM' | 'PM')}
                                    style={{flex: 0.6, color: 'var(--text)', backgroundColor: 'var(--bg)'}}
                                >
                                    <option value="AM" style={{color: 'white', backgroundColor: 'var(--panel)'}}>AM</option>
                                    <option value="PM" style={{color: 'white', backgroundColor: 'var(--panel)'}}>PM</option>
                                </select>
                                <select 
                                    className="input" 
                                    value={templateMinute}
                                    onChange={(e) => setTemplateMinute(Number(e.target.value))}
                                    style={{flex: 1, color: 'var(--text)', backgroundColor: 'var(--bg)'}}
                                >
                                    {Array.from({length: 12}).map((_, i) => (
                                        <option key={i} value={i * 5} style={{color: 'white', backgroundColor: 'var(--panel)'}}>{String(i * 5).padStart(2, '0')}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div style={{display: 'flex', gap: 12}}>
                            <button 
                                className="btn ghost" 
                                onClick={() => setSelectedTemplate(null)}
                                style={{flex: 1}}
                            >
                                Back
                            </button>
                            <button 
                                className="btn" 
                                onClick={confirmQuickAddTemplate}
                                style={{flex: 1}}
                            >
                                Add Task
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Dashboard;
