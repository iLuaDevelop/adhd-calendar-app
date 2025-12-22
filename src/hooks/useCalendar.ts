import { useState, useEffect } from 'react';
import { getFromLocalStorage, saveToLocalStorage } from '../services/storage';
import { syncTasksToFirestore } from '../services/gameProgress';
import { getAuth } from 'firebase/auth';

const TASKS_KEY = 'adhd_tasks';
const EVENTS_KEY = 'adhd_events';

const useCalendar = () => {
    const [events, setEvents] = useState<Record<string, string[]>>(() => getFromLocalStorage(EVENTS_KEY) || {});
    const [tasks, setTasks] = useState<any[]>(() => getFromLocalStorage(TASKS_KEY) || []);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // persist tasks when they change
        try {
            saveToLocalStorage(TASKS_KEY, tasks);
            // Also sync to Firestore if user is logged in
            const auth = getAuth();
            if (auth.currentUser) {
                syncTasksToFirestore(tasks).catch(err => console.warn('[useCalendar] Failed to sync tasks:', err));
            }
        } catch {}
    }, [tasks]);

    useEffect(() => {
        try {
            saveToLocalStorage(EVENTS_KEY, events);
        } catch {}
    }, [events]);

    const addEvent = (date: Date, title: string) => {
        const key = date.toDateString();
        setEvents((prev) => {
            const next = { ...prev };
            next[key] = [...(next[key] || []), title];
            return next;
        });
    };

    const removeEvent = (date: Date, index: number) => {
        const key = date.toDateString();
        setEvents((prev) => {
            const next = { ...prev };
            if (!next[key]) return prev;
            next[key] = next[key].filter((_, i) => i !== index);
            return next;
        });
    };

    const addTask = (task: any) => {
        const taskWithTimestamp = { ...task, createdAt: Date.now() };
        setTasks((prev) => [...prev, taskWithTimestamp]);
    };

    const removeTask = (taskId: number) => {
        setTasks((prev) => prev.filter(t => t.id !== taskId));
    };

    const updateTask = (updated: any) => {
        setTasks((prev) => prev.map(t => (t.id === updated.id ? { ...t, ...updated } : t)));
    };

    return { events, tasks, loading, addEvent, removeEvent, addTask, removeTask, updateTask };
};

export default useCalendar;
export { useCalendar };