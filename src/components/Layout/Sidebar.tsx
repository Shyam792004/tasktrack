
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Calendar, PieChart, CreditCard, Target, Settings, Clock, Activity, Heart, PiggyBank } from 'lucide-react';
import styles from './Sidebar.module.css';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Tasks', path: '/tasks', icon: <CheckSquare size={20} /> },
        { name: 'Calendar', path: '/calendar', icon: <Calendar size={20} /> },
        { name: 'Timer', path: '/timer', icon: <Clock size={20} /> },
        { name: 'Analytics', path: '/analytics', icon: <PieChart size={20} /> },
        { name: 'Expenses', path: '/expenses', icon: <CreditCard size={20} /> },
        { name: 'Savings', path: '/savings', icon: <PiggyBank size={20} /> },
        { name: 'Goals', path: '/goals', icon: <Target size={20} /> },
        { name: 'Habits', path: '/habits', icon: <Activity size={20} /> },
        { name: 'Health', path: '/health', icon: <Heart size={20} /> },
        { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
    ];

    return (
        <>
            <div className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ''}`} onClick={() => setIsOpen(false)} />
            <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
                <div className={styles.logo}>
                    <Target size={28} className="text-gradient" />
                    <h2 className="text-gradient">TaskTrack</h2>
                </div>

                <nav className={styles.nav}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
                            onClick={() => setIsOpen(false)}
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                </nav>
            </aside>
        </>
    );
}
