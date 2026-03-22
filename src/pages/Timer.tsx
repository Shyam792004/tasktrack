import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, Briefcase, ListTodo } from 'lucide-react';
import { subscribeToTasks, subscribeToUserSettings, updateUserSettings } from '../services/dataService';
import styles from './Timer.module.css';

export function Timer() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [focusDuration, setFocusDuration] = useState(25);
    const [sessions, setSessions] = useState(0);
    const [totalFocusTime, setTotalFocusTime] = useState(0);

    const getBreakDuration = (fd: number) => fd === 25 ? 5 : 10;

    const [timeLeft, setTimeLeft] = useState(focusDuration * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'focus' | 'break'>('focus');
    const [selectedTaskId, setSelectedTaskId] = useState<string>('');

    useEffect(() => {
        const unsubTasks = subscribeToTasks((newTasks) => {
            setTasks(newTasks);
            if (newTasks.length > 0 && !selectedTaskId) setSelectedTaskId(newTasks[0].id);
        });
        const unsubSettings = subscribeToUserSettings((settings) => {
            if (settings.timerDuration !== undefined) {
                setFocusDuration(settings.timerDuration);
                if (!isActive && mode === 'focus') setTimeLeft(settings.timerDuration * 60);
            }
            if (settings.timerSessions !== undefined) setSessions(settings.timerSessions);
            if (settings.timerTotalFocusTime !== undefined) setTotalFocusTime(settings.timerTotalFocusTime);
        });
        return () => {
            unsubTasks();
            unsubSettings();
        };
    }, [selectedTaskId, isActive, mode]);

    useEffect(() => {
        let interval: number | null = null;

        if (isActive && timeLeft > 0) {
            interval = window.setInterval(() => {
                setTimeLeft(time => time - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            if (mode === 'focus') {
                const newSessions = sessions + 1;
                const newTotalTime = totalFocusTime + focusDuration;
                updateUserSettings({
                    timerSessions: newSessions,
                    timerTotalFocusTime: newTotalTime
                });
            }
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft, mode, focusDuration]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(mode === 'focus' ? focusDuration * 60 : getBreakDuration(focusDuration) * 60);
    };

    const switchMode = (newMode: 'focus' | 'break') => {
        setMode(newMode);
        setIsActive(false);
        setTimeLeft(newMode === 'focus' ? focusDuration * 60 : getBreakDuration(focusDuration) * 60);
    };

    const handleDurationChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = parseInt(e.target.value);
        await updateUserSettings({ timerDuration: val });
        setIsActive(false);
        if (mode === 'focus') {
            setTimeLeft(val * 60);
        } else {
            setTimeLeft(getBreakDuration(val) * 60);
        }
    };

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const currentTotal = mode === 'focus' ? focusDuration * 60 : getBreakDuration(focusDuration) * 60;
    const progressPercent = ((currentTotal - timeLeft) / currentTotal) * 100;

    return (
        <div className={styles.timerPage}>
            <div className={styles.header}>
                <h1 className={styles.title}>Focus Timer</h1>
                <p className={styles.subtitle}>Stay productive with Pomodoro</p>
            </div>

            <div className={styles.timerContainer}>
                <div className={`glass-panel ${styles.timerCard}`}>
                    <div className={styles.taskSelectorWrapper}>
                        <ListTodo size={18} className={styles.taskIcon} />
                        <select
                            value={selectedTaskId}
                            onChange={(e) => setSelectedTaskId(e.target.value)}
                            className={styles.taskSelect}
                        >
                            <option value="">-- Select a Task to Focus On --</option>
                            {tasks.map(t => (
                                <option key={t.id} value={t.id}>{t.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.modeTabsWrapper}>
                        <select
                            value={focusDuration}
                            onChange={handleDurationChange}
                            className={styles.durationSelect}
                        >
                            <option value={25}>25 mins</option>
                            <option value={50}>50 mins</option>
                        </select>
                        <div className={styles.modeTabs}>
                            <button
                                className={`${styles.tab} ${mode === 'focus' ? styles.activeTab : ''}`}
                                onClick={() => switchMode('focus')}
                            >
                                <Briefcase size={16} /> Focus
                            </button>
                            <button
                                className={`${styles.tab} ${mode === 'break' ? styles.breakActiveTab : ''}`}
                                onClick={() => switchMode('break')}
                            >
                                <Coffee size={16} /> Break
                            </button>
                        </div>
                    </div>

                    <div className={styles.circularProgress}>
                        <svg viewBox="0 0 100 100" className={styles.progressCircle}>
                            <circle cx="50" cy="50" r="45" className={styles.circleBg} />
                            <circle
                                cx="50" cy="50" r="45"
                                className={styles.circleFill}
                                style={{
                                    strokeDasharray: `${2 * Math.PI * 45}`,
                                    strokeDashoffset: `${2 * Math.PI * 45 * (1 - progressPercent / 100)}`,
                                    stroke: mode === 'focus' ? 'var(--accent-primary)' : 'var(--accent-success)'
                                }}
                            />
                        </svg>
                        <div className={styles.timeDisplay}>
                            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </div>
                    </div>

                    <div className={styles.controls}>
                        <button onClick={toggleTimer} className={`${styles.mainBtn} ${isActive ? styles.pauseBtn : styles.playBtn}`}>
                            {isActive ? <Pause size={28} /> : <Play size={28} className={styles.playIcon} />}
                        </button>
                        <button onClick={resetTimer} className={styles.resetBtn}>
                            <RotateCcw size={20} />
                        </button>
                    </div>
                </div>

                <div className={`glass-panel ${styles.statsCard}`}>
                    <h3>Session Stats</h3>
                    <div className={styles.statList}>
                        <div className={styles.statItem}>
                            <span>Today's Focus Time</span>
                            <span className={styles.statValue}>{Math.floor(totalFocusTime / 60)}h {totalFocusTime % 60}m</span>
                        </div>
                        <div className={styles.statItem}>
                            <span>Sessions Completed</span>
                            <span className={styles.statValue}>{sessions}</span>
                        </div>
                        <div className={styles.statItem}>
                            <span>Current Task</span>
                            <span className={styles.statValueHighlight}>
                                {selectedTaskId
                                    ? tasks.find(t => t.id === selectedTaskId)?.title
                                    : 'None selected'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
