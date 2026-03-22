import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from 'date-fns';
import { subscribeToCalendarEvents, addCalendarEvent } from '../services/dataService';
import styles from './Calendar.module.css';

interface CalendarEvent {
    id: string;
    title: string;
    date: Date;
    type: 'task' | 'goal' | 'reminder';
    completed: boolean;
}

const mockEvents: CalendarEvent[] = [
    { id: '1', title: 'Design Review', date: new Date(), type: 'task', completed: false },
    { id: '2', title: 'Launch MVP', date: addDays(new Date(), 3), type: 'goal', completed: false },
    { id: '3', title: 'Pay Bills', date: addDays(new Date(), -2), type: 'reminder', completed: false },
];

export function Calendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [manualEvents, setManualEvents] = useState<CalendarEvent[]>([]);

    const [tasks, setTasks] = useState<any[]>([]);
    const [goals, setGoals] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeToCalendarEvents((fetchedEvents) => {
            const parsed = fetchedEvents.map(e => ({
                ...e,
                date: new Date(e.date)
            }));
            setManualEvents(parsed.length > 0 ? parsed : mockEvents);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const savedTasks = localStorage.getItem('tracktrack_tasks');
        const savedGoals = localStorage.getItem('tracktrack_goals');
        if (savedTasks) setTasks(JSON.parse(savedTasks));
        if (savedGoals) setGoals(JSON.parse(savedGoals));
    }, []);

    // Derived events: manual + tasks + goal tasks
    const events = [...manualEvents];

    // Auto-populate from tasks
    tasks.forEach(t => {
        if (t.dueDate) {
            events.push({
                id: t.id,
                title: t.title,
                date: new Date(t.dueDate),
                type: 'task',
                completed: t.completed || false
            });
        }
    });

    goals.forEach(g => {
        if (g.deadline) {
            events.push({
                id: g.id,
                title: g.title,
                date: new Date(g.deadline),
                type: 'goal',
                completed: g.completed || false
            });
        }
    });

    // Add Event Form State
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventDate, setNewEventDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [newEventType, setNewEventType] = useState<'task' | 'goal' | 'reminder'>('task');

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const jumpToToday = () => setCurrentDate(new Date());

    const handleAddEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEventTitle.trim()) return;

        const dateParts = newEventDate.split('-');
        // Construct date correctly respecting local timezone if needed, or simply naive
        const eventDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));

        const newEvent = {
            title: newEventTitle,
            date: eventDate.toISOString(),
            type: newEventType,
            completed: false
        };

        try {
            await addCalendarEvent(newEvent);
            setIsModalOpen(false);
            setNewEventTitle('');
            setNewEventDate(format(new Date(), 'yyyy-MM-dd'));
            setNewEventType('task');
        } catch (error) {
            console.error("Error adding calendar event:", error);
        }
    };

    const renderHeader = () => {
        return (
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>{format(currentDate, 'MMMM yyyy')}</h1>
                    <button className={styles.todayBtn} onClick={jumpToToday}>Today</button>
                </div>
                <div className={styles.navButtons}>
                    <button onClick={prevMonth} className={styles.iconBtn}><ChevronLeft size={24} /></button>
                    <button onClick={nextMonth} className={styles.iconBtn}><ChevronRight size={24} /></button>
                    <button className={styles.addEventBtn} onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} /> Add Event
                    </button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = [];
        const dateFormat = 'EEEE';
        const startDate = startOfWeek(currentDate);

        for (let i = 0; i < 7; i++) {
            days.push(
                <div className={styles.dayName} key={i}>
                    {format(addDays(startDate, i), dateFormat)}
                </div>
            );
        }
        return <div className={styles.daysRow}>{days}</div>;
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = '';

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, 'd');
                const cloneDay = day;

                // Find events for this day
                const dayEvents = events.filter(event => isSameDay(event.date, cloneDay));

                days.push(
                    <div
                        className={`${styles.cell} ${!isSameMonth(day, monthStart)
                            ? styles.disabledCell
                            : isToday(day) ? styles.todayCell : ''
                            }`}
                        key={day.toString()}
                    >
                        <span className={styles.dateNumber}>{formattedDate}</span>
                        <div className={styles.eventsList}>
                            {dayEvents.map(event => (
                                <div key={event.id} className={`${styles.eventBadge} ${styles[event.type]} ${event.completed ? styles.completedEvent : ''}`}>
                                    {event.title}
                                </div>
                            ))}
                        </div>
                    </div>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className={styles.calendarRow} key={day.toString()}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div className={styles.body}>{rows}</div>;
    };

    return (
        <div className={styles.calendarPage}>
            {renderHeader()}
            <div className={styles.legendContainer}>
                <div className={styles.legendItem}>
                    <div className={`${styles.legendColor} ${styles.taskLegend}`}></div>
                    <span>Task</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={`${styles.legendColor} ${styles.goalLegend}`}></div>
                    <span>Goal</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={`${styles.legendColor} ${styles.reminderLegend}`}></div>
                    <span>Reminder</span>
                </div>
            </div>
            <div className={`glass-panel ${styles.calendarContainer}`}>
                {renderDays()}
                {renderCells()}
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>Add New Event</h2>
                            <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddEvent} className={styles.eventForm}>
                            <div className={styles.formGroup}>
                                <label>Event Title</label>
                                <input
                                    type="text"
                                    value={newEventTitle}
                                    onChange={(e) => setNewEventTitle(e.target.value)}
                                    placeholder="Enter event name"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Date</label>
                                <input
                                    type="date"
                                    value={newEventDate}
                                    onChange={(e) => setNewEventDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Event Type</label>
                                <select
                                    value={newEventType}
                                    onChange={(e) => setNewEventType(e.target.value as any)}
                                >
                                    <option value="task">Task</option>
                                    <option value="goal">Goal</option>
                                    <option value="reminder">Reminder</option>
                                </select>
                            </div>
                            <div className={styles.formActions}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className={styles.saveBtn}>Save Event</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
