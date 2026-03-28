import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, Briefcase, ListTodo, CheckCircle2, BarChart2, Calendar } from 'lucide-react';
import { subscribeToTasks, subscribeToUserSettings, updateUserSettings, subscribeToHealthByDate, updateHealthData, subscribeToHealth } from '../services/dataService';
import { format, subDays } from 'date-fns';
import { LineChart, Line, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './Timer.module.css';

function RingProgress({ pct, size = 120, stroke = 12, color = '#6366f1', label }: {
    pct: number; size?: number; stroke?: number; color?: string; label: string
}) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const dash = circ * Math.min(pct, 1);
    return (
        <div className={styles.ring}>
            <svg width={size} height={size}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-color)" strokeWidth={stroke} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
                    strokeWidth={stroke} strokeDasharray={`${dash} ${circ}`}
                    strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ transition: 'stroke-dasharray 0.5s ease' }} />
                <text x={size / 2} y={size / 2 + 5} textAnchor="middle" fontSize="18" fontWeight="700"
                    fill="var(--text-primary)">{label}</text>
            </svg>
        </div>
    );
}


export function Timer() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [focusDuration, setFocusDuration] = useState(25);
    const [completedSessions, setCompletedSessions] = useState<number[]>([]);
    const [sessionsGoal, setSessionsGoal] = useState(8);
    const [focusGoalMin, setFocusGoalMin] = useState(120);
    const [totalFocusTime, setTotalFocusTime] = useState(0);


    const getBreakDuration = (fd: number) => fd === 25 ? 5 : 10;

    const [timeLeft, setTimeLeft] = useState(focusDuration * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<'focus' | 'break'>('focus');
    const [selectedTaskId, setSelectedTaskId] = useState<string>('');

    const today = format(new Date(), 'yyyy-MM-dd');
    const [viewDate, setViewDate] = useState(today);
    const [viewedFocusTime, setViewedFocusTime] = useState(0);
    const [todayFocusTime, setTodayFocusTime] = useState(0);
    const [weekData, setWeekData] = useState<any[]>([]);

    const todayFocusTimeRef = useRef(0);
    useEffect(() => {
        todayFocusTimeRef.current = todayFocusTime;
    }, [todayFocusTime]);

    useEffect(() => {
        const unsub = subscribeToHealthByDate(today, (data) => {
            setTodayFocusTime(data.focusTime || 0);
        });
        return unsub;
    }, [today]);

    useEffect(() => {
        const unsub = subscribeToHealthByDate(viewDate, (data) => {
            setViewedFocusTime(data.focusTime || 0);
        });
        return unsub;
    }, [viewDate]);

    useEffect(() => {
        const unsub = subscribeToHealth((allData) => {
            const [y, m, d] = viewDate.split('-').map(Number);
            const baseDate = new Date(y, m - 1, d);

            const last7Days = Array.from({ length: 7 }).map((_, i) => {
                const targetDate = format(subDays(baseDate, 6 - i), 'yyyy-MM-dd');
                const dayData = allData.find(x => x.id === targetDate);
                return {
                    date: format(new Date(targetDate), 'MMM dd'),
                    focusTime: dayData?.focusTime || 0
                };
            });
            setWeekData(last7Days);
        });
        return unsub;
    }, [viewDate]);


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
            
            if (settings.timerCompletedSessions !== undefined) {
                setCompletedSessions(settings.timerCompletedSessions);
            } else if (settings.timerSessions !== undefined) {
                // Compatibility for old numeric format
                const oldArray = Array.from({ length: settings.timerSessions }, (_, i) => i + 1);
                setCompletedSessions(oldArray);
            }

            if (settings.timerSessionsGoal !== undefined) setSessionsGoal(settings.timerSessionsGoal);
            if (settings.timerFocusTimeGoal !== undefined) setFocusGoalMin(settings.timerFocusTimeGoal);
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
                setTimeLeft(time => {
                    const newTime = time - 1;
                    // Increment and save focus time correctly every 60 seconds elapsed
                    if (mode === 'focus' && newTime % 60 === 0) {
                        setTotalFocusTime(prev => {
                            const newTotal = prev + 1;
                            updateUserSettings({ timerTotalFocusTime: newTotal }).catch(console.error);
                            return newTotal;
                        });
                        const newToday = todayFocusTimeRef.current + 1;
                        updateHealthData(today, { focusTime: newToday }).catch(console.error);
                    }
                    return newTime;
                });
            }, 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
            if (mode === 'focus') {
                // Add next available session number
                let nextSession = 1;
                while (completedSessions.includes(nextSession)) {
                    nextSession++;
                }
                const newCompleted = [...completedSessions, nextSession].sort((a, b) => a - b);
                updateUserSettings({
                    timerCompletedSessions: newCompleted,
                    timerSessions: newCompleted.length // Keep old field updated too
                });
            }
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft, mode, focusDuration, completedSessions, totalFocusTime]);

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

                <div className={`glass-panel ${styles.trackerCard}`}>
                    <div className={styles.trackerHeader}>
                        <div className={styles.trackerTitleGroup}>
                            <CheckCircle2 size={24} className={styles.trackerIcon} />
                            <h3>Sessions Completed</h3>
                        </div>
                        <div className={styles.goalGroup}>
                            <span>Daily goal</span>
                            <input 
                                type="number" 
                                value={sessionsGoal} 
                                onChange={async (e) => {
                                    const val = Math.max(1, parseInt(e.target.value) || 1);
                                    setSessionsGoal(val);
                                    await updateUserSettings({ timerSessionsGoal: val });
                                }}
                                className={styles.goalInput}
                            />
                            <span>sessions</span>
                        </div>
                    </div>

                    <p className={styles.trackerSummary}>{completedSessions.length} sessions completed (Goal: {sessionsGoal})</p>

                    <div className={styles.iconRow}>
                        {Array.from({ length: Math.max(sessionsGoal, ...completedSessions, 0) }).map((_, i) => {
                            const sessionNum = i + 1;
                            const isCompleted = completedSessions.includes(sessionNum);
                            return (
                                <div 
                                    key={i} 
                                    className={`${styles.sessionIconWrapper} ${isCompleted ? styles.activeIcon : ''}`}
                                    onClick={async () => {
                                        let newCompleted;
                                        if (isCompleted) {
                                            newCompleted = completedSessions.filter(s => s !== sessionNum);
                                        } else {
                                            newCompleted = [...completedSessions, sessionNum].sort((a, b) => a - b);
                                        }
                                        setCompletedSessions(newCompleted);
                                        await updateUserSettings({ 
                                            timerCompletedSessions: newCompleted,
                                            timerSessions: newCompleted.length
                                        });
                                    }}
                                >
                                    {sessionNum}
                                </div>
                            );
                        })}
                    </div>

                    <div className={styles.trackerProgressWrapper}>
                        <div 
                            className={styles.trackerProgressBar} 
                            style={{ width: `${Math.min(100, (completedSessions.length / sessionsGoal) * 100)}%` }}
                        />
                    </div>

                    <div className={styles.otherStats}>
                        <div className={styles.statItem}>
                            <span>Today's Focus Time</span>
                            <span className={styles.statValue}>{Math.floor(totalFocusTime / 60)}h {totalFocusTime % 60}m</span>
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

                <div className={`glass-panel ${styles.analyticsCard}`}>
                    <div className={styles.analyticsHeader}>
                        <div className={styles.trackerTitleGroup}>
                            <BarChart2 size={24} className={styles.trackerIcon} />
                            <h3>Focus Analytics</h3>
                        </div>
                        <div className={styles.datePickerGroup}>
                            <Calendar size={16} />
                            <input 
                                type="date" 
                                value={viewDate} 
                                onChange={(e) => setViewDate(e.target.value)}
                                className={styles.dateInput}
                            />
                        </div>
                    </div>

                    <div className={styles.chartsGrid}>
                        <div className={styles.ringChartBox}>
                            <h4>{viewDate === today ? "Today's Focus Goal" : "Focus Goal"}</h4>
                            <RingProgress 
                                pct={focusGoalMin > 0 ? viewedFocusTime / focusGoalMin : 0} 
                                color="#8b5cf6" 
                                label={`${viewedFocusTime}m`} 
                            />
                            <div className={styles.goalGroup} style={{ marginTop: '8px' }}>
                                <span>Goal:</span>
                                <input 
                                    type="number" 
                                    value={focusGoalMin} 
                                    onChange={async (e) => {
                                        const val = Math.max(1, parseInt(e.target.value) || 1);
                                        setFocusGoalMin(val);
                                        await updateUserSettings({ timerFocusTimeGoal: val });
                                    }}
                                    className={styles.goalInput}
                                    style={{ width: '70px' }}
                                />
                                <span>min</span>
                            </div>
                        </div>
                        <div className={styles.lineChartBox}>
                            <h4>7 Days up to {format(new Date(viewDate.split('-')[0] as any, (viewDate.split('-')[1] as any) - 1, viewDate.split('-')[2] as any), 'MMM dd')}</h4>
                            <div className={styles.chartWrapper}>
                                <ResponsiveContainer width="100%" height={150}>
                                    <LineChart data={weekData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={11} tickMargin={8} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: 'var(--bg-primary)', border: 'none', borderRadius: '8px', color: 'var(--text-primary)' }}
                                        />
                                        <Line type="monotone" dataKey="focusTime" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
