const TITLES_KEY = 'adhd_titles';

import { syncTitlesToFirestore } from './gameProgress';

export interface Title {
    id: string;
    name: string;
    description: string;
    unlockedFrom: 'store' | 'quest' | 'achievement' | 'special';
    source?: string; // e.g., "Complete 10 tasks", "Reach Level 10"
}

export const ALL_TITLES: Title[] = [
    {
        id: 'task_master',
        name: 'Task Master',
        description: 'Complete 100 tasks',
        unlockedFrom: 'achievement',
        source: 'Complete 100 tasks',
    },
    {
        id: 'focus_wizard',
        name: 'Focus Wizard',
        description: 'Complete 10 focus sessions',
        unlockedFrom: 'achievement',
        source: 'Complete 10 focus sessions',
    },
    {
        id: 'level_legend',
        name: 'Level Legend',
        description: 'Reach Level 20',
        unlockedFrom: 'achievement',
        source: 'Reach Level 20',
    },
    {
        id: 'streak_keeper',
        name: 'Streak Keeper',
        description: 'Maintain a 30-day streak',
        unlockedFrom: 'achievement',
        source: 'Maintain a 30-day streak',
    },
    {
        id: 'pet_lover',
        name: 'Pet Lover',
        description: 'Reach maximum pet happiness',
        unlockedFrom: 'achievement',
        source: 'Reach maximum pet happiness',
    },
    {
        id: 'skill_scholar',
        name: 'Skill Scholar',
        description: 'Unlock 10 skills',
        unlockedFrom: 'achievement',
        source: 'Unlock 10 skills',
    },
    {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Complete 5 tasks before 9 AM',
        unlockedFrom: 'achievement',
        source: 'Complete 5 tasks before 9 AM',
    },
    {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Complete 5 tasks after 9 PM',
        unlockedFrom: 'achievement',
        source: 'Complete 5 tasks after 9 PM',
    },
    {
        id: 'calendar_creator',
        name: 'Calendar Creator',
        description: 'Create 50 events',
        unlockedFrom: 'achievement',
        source: 'Create 50 events',
    },
    {
        id: 'explorer',
        name: 'Explorer',
        description: 'Visit all pages in the app',
        unlockedFrom: 'achievement',
        source: 'Visit all pages in the app',
    },
    {
        id: 'founder',
        name: 'Founder',
        description: 'Support the app early',
        unlockedFrom: 'store',
        source: 'Purchase from store',
    },
    {
        id: 'collector',
        name: 'Collector',
        description: 'Unlock 50 titles',
        unlockedFrom: 'achievement',
        source: 'Unlock 50 titles',
    },
    {
        id: 'developer',
        name: 'Developer',
        description: 'Secret dev title',
        unlockedFrom: 'special',
        source: 'For Devs Only ;)',
    },
];

interface UnlockedTitles {
    unlockedIds: string[];
    selectedTitleId: string | null;
}

const getDefaultTitles = (): UnlockedTitles => ({
    unlockedIds: [],
    selectedTitleId: null,
});

export const getTitles = (): UnlockedTitles => {
    try {
        const stored = localStorage.getItem(TITLES_KEY);
        return stored ? JSON.parse(stored) : getDefaultTitles();
    } catch {
        return getDefaultTitles();
    }
};

export const unlockTitle = (titleId: string): void => {
    try {
        const titles = getTitles();
        if (!titles.unlockedIds.includes(titleId)) {
            titles.unlockedIds.push(titleId);
            localStorage.setItem(TITLES_KEY, JSON.stringify(titles));
            
            // Sync to Firestore
            console.log('[titles] Syncing unlocked title to Firestore:', titleId);
            syncTitlesToFirestore(titles.unlockedIds, titles.selectedTitleId).catch(err => console.warn('[titles] Failed to sync:', err));
            
            // Dispatch custom event for UI updates
            window.dispatchEvent(new CustomEvent('titleUnlocked', { detail: { titleId } }));
        }
    } catch (error) {
        console.error('Error unlocking title:', error);
    }
};

export const setSelectedTitle = (titleId: string | null): void => {
    try {
        const titles = getTitles();
        titles.selectedTitleId = titleId;
        localStorage.setItem(TITLES_KEY, JSON.stringify(titles));
        
        // Sync to Firestore
        const unlockedTitles = titles.unlockedIds;
        console.log('[titles] Syncing selected title to Firestore:', titleId);
        syncTitlesToFirestore(unlockedTitles, titleId).catch(err => console.warn('[titles] Failed to sync:', err));
        
        window.dispatchEvent(new CustomEvent('selectedTitleChanged', { detail: { titleId } }));
    } catch (error) {
        console.error('Error setting selected title:', error);
    }
};

export const getUnlockedTitles = (): Title[] => {
    const titles = getTitles();
    return ALL_TITLES.filter(title => titles.unlockedIds.includes(title.id));
};

export const getSelectedTitle = (): Title | null => {
    const titles = getTitles();
    if (!titles.selectedTitleId) return null;
    return ALL_TITLES.find(title => title.id === titles.selectedTitleId) || null;
};

export const isTitleUnlocked = (titleId: string): boolean => {
    const titles = getTitles();
    return titles.unlockedIds.includes(titleId);
};
