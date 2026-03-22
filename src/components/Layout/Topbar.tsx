import { useState, useEffect } from 'react';
import { Menu, Bell, Search, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
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

    const updateData = () => {
        // Update Task Count
        let totalCount = 0;
        const today = format(new Date(), 'yyyy-MM-dd');

        const savedTasks = localStorage.getItem('tracktrack_tasks');
        if (savedTasks) {
            const tasks = JSON.parse(savedTasks);
            const count = tasks.filter((t: any) => t.dueDate && format(new Date(t.dueDate), 'yyyy-MM-dd') === today && !t.completed).length;
            totalCount += count;
        }

        const savedCalendar = localStorage.getItem('tracktrack_calendar_events');
        if (savedCalendar) {
            const events = JSON.parse(savedCalendar);
            const count = events.filter((e: any) => e.date && format(new Date(e.date), 'yyyy-MM-dd') === today && !e.completed).length;
            totalCount += count;
        }

        setTodayTaskCount(totalCount);

        // Update User Name
        const savedUser = localStorage.getItem('tracktrack_user');
        if (savedUser) {
            const { name } = JSON.parse(savedUser);
            setUserName(name);
        }
    };

    useEffect(() => {
        updateData();
        
        // Listen for storage changes and custom updates
        window.addEventListener('storage', updateData);
        window.addEventListener('userUpdate', updateData);
        window.addEventListener('tasksUpdate', updateData);
        
        return () => {
            window.removeEventListener('storage', updateData);
            window.removeEventListener('userUpdate', updateData);
            window.removeEventListener('tasksUpdate', updateData);
        };
    }, []);

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
