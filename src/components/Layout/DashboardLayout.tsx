import { useState  } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import styles from './DashboardLayout.module.css';

interface DashboardLayoutProps {
    children: React.ReactNode;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

export function DashboardLayout({ children, theme, toggleTheme }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className={styles.layout}>
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
            <div className={styles.mainContent}>
                <Topbar toggleSidebar={() => setSidebarOpen(true)} theme={theme} toggleTheme={toggleTheme} />
                <main className={styles.contentArea}>
                    {children}
                </main>
            </div>
        </div>
    );
}
