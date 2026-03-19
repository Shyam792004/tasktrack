import { useState, useEffect } from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    LabelList,
    Tooltip,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { Target, CheckCircle2, Footprints, Activity, Droplets, Zap, ListTodo, AlertCircle, TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import styles from './Analytics.module.css';

export function Analytics() {
    const [habitsData, setHabitsData] = useState<any[]>([]);
    const [flexHabitsData, setFlexHabitsData] = useState<any[]>([]);
    const [goalsData, setGoalsData] = useState<any[]>([]);
    const [tasksData, setTasksData] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
    const [steps, setSteps] = useState(0);
    const [stepGoal, setStepGoal] = useState(10000);
    const [water, setWater] = useState(0);
    const [waterGoal, setWaterGoal] = useState(8);

    useEffect(() => {
        const h = localStorage.getItem('tracktrack_habits');
        const fh = localStorage.getItem('tracktrack_flex_habits');
        const g = localStorage.getItem('tracktrack_goals');
        const t = localStorage.getItem('tracktrack_tasks');
        const trans = localStorage.getItem('tracktrack_transactions');
        const cats = localStorage.getItem('tracktrack_expense_cats');
        const s = localStorage.getItem('tracktrack_steps');
        const sg = localStorage.getItem('tracktrack_step_goal');
        const wc = localStorage.getItem('tracktrack_water_current');
        const wg = localStorage.getItem('tracktrack_water_goal');

        if (h) setHabitsData(JSON.parse(h));
        if (fh) setFlexHabitsData(JSON.parse(fh));
        if (g) setGoalsData(JSON.parse(g));
        if (t) setTasksData(JSON.parse(t));
        if (trans) setTransactions(JSON.parse(trans));
        if (cats) setExpenseCategories(JSON.parse(cats));
        if (s) setSteps(Number(s));
        if (sg) setStepGoal(Number(sg));
        if (wc) setWater(Number(wc));
        if (wg) setWaterGoal(Number(wg));
    }, []);

    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    // Daily Calculations
    const allHabits = [...habitsData, ...flexHabitsData];
    const totalHabits = allHabits.length;
    const completedHabits = allHabits.filter(h => h.completedDays?.includes(todayStr)).length;
    const habitScore = totalHabits === 0 ? 0 : Math.round((completedHabits / totalHabits) * 100);

    const pendingTasks = tasksData.filter(t => !t.completed);
    const completedTasksToday = tasksData.filter(t => t.completed).length;
    const totalTasks = tasksData.length;

    // Financial Calculations for Today
    const todayTransactions = transactions.filter(tr => isSameDay(new Date(tr.date), today));
    const todayIncome = todayTransactions.filter(tr => tr.type === 'income').reduce((sum, tr) => sum + tr.amount, 0);
    const todayExpenses = todayTransactions.filter(tr => tr.type === 'expense').reduce((sum, tr) => sum + tr.amount, 0);
    const netBalance = todayIncome - todayExpenses;

    // Today's Expense Breakdown
    const todayExpenseDataMap: Record<string, number> = {};
    todayTransactions.filter(tr => tr.type === 'expense').forEach(tr => {
        todayExpenseDataMap[tr.category] = (todayExpenseDataMap[tr.category] || 0) + tr.amount;
    });
    const todayExpenseChartData = Object.keys(todayExpenseDataMap).map(catName => ({
        name: catName,
        value: todayExpenseDataMap[catName]
    }));

    // Priority Specific Calculations
    const getPriorityStats = (priority: string) => {
        const pTasks = tasksData.filter(t => t.priority === priority);
        const done = pTasks.filter(t => t.completed).length;
        const total = pTasks.length;
        return { done, total };
    };

    const avgGoalProgress = goalsData.length === 0 ? 0 : Math.round(
        goalsData.reduce((sum, g) => {
            const done = g.tasks?.filter((t: any) => t.completed).length || 0;
            const total = g.tasks?.length || 1;
            return sum + (done / total * 100);
        }, 0) / goalsData.length
    );

    // Habit Bar Data
    const habitBarData = [
        { name: 'Timed', done: habitsData.filter(h => h.completedDays?.includes(todayStr)).length, total: habitsData.length },
        { name: 'Flexible', done: flexHabitsData.filter(h => h.completedDays?.includes(todayStr)).length, total: flexHabitsData.length }
    ];

    // Progress Circle Component
    const ProgressCircle = ({ value, max, label, sublabel, color, icon: Icon, size = 120 }: any) => {
        const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
        const radius = 45;
        const circumference = 2 * Math.PI * radius;
        const offset = max === 0 ? circumference : circumference - (pct / 100) * circumference;

        return (
            <div className={styles.circleContainer}>
                <div className={styles.circleHeader}>
                    {Icon && <Icon size={14} color={color} />}
                    <span>{label}</span>
                </div>
                <div className={styles.svgWrapper} style={{ width: size, height: size }}>
                    <svg viewBox="0 0 100 100" className={styles.svgCircle}>
                        <circle cx="50" cy="50" r={radius} className={styles.circleBg} />
                        <circle
                            cx="50" cy="50" r={radius}
                            className={styles.circleFill}
                            style={{
                                strokeDasharray: circumference.toString(),
                                strokeDashoffset: offset.toString(),
                                stroke: color
                            }}
                        />
                    </svg>
                    <div className={styles.circleText}>
                        <span className={styles.circleValue} style={{ fontSize: size > 100 ? '1.4rem' : '1.1rem' }}>{pct}%</span>
                        <span className={styles.circleSubValue}>{value}/{max}</span>
                    </div>
                </div>
                {sublabel && <div className={styles.circleFooter}>{sublabel}</div>}
            </div>
        );
    };

    return (
        <div className={styles.analyticsPage}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Daily Performance Dashboard</h1>
                    <p className={styles.subtitle}>Consolidated view of your habits, goals, and health</p>
                </div>
                <div className={styles.dateTag}>{format(new Date(), 'EEEE, MMMM do')}</div>
            </div>

            <div className={styles.summaryWidgets}>
                <div className={`glass-panel ${styles.widget}`}>
                    <div className={styles.widgetIcon} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className={styles.widgetLabel}>Today's Income</p>
                        <h3 className={styles.widgetValue}>₹{todayIncome.toFixed(0)}</h3>
                        <p className={styles.widgetSub}>Earnings for today</p>
                    </div>
                </div>
                <div className={`glass-panel ${styles.widget}`}>
                    <div className={styles.widgetIcon} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                        <TrendingDown size={24} />
                    </div>
                    <div>
                        <p className={styles.widgetLabel}>Today's Expenses</p>
                        <h3 className={styles.widgetValue}>₹{todayExpenses.toFixed(0)}</h3>
                        <p className={styles.widgetSub}>Spent for today</p>
                    </div>
                </div>
                <div className={`glass-panel ${styles.widget}`}>
                    <div className={styles.widgetIcon} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className={styles.widgetLabel}>Net Balance</p>
                        <h3 className={styles.widgetValue} style={{ color: netBalance >= 0 ? '#10b981' : '#ef4444' }}>₹{Math.abs(netBalance).toFixed(0)}</h3>
                        <p className={styles.widgetSub}>{netBalance >= 0 ? 'Profit for today' : 'Loss for today'}</p>
                    </div>
                </div>
                <div className={`glass-panel ${styles.widget}`}>
                    <div className={styles.widgetIcon} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className={styles.widgetLabel}>Task Progress</p>
                        <h3 className={styles.widgetValue}>{completedTasksToday}/{totalTasks}</h3>
                        <p className={styles.widgetSub}>{pendingTasks.length} items left</p>
                    </div>
                </div>
                <div className={`glass-panel ${styles.widget}`}>
                    <div className={styles.widgetIcon} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className={styles.widgetLabel}>Habit Score</p>
                        <h3 className={styles.widgetValue}>{habitScore}%</h3>
                        <p className={styles.widgetSub}>{completedHabits} of {totalHabits} done</p>
                    </div>
                </div>
                <div className={`glass-panel ${styles.widget}`}>
                    <div className={styles.widgetIcon} style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                        <Target size={24} />
                    </div>
                    <div>
                        <p className={styles.widgetLabel}>Goal Status</p>
                        <h3 className={styles.widgetValue}>{avgGoalProgress}%</h3>
                        <p className={styles.widgetSub}>{goalsData.length} goals tracking</p>
                    </div>
                </div>
            </div>

            <div className={styles.vitalitySection}>
                <div className={`glass-panel ${styles.vitalityCard}`}>
                    <h3 className={styles.chartTitle}><Zap size={18} /> Daily Vitality Status</h3>
                    <div className={styles.vitalityCircles}>
                        <ProgressCircle value={steps} max={stepGoal} label="Steps" sublabel="Daily Activity" color="#f59e0b" icon={Footprints} />
                        <ProgressCircle value={completedHabits} max={totalHabits} label="Habits" sublabel="Consistency" color="#10b981" icon={Activity} />
                        <ProgressCircle value={completedTasksToday} max={totalTasks} label="Total Tasks" sublabel="Daily To-Do" color="#3b82f6" icon={ListTodo} />
                        <ProgressCircle value={water} max={waterGoal} label="Water" sublabel="Hydration Status" color="#06b6d4" icon={Droplets} />
                    </div>
                </div>
            </div>

            <div className={styles.chartsGrid}>
                {/* Habit Completion Details */}
                <div className={`glass-panel ${styles.chartCard}`}>
                    <h3 className={styles.chartTitle}><Activity size={18} /> Habit Completion Details</h3>
                    <div className={styles.chartWrapper}>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={habitBarData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="done" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} name="Completed">
                                    <LabelList dataKey="done" position="top" style={{ fontSize: '12px', fontWeight: 'bold' }} />
                                </Bar>
                                <Bar dataKey="total" fill="rgba(16, 185, 129, 0.1)" radius={[4, 4, 0, 0]} barSize={40} name="Target">
                                    <LabelList dataKey="total" position="top" style={{ fontSize: '11px', color: '#666' }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Task Priority Status */}
                <div className={`glass-panel ${styles.chartCard}`}>
                    <h3 className={styles.chartTitle}><AlertCircle size={18} /> Task Priority Status</h3>
                    <div className={styles.priorityCircles}>
                        <ProgressCircle
                            value={getPriorityStats('high').done}
                            max={getPriorityStats('high').total}
                            label="High"
                            color="#ef4444"
                            size={100}
                        />
                        <ProgressCircle
                            value={getPriorityStats('medium').done}
                            max={getPriorityStats('medium').total}
                            label="Medium"
                            color="#f59e0b"
                            size={100}
                        />
                        <ProgressCircle
                            value={getPriorityStats('low').done}
                            max={getPriorityStats('low').total}
                            label="Low"
                            color="#3b82f6"
                            size={100}
                        />
                    </div>
                </div>

                {/* Today's Expense Pie Breakdown */}
                <div className={`glass-panel ${styles.chartCard}`}>
                    <h3 className={styles.chartTitle}><Wallet size={18} /> Today's Spending Breakdown</h3>
                    <div className={styles.chartWrapper}>
                        {todayExpenseChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={todayExpenseChartData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {todayExpenseChartData.map((entry, index) => {
                                            const cat = expenseCategories.find(c => c.id === entry.name);
                                            return <Cell key={`cell-${index}`} fill={cat?.color || '#3b82f6'} />;
                                        })}
                                    </Pie>
                                    <Tooltip
                                        formatter={(val: any) => `₹${Number(val).toFixed(0)}`}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className={styles.emptyMsg}>No spending recorded today</div>
                        )}
                    </div>
                </div>
            </div>

            <div className={`glass-panel ${styles.planSection}`}>
                <div className={styles.planHeader}>
                    <h3 className={styles.chartTitle}>Daily Execution Plan</h3>
                    <div className={styles.planStats}>
                        <span className={styles.taskCountBadge}>{completedTasksToday}/{totalTasks} Tasks</span>
                        <span className={styles.habitCountBadge}>{completedHabits}/{totalHabits} Habits</span>
                        <span className={styles.moneyCountBadge} style={{ color: netBalance >= 0 ? '#10b981' : '#ef4444' }}>
                            Net: ₹{netBalance.toFixed(0)}
                        </span>
                    </div>
                </div>
                <div className={styles.planGrid}>
                    <div className={styles.planColumn}>
                        <h4>Timed Habits</h4>
                        {habitsData.length > 0 ? habitsData.sort((a, b) => a.startTime.localeCompare(b.startTime)).map(h => (
                            <div key={h.id} className={styles.planItem}>
                                <div className={`${styles.statusDot} ${h.completedDays?.includes(todayStr) ? styles.statusDone : ''}`} />
                                <span className={styles.planTime}>{h.startTime}</span>
                                <span className={styles.planName}>{h.title}</span>
                            </div>
                        )) : <p className={styles.emptyMsg}>No timed habits scheduled</p>}
                    </div>
                    <div className={styles.planColumn}>
                        <h4>Flexible Habits</h4>
                        {flexHabitsData.length > 0 ? flexHabitsData.map(h => (
                            <div key={h.id} className={styles.planItem}>
                                <div className={`${styles.statusDot} ${h.completedDays?.includes(todayStr) ? styles.statusDone : ''}`} />
                                <span className={styles.planName}>{h.title}</span>
                            </div>
                        )) : <p className={styles.emptyMsg}>No flexible habits found</p>}
                    </div>
                    <div className={styles.planColumn}>
                        <h4>Current To-Do List</h4>
                        {tasksData.length > 0 ? tasksData.map(t => (
                            <div key={t.id} className={styles.planItem}>
                                <div className={`${styles.statusDot} ${t.completed ? styles.statusDone : ''}`} style={{ background: !t.completed ? (t.priority === 'high' ? '#ef4444' : (t.priority === 'medium' ? '#f59e0b' : '#3b82f6')) : undefined }} />
                                <span className={`${styles.planName} ${t.completed ? styles.nameDone : ''}`}>{t.title}</span>
                                {t.priority === 'high' && !t.completed && <span className={styles.priorityMini}>!!!</span>}
                            </div>
                        )) : <p className={styles.emptyMsg}>To-do list is empty</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
