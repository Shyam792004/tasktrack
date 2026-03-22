import { useState, useEffect } from 'react';
import { Plus, Flame, Check, X, Clock, Edit2, Trash2 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { subscribeToHabits, subscribeToFlexHabits, addHabit, updateHabit, deleteHabit, addFlexHabit, updateFlexHabit, deleteFlexHabit } from '../services/dataService';
import styles from './Habits.module.css';

// ── Circle SVG Progress ──
function CircleProgress({ pct, label, dayName, isSelected, onClick }: {
    pct: number; label: string; dayName: string; isSelected: boolean; onClick: () => void;
}) {
    const r = 22;
    const circ = 2 * Math.PI * r;
    const dash = circ * pct;
    return (
        <div className={`${styles.circleWrap} ${isSelected ? styles.circleSelected : ''}`} onClick={onClick} title={label}>
            <svg width="56" height="56" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r={r} fill="none" stroke="var(--border-color)" strokeWidth="4" />
                <circle cx="28" cy="28" r={r} fill="none"
                    stroke={isSelected ? '#6366f1' : (pct === 1 ? '#10b981' : '#6366f1')}
                    strokeWidth="4"
                    strokeDasharray={`${dash} ${circ}`}
                    strokeLinecap="round"
                    transform="rotate(-90 28 28)"
                    style={{ transition: 'stroke-dasharray 0.4s ease', opacity: pct > 0 ? 1 : 0.3 }}
                />
                <text x="28" y="33" textAnchor="middle" fontSize="12" fontWeight="700"
                    fill={pct === 1 ? '#10b981' : 'var(--text-primary)'}>
                    {Math.round(pct * 100)}%
                </text>
            </svg>
            <span className={styles.circleDayLabel}>{dayName}</span>
            {isSelected && <span className={styles.circleDetail}>{label}</span>}
        </div>
    );
}

// ── Habit Activity Calendar Modal ──
function HabitCalendar({ title, completedDays, onClose }: {
    title: string; completedDays: string[]; onClose: () => void;
}) {
    const today = new Date();
    const completedSet = new Set(completedDays);
    const totalDone = completedDays.length;

    // Build list of months to display: last 6 months up to current month
    const months: { year: number; month: number }[] = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push({ year: d.getFullYear(), month: d.getMonth() });
    }

    const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return (
        <div className={styles.calModalOverlay} onClick={onClose}>
            <div className={styles.calModal} onClick={e => e.stopPropagation()}>
                <div className={styles.calModalHeader}>
                    <div>
                        <h3 className={styles.calModalTitle}>📅 {title}</h3>
                        <span className={styles.calModalSub}>{totalDone} day{totalDone !== 1 ? 's' : ''} completed</span>
                    </div>
                    <button className={styles.calModalClose} onClick={onClose}>✕</button>
                </div>

                <div className={styles.calGrid}>
                    {months.map(({ year, month }) => {
                        const firstDay = new Date(year, month, 1);
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        const startDow = firstDay.getDay(); // 0=Sun

                        const cells: (number | null)[] = [
                            ...Array(startDow).fill(null),
                            ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
                        ];
                        // Pad to full weeks
                        while (cells.length % 7 !== 0) cells.push(null);

                        return (
                            <div key={`${year}-${month}`} className={styles.calMonth}>
                                <div className={styles.calMonthTitle}>
                                    {MONTH_NAMES[month]} {year}
                                </div>
                                <div className={styles.calDowRow}>
                                    {DAYS.map((d, i) => <span key={i} className={styles.calDow}>{d}</span>)}
                                </div>
                                <div className={styles.calDaysGrid}>
                                    {cells.map((day, ci) => {
                                        if (day === null) return <span key={ci} className={styles.calDayEmpty} />;
                                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                        const done = completedSet.has(dateStr);
                                        const isToday = dateStr === format(today, 'yyyy-MM-dd');
                                        return (
                                            <span
                                                key={ci}
                                                className={`${styles.calDay} ${done ? styles.calDayDone : styles.calDayMiss} ${isToday ? styles.calDayToday : ''}`}
                                                title={`${MONTH_NAMES[month]} ${day}: ${done ? 'Completed ✅' : 'Not done'}`}
                                            >
                                                {day}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className={styles.calLegend}>
                    <span className={`${styles.calLegendBox} ${styles.calDayDone}`} /> Completed
                    <span className={`${styles.calLegendBox} ${styles.calDayMiss}`} /> Not done
                </div>
            </div>
        </div>
    );
}

interface Habit {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    streak: number;
    completedDays: string[];
}

interface FlexibleHabit {
    id: string;
    title: string;
    streak: number;
    completedDays: string[];
}

const todayStr = format(new Date(), 'yyyy-MM-dd');
const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');

export function Habits() {
    // --- State Persistence & Initialization ---
    const [habits, setHabits] = useState<Habit[]>([]);
    const [flexibleHabits, setFlexibleHabits] = useState<FlexibleHabit[]>([]);

    useEffect(() => {
        const unsubHabits = subscribeToHabits(setHabits);
        const unsubFlex = subscribeToFlexHabits(setFlexibleHabits);
        return () => {
            unsubHabits();
            unsubFlex();
        };
    }, []);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
    const [newHabitName, setNewHabitName] = useState('');
    const [newHabitStartTime, setNewHabitStartTime] = useState('');
    const [newHabitEndTime, setNewHabitEndTime] = useState('');

    // --- Modal States ---
    const [isFlexModalOpen, setIsFlexModalOpen] = useState(false);
    const [editingFlexId, setEditingFlexId] = useState<string | null>(null);
    const [newFlexName, setNewFlexName] = useState('');

    // --- Selected day for circle progress display ---
    const [selectedTimedDay, setSelectedTimedDay] = useState<string | null>(null);
    const [selectedFlexDay, setSelectedFlexDay] = useState<string | null>(null);

    // --- Selected habit for streak badge ---
    const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
    const [selectedHabitSource, setSelectedHabitSource] = useState<'timed' | 'flex' | null>(null);

    // Compute badge streak info
    const allHabits = [...habits, ...flexibleHabits];
    const overallMax = allHabits.length > 0 ? Math.max(...allHabits.map(h => h.streak)) : 0;
    const selectedHabit = selectedHabitId
        ? (selectedHabitSource === 'timed' ? habits : flexibleHabits).find(h => h.id === selectedHabitId)
        : null;
    const badgeStreak = selectedHabit ? selectedHabit.streak : overallMax;
    const badgeLabel = selectedHabit ? selectedHabit.title : 'Longest Streak';

    const selectHabit = (id: string, source: 'timed' | 'flex') => {
        if (selectedHabitId === id) {
            setSelectedHabitId(null);
            setSelectedHabitSource(null);
        } else {
            setSelectedHabitId(id);
            setSelectedHabitSource(source);
        }
    };

    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const d = subDays(new Date(), 6 - i);
        return { date: d, formatted: format(d, 'yyyy-MM-dd'), dayName: format(d, 'EE') };
    });

    // --- Calendar modal for streak history ---
    const [calendarHabit, setCalendarHabit] = useState<{ title: string; completedDays: string[] } | null>(null);

    // --- Time-bound Habit Handlers ---
    const openEditModal = (habit: Habit) => {
        setEditingHabitId(habit.id);
        setNewHabitName(habit.title);
        setNewHabitStartTime(habit.startTime);
        setNewHabitEndTime(habit.endTime);
        setIsModalOpen(true);
    };

    const handleAddHabit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newHabitName.trim()) return;
        
        try {
            if (editingHabitId) {
                await updateHabit(editingHabitId, {
                    title: newHabitName,
                    startTime: newHabitStartTime || '00:00',
                    endTime: newHabitEndTime || '23:59'
                });
            } else {
                await addHabit({
                    title: newHabitName,
                    startTime: newHabitStartTime || '00:00',
                    endTime: newHabitEndTime || '23:59',
                    streak: 0,
                    completedDays: [],
                });
            }
            closeModal();
        } catch (err) {
            console.error(err);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingHabitId(null);
        setNewHabitName('');
        setNewHabitStartTime('');
        setNewHabitEndTime('');
    };

    const toggleHabitDay = async (habitId: string, dateStr: string) => {
        const habit = habits.find(h => h.id === habitId);
        if (!habit) return;

        const hasCompleted = habit.completedDays.includes(dateStr);
        const newCompletedDays = hasCompleted
            ? habit.completedDays.filter(d => d !== dateStr)
            : [...habit.completedDays, dateStr];
        
        let newStreak = habit.streak;
        if (dateStr === todayStr) {
            newStreak = hasCompleted ? Math.max(0, newStreak - 1) : newStreak + 1;
        }

        await updateHabit(habitId, { completedDays: newCompletedDays, streak: newStreak });
    };

    const handleDeleteHabit = async (id: string) => {
        if (confirm('Delete this habit?')) {
            await deleteHabit(id);
        }
    };

    const sortedHabits = [...habits].sort((a, b) => a.startTime.localeCompare(b.startTime));

    // --- Flexible Habit Handlers ---
    const openEditFlexModal = (habit: FlexibleHabit) => {
        setEditingFlexId(habit.id);
        setNewFlexName(habit.title);
        setIsFlexModalOpen(true);
    };

    const handleAddFlexHabit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFlexName.trim()) return;

        try {
            if (editingFlexId) {
                await updateFlexHabit(editingFlexId, { title: newFlexName });
            } else {
                await addFlexHabit({
                    title: newFlexName,
                    streak: 0,
                    completedDays: [],
                });
            }
            closeFlexModal();
        } catch (err) {
            console.error(err);
        }
    };

    const closeFlexModal = () => {
        setIsFlexModalOpen(false);
        setEditingFlexId(null);
        setNewFlexName('');
    };

    const toggleFlexDay = async (habitId: string, dateStr: string) => {
        const habit = flexibleHabits.find(h => h.id === habitId);
        if (!habit) return;

        const hasCompleted = habit.completedDays.includes(dateStr);
        const newCompletedDays = hasCompleted
            ? habit.completedDays.filter(d => d !== dateStr)
            : [...habit.completedDays, dateStr];

        let newStreak = habit.streak;
        if (dateStr === todayStr) {
            newStreak = hasCompleted ? Math.max(0, newStreak - 1) : newStreak + 1;
        }

        await updateFlexHabit(habitId, { completedDays: newCompletedDays, streak: newStreak });
    };

    const handleDeleteFlexHabit = async (id: string) => {
        if (confirm('Delete this flexible habit?')) {
            await deleteFlexHabit(id);
        }
    };

    // Helper: renders a row of 7 circular day-progress indicators
    const renderDayProgressRow = (
        habitList: { id: string; title: string; completedDays: string[] }[],
        selectedDay: string | null,
        setSelected: (d: string | null) => void
    ) => (
        <div className={styles.dayProgressRow}>
            {weekDays.map(day => {
                const total = habitList.length;
                const done = habitList.filter(h => h.completedDays.includes(day.formatted)).length;
                const pct = total === 0 ? 0 : done / total;
                const label = `${done} / ${total} completed`;
                const isSelected = selectedDay === day.formatted;
                return (
                    <CircleProgress
                        key={day.formatted}
                        pct={pct}
                        label={label}
                        dayName={`${format(day.date, 'd')} ${day.dayName}`}
                        isSelected={isSelected}
                        onClick={() => setSelected(isSelected ? null : day.formatted)}
                    />
                );
            })}
        </div>
    );

    // Shared calendar table renderer – highlights the selected day column
    const renderDayHeaders = (selectedDay: string | null) => (
        <div className={styles.daysCol}>
            {weekDays.map(day => (
                <div key={day.formatted} className={`${styles.dayHead} ${selectedDay === day.formatted ? styles.selectedDayHead : ''}`}>
                    <span className={styles.dayNum}>{format(day.date, 'd')}</span>
                    <span className={styles.dayLabel}>{day.dayName}</span>
                </div>
            ))}
        </div>
    );

    return (
        <div className={styles.habitsPage}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Habit Tracker</h1>
                    <p className={styles.subtitle}>Build consistency, one day at a time</p>
                </div>
                <div className={`${styles.overviewBadge} ${selectedHabit ? styles.overviewBadgeSelected : ''}`}
                    onClick={() => { setSelectedHabitId(null); setSelectedHabitSource(null); }}
                    title={selectedHabit ? 'Click to reset' : ''}>
                    <Flame size={24} className={styles.flameIcon} />
                    <div className={styles.overviewText}>
                        <span>{badgeLabel}</span>
                        <strong>{badgeStreak} Days</strong>
                    </div>
                </div>
            </div>

            {/* Two-column layout */}
            <div className={styles.twoColLayout}>

                {/* ── LEFT: Time-bound Habits ── */}
                <div className={styles.habitColumn}>
                    <div className={styles.columnHeader}>
                        <div>
                            <h2 className={styles.columnTitle}><Clock size={18} /> Time-Bound Habits</h2>
                            <p className={styles.columnSubtitle}>Habits with a specific schedule</p>
                        </div>
                        <button onClick={() => setIsModalOpen(true)} className={styles.addBtn}>
                            <Plus size={16} /> Add
                        </button>
                    </div>

                    {renderDayProgressRow(sortedHabits, selectedTimedDay, setSelectedTimedDay)}

                    <div className={`glass-panel ${styles.habitsContainer}`}>
                        <div className={`${styles.tableHeader} ${styles.timedGrid}`}>
                            <div className={styles.habitSNoCol}>S.No</div>
                            <div className={styles.habitTitleCol}>Habit</div>
                            <div className={styles.habitTimeCol}>Time</div>
                            <div className={styles.habitCompleteCol}>
                                Done
                                {selectedTimedDay && selectedTimedDay !== todayStr && (
                                    <span className={styles.viewingDayBadge}>
                                        {format(new Date(selectedTimedDay), 'd MMM')}
                                    </span>
                                )}
                            </div>
                            {renderDayHeaders(selectedTimedDay)}
                            <div className={styles.habitActionCol}>Edit</div>
                            <div className={styles.streakCol}>🔥</div>
                        </div>

                        <div className={styles.habitsList}>
                            {sortedHabits.map((habit, index) => (
                                <div key={habit.id} className={`${styles.habitRow} ${styles.timedGrid} ${selectedHabitId === habit.id ? styles.habitRowSelected : ''}`}>
                                    <div className={styles.habitSNoColMain}><span className={styles.habitSerial}>{index + 1}</span></div>
                                    <div className={styles.habitTitleColMain} onClick={() => selectHabit(habit.id, 'timed')} style={{ cursor: 'pointer' }}>
                                        <span className={styles.habitName}>{habit.title}</span>
                                    </div>
                                    <div className={styles.habitTimeColMain}><span className={styles.habitTime}>{habit.startTime} - {habit.endTime}</span></div>
                                    <div className={styles.habitCompleteColMain}>
                                        {/* Done checkbox: reflects selected day history or today */}
                                        {(() => {
                                            const viewDate = selectedTimedDay || todayStr;
                                            const isHistorical = viewDate !== todayStr;
                                            return (
                                                <input type="checkbox"
                                                    className={`${styles.completeCheckbox} ${isHistorical ? styles.historicalCheckbox : ''}`}
                                                    checked={habit.completedDays.includes(viewDate)}
                                                    onChange={isHistorical ? undefined : () => toggleHabitDay(habit.id, viewDate)}
                                                    readOnly={isHistorical}
                                                    title={isHistorical ? `Status on ${format(new Date(viewDate), 'dd MMM')}` : 'Mark complete today'}
                                                />
                                            );
                                        })()}
                                    </div>
                                    <div className={styles.daysColMain}>
                                        {weekDays.map(day => {
                                            const isCompleted = habit.completedDays.includes(day.formatted);
                                            const isToday = day.formatted === todayStr;
                                            const isSelectedDay = day.formatted === selectedTimedDay;
                                            return (
                                                <button key={day.formatted}
                                                    className={`${styles.dayCheckbox} ${isCompleted ? styles.completed : ''} ${isToday ? styles.todayBox : ''} ${isSelectedDay ? styles.selectedDayCol : ''}`}
                                                    onClick={() => toggleHabitDay(habit.id, day.formatted)}>
                                                    {isCompleted ? <Check size={14} strokeWidth={3} /> : <X size={14} className={styles.xIcon} />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className={styles.habitActionColMain}>
                                        <button className={styles.editBtn} onClick={() => openEditModal(habit)}><Edit2 size={14} /></button>
                                        <button className={styles.deleteBtn} onClick={() => handleDeleteHabit(habit.id)}><Trash2 size={14} /></button>
                                    </div>
                                    <div className={styles.streakColMain}>
                                        <div
                                            className={`${styles.streakBadge} ${habit.streak > 0 ? styles.activeStreak : ''} ${styles.streakClickable}`}
                                            onClick={() => setCalendarHabit({ title: habit.title, completedDays: habit.completedDays })}
                                            title="Click to view activity calendar"
                                        >
                                            <Flame size={14} /><span>{habit.streak}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: Flexible Habits ── */}
                <div className={styles.habitColumn}>
                    <div className={styles.columnHeader}>
                        <div>
                            <h2 className={`${styles.columnTitle} ${styles.flexTitle}`}>✅ Flexible Habits</h2>
                            <p className={styles.columnSubtitle}>No strict timing — just complete daily</p>
                        </div>
                        <button onClick={() => setIsFlexModalOpen(true)} className={`${styles.addBtn} ${styles.flexAddBtn}`}>
                            <Plus size={16} /> Add
                        </button>
                    </div>

                    {renderDayProgressRow(flexibleHabits, selectedFlexDay, setSelectedFlexDay)}

                    <div className={`glass-panel ${styles.habitsContainer}`}>
                        <div className={`${styles.tableHeader} ${styles.flexGrid}`}>
                            <div className={styles.habitSNoCol}>S.No</div>
                            <div className={styles.flexTitleCol}>Habit</div>
                            <div className={styles.habitCompleteCol}>
                                Done
                                {selectedFlexDay && selectedFlexDay !== todayStr && (
                                    <span className={styles.viewingDayBadge}>
                                        {format(new Date(selectedFlexDay), 'd MMM')}
                                    </span>
                                )}
                            </div>
                            {renderDayHeaders(selectedFlexDay)}
                            <div className={styles.habitActionCol}>Edit</div>
                            <div className={styles.streakCol}>🔥</div>
                        </div>

                        <div className={styles.habitsList}>
                            {flexibleHabits.map((habit, index) => (
                                <div key={habit.id} className={`${styles.habitRow} ${styles.flexGrid} ${selectedHabitId === habit.id ? styles.habitRowSelected : ''}`}>
                                    <div className={styles.habitSNoColMain}><span className={styles.habitSerial}>{index + 1}</span></div>
                                    <div className={styles.flexTitleColMain} onClick={() => selectHabit(habit.id, 'flex')} style={{ cursor: 'pointer' }}>
                                        <span className={styles.habitName}>{habit.title}</span>
                                    </div>
                                    <div className={styles.habitCompleteColMain}>
                                        {(() => {
                                            const viewDate = selectedFlexDay || todayStr;
                                            const isHistorical = viewDate !== todayStr;
                                            return (
                                                <input type="checkbox"
                                                    className={`${styles.completeCheckbox} ${isHistorical ? styles.historicalCheckbox : ''}`}
                                                    checked={habit.completedDays.includes(viewDate)}
                                                    onChange={isHistorical ? undefined : () => toggleFlexDay(habit.id, viewDate)}
                                                    readOnly={isHistorical}
                                                    title={isHistorical ? `Status on ${format(new Date(viewDate), 'dd MMM')}` : 'Mark complete today'}
                                                />
                                            );
                                        })()}
                                    </div>
                                    <div className={styles.daysColMain}>
                                        {weekDays.map(day => {
                                            const isCompleted = habit.completedDays.includes(day.formatted);
                                            const isToday = day.formatted === todayStr;
                                            const isSelectedDay = day.formatted === selectedFlexDay;
                                            return (
                                                <button key={day.formatted}
                                                    className={`${styles.dayCheckbox} ${isCompleted ? styles.completed : ''} ${isToday ? styles.todayBox : ''} ${isSelectedDay ? styles.selectedDayCol : ''}`}
                                                    onClick={() => toggleFlexDay(habit.id, day.formatted)}>
                                                    {isCompleted ? <Check size={14} strokeWidth={3} /> : <X size={14} className={styles.xIcon} />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className={styles.habitActionColMain}>
                                        <button className={styles.editBtn} onClick={() => openEditFlexModal(habit)}><Edit2 size={14} /></button>
                                        <button className={styles.deleteBtn} onClick={() => handleDeleteFlexHabit(habit.id)}><Trash2 size={14} /></button>
                                    </div>
                                    <div className={styles.streakColMain}>
                                        <div
                                            className={`${styles.streakBadge} ${habit.streak > 0 ? styles.activeStreak : ''} ${styles.streakClickable}`}
                                            onClick={() => setCalendarHabit({ title: habit.title, completedDays: habit.completedDays })}
                                            title="Click to view activity calendar"
                                        >
                                            <Flame size={14} /><span>{habit.streak}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Habit Activity Calendar Modal ── */}
            {calendarHabit && (
                <HabitCalendar
                    title={calendarHabit.title}
                    completedDays={calendarHabit.completedDays}
                    onClose={() => setCalendarHabit(null)}
                />
            )}

            {/* ── Time-bound Habit Modal ── */}
            {isModalOpen && (
                <div className={styles.modalOverlay} onClick={closeModal}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>{editingHabitId ? 'Edit Habit' : 'Create New Habit'}</h2>
                            <button className={styles.closeBtn} onClick={closeModal}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleAddHabit} className={styles.modalForm}>
                            <div className={styles.formGroup}>
                                <label>Habit Name</label>
                                <input type="text" value={newHabitName} onChange={e => setNewHabitName(e.target.value)}
                                    placeholder="e.g., Read 30 pages" required className={styles.input} />
                            </div>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Start Time</label>
                                    <div style={{ position: 'relative' }}>
                                        <Clock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                        <input type="time" value={newHabitStartTime} onChange={e => setNewHabitStartTime(e.target.value)}
                                            required className={styles.input} style={{ paddingLeft: '36px' }} />
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>End Time</label>
                                    <div style={{ position: 'relative' }}>
                                        <Clock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                        <input type="time" value={newHabitEndTime} onChange={e => setNewHabitEndTime(e.target.value)}
                                            required className={styles.input} style={{ paddingLeft: '36px' }} />
                                    </div>
                                </div>
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelBtn} onClick={closeModal}>Cancel</button>
                                <button type="submit" className={styles.submitBtn}>{editingHabitId ? 'Save Changes' : 'Save Habit'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Flexible Habit Modal ── */}
            {isFlexModalOpen && (
                <div className={styles.modalOverlay} onClick={closeFlexModal}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>{editingFlexId ? 'Edit Flexible Habit' : 'Add Flexible Habit'}</h2>
                            <button className={styles.closeBtn} onClick={closeFlexModal}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleAddFlexHabit} className={styles.modalForm}>
                            <div className={styles.formGroup}>
                                <label>Habit Name</label>
                                <input type="text" value={newFlexName} onChange={e => setNewFlexName(e.target.value)}
                                    placeholder="e.g., Drink 3L of Water" required className={styles.input} />
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '-8px' }}>
                                This habit has no time constraint — just complete it every day!
                            </p>
                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelBtn} onClick={closeFlexModal}>Cancel</button>
                                <button type="submit" className={`${styles.submitBtn} ${styles.flexSubmitBtn}`}>
                                    {editingFlexId ? 'Save Changes' : 'Add Habit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
