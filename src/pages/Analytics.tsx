import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { CheckCircle2, Footprints, Activity, Droplets, Zap, ListTodo, AlertCircle, TrendingUp, TrendingDown, DollarSign, Wallet, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addDays, subDays } from 'date-fns';
import { 
    subscribeToHabits, 
    subscribeToFlexHabits, 
    subscribeToTasks, 
    subscribeToTransactions, 
    subscribeToCategories, 
    subscribeToHealthByDate 
} from '../services/dataService';
import styles from './Analytics.module.css';

const RADIAN = Math.PI / 180;

export function Analytics() {
    const [habitsData, setHabitsData] = useState<any[]>([]);
    const [flexHabitsData, setFlexHabitsData] = useState<any[]>([]);
    const [tasksData, setTasksData] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
    const [incomeCategories, setIncomeCategories] = useState<any[]>([]);
    const [steps, setSteps] = useState(0);
    const [stepGoal] = useState(10000);
    const [water, setWater] = useState(0);
    const [waterGoal, setWaterGoal] = useState(8);
    
    // Monthly Trend Selection
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [breakdownMode, setBreakdownMode] = useState<'daily' | 'monthly'>('daily');
    const [viewDate, setViewDate] = useState(new Date());
    const viewDateStr = format(viewDate, 'yyyy-MM-dd');
    const dateInputRef = useRef<HTMLInputElement>(null);

    const MONTHS = [
        'January', 'February', 'March', 'April', 'May', 'June', 
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

    const handlePrevDate = () => setViewDate(prev => subDays(prev, 1));
    const handleNextDate = () => setViewDate(prev => addDays(prev, 1));
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = new Date(e.target.value);
        if (!isNaN(newDate.getTime())) {
            // Use local date constructor to avoid UTC shift
            const [year, month, day] = e.target.value.split('-').map(Number);
            setViewDate(new Date(year, month - 1, day));
        }
    };

    useEffect(() => {
        const unsubHabits = subscribeToHabits(setHabitsData);
        const unsubFlex = subscribeToFlexHabits(setFlexHabitsData);
        const unsubTasks = subscribeToTasks(setTasksData);
        const unsubTrans = subscribeToTransactions(setTransactions);
        const unsubCats = subscribeToCategories((data) => {
            if (data.expenseCategories) setExpenseCategories(data.expenseCategories);
            if (data.incomeCategories) setIncomeCategories(data.incomeCategories);
        });

        return () => {
            unsubHabits();
            unsubFlex();
            unsubTasks();
            unsubTrans();
            unsubCats();
        };
    }, []);

    // Health Data sync based on viewDate
    useEffect(() => {
        const unsubHealth = subscribeToHealthByDate(viewDateStr, (data) => {
            setSteps(data.steps || 0);
            setWater(data.waterGlasses || 0);
            if (data.waterGoal !== undefined) setWaterGoal(data.waterGoal);
        });
        return () => unsubHealth();
    }, [viewDateStr]);

    const today = new Date();
    // Daily Calculations (based on VIEW DATE)
    const allHabits = [...habitsData, ...flexHabitsData];
    const totalHabits = allHabits.length;
    const completedHabits = allHabits.filter(h => h.completedDays?.includes(viewDateStr)).length;
    const habitScore = totalHabits === 0 ? 0 : Math.round((completedHabits / totalHabits) * 100);

    const pendingTasks = tasksData.filter(t => !t.completed);
    const completedTasksToday = tasksData.filter(t => t.completed).length;
    const totalTasks = tasksData.length;

    // Financial Calculations for VIEW DATE
    const selectedDayTransactions = transactions.filter(tr => isSameDay(new Date(tr.date), viewDate));
    const todayIncome = selectedDayTransactions.filter(tr => tr.type === 'income').reduce((sum, tr) => sum + (Number(tr.amount) || 0), 0);
    const todayExpenses = selectedDayTransactions.filter(tr => tr.type === 'expense').reduce((sum, tr) => sum + (Number(tr.amount) || 0), 0);
    const netBalance = todayIncome - todayExpenses;

    // Spending & Income Breakdown for VIEW DATE
    const selectedDayExpenseDataMap: Record<string, number> = {};
    const selectedDayIncomeDataMap: Record<string, number> = {};
    
    selectedDayTransactions.forEach(tr => {
        if (tr.type === 'expense') {
            selectedDayExpenseDataMap[tr.category] = (selectedDayExpenseDataMap[tr.category] || 0) + (Number(tr.amount) || 0);
        } else if (tr.type === 'income') {
            selectedDayIncomeDataMap[tr.category] = (selectedDayIncomeDataMap[tr.category] || 0) + (Number(tr.amount) || 0);
        }
    });

    const selectedDayExpenseChartData = Object.keys(selectedDayExpenseDataMap).map(catName => ({
        name: catName,
        value: selectedDayExpenseDataMap[catName]
    }));

    const selectedDayIncomeChartData = Object.keys(selectedDayIncomeDataMap).map(catName => ({
        name: catName,
        value: selectedDayIncomeDataMap[catName]
    }));

    // Priority Specific Calculations
    const getPriorityStats = (priority: string) => {
        const pTasks = tasksData.filter(t => t.priority === priority);
        const done = pTasks.filter(t => t.completed).length;
        const total = pTasks.length;
        return { done, total };
    };

    const getChartData = (list: any[]) => {
        const dataObj: Record<string, number> = {};
        list.forEach((t: any) => {
            dataObj[t.category] = (dataObj[t.category] || 0) + Number(t.amount || 0);
        });
        return Object.entries(dataObj).map(([name, value]) => ({ name, value }));
    };

    const monthlyIncomeChartData = useMemo(() => {
        return getChartData(transactions.filter(t => 
            t.type === 'income' && 
            new Date(t.date).getMonth() === selectedMonth && 
            new Date(t.date).getFullYear() === selectedYear
        ));
    }, [transactions, selectedMonth, selectedYear]);

    const monthlyExpenseChartData = useMemo(() => {
        return getChartData(transactions.filter(t => 
            t.type === 'expense' && 
            new Date(t.date).getMonth() === selectedMonth && 
            new Date(t.date).getFullYear() === selectedYear
        ));
    }, [transactions, selectedMonth, selectedYear]);

    const selectedBreakdownDate = format(viewDate, 'MMM d, yyyy');
    const displayIncomeData = breakdownMode === 'monthly' ? monthlyIncomeChartData : selectedDayIncomeChartData;
    const displayExpenseData = breakdownMode === 'monthly' ? monthlyExpenseChartData : selectedDayExpenseChartData;
    const finalBreakdownDate = breakdownMode === 'monthly' ? `${MONTHS[selectedMonth]} ${selectedYear}` : selectedBreakdownDate;

    const onLineChartClick = (data: any) => {
        if (data && data.activeLabel) {
            const dayNum = parseInt(data.activeLabel);
            if (!isNaN(dayNum)) {
                const newDate = new Date(selectedYear, selectedMonth, dayNum);
                setViewDate(newDate);
                setBreakdownMode('daily'); // Switch to daily mode to show specific day breakdown
            }
        }
    };

    // Generate Monthly Trend Data based on selection
    const filterDate = new Date(selectedYear, selectedMonth, 1);
    const isCurrentMonth = isSameMonth(filterDate, new Date());
    
    const monthlyTrendData = eachDayOfInterval({
        start: startOfMonth(filterDate),
        end: isCurrentMonth ? today : endOfMonth(filterDate)
    }).map(day => {
        const dayTransactions = transactions.filter(tr => isSameDay(new Date(tr.date), day));
        return {
            name: format(day, 'dd'),
            income: dayTransactions.filter(tr => tr.type === 'income').reduce((sum, tr) => sum + (Number(tr.amount) || 0), 0),
            expense: dayTransactions.filter(tr => tr.type === 'expense').reduce((sum, tr) => sum + (Number(tr.amount) || 0), 0)
        };
    });

    const renderMonthYearSelectors = () => (
        <div className={styles.headerActions}>
            <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className={styles.dateSelect}
            >
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className={styles.dateSelect}
            >
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
        </div>
    );

    const renderDaySelector = () => (
        <div className={styles.dateSelector}>
            <button onClick={handlePrevDate} className={styles.dateBtn} title="Previous Day">
                <ChevronLeft size={18} />
            </button>
            <div 
                className={styles.datePickerWrapper} 
                onClick={() => dateInputRef.current?.showPicker()}
            >
                <input 
                    type="date" 
                    ref={dateInputRef}
                    className={styles.hiddenDateInput} 
                    value={format(viewDate, 'yyyy-MM-dd')}
                    onChange={handleDateChange}
                />
                <div className={styles.dateDisplay}>
                    <Calendar size={16} className={styles.calendarIcon} />
                    <div className={styles.dateInfo}>
                        <span className={styles.currentDateText}>
                            {isSameDay(viewDate, today) ? 'Today' : format(viewDate, 'MMM d')}
                        </span>
                        {!isSameDay(viewDate, today) && (
                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setViewDate(today); }} className={styles.todayBtn}>Today</button>
                        )}
                    </div>
                </div>
            </div>
            <button onClick={handleNextDate} className={styles.dateBtn} title="Next Day">
                <ChevronRight size={18} />
            </button>
        </div>
    );

    const renderDateSelectors = () => {
        if (breakdownMode === 'monthly') {
            return renderMonthYearSelectors();
        }
        return renderDaySelector();
    };

    const habitTrendData = useMemo(() => {
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        return Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1;
            const dStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            return {
                name: d.toString(),
                timed: habitsData.filter(h => h.completedDays?.includes(dStr)).length,
                flexible: flexHabitsData.filter(h => h.completedDays?.includes(dStr)).length
            };
        });
    }, [habitsData, flexHabitsData, selectedMonth, selectedYear]);

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

    const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, name, value, percent }: any) => {
        const sin = Math.sin(-RADIAN * midAngle);
        const cos = Math.cos(-RADIAN * midAngle);
        const sx = cx + (outerRadius + 5) * cos;
        const sy = cy + (outerRadius + 5) * sin;
        const mx = cx + (outerRadius + 15) * cos;
        const my = cy + (outerRadius + 15) * sin;
        const ex = mx + (cos >= 0 ? 1 : -1) * 22;
        const ey = my;
        const textAnchor = cos >= 0 ? 'start' : 'end';

        return (
            <g>
                <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke="var(--text-secondary)" fill="none" opacity={0.5} />
                <circle cx={ex} cy={ey} r={2} fill="var(--text-secondary)" stroke="none" />
                <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} dy={4} textAnchor={textAnchor} fill="var(--text-primary)" fontSize={11} fontWeight={600}>
                    {name} (₹{value.toFixed(0)}) ({(percent * 100).toFixed(0)}%)
                </text>
            </g>
        );
    };

    const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e', '#84cc16', '#a855f7'];

    return (
        <div className={styles.analyticsPage}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Daily Performance Dashboard</h1>
                    <p className={styles.subtitle}>Consolidated view of your habits, goals, and health</p>
                </div>
                <div className={styles.dateTag}>{format(viewDate, 'EEEE, MMMM do')}</div>
            </div>

            <div className={styles.summaryWidgets}>
                <div className={`glass-panel ${styles.widget}`}>
                    <div className={styles.widgetIcon} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className={styles.widgetLabel}>{isSameDay(viewDate, today) ? "Today's" : format(viewDate, 'MMM d')} Income</p>
                        <h3 className={styles.widgetValue}>₹{todayIncome.toFixed(0)}</h3>
                        <p className={styles.widgetSub}>Earnings for {isSameDay(viewDate, today) ? "today" : format(viewDate, 'MMM d')}</p>
                    </div>
                </div>
                <div className={`glass-panel ${styles.widget}`}>
                    <div className={styles.widgetIcon} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                        <TrendingDown size={24} />
                    </div>
                    <div>
                        <p className={styles.widgetLabel}>{isSameDay(viewDate, today) ? "Today's" : format(viewDate, 'MMM d')} Expenses</p>
                        <h3 className={styles.widgetValue}>₹{todayExpenses.toFixed(0)}</h3>
                        <p className={styles.widgetSub}>Spent for {isSameDay(viewDate, today) ? "today" : format(viewDate, 'MMM d')}</p>
                    </div>
                </div>
                <div className={`glass-panel ${styles.widget}`}>
                    <div className={styles.widgetIcon} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className={styles.widgetLabel}>{isSameDay(viewDate, today) ? "Net Balance Today" : format(viewDate, 'MMM d') + " Balance"}</p>
                        <h3 className={styles.widgetValue} style={{ color: netBalance >= 0 ? '#10b981' : '#ef4444' }}>₹{Math.abs(netBalance).toFixed(0)}</h3>
                        <p className={styles.widgetSub}>{netBalance >= 0 ? 'Profit' : 'Loss'} for {isSameDay(viewDate, today) ? "today" : format(viewDate, 'MMM d')}</p>
                    </div>
                </div>
                <div className={`glass-panel ${styles.widget}`}>
                    <div className={styles.widgetIcon} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className={styles.widgetLabel}>{isSameDay(viewDate, today) ? "Task Progress" : "Current Tasks"}</p>
                        <h3 className={styles.widgetValue}>{completedTasksToday}/{totalTasks}</h3>
                        <p className={styles.widgetSub}>{pendingTasks.length} items left</p>
                    </div>
                </div>
                <div className={`glass-panel ${styles.widget}`}>
                    <div className={styles.widgetIcon} style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                        <Activity size={24} />
                    </div>
                    <div>
                        <p className={styles.widgetLabel}>{isSameDay(viewDate, today) ? "Habit Score" : format(viewDate, 'MMM d') + " Habits"}</p>
                        <h3 className={styles.widgetValue}>{habitScore}%</h3>
                        <p className={styles.widgetSub}>{completedHabits} of {totalHabits} done</p>
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
                {/* Parallel Habits and Priority Charts */}
                <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
                    <div className={`glass-panel ${styles.chartCard}`}>
                        <div className={styles.sectionHeader}>
                            <h2>Habit Completion Trend</h2>
                            {renderMonthYearSelectors()}
                        </div>
                        <div className={styles.chartWrapper}>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={habitTrendData} margin={{ top: 20, right: 30, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }} 
                                    />
                                    <Legend verticalAlign="top" height={36} />
                                    <Line 
                                        type="monotone" 
                                        dataKey="timed" 
                                        stroke="#10b981" 
                                        strokeWidth={3} 
                                        dot={{ r: 4, strokeWidth: 2 }} 
                                        activeDot={{ r: 6 }} 
                                        name="Timed Habits" 
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="flexible" 
                                        stroke="#3b82f6" 
                                        strokeWidth={3} 
                                        dot={{ r: 4, strokeWidth: 2 }} 
                                        activeDot={{ r: 6 }} 
                                        name="Flexible Habits" 
                                    />
                                </LineChart>
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
                </div>

                {/* Parallel Income and Spending Charts Header */}
                <div className={styles.sectionHeader}>
                    <div className={styles.headerTitle}>
                        <h2>{breakdownMode === 'monthly' ? 'Monthly' : 'Daily'} Breakdown</h2>
                        <span className={styles.dateSubtitle}>{finalBreakdownDate}</span>
                    </div>
                    <div className={styles.headerActions}>
                        <div className={styles.toggleGroup}>
                            <button 
                                className={`${styles.toggleBtn} ${breakdownMode === 'daily' ? styles.activeToggle : ''}`}
                                onClick={() => setBreakdownMode('daily')}
                            >Daily</button>
                            <button 
                                className={`${styles.toggleBtn} ${breakdownMode === 'monthly' ? styles.activeToggle : ''}`}
                                onClick={() => setBreakdownMode('monthly')}
                            >Monthly</button>
                        </div>
                        {renderDateSelectors()}
                    </div>
                </div>

                {/* Parallel Income and Spending Charts */}
                <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
                    {/* Daily Income Breakdown */}
                    <div className={`glass-panel ${styles.chartCard}`}>
                        <h3 className={styles.chartTitle}><TrendingUp size={18} color="#10b981" /> Income Breakdown</h3>
                        <div className={styles.chartWrapper}>
                            {displayIncomeData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={displayIncomeData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                            label={renderCustomizedLabel}
                                            labelLine={false}
                                        >
                                            {displayIncomeData.map((entry, index) => {
                                                const cat = incomeCategories.find(c => c.id === entry.name);
                                                return <Cell key={`cell-${index}`} fill={cat?.color || CHART_COLORS[(index + 5) % CHART_COLORS.length]} />;
                                            })}
                                        </Pie>
                                        <Tooltip
                                            formatter={(val: any) => `₹${Number(val).toFixed(0)}`}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className={styles.emptyMsg}>No income recorded for this period</div>
                            )}
                        </div>
                    </div>

                    {/* Spending Pie Breakdown */}
                    <div className={`glass-panel ${styles.chartCard}`}>
                        <h3 className={styles.chartTitle}><Wallet size={18} /> Spending Breakdown</h3>
                        <div className={styles.chartWrapper}>
                            {displayExpenseData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={displayExpenseData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                            label={renderCustomizedLabel}
                                            labelLine={false}
                                        >
                                            {displayExpenseData.map((entry, index) => {
                                                const cat = expenseCategories.find(c => c.id === entry.name);
                                                return <Cell key={`cell-${index}`} fill={cat?.color || CHART_COLORS[index % CHART_COLORS.length]} />;
                                            })}
                                        </Pie>
                                        <Tooltip
                                            formatter={(val: any) => `₹${Number(val).toFixed(0)}`}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className={styles.emptyMsg}>No spending recorded for this period</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Monthly Financial Trend Chart */}
                <div className={`glass-panel ${styles.chartCard}`} style={{ gridColumn: '1 / -1' }}>
                    <div className={styles.sectionHeader}>
                        <h2>Financial Trend</h2>
                        {renderMonthYearSelectors()}
                    </div>
                    <div className={styles.chartWrapper}>
                        {monthlyTrendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart 
                                    data={monthlyTrendData} 
                                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }} 
                                    onClick={onLineChartClick}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }} 
                                        formatter={(val: any) => `₹${Number(val).toFixed(0)}`}
                                    />
                                    <Legend verticalAlign="top" height={36} />
                                    <Line 
                                        type="monotone" 
                                        dataKey="income" 
                                        stroke="#10b981" 
                                        strokeWidth={3} 
                                        dot={false}
                                        activeDot={{ r: 6 }} 
                                        name="Income" 
                                        isAnimationActive={true}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="expense" 
                                        stroke="#ef4444" 
                                        strokeWidth={3} 
                                        dot={false}
                                        activeDot={{ r: 6 }} 
                                        name="Expense" 
                                        isAnimationActive={true}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className={styles.emptyMsg}>No data available for this period</div>
                        )}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: 10 }}>
                        Tip: Click on a day to view its spending breakdown.
                    </p>
                </div>
            </div>

            <div className={`glass-panel ${styles.planSection}`}>
                <div className={styles.planHeader}>
                    <h3 className={styles.chartTitle}>Daily Execution Plan ({isSameDay(viewDate, today) ? 'Today' : format(viewDate, 'MMM d')})</h3>
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
                                    <div className={`${styles.statusDot} ${h.completedDays?.includes(viewDateStr) ? styles.statusDone : ''}`} />
                                    <span className={styles.planTime}>{h.startTime}</span>
                                    <span className={styles.planName}>{h.title}</span>
                                </div>
                        )) : <p className={styles.emptyMsg}>No timed habits scheduled</p>}
                    </div>
                    <div className={styles.planColumn}>
                        <h4>Flexible Habits</h4>
                        {flexHabitsData.length > 0 ? flexHabitsData.map(h => (
                                <div key={h.id} className={styles.planItem}>
                                    <div className={`${styles.statusDot} ${h.completedDays?.includes(viewDateStr) ? styles.statusDone : ''}`} />
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
