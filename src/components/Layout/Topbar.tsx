import { useState, useEffect } from 'react';
import { Menu, Bell, Search, Sun, Moon } from 'lucide-react';
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
    const [todayTaskCount, setTodayTaskCount] = useState(0);
    const [userName, setUserName] = useState('User');

    // Live data for counts
    const [tasks, setTasks] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);

    useEffect(() => {
        const unsubTasks = subscribeToTasks(setTasks);
        const unsubEvents = subscribeToCalendarEvents(setEvents);
        const unsubUser = subscribeToUserSettings((user) => {
            if (user && user.name) setUserName(user.name);
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
        
        setTodayTaskCount(taskCount + eventCount);
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
                <button onClick={toggleTheme} className={styles.iconButton}>
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
                <button className={styles.iconButton} onClick={() => navigate('/todays-events')}>
                    {todayTaskCount > 0 && <div className={styles.badge}>{todayTaskCount}</div>}
                    <Bell size={20} />
                </button>
                <div className={styles.userProfile} onClick={() => navigate('/settings')} style={{ cursor: 'pointer' }}>
                    <img src={avatarUrl} alt="User profile" />
                </div>
            </div>
        </header>
    );
}
