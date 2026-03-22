import { useState, useEffect } from 'react';
import { Menu, Bell, Search, Sun, Moon, Cloud, CloudOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { subscribeToTasks, subscribeToCalendarEvents, subscribeToUserSettings } from '../../services/dataService';
import styles from './Topbar.module.css';

interface TopbarProps {
    toggleSidebar: () => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

export function Topbar({ toggleSidebar, theme, toggleTheme }: TopbarProps) {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState(0);
    const [userName, setUserName] = useState('User');
    const [isSynced, setIsSynced] = useState(false);

    // Live data for counts
    const [tasks, setTasks] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);

    useEffect(() => {
        const unsubTasks = subscribeToTasks(setTasks);
        const unsubEvents = subscribeToCalendarEvents(setEvents);
        const unsubUser = subscribeToUserSettings((data) => {
            if (data && data.name) setUserName(data.name);
            setIsSynced(true);
        });

        return () => {
            unsubTasks();
            unsubEvents();
            unsubUser();
        };
    }, []);

    useEffect(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        
        const taskCount = tasks.filter(t => t.dueDate && format(new Date(t.dueDate), 'yyyy-MM-dd') === today && !t.completed).length;
        const eventCount = events.filter(e => e.date && format(new Date(e.date), 'yyyy-MM-dd') === today && !e.completed).length;
        
        setNotifications(taskCount + eventCount);
    }, [tasks, events]);

    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=3b82f6&color=fff`;

    return (
        <header className={styles.topbar}>
            <div className={styles.left}>
                <button onClick={toggleSidebar} className={styles.menuButton}>
                    <Menu size={24} />
                </button>
                <div className={styles.searchBar}>
                    <Search size={18} className={styles.searchIcon} />
                    <input type="text" placeholder="Search tasks, goals..." className={styles.searchInput} />
                </div>
            </div>

            <div className={styles.right}>
                <div className={styles.syncIndicator} title={isSynced ? "Cloud Synced" : "Syncing..."}>
                    {isSynced ? <Cloud size={18} color="#10b981" /> : <CloudOff size={18} color="#94a3b8" />}
                    <span className={styles.syncText}>{isSynced ? "Synced" : "Syncing..."}</span>
                </div>
                <button onClick={toggleTheme} className={styles.iconButton}>
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
                <button className={styles.iconButton} onClick={() => navigate('/todays-events')}>
                    {notifications > 0 && <div className={styles.badge}>{notifications}</div>}
                    <Bell size={20} />
                </button>
                <div className={styles.userProfile} onClick={() => navigate('/settings')} style={{ cursor: 'pointer' }}>
                    <img src={avatarUrl} alt="User profile" />
                </div>
            </div>
        </header>
    );
}
