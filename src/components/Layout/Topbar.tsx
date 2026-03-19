
import { Menu, Bell, Search, Sun, Moon } from 'lucide-react';
import styles from './Topbar.module.css';

interface TopbarProps {
    toggleSidebar: () => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

export function Topbar({ toggleSidebar, theme, toggleTheme }: TopbarProps) {
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
                <button className={styles.iconButton}>
                    <div className={styles.badge}>3</div>
                    <Bell size={20} />
                </button>
                <div className={styles.userProfile}>
                    <img src="https://ui-avatars.com/api/?name=User&background=3b82f6&color=fff" alt="User profile" />
                </div>
            </div>
        </header>
    );
}
