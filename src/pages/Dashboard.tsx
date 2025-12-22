import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { useCalendar } from '../hooks/useCalendar';
import TaskCard from '../components/Task/TaskCard';
import Calendar from '../components/Calendar/Calendar';
import Button from '../components/UI/Button';
import QuickAdd from '../components/Task/QuickAdd';
import { grantXp, getXp, setXp, resetXp } from '../services/xp';
import { getGems, setGems, addGems } from '../services/currency';
import { getMedals } from '../services/medals';
import { getPet, updatePetStats, getPetEmoji, feedPet, getAllPets, getCurrentPetId, setCurrentPet, deletePet } from '../services/pet';
import { getUnlockedSkills, unlockSkill, getAllSkills } from '../services/skillTree';
import { getTitles, unlockTitle, setSelectedTitle, getUnlockedTitles, ALL_TITLES, getSelectedTitle } from '../services/titles';
import { enableCriticalTestMode, disableCriticalTestMode, isCriticalTestModeEnabled, getCriticalChances, enableCrateTestMode, disableCrateTestMode, isCrateTestModeEnabled } from '../services/critical';
import { signUpWithEmail, signInWithEmail, signOutUser, onAuthChange, getCurrentUserProfile } from '../services/auth';
import { auth, db } from '../services/firebase';

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
    username: 'Player',
    hashtag: String(Math.floor(Math.random() * 9000) + 1000),
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
    const history = useHistory();
    const [adding, setAdding] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<{title: string, xp: number} | null>(null);
    const [templateDueDate, setTemplateDueDate] = useState<string>('');
    const [templateHour, setTemplateHour] = useState<number>(9);
    const [templateMinute, setTemplateMinute] = useState<number>(0);
    const [templateAmPm, setTemplateAmPm] = useState<'AM' | 'PM'>('AM');
    const [view, setView] = useState<'day' | 'week' | 'month'>('month');
    const [devMenuClicks, setDevMenuClicks] = useState(0);
    const [showDevMenu, setShowDevMenu] = useState(false);
    const [devXpInput, setDevXpInput] = useState('');
    const [devPasswordPrompt, setDevPasswordPrompt] = useState(false);
    const [devPasswordInput, setDevPasswordInput] = useState('');
    const [devPasswordError, setDevPasswordError] = useState('');
    const [showProfile, setShowProfile] = useState(false);
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

    // Anti-spam: Track daily task creations (not affected by deletions)
    const getTodayDate = () => new Date().toDateString();
    const getDailyCreationCount = () => {
        const stored = localStorage.getItem(DAILY_CREATIONS_KEY);
        const data = stored ? JSON.parse(stored) : {};
        const today = getTodayDate();
        return data[today] || 0;
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
            alert(`Task limit reached (${taskLimit}). Unlock more in the Store!`);
            return;
        }
        
        const dailyLimit = purchases.has(4) ? 6 : 3;
        const dailyCreations = getDailyCreationCount();
        
        if (dailyCreations >= dailyLimit) {
            alert(`Daily task creation limit reached (${dailyLimit}). Try again tomorrow or unlock more in the Store!`);
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
                // User is logged in - load their profile from Firestore
                setIsLoggedIn(true);
                try {
                    const userProfile = await getCurrentUserProfile(firebaseUser.uid);
                    if (userProfile) {
                        console.log('[Auth] Loaded profile from Firestore:', userProfile);
                        setProfile(userProfile);
                        localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile));
                    }
                } catch (error) {
                    console.error('[Auth] Error loading profile from Firestore:', error);
                }
            } else {
                // User is logged out
                setIsLoggedIn(false);
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

        window.addEventListener('selectedTitleChanged', handleTitleChange as EventListener);
        return () => window.removeEventListener('selectedTitleChanged', handleTitleChange as EventListener);
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

    // Listen for dev menu key combo (Ctrl+Shift+D)
    useEffect(() => {
        const handleDevMenuKeyCombo = () => {
            setDevPasswordPrompt(true);
            setDevMenuClicks(0);
        };

        window.addEventListener('devMenuKeyCombo', handleDevMenuKeyCombo as EventListener);
        return () => window.removeEventListener('devMenuKeyCombo', handleDevMenuKeyCombo as EventListener);
    }, []);

    // Dev Menu
    const handleDashboardClick = () => {
        setDevMenuClicks(c => c + 1);
        if (devMenuClicks + 1 === 7) {
            setDevPasswordPrompt(true);
            setDevMenuClicks(0);
        }
        setTimeout(() => setDevMenuClicks(0), 3000); // Reset after 3 seconds
    };

    const handleDevPassword = () => {
        // Simple password (you can change this)
        const DEV_PASSWORD = 'adhd123';
        if (devPasswordInput === DEV_PASSWORD) {
            setShowDevMenu(true);
            setDevPasswordPrompt(false);
            setDevPasswordInput('');
            setDevPasswordError('');
        } else {
            setDevPasswordError('Incorrect password');
            setDevPasswordInput('');
        }
    };

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
        alert('Test Friend (TestBot#9999) added to the user registry. You can now add them as a friend!');
    };
    const handleAvatarClick = () => {
        setShowProfile(true);
    };

    const saveProfile = async (data: ProfileData) => {
        console.log('[saveProfile] Saving profile with:', data);
        // Update local state immediately for UI responsiveness
        setProfile(data);
        localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
        
        // Sync to Firestore if logged in
        if (auth.currentUser) {
            try {
                console.log('[saveProfile] Syncing to Firestore...');
                await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                    username: data.username,
                    hashtag: data.hashtag || '1000',
                    avatar: data.avatar,
                    customAvatarUrl: data.customAvatarUrl || null,
                    updatedAt: new Date().toISOString()
                });
                console.log('[saveProfile] Firestore sync successful');
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
        } catch (error: any) {
            setLoginError(error.message || 'Login failed. Check your email and password.');
        }
    };

    const handleLogout = async () => {
        try {
            await signOutUser();
            setIsLoggedIn(false);
            setShowProfile(false);
            setLoginError('');
            setLoginEmail('');
            setLoginPassword('');
            // Reset profile to guest
            setProfile({
                username: 'Guest',
                hashtag: '0000',
                avatar: '👤',
                customAvatarUrl: undefined,
                tasksCompleted: 0,
                eventsCreated: 0
            });
        } catch (error: any) {
            setLoginError('Logout failed');
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
            alert(`Task limit reached (${taskLimit}). Unlock more in the Store!`);
            return;
        }
        
        const dailyLimit = purchases.has(4) ? 6 : 3;
        const dailyCreations = getDailyCreationCount();
        
        if (dailyCreations >= dailyLimit) {
            alert(`Daily task creation limit reached (${dailyLimit}). Try again tomorrow or unlock more in the Store!`);
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
            <div className="header" style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                <div>
                    <h1 onClick={handleDashboardClick} style={{cursor:'pointer', userSelect:'none'}}>Dashboard</h1>
                    <div className="subtle">Plan your day — quick add tasks or jump to views</div>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:0, justifyContent:'space-between'}}>
                    <div style={{display:'flex', flexDirection:'column', gap:4}}>
                        <div>
                            <div style={{fontWeight:600, fontSize:'1.1rem', marginLeft:100}}>{profile.username}</div>
                            {selectedTitle && (
                                <div style={{fontSize:'0.8rem', color:'var(--accent)', fontWeight:500, marginLeft:75}}>
                                    {selectedTitle.name}
                                </div>
                            )}
                        </div>
                        <div style={{fontSize:'0.9rem', display:'flex', flexDirection:'column', gap:1}}>
                            <div style={{fontWeight:500, marginLeft:75}}>Level {Math.floor(getXp() / 100) + 1}</div>
                            <div className="subtle" style={{fontSize:'0.8rem', marginLeft:100}}>{getXp()} XP</div>
                        </div>
                    </div>
                    <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        fontWeight: 'bold',
                        color: 'var(--bg)',
                        cursor: 'pointer',
                        border: purchases.has(3) ? '3px solid var(--accent-2)' : 'none',
                        backgroundImage: profile.customAvatarUrl ? `url(${profile.customAvatarUrl})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        overflow: 'hidden',
                        flexShrink: 0,
                        marginLeft: -4
                    }} onClick={handleAvatarClick}>
                        {!profile.customAvatarUrl && profile.avatar}
                    </div>
                </div>
            </div>

            {/* Recommended Tasks Section */}
            <div className="app-grid">
                <aside className="panel">
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12, gap: 24, flexWrap: 'nowrap'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8, whiteSpace: 'nowrap', minWidth: 0}}>
                            <h3 style={{margin:0}}>Your Tasks</h3>
                            <span className="subtle" style={{fontSize:'0.875rem'}}>{getDailyCreationCount()}/{purchases.has(4) ? 6 : 3}</span>
                        </div>
                        <div style={{display:'flex', gap:8}}>
                            <Button onClick={() => setShowTemplates(true)} title="Quick add from templates">Quick Add</Button>
                            <Button onClick={() => setAdding((s) => !s)} disabled={getDailyCreationCount() >= (purchases.has(4) ? 6 : 3) && !adding}>{adding ? 'Close' : '+ Add'}</Button>
                        </div>
                    </div>

                    <div className="tasks-list" style={{maxHeight: '400px', overflowY: 'auto'}}>
                        {adding && <QuickAdd onAdd={handleAdd} />}

                        {tasks.length === 0 && <div className="subtle">No tasks yet — hit + Add to create one</div>}
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
                            <h3 style={{margin:0}}>Upcoming Events</h3>
                            <div className="subtle">{new Date().toLocaleDateString()}</div>
                        </div>
                        <div style={{display:'flex',gap:8}}>
                            <Button variant={view === 'day' ? undefined : 'ghost'} onClick={() => setView('day')}>Day</Button>
                            <Button variant={view === 'week' ? undefined : 'ghost'} onClick={() => setView('week')}>Week</Button>
                            <Button variant={view === 'month' ? undefined : 'ghost'} onClick={() => setView('month')}>Month</Button>
                        </div>
                    </div>

                    <Calendar view={view} />
                </main>

                {/* Pet Widget */}
                {pet && (
                    <aside className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 16 }}>
                        <h3 style={{ margin: 0, marginBottom: 8 }}>Your Pet</h3>
                        <div style={{ fontSize: '3rem' }}>{getPetEmoji(pet.stage, pet.color, pet.emoji)}</div>
                        <div style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: 2 }}>{pet.name}</div>
                            <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: 8 }}>
                                Level {pet.level} {pet.stage.charAt(0).toUpperCase() + pet.stage.slice(1)}
                            </div>
                        </div>
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {/* Hunger */}
                            <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Hunger</div>
                            <div style={{ height: 6, background: 'var(--border)', borderRadius: 3 }}>
                                <div style={{
                                    height: '100%',
                                    width: `${Math.max(0, 100 - pet.hunger)}%`,
                                    background: pet.hunger > 70 ? '#ef4444' : '#22c55e',
                                    borderRadius: 3,
                                }} />
                            </div>
                        </div>
                            <div style={{ width: '100%', marginBottom: 6 }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: 12, textAlign: 'center' }}>Switch Pet</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', gap: 4 }}>
                                    {ownedPets.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => setCurrentPet(p.id)}
                                            style={{
                                                padding: '6px 4px',
                                                borderRadius: 4,
                                                border: currentPetId === p.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                                                background: currentPetId === p.id ? 'rgba(167, 139, 250, 0.2)' : 'transparent',
                                                cursor: 'pointer',
                                                fontSize: '0.75rem',
                                                color: 'var(--text)',
                                                fontWeight: currentPetId === p.id ? 'bold' : 'normal',
                                                transition: 'all 0.2s',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            title={p.name}
                                        >
                                            {p.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                            <button
                                className="btn primary"
                                onClick={() => {
                                    const updated = feedPet('gems');
                                    if (updated) {
                                        setPet(updated);
                                        setGemsState(getGems());
                                    }
                                }}
                                disabled={currentGems < 5}
                                style={{ fontSize: '0.7rem', padding: '6px', opacity: currentGems < 5 ? 0.5 : 1, cursor: currentGems < 5 ? 'not-allowed' : 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                Feed with gems (5)
                            </button>
                            <button
                                className="btn primary"
                                onClick={() => {
                                    const updated = feedPet('xp');
                                    if (updated) {
                                        setPet(updated);
                                        setCurrentXp(getXp());
                                    }
                                }}
                                disabled={currentXp < 30}
                                style={{ fontSize: '0.7rem', padding: '6px', opacity: currentXp < 30 ? 0.5 : 1, cursor: currentXp < 30 ? 'not-allowed' : 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                Feed with XP (30)
                            </button>
                        </div>
                        <button
                            className="btn primary"
                            onClick={() => history.push('/pet')}
                            style={{ width: '100%', fontSize: '0.85rem', padding: '8px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            Care for Pet →
                        </button>
                    </aside>
                )}
            </div>

            {/* Developer Password Prompt */}
            {devPasswordPrompt && (
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
                    zIndex: 99998
                }}>
                    <div className="panel" style={{maxWidth: 400, padding: 24, backgroundColor: 'var(--panel)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)'}}>
                        <h2 style={{margin: '0 0 16px 0', textAlign: 'center'}}>Developer Menu</h2>
                        <p style={{textAlign: 'center', color: 'var(--muted)', marginBottom: 16}}>Enter password to continue</p>
                        <input
                            type="password"
                            className="input"
                            placeholder="Password"
                            value={devPasswordInput}
                            onChange={(e) => setDevPasswordInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleDevPassword()}
                            autoFocus
                            style={{marginBottom: 12}}
                        />
                        {devPasswordError && (
                            <div style={{color: '#ef4444', marginBottom: 12, fontSize: '0.9rem', textAlign: 'center'}}>
                                {devPasswordError}
                            </div>
                        )}
                        <div style={{display: 'flex', gap: 8}}>
                            <button className="btn primary" onClick={handleDevPassword} style={{flex: 1}}>
                                Unlock
                            </button>
                            <button className="btn ghost" onClick={() => { setDevPasswordPrompt(false); setDevPasswordInput(''); setDevPasswordError(''); }} style={{flex: 1}}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Developer Menu */}
            {showDevMenu && (
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
                    zIndex: 99999
                }}>
                    <div className="panel" style={{maxWidth: 500, maxHeight: '80vh', padding: 20, backgroundColor: 'var(--panel)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', userSelect: 'none', overflow: 'auto'}}>
                        <h2 style={{margin: '0 0 12px 0', textAlign: 'center'}}>Development Menu</h2>
                        <div style={{marginBottom: 16, fontSize: '0.9rem', color: 'var(--muted)'}}>
                            <div>Current XP: {getXp()} | Daily Tasks Created: {getDailyCreationCount()}/{purchases.has(4) ? 6 : 3}</div>
                            <div>Streak: {streak.current} current | {streak.longest} longest</div>
                        </div>

                        <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                            {/* XP Controls */}
                            <div style={{borderBottom: '1px solid var(--border)', paddingBottom: 12}}>
                                <h3 style={{margin: '0 0 8px 0'}}>XP Controls</h3>
                                <div style={{display: 'flex', gap: 8}}>
                                    <input
                                        type="number"
                                        className="input"
                                        placeholder="XP amount"
                                        value={devXpInput}
                                        onChange={(e) => setDevXpInput(e.target.value)}
                                        style={{flex: 1}}
                                    />
                                    <button className="btn" onClick={() => devAddXp(parseInt(devXpInput) || 0)}>Grant</button>
                                </div>
                                <button className="btn ghost" onClick={() => resetXp()} style={{marginTop: 8, width: '100%'}}>Reset XP</button>
                            </div>

                            {/* Task Limit Controls */}
                            <div style={{borderBottom: '1px solid var(--border)', paddingBottom: 12}}>
                                <h3 style={{margin: '0 0 8px 0'}}>Task Limit Controls</h3>
                                <button className="btn ghost" onClick={devResetDailyLimit} style={{width: '100%'}}>Reset Daily Limit</button>
                            </div>

                            {/* Streak Controls */}
                            <div style={{borderBottom: '1px solid var(--border)', paddingBottom: 12}}>
                                <h3 style={{margin: '0 0 8px 0'}}>Streak Controls</h3>
                                <div className="subtle" style={{fontSize: '0.85rem', marginBottom: 8}}>Current: {streak.current} days</div>
                                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8}}>
                                    <button className="btn ghost" onClick={devAddStreak} style={{fontSize: '0.85rem'}}>+1 Streak</button>
                                    <button className="btn ghost" onClick={devRemoveStreak} style={{fontSize: '0.85rem'}}>-1 Streak</button>
                                    <button className="btn ghost" onClick={devResetStreak} style={{fontSize: '0.85rem'}}>Reset</button>
                                </div>
                            </div>

                            {/* Purchase Controls */}
                            <div style={{borderBottom: '1px solid var(--border)', paddingBottom: 12}}>
                                <h3 style={{margin: '0 0 8px 0'}}>Purchases</h3>
                                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8}}>
                                    <button className="btn ghost" onClick={() => devTogglePurchase(1)} style={{opacity: purchases.has(1) ? 1 : 0.5}}>
                                        {purchases.has(1) ? '✓' : '✗'} Sunset Theme
                                    </button>
                                    <button className="btn ghost" onClick={() => devTogglePurchase(2)} style={{opacity: purchases.has(2) ? 1 : 0.5}}>
                                        {purchases.has(2) ? '✓' : '✗'} Ocean Theme
                                    </button>
                                    <button className="btn ghost" onClick={() => devTogglePurchase(3)} style={{opacity: purchases.has(3) ? 1 : 0.5}}>
                                        {purchases.has(3) ? '✓' : '✗'} Avatar Border
                                    </button>
                                    <button className="btn ghost" onClick={() => devTogglePurchase(4)} style={{opacity: purchases.has(4) ? 1 : 0.5}}>
                                        {purchases.has(4) ? '✓' : '✗'} Extra Slots
                                    </button>
                                    <button className="btn ghost" onClick={() => devTogglePurchase(5)} style={{opacity: purchases.has(5) ? 1 : 0.5}}>
                                        {purchases.has(5) ? '✓' : '✗'} Custom Avatar
                                    </button>
                                </div>
                            </div>

                            {/* Social/Friend Testing */}
                            <div style={{borderBottom: '1px solid var(--border)', paddingBottom: 12}}>
                                <h3 style={{margin: '0 0 8px 0'}}>Social Testing</h3>
                                <button className="btn ghost" onClick={devAddTestFriend} style={{width: '100%'}}>Add Test Friend (TestBot#9999)</button>
                            </div>

                            {/* Gem Controls */}
                            <div style={{borderBottom: '1px solid var(--border)', paddingBottom: 12}}>
                                <h3 style={{margin: '0 0 8px 0'}}>Gem Controls</h3>
                                <div style={{marginBottom: 8}}>
                                    <div style={{fontSize: '0.9rem', marginBottom: 8}}>Current Gems: <strong>{currentGems}</strong></div>
                                    <div style={{display: 'flex', gap: 8}}>
                                        <input
                                            type="number"
                                            className="input"
                                            placeholder="Gem amount"
                                            value={gemInput}
                                            onChange={(e) => setGemInput(e.target.value)}
                                            style={{flex: 1}}
                                        />
                                        <button className="btn" onClick={() => {
                                            const amount = parseInt(gemInput);
                                            if (!isNaN(amount) && amount > 0) {
                                                addGems(amount);
                                                setCurrentGems(getGems());
                                                setGemInput('');
                                                window.dispatchEvent(new Event('currencyUpdated'));
                                            }
                                        }}>Add</button>
                                    </div>
                                </div>
                                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8}}>
                                    <button className="btn ghost" onClick={() => {
                                        setGems(0);
                                        setCurrentGems(0);
                                        setGemInput('');
                                        window.dispatchEvent(new Event('currencyUpdated'));
                                    }}>Set to 0</button>
                                    <button className="btn ghost" onClick={() => {
                                        setGems(1000);
                                        setCurrentGems(1000);
                                        setGemInput('');
                                        window.dispatchEvent(new Event('currencyUpdated'));
                                    }}>Set to 1000</button>
                                </div>
                            </div>

                            {/* Skill Tree Controls */}
                            <div style={{borderBottom: '1px solid var(--border)', paddingBottom: 12}}>
                                <h3 style={{margin: '0 0 8px 0'}}>Skill Tree Controls</h3>
                                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxHeight: 200, overflowY: 'auto'}}>
                                    {getAllSkills().map((skill) => (
                                        <button 
                                            key={skill.id} 
                                            className="btn ghost" 
                                            onClick={() => unlockSkill(skill.id)}
                                            style={{fontSize: '0.75rem', opacity: getUnlockedSkills().includes(skill.id) ? 1 : 0.5}}
                                        >
                                            {getUnlockedSkills().includes(skill.id) ? '✓' : '✗'} {skill.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Pet Controls */}
                            <div style={{borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 12}}>
                                <h3 style={{margin: '0 0 8px 0'}}>Pet Controls</h3>
                                {pet && (
                                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12}}>
                                        <button className="btn ghost" onClick={() => {
                                            if (pet) {
                                                pet.hunger = 0;
                                                const updatedPet = feedPet('gems');
                                                if (updatedPet) {
                                                    setPet(updatedPet);
                                                    window.dispatchEvent(new CustomEvent('petUpdated', { detail: { pet: updatedPet } }));
                                                }
                                            }
                                        }} style={{fontSize: '0.8rem'}}>
                                            Feed Pet
                                        </button>
                                        <button className="btn ghost" onClick={() => {
                                            if (pet) {
                                                pet.happiness = 100;
                                                const updatedPet = updatePetStats();
                                                if (updatedPet) {
                                                    setPet(updatedPet);
                                                    window.dispatchEvent(new CustomEvent('petUpdated', { detail: { pet: updatedPet } }));
                                                }
                                            }
                                        }} style={{fontSize: '0.8rem'}}>
                                            Max Happiness
                                        </button>
                                        <button className="btn ghost" onClick={() => {
                                            if (pet) {
                                                pet.health = 100;
                                                const updatedPet = updatePetStats();
                                                if (updatedPet) {
                                                    setPet(updatedPet);
                                                    window.dispatchEvent(new CustomEvent('petUpdated', { detail: { pet: updatedPet } }));
                                                }
                                            }
                                        }} style={{fontSize: '0.8rem'}}>
                                            Max Health
                                        </button>
                                        <button className="btn ghost" onClick={() => {
                                            if (pet) {
                                                pet.level = Math.min(pet.level + 1, 10);
                                                const updatedPet = updatePetStats();
                                                if (updatedPet) {
                                                    setPet(updatedPet);
                                                    window.dispatchEvent(new CustomEvent('petUpdated', { detail: { pet: updatedPet } }));
                                                }
                                            }
                                        }} style={{fontSize: '0.8rem'}}>
                                            +1 Level
                                        </button>
                                    </div>
                                )}
                                <div style={{marginBottom: 12}}>
                                    <h4 style={{margin: '0 0 8px 0', fontSize: '0.8rem', color: 'var(--muted)'}}>Delete Pet</h4>
                                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 6}}>
                                        {ownedPets.map(p => (
                                            <button
                                                key={p.id}
                                                className="btn ghost"
                                                onClick={() => {
                                                    if (window.confirm(`Delete ${p.name}?`)) {
                                                        deletePet(p.id);
                                                        setOwnedPets(getAllPets());
                                                        setPet(getPet());
                                                        alert(`${p.name} deleted!`);
                                                    }
                                                }}
                                                style={{fontSize: '0.7rem', padding: '4px 8px'}}
                                            >
                                                Delete {p.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Crate Timer Controls */}
                            <div style={{borderBottom: '1px solid var(--border)', paddingBottom: 12}}>
                                <h3 style={{margin: '0 0 8px 0'}}>Crate Timer Controls</h3>
                                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8}}>
                                    <button className="btn ghost" onClick={() => {
                                        localStorage.setItem(BRONZE_CRATE_KEY, '0');
                                        alert('Bronze crate timer reset!');
                                    }} style={{fontSize: '0.8rem'}}>
                                        Reset Bronze Timer
                                    </button>
                                    <button className="btn ghost" onClick={() => {
                                        localStorage.setItem(BRONZE_CRATE_KEY, String(Date.now() - (12 * 60 * 60 * 1000)));
                                        alert('Bronze crate ready!');
                                    }} style={{fontSize: '0.8rem'}}>
                                        Bronze Ready Now
                                    </button>
                                </div>
                            </div>

                            {/* Title Controls */}
                            <div style={{borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 12}}>
                                <h3 style={{margin: '0 0 8px 0'}}>Title Controls</h3>
                                <div style={{marginBottom: 12}}>
                                    <button className="btn ghost" onClick={() => {
                                        unlockTitle('developer');
                                        setUnlockedTitles(getUnlockedTitles());
                                        alert('Developer title unlocked!');
                                    }} style={{fontSize: '0.8rem', width: '100%', marginBottom: 8}}>
                                        Unlock Developer Title
                                    </button>
                                    <button className="btn ghost" onClick={() => {
                                        setSelectedTitle('developer');
                                        setSelectedTitleState(getSelectedTitle());
                                        alert('Developer title equipped!');
                                    }} style={{fontSize: '0.8rem', width: '100%'}}>
                                        Equip Developer Title
                                    </button>
                                </div>
                                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8}}>
                                    {getUnlockedTitles().map(title => (
                                        <button
                                            key={title.id}
                                            className="btn ghost"
                                            onClick={() => {
                                                setSelectedTitle(title.id);
                                                setSelectedTitleState(getSelectedTitle());
                                            }}
                                            style={{
                                                fontSize: '0.75rem',
                                                padding: 6,
                                                background: selectedTitle?.id === title.id ? 'rgba(167, 139, 250, 0.3)' : 'transparent',
                                                border: selectedTitle?.id === title.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                                            }}
                                        >
                                            {title.id === 'developer' ? (
                                                <span style={{
                                                    background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)',
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent',
                                                    backgroundClip: 'text',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {title.name}
                                                </span>
                                            ) : (
                                                title.name
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Critical Hit Testing */}
                            <div style={{borderBottom: '1px solid var(--border)', paddingBottom: 12}}>
                                <h3 style={{margin: '0 0 8px 0'}}>Critical Hit Testing</h3>
                                <div style={{marginBottom: 12, fontSize: '0.85rem', color: 'var(--muted)'}}>
                                    <div>2x XP Chance: <strong>{criticalChances.criticalHitChance}%</strong></div>
                                    <div>Crate Chance: <strong>{criticalChances.crateRewardChance}%</strong></div>
                                </div>
                                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8}}>
                                    <button 
                                        className={`btn ${criticalTestMode ? 'primary' : 'ghost'}`}
                                        onClick={() => {
                                            enableCriticalTestMode();
                                            setCriticalTestMode(true);
                                            setCriticalChances(getCriticalChances());
                                            alert('Critical test mode enabled (100% chance)!');
                                        }} 
                                        style={{fontSize: '0.8rem'}}
                                    >
                                        {criticalTestMode ? '✓ ' : ''}Max Critical (100%)
                                    </button>
                                    <button 
                                        className="btn ghost"
                                        onClick={() => {
                                            disableCriticalTestMode();
                                            setCriticalTestMode(false);
                                            setCriticalChances(getCriticalChances());
                                            alert('Critical test mode disabled (normal chances)!');
                                        }} 
                                        style={{fontSize: '0.8rem'}}
                                    >
                                        Reset Critical
                                    </button>
                                </div>
                                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8}}>
                                    <button 
                                        className={`btn ${crateTestMode ? 'primary' : 'ghost'}`}
                                        onClick={() => {
                                            enableCrateTestMode();
                                            setCrateTestMode(true);
                                            setCriticalChances(getCriticalChances());
                                            alert('Crate test mode enabled (100% chance)!');
                                        }} 
                                        style={{fontSize: '0.8rem'}}
                                    >
                                        {crateTestMode ? '✓ ' : ''}Max Crate (100%)
                                    </button>
                                    <button 
                                        className="btn ghost"
                                        onClick={() => {
                                            disableCrateTestMode();
                                            setCrateTestMode(false);
                                            setCriticalChances(getCriticalChances());
                                            alert('Crate test mode disabled (normal chances)!');
                                        }} 
                                        style={{fontSize: '0.8rem'}}
                                    >
                                        Reset Crate
                                    </button>
                                </div>
                                <button 
                                    className="btn ghost"
                                    onClick={() => {
                                        grantXp(10);
                                        alert('Granted 10 XP - check for critical!');
                                    }} 
                                    style={{fontSize: '0.8rem', width: '100%'}}
                                >
                                    Test Grant 10 XP
                                </button>
                            </div>

                            {/* Quest Controls */}
                            <div style={{borderBottom: '1px solid var(--border)', paddingBottom: 12}}>
                                <h3 style={{margin: '0 0 8px 0'}}>Quest Controls</h3>
                                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8}}>
                                    <button className="btn ghost" onClick={() => {
                                        const quests = JSON.parse(localStorage.getItem(QUESTS_KEY) || '[]');
                                        quests.forEach((q: any) => q.completed = false);
                                        localStorage.setItem(QUESTS_KEY, JSON.stringify(quests));
                                        window.dispatchEvent(new CustomEvent('questsReset'));
                                        alert('All quests reset!');
                                    }} style={{fontSize: '0.8rem'}}>
                                        Reset All Quests
                                    </button>
                                    <button className="btn ghost" onClick={() => {
                                        const quests = JSON.parse(localStorage.getItem(QUESTS_KEY) || '[]');
                                        quests.forEach((q: any) => q.completed = true);
                                        localStorage.setItem(QUESTS_KEY, JSON.stringify(quests));
                                        window.dispatchEvent(new CustomEvent('questsReset'));
                                        alert('All quests completed!');
                                    }} style={{fontSize: '0.8rem'}}>
                                        Complete All Quests
                                    </button>
                                    <button className="btn ghost" onClick={() => {
                                        const quests = JSON.parse(localStorage.getItem(QUESTS_KEY) || '[]');
                                        const quest = quests.find((q: any) => q.id === 1);
                                        if (quest) quest.progress = 5;
                                        localStorage.setItem(QUESTS_KEY, JSON.stringify(quests));
                                        window.dispatchEvent(new CustomEvent('questsReset'));
                                        alert('Task Master quest progressed!');
                                    }} style={{fontSize: '0.8rem'}}>
                                        +5 Tasks (Q1)
                                    </button>
                                    <button className="btn ghost" onClick={() => {
                                        const quests = JSON.parse(localStorage.getItem(QUESTS_KEY) || '[]');
                                        const quest = quests.find((q: any) => q.id === 4);
                                        if (quest) quest.progress = 7;
                                        localStorage.setItem(QUESTS_KEY, JSON.stringify(quests));
                                        window.dispatchEvent(new CustomEvent('questsReset'));
                                        alert('Streak Keeper quest progressed!');
                                    }} style={{fontSize: '0.8rem'}}>
                                        +7 Streak (Q4)
                                    </button>
                                    <button className="btn ghost" onClick={() => {
                                        const quests = JSON.parse(localStorage.getItem(QUESTS_KEY) || '[]');
                                        const quest = quests.find((q: any) => q.id === 5);
                                        if (quest) quest.progress = 5;
                                        localStorage.setItem(QUESTS_KEY, JSON.stringify(quests));
                                        window.dispatchEvent(new CustomEvent('questsReset'));
                                        alert('Level Up quest progressed!');
                                    }} style={{fontSize: '0.8rem'}}>
                                        +Level 5 (Q5)
                                    </button>
                                </div>
                            </div>

                            {/* Close */}
                            <button className="btn" onClick={() => setShowDevMenu(false)} style={{width: '100%'}}>Close</button>
                        </div>
                    </div>
                </div>
            )}

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

            {/* Profile Modal */}
            {showProfile && (
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
                    zIndex: 9998
                }} onClick={() => setShowProfile(false)}>
                    <div className="panel custom-scrollbar" style={{
                        maxWidth: 500,
                        padding: 24,
                        backgroundColor: 'var(--panel)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                        userSelect: 'none',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }} onClick={(e) => e.stopPropagation()}>
                        {!isLoggedIn ? (
                            // Login/Signup Screen
                            <div>
                                {/* Tabs */}
                                <div style={{display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0}}>
                                    <button
                                        className={authTab === 'login' ? 'btn' : 'btn ghost'}
                                        onClick={() => {
                                            setAuthTab('login');
                                            setLoginError('');
                                            setSignupError('');
                                        }}
                                        style={{flex: 1, borderBottom: authTab === 'login' ? '2px solid var(--accent)' : 'none'}}
                                    >
                                        Login
                                    </button>
                                    <button
                                        className={authTab === 'signup' ? 'btn' : 'btn ghost'}
                                        onClick={() => {
                                            setAuthTab('signup');
                                            setLoginError('');
                                            setSignupError('');
                                        }}
                                        style={{flex: 1, borderBottom: authTab === 'signup' ? '2px solid var(--accent)' : 'none'}}
                                    >
                                        Sign Up
                                    </button>
                                </div>

                                {authTab === 'login' ? (
                                    // Login Tab
                                    <div>
                                        <h2 style={{textAlign: 'center', marginBottom: 24, fontSize: '1.5rem'}}>Login</h2>
                                        <div style={{marginBottom: 16}}>
                                            <label className="subtle" style={{fontSize: '0.8rem', display: 'block', marginBottom: 6}}>EMAIL</label>
                                            <input
                                                type="email"
                                                className="input"
                                                placeholder="Enter your email"
                                                value={loginEmail}
                                                onChange={(e) => setLoginEmail(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                            />
                                        </div>
                                        <div style={{marginBottom: 16}}>
                                            <label className="subtle" style={{fontSize: '0.8rem', display: 'block', marginBottom: 6}}>PASSWORD</label>
                                            <input
                                                type="password"
                                                className="input"
                                                placeholder="Enter your password"
                                                value={loginPassword}
                                                onChange={(e) => setLoginPassword(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                            />
                                        </div>
                                        {loginError && (
                                            <div style={{
                                                backgroundColor: '#ff4444',
                                                color: 'white',
                                                padding: 12,
                                                borderRadius: 4,
                                                marginBottom: 16,
                                                fontSize: '0.9rem'
                                            }}>
                                                {loginError}
                                            </div>
                                        )}
                                        <button className="btn" onClick={handleLogin} style={{width: '100%', marginBottom: 12}}>
                                            Login
                                        </button>
                                        <button className="btn ghost" onClick={() => setShowProfile(false)} style={{width: '100%'}}>
                                            Close
                                        </button>
                                    </div>
                                ) : (
                                    // Sign Up Tab
                                    <div>
                                        <h2 style={{textAlign: 'center', marginBottom: 24, fontSize: '1.5rem'}}>Create Account</h2>
                                        <div style={{marginBottom: 16}}>
                                            <label className="subtle" style={{fontSize: '0.8rem', display: 'block', marginBottom: 6}}>EMAIL</label>
                                            <input
                                                type="email"
                                                className="input"
                                                placeholder="Enter your email"
                                                value={signupEmail}
                                                onChange={(e) => setSignupEmail(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
                                            />
                                        </div>
                                        <div style={{marginBottom: 16}}>
                                            <label className="subtle" style={{fontSize: '0.8rem', display: 'block', marginBottom: 6}}>PASSWORD</label>
                                            <input
                                                type="password"
                                                className="input"
                                                placeholder="Create a password (min 6 chars)"
                                                value={signupPassword}
                                                onChange={(e) => setSignupPassword(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
                                            />
                                        </div>
                                        <div style={{marginBottom: 16}}>
                                            <label className="subtle" style={{fontSize: '0.8rem', display: 'block', marginBottom: 6}}>USERNAME</label>
                                            <input
                                                type="text"
                                                className="input"
                                                placeholder="Choose a username"
                                                value={signupUsername}
                                                onChange={(e) => setSignupUsername(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
                                            />
                                        </div>
                                        <div style={{marginBottom: 16}}>
                                            <label className="subtle" style={{fontSize: '0.8rem', display: 'block', marginBottom: 6}}>HASHTAG (Optional)</label>
                                            <div style={{fontSize: '0.85rem', marginBottom: 8, color: 'var(--muted)'}}>Leave blank to auto-generate</div>
                                            <input
                                                type="text"
                                                className="input"
                                                placeholder="e.g., 1234 (or leave blank)"
                                                value={signupHashtag}
                                                onChange={(e) => setSignupHashtag(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSignUp()}
                                            />
                                        </div>
                                        {signupError && (
                                            <div style={{
                                                backgroundColor: '#ff4444',
                                                color: 'white',
                                                padding: 12,
                                                borderRadius: 4,
                                                marginBottom: 16,
                                                fontSize: '0.9rem'
                                            }}>
                                                {signupError}
                                            </div>
                                        )}
                                        <button className="btn" onClick={handleSignUp} style={{width: '100%', marginBottom: 12}}>
                                            Create Account
                                        </button>
                                        <button className="btn ghost" onClick={() => setShowProfile(false)} style={{width: '100%'}}>
                                            Close
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Profile Content (after logged in)
                            <>
                        {/* Profile Header */}
                        <div style={{textAlign: 'center', marginBottom: 24}}>
                            {editingAvatar ? (
                                <div>
                                    <div style={{marginBottom: 12}}>
                                        <div className="subtle" style={{fontSize: '0.8rem', marginBottom: 8}}>CHOOSE AVATAR</div>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(4, 1fr)',
                                            gap: 8,
                                            marginBottom: 12
                                        }}>
                                            {AVATAR_OPTIONS.map((avatar) => (
                                                <button
                                                    key={avatar}
                                                    className="btn ghost"
                                                    onClick={() => handleAvatarSelect(avatar)}
                                                    style={{
                                                        fontSize: 32,
                                                        padding: 8,
                                                        border: (profile.avatar === avatar && !profile.customAvatarUrl) ? '2px solid var(--accent)' : '2px solid transparent'
                                                    }}
                                                >
                                                    {avatar}
                                                </button>
                                            ))}
                                        </div>
                                        
                                        {/* Upload Custom Image */}
                                        {purchases.has(5) ? (
                                            <div style={{borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12}}>
                                                <div className="subtle" style={{fontSize: '0.8rem', marginBottom: 8}}>UPLOAD CUSTOM IMAGE</div>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleAvatarUpload}
                                                    style={{
                                                        display: 'block',
                                                        width: '100%',
                                                        marginBottom: 8,
                                                        padding: 8,
                                                        borderRadius: 4,
                                                        border: '1px solid var(--border)',
                                                        backgroundColor: 'var(--bg)',
                                                        color: 'var(--text)',
                                                        cursor: 'pointer'
                                                    }}
                                                />
                                                {uploadError && (
                                                    <div className="subtle" style={{color: 'var(--accent)', fontSize: '0.8rem', marginBottom: 8}}>
                                                        {uploadError}
                                                    </div>
                                                )}
                                                {profile.customAvatarUrl && (
                                                    <button 
                                                        className="btn ghost" 
                                                        onClick={() => saveProfile({ ...profile, customAvatarUrl: undefined })}
                                                        style={{width: '100%'}}
                                                    >
                                                        Remove Custom Image
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div style={{borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12}}>
                                                <div className="subtle" style={{fontSize: '0.8rem', marginBottom: 8}}>UPLOAD CUSTOM IMAGE</div>
                                                <div className="subtle" style={{fontSize: '0.85rem', marginBottom: 8, padding: 12, backgroundColor: 'var(--bg)', borderRadius: 4}}>
                                                    🔒 Unlock in the Store for 150 XP to upload custom images
                                                </div>
                                            </div>
                                        )}

                                        <button className="btn ghost" onClick={() => setEditingAvatar(false)} style={{width: '100%', marginTop: 12}}>Done</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div style={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: '50%',
                                        backgroundColor: 'var(--accent)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 40,
                                        margin: '0 auto 12px',
                                        border: purchases.has(3) ? '4px solid var(--accent-2)' : 'none',
                                        cursor: 'pointer',
                                        backgroundImage: profile.customAvatarUrl ? `url(${profile.customAvatarUrl})` : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        overflow: 'hidden'
                                    }} onClick={() => setEditingAvatar(true)}>
                                        {!profile.customAvatarUrl && profile.avatar}
                                    </div>
                                </>
                            )}
                            {editingName ? (
                                <div style={{display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12}}>
                                    <div style={{display: 'flex', gap: 8}}>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="Username"
                                            value={editNameValue}
                                            onChange={(e) => setEditNameValue(e.target.value)}
                                            autoFocus
                                            onKeyPress={(e) => e.key === 'Enter' && handleSaveName()}
                                            style={{flex: 1}}
                                        />
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="#1234"
                                            value={editHashtagValue}
                                            onChange={(e) => setEditHashtagValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSaveName()}
                                            style={{width: 100}}
                                        />
                                    </div>
                                    <div style={{display: 'flex', gap: 8}}>
                                        <button className="btn" onClick={handleSaveNameAndHashtag} style={{flex: 1}}>Save</button>
                                        <button className="btn ghost" onClick={() => setEditingName(false)} style={{flex: 1}}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12}}>
                                    <h2 style={{margin: 0}}>
                                        {profile.username}<span style={{color: 'var(--muted)', fontSize: '0.8em', marginLeft: 4}}>#{profile.hashtag || '1000'}</span>
                                    </h2>
                                    <button 
                                        className="btn ghost"
                                        onClick={() => {
                                            setEditingName(true);
                                            setEditNameValue(profile.username);
                                            setEditHashtagValue(profile.hashtag || '');
                                        }}
                                        style={{padding: '4px 8px', fontSize: '1rem'}}
                                    >
                                        ✏️
                                    </button>
                                </div>
                            )}
                            <div className="subtle">Level {Math.floor(getXp() / 100) + 1} • {getXp()} XP</div>
                            {selectedTitle && (
                                <div style={{fontSize: '0.9rem', marginTop: 4}}>
                                    {selectedTitle.id === 'developer' ? (
                                        <span style={{
                                            background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            backgroundClip: 'text',
                                            fontWeight: 'bold'
                                        }}>
                                            ✨ {selectedTitle.name}
                                        </span>
                                    ) : (
                                        <span style={{color: 'var(--accent)'}}>
                                            ✨ {selectedTitle.name}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Streak Section */}
                        <div style={{
                            backgroundColor: 'var(--bg)',
                            borderRadius: 8,
                            padding: 16,
                            marginBottom: 16,
                            textAlign: 'center'
                        }}>
                            <div style={{fontSize: '2rem', marginBottom: 8}}>🔥</div>
                            <div style={{fontSize: '1.2rem', fontWeight: 500}}>{streak.current} day streak</div>
                            <div className="subtle" style={{fontSize: '0.9rem', marginTop: 4}}>Longest: {streak.longest} days</div>
                        </div>

                        {/* Stats Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 12,
                            marginBottom: 16
                        }}>
                            <div style={{backgroundColor: 'var(--bg)', borderRadius: 8, padding: 12, textAlign: 'center'}}>
                                <div className="subtle" style={{fontSize: '0.8rem', marginBottom: 4}}>Tasks Completed</div>
                                <div style={{fontSize: '1.5rem', fontWeight: 'bold'}}>{profile.tasksCompleted}</div>
                            </div>
                            <div style={{backgroundColor: 'var(--bg)', borderRadius: 8, padding: 12, textAlign: 'center'}}>
                                <div className="subtle" style={{fontSize: '0.8rem', marginBottom: 4}}>Events Created</div>
                                <div style={{fontSize: '1.5rem', fontWeight: 'bold'}}>{profile.eventsCreated}</div>
                            </div>
                        </div>

                        {/* Titles Section */}
                        <div style={{marginBottom: 16}}>
                            <div style={{textAlign: 'center', marginBottom: 12}}>
                                <h3 style={{margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--muted)'}}>TITLES</h3>
                                <div style={{fontSize: '1rem', fontWeight: 'bold', marginBottom: 8}}>
                                    {unlockedTitles.length}/{ALL_TITLES.length}
                                </div>
                                <div style={{
                                    width: '100%',
                                    height: 6,
                                    background: 'var(--border)',
                                    borderRadius: 3,
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${(unlockedTitles.length / ALL_TITLES.length) * 100}%`,
                                        background: 'linear-gradient(90deg, var(--accent), #a78bfa)',
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                            </div>
                            <div className="custom-scrollbar" style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 12, maxHeight: '300px', overflowY: 'auto'}}>
                                {ALL_TITLES.map(title => {
                                    const isUnlocked = unlockedTitles.some(t => t.id === title.id);
                                    const isSelected = selectedTitle?.id === title.id;
                                    return (
                                        <div
                                            key={title.id}
                                            onClick={() => isUnlocked && setSelectedTitle(isSelected ? null : title.id)}
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
                                                alignItems: 'flex-start'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (isUnlocked) {
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(167, 139, 250, 0.3)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            <div style={{fontSize: '1.5rem', flexShrink: 0}}>
                                                {isUnlocked ? '✨' : '🔒'}
                                            </div>
                                            <div style={{flex: 1, minWidth: 0}}>
                                                <div style={{fontSize: '0.8rem', fontWeight: 'bold', marginBottom: 2}}>
                                                    {title.id === 'developer' ? (
                                                        <span style={{
                                                            background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899)',
                                                            WebkitBackgroundClip: 'text',
                                                            WebkitTextFillColor: 'transparent',
                                                            backgroundClip: 'text'
                                                        }}>
                                                            {title.name}
                                                        </span>
                                                    ) : (
                                                        title.name
                                                    )}
                                                    {isSelected && <span style={{marginLeft: 4, color: 'var(--accent)'}}>★</span>}
                                                </div>
                                                <div style={{fontSize: '0.7rem', color: 'var(--muted)', lineHeight: '1.3', marginBottom: 4}}>
                                                    {title.description}
                                                </div>
                                                <div style={{fontSize: '0.65rem', color: 'var(--accent)', fontStyle: 'italic'}}>
                                                    {title.source}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Medals Section */}
                        <div style={{marginBottom: 16}}>
                            <div style={{textAlign: 'center', marginBottom: 12}}>
                                <h3 style={{margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--muted)'}}>MEDALS</h3>
                                <div style={{fontSize: '1rem', fontWeight: 'bold', marginBottom: 8}}>
                                    {medals.filter(m => m.earned).length}/{medals.length}
                                </div>
                                <div style={{
                                    width: '100%',
                                    height: 6,
                                    background: 'var(--border)',
                                    borderRadius: 3,
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${(medals.filter(m => m.earned).length / medals.length) * 100}%`,
                                        background: 'linear-gradient(90deg, var(--accent), #fbbf24)',
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                            </div>
                            <div className="custom-scrollbar" style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 12, maxHeight: '300px', overflowY: 'auto'}}>
                                {medals.map(medal => (
                                    <div
                                        key={medal.id}
                                        style={{
                                            display: 'flex',
                                            gap: 8,
                                            padding: 10,
                                            background: medal.earned
                                                ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)'
                                                : 'rgba(0, 0, 0, 0.1)',
                                            border: medal.earned
                                                ? '1px solid rgba(251, 191, 36, 0.5)'
                                                : '1px solid var(--border)',
                                            borderRadius: 6,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            alignItems: 'flex-start'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (medal.earned) {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 191, 36, 0.3)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        <div style={{fontSize: '1.5rem', flexShrink: 0}}>{medal.earned ? medal.icon : '🔒'}</div>
                                        <div style={{flex: 1, minWidth: 0}}>
                                            <div style={{fontSize: '0.8rem', fontWeight: 'bold', marginBottom: 2}}>{medal.name}</div>
                                            <div style={{fontSize: '0.7rem', color: 'var(--muted)', lineHeight: '1.3'}}>{medal.description}</div>
                                            {medal.earned && medal.earnedDate && (
                                                <div style={{fontSize: '0.65rem', color: 'var(--accent)', marginTop: 4}}>
                                                    ✓ {new Date(medal.earnedDate).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* About Section */}
                        <div style={{marginBottom: 16, textAlign: 'center'}}>
                            <h3 style={{margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--muted)'}}>ABOUT</h3>
                            <div className="subtle" style={{fontSize: '0.9rem'}}>
                                An ADHD explorer on a journey of self-care and productivity. Crushing goals one task at a time! 🚀
                            </div>
                        </div>

                        {/* Close and Logout Buttons */}
                        <button className="btn ghost" onClick={handleLogout} style={{width: '100%', marginBottom: 8, backgroundColor: 'rgba(255,68,68,0.2)', color: 'var(--text)'}}>Logout</button>
                        <button className="btn" onClick={() => setShowProfile(false)} style={{width: '100%'}}>Close</button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;