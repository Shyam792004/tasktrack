import { useState, useEffect } from 'react';
import { CheckSquare, TrendingUp, Flame, Zap, Award, ArrowUpRight, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import styles from './Dashboard.module.css';

export function Dashboard() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [savings, setSavings] = useState<any[]>([]);
    const [habits, setHabits] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [insightIndex, setInsightIndex] = useState(0);

    useEffect(() => {
        const t = localStorage.getItem('tracktrack_tasks');
        const s = localStorage.getItem('tracktrack_savings');
        const h = localStorage.getItem('tracktrack_habits');
        const fh = localStorage.getItem('tracktrack_flex_habits');
        const trans = localStorage.getItem('tracktrack_transactions');

        if (t) setTasks(JSON.parse(t));
        if (s) setSavings(JSON.parse(s));

        const combinedHabits = [];
        if (h) combinedHabits.push(...JSON.parse(h));
        if (fh) combinedHabits.push(...JSON.parse(fh));
        setHabits(combinedHabits);

        if (trans) setTransactions(JSON.parse(trans));

        // Insights timer
        const interval = setInterval(() => {
            setInsightIndex(prev => (prev + 1) % 3);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const todayStr = format(new Date(), 'yyyy-MM-dd');

    // Calculations
    const todayTasks = tasks.filter((t: any) => !t.completed);
    const completedToday = tasks.filter((t: any) => t.completed).length;
    const focusTask = todayTasks.find((t: any) => t.priority === 'high') || todayTasks[0];

    const pendingTasks = todayTasks.length;

    const todayTransactions = transactions.filter((t: any) => t.date?.startsWith(todayStr) && t.type === 'expense');
    const todaySpend = todayTransactions.reduce((sum: number, t: any) => sum + t.amount, 0);

    // Savings Calculations
    const totalSavings = savings.reduce((sum: number, s: any) => sum + s.currentAmount, 0);
    const totalNeeded = savings.reduce((sum: number, s: any) => sum + s.targetAmount, 0);
    const savingsRatio = totalNeeded === 0 ? 0 : Math.round((totalSavings / totalNeeded) * 100);

    const productivityScore = habits.length === 0 ? 0 : Math.round(
        (habits.filter((h: any) => h.completedDays?.includes(todayStr)).length / habits.length) * 100
    );

    const insights = [
        totalSavings > 0 ? `You've reached ${savingsRatio}% of your total savings goals!` : "Set your first savings goal today!",
        pendingTasks === 0 ? "Inbox zero! You're crushing it today." : `Only ${pendingTasks} tasks left to a perfect day.`,
        productivityScore > 70 ? "High productivity detected! Keep the streak alive." : "Small steps lead to big change. Complete one habit!"
    ];

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Welcome back! ✨</h1>
                    <p className={styles.subtitle}>Here is your live productivity summary.</p>
                </div>
                <div className={styles.scoreCard}>
                    <div className={styles.scoreInfo}>
                        <span className={styles.scoreLabel}>Habit Score</span>
                        <span className={styles.scoreValue}>{productivityScore}%</span>
                    </div>
                    <Flame className={styles.scoreIcon} size={32} color={productivityScore > 50 ? '#f59e0b' : '#94a3b8'} />
                </div>
            </div>

            <div className={styles.insightsWrapper}>
                <div className={`glass-panel ${styles.insightCard}`}>
                    <Zap className={styles.insightIcon} size={20} />
                    <p className={styles.insightText}>{insights[insightIndex]}</p>
                </div>
            </div>

            <div className={styles.mainGrid}>
                {/* Left Column: Focus & Stats */}
                <div className={styles.dashboardLeft}>
                    {focusTask && (
                        <div className={`glass-panel ${styles.focusCard}`}>
                            <div className={styles.focusHeader}>
                                <div className={styles.focusTag}>
                                    <Zap size={14} />
                                    <span>DAILY FOCUS</span>
                                </div>
                                <span className={`${styles.priorityBadge} ${focusTask.priority === 'high' ? styles.highPriority : styles.mediumPriority}`}>
                                    {focusTask.priority}
                                </span>
                            </div>
                            <h2 className={styles.focusTitle}>{focusTask.title}</h2>
                            <p className={styles.focusDetails}>Your most important step forward right now.</p>
                            <button className={styles.focusActionBtn}>
                                Mark as Completed <ArrowUpRight size={16} />
                            </button>
                        </div>
                    )}

                    <div className={styles.statsGrid}>
                        <div className={`glass-panel ${styles.statCard}`}>
                            <div className={styles.statHeader}>
                                <span className={styles.statTitle}>Pending Tasks</span>
                                <div className={styles.iconWrapper} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                                    <CheckSquare size={20} />
                                </div>
                            </div>
                            <h3 className={styles.statValue}>{pendingTasks}</h3>
                            <p className={styles.statTrend}><span className={styles.positive}>{completedToday} total done</span></p>
                        </div>

                        <div className={`glass-panel ${styles.statCard}`}>
                            <div className={styles.statHeader}>
                                <span className={styles.statTitle}>Active Habits</span>
                                <div className={styles.iconWrapper} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                                    <TrendingUp size={20} />
                                </div>
                            </div>
                            <h3 className={styles.statValue}>{habits.length}</h3>
                            <p className={styles.statTrend}>{habits.filter(h => h.completedDays?.includes(todayStr)).length} done today</p>
                        </div>
                    </div>

                    <div className={`glass-panel ${styles.financialPulse}`}>
                        <div className={styles.pulseHeader}>
                            <h3 className={styles.pulseTitle}>Financial Pulse</h3>
                            <button className={styles.quickAddBtn} title="Quick Log Expense">
                                <PlusCircle size={20} />
                            </button>
                        </div>
                        <div className={styles.pulseContent}>
                            <div className={styles.pulseMetric}>
                                <span className={styles.pulseLabel}>Total Saved</span>
                                <span className={styles.pulseValue}>₹{totalSavings.toLocaleString()}</span>
                            </div>
                            <div className={styles.pulseMetric}>
                                <span className={styles.pulseLabel}>Today's Spend</span>
                                <span className={styles.pulseValue} style={{ color: '#ef4444' }}>₹{todaySpend.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className={styles.pulseBar}>
                            <div className={styles.pulseFill} style={{ width: `${savingsRatio}%` }} />
                        </div>
                        <p className={styles.pulseNote}>{savingsRatio}% towards your total goals reached today.</p>
                    </div>
                </div>

                {/* Right Column: Priority & Goal Lists */}
                <div className={styles.dashboardRight}>
                    <div className={`glass-panel ${styles.listCard}`}>
                        <div className={styles.listHeader}>
                            <h3 className={styles.chartTitle}>Priority Stack</h3>
                            <Award size={18} color="#f59e0b" />
                        </div>
                        <div className={styles.taskList}>
                            {todayTasks.slice(0, 5).map(t => (
                                <div key={t.id} className={styles.taskItem}>
                                    <span className={styles.taskText}>{t.title}</span>
                                    <span className={`${styles.badge} ${t.priority === 'high' ? styles.highPriority : (t.priority === 'medium' ? styles.mediumPriority : styles.lowPriority)}`}>
                                        {t.priority}
                                    </span>
                                </div>
                            ))}
                            {todayTasks.length === 0 && <p className={styles.emptyMsg}>Clean slate! No pending tasks.</p>}
                        </div>
                    </div>

                    <div className={`glass-panel ${styles.listCard}`} style={{ marginTop: '20px' }}>
                        <h3 className={styles.chartTitle}>Savings Progress</h3>
                        <div className={styles.goalList}>
                            {savings.slice(0, 3).map(s => {
                                const p = Math.min(100, Math.round((s.currentAmount / s.targetAmount) * 100));
                                return (
                                    <div key={s.id} className={styles.goalItem}>
                                        <div className={styles.goalHeader}>
                                            <span className={styles.goalTitle}>{s.title}</span>
                                            <span className={styles.goalText}>{p}%</span>
                                        </div>
                                        <div className={styles.progressBar}>
                                            <div className={styles.progressFill} style={{ width: `${p}%`, backgroundColor: '#8b5cf6' }} />
                                        </div>
                                    </div>
                                );
                            })}
                            {savings.length === 0 && <p className={styles.emptyMsg}>Track your first goal in Savings!</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
