import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import Button from '../components/UI/Button';
import { getGlobalLeaderboard, getFriendsLeaderboard, getPlayerRank, syncPlayerToLeaderboard } from '../services/leaderboard';
import { getLevelFromXp } from '../services/xp';

interface LeaderboardEntry {
    id: string;
    userId: string;
    username: string;
    avatar: string;
    customAvatarUrl?: string;
    xp: number;
    level: number;
    currentStreak?: number;
    tasksCompleted?: number;
}

interface MonthlyResetInfo {
    daysLeft: number;
    hoursLeft: number;
    minutesLeft: number;
    totalDaysLeft: number;
}

const Leaderboards: React.FC = () => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [userRank, setUserRank] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'global' | 'friends'>('global');
    const [loading, setLoading] = useState(true);
    const [resetInfo, setResetInfo] = useState<MonthlyResetInfo>({
        daysLeft: 0,
        hoursLeft: 0,
        minutesLeft: 0,
        totalDaysLeft: 0,
    });
    const auth = getAuth();

    // Calculate time until next month reset
    const calculateResetTime = (): MonthlyResetInfo => {
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const diffMs = nextMonth.getTime() - now.getTime();
        
        const totalDaysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hoursLeft = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutesLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return {
            daysLeft: totalDaysLeft,
            hoursLeft,
            minutesLeft,
            totalDaysLeft,
        };
    };

    useEffect(() => {
        const loadLeaderboard = async () => {
            try {
                setLoading(true);
                
                // Calculate reset time
                const info = calculateResetTime();
                setResetInfo(info);

                // Sync current player to leaderboard first
                if (auth.currentUser) {
                    await syncPlayerToLeaderboard();
                }

                // Get leaderboard data
                const globalData = await getGlobalLeaderboard();
                
                // Convert to LeaderboardEntry format
                const entries: LeaderboardEntry[] = globalData.map(player => ({
                    id: player.userId,
                    userId: player.userId,
                    username: player.username,
                    avatar: player.avatar,
                    customAvatarUrl: player.customAvatarUrl,
                    xp: player.xp,
                    level: player.level,
                    currentStreak: player.currentStreak,
                    tasksCompleted: player.tasksCompleted,
                }));

                setLeaderboard(entries);

                // Get user rank
                if (auth.currentUser) {
                    const rank = await getPlayerRank();
                    setUserRank(rank);
                }
            } catch (error) {
                console.error('Error loading leaderboard:', error);
                setLeaderboard([]);
            } finally {
                setLoading(false);
            }
        };

        loadLeaderboard();

        // Set up interval to update timer every minute
        const interval = setInterval(() => {
            const newInfo = calculateResetTime();
            setResetInfo(newInfo);
        }, 60000);

        return () => clearInterval(interval);
    }, [auth.currentUser]);

    return (
        <div className="container">
            <div className="panel" style={{ maxWidth: 700, margin: '24px auto' }}>
                <div style={{ marginBottom: 24, textAlign: 'center' }}>
                    <h2 style={{ margin: '0 0 8px 0' }}>🏆 Leaderboards</h2>
                    <div className="subtle">Compete with others. Complete tasks. Earn XP.</div>
                    <div style={{
                        marginTop: 12,
                        padding: '8px 12px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        borderRadius: 6,
                        border: '1px solid var(--primary)',
                        fontSize: '0.85rem',
                        color: 'var(--text)',
                    }}>
                        Resets Monthly • Next reset in {resetInfo.daysLeft}d {resetInfo.hoursLeft}h {resetInfo.minutesLeft}m
                    </div>
                </div>

                {userRank && userRank > 0 && (
                    <div style={{
                        background: 'var(--panel)',
                        border: '2px solid var(--primary)',
                        borderRadius: 8,
                        padding: 16,
                        marginBottom: 24,
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 4 }}>YOUR RANK</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>#{userRank}</div>
                    </div>
                )}

                {loading ? (
                    <div style={{
                        textAlign: 'center',
                        padding: 32,
                        color: 'var(--text-secondary)',
                    }}>
                        <div>Loading leaderboard...</div>
                    </div>
                ) : leaderboard.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: 32,
                        color: 'var(--text-secondary)',
                    }}>
                        <div style={{ fontSize: '2rem', marginBottom: 12 }}>👥</div>
                        <div>No one on the leaderboard yet. Start completing tasks!</div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {leaderboard.map((entry, index) => (
                            <div
                                key={entry.userId}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: 12,
                                    background: 'var(--panel)',
                                    borderRadius: 8,
                                    border: auth.currentUser?.uid === entry.userId ? '2px solid var(--primary)' : '1px solid var(--border)',
                                }}
                            >
                                <div style={{
                                    minWidth: 32,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '1.2rem',
                                }}>
                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                </div>

                                <div style={{
                                    fontSize: '1.8rem',
                                    minWidth: 40,
                                    textAlign: 'center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    {entry.customAvatarUrl ? (
                                        <img 
                                            src={entry.customAvatarUrl} 
                                            alt={entry.username}
                                            style={{
                                                width: '2rem',
                                                height: '2rem',
                                                borderRadius: '50%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    ) : (
                                        entry.avatar
                                    )}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                                        {entry.username}
                                        {auth.currentUser?.uid === entry.userId && <span style={{ color: 'var(--primary)', marginLeft: 8 }}>(You)</span>}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        Level {entry.level} • {entry.tasksCompleted || 0} tasks • 🔥 {entry.currentStreak || 0}
                                    </div>
                                </div>

                                <div style={{
                                    textAlign: 'right',
                                    minWidth: 80,
                                }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary)' }}>
                                        {(entry.xp || 0).toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>XP</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ marginTop: 32, padding: 16, background: 'var(--panel)', borderRadius: 8, textAlign: 'center' }}>
                    <div className="subtle" style={{ marginBottom: 12 }}>
                        Complete tasks and focus sessions to earn XP and climb the leaderboard!
                    </div>
                    <Button onClick={() => window.location.href = '/'}>Back to Dashboard</Button>
                </div>
            </div>
        </div>
    );
};

export default Leaderboards;
