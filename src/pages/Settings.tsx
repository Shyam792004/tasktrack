import { useState, useEffect } from 'react';
import { Camera, Save, Check } from 'lucide-react';
import styles from './Settings.module.css';

export function Settings() {
    const [name, setName] = useState('User');
    const [email, setEmail] = useState('user@example.com');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const savedUser = localStorage.getItem('tracktrack_user');
        if (savedUser) {
            const { name, email } = JSON.parse(savedUser);
            setName(name);
            setEmail(email);
        }
    }, []);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const userData = { name, email };
        localStorage.setItem('tracktrack_user', JSON.stringify(userData));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        
        // Dispatch custom event to notify Topbar
        window.dispatchEvent(new Event('userUpdate'));
    };

    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff&size=128`;

    return (
        <div className={styles.settingsPage}>
            <div className={styles.header}>
                <h1 className={styles.title}>Settings</h1>
                <p className={styles.subtitle}>Manage your profile and account preferences</p>
            </div>

            <div className={`glass-panel ${styles.settingsCard}`}>
                <form onSubmit={handleSave} className={styles.section}>
                    <div className={styles.profileSection}>
                        <div className={styles.avatarContainer}>
                            <img src={avatarUrl} alt="User avatar" className={styles.avatar} />
                            <div className={styles.editAvatar}>
                                <Camera size={16} />
                            </div>
                        </div>
                        <div className={styles.profileInfo}>
                            <h3>Profile Picture</h3>
                            <p>Your avatar is automatically generated based on your name.</p>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="name">Full Name</label>
                        <div className={styles.inputWrapper}>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={styles.input}
                                placeholder="Enter your name"
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="email">Email Address</label>
                        <div className={styles.inputWrapper}>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={styles.input}
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button type="submit" className={styles.saveButton}>
                            {saved ? <Check size={18} /> : <Save size={18} />}
                            {saved ? 'Saved!' : 'Save Changes'}
                        </button>
                        {saved && <span className={styles.successMessage}>Settings updated successfully!</span>}
                    </div>
                </form>
            </div>
        </div>
    );
}
