import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Calendar, Flag, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import styles from './TodaysEvents.module.css';

export function TodaysEvents() {
    const [tasks, setTasks] = useState<any[]>([]);

    const loadTasks = () => {
        let items: any[] = [];
        const today = format(new Date(), 'yyyy-MM-dd');

        // Load tasks
        const savedTasks = localStorage.getItem('tracktrack_tasks');
        if (savedTasks) {
            const allTasks: any[] = JSON.parse(savedTasks);
            const filteredTasks = allTasks.filter(t => t.dueDate && format(new Date(t.dueDate), 'yyyy-MM-dd') === today).map(t => ({...t, displayType: 'Task'}));
            items = [...items, ...filteredTasks];
        }

        // Load calendar events
        const savedEvents = localStorage.getItem('tracktrack_calendar_events');
        if (savedEvents) {
            const allEvents: any[] = JSON.parse(savedEvents);
            const filteredEvents = allEvents.filter(e => e.date && format(new Date(e.date), 'yyyy-MM-dd') === today).map(e => ({...e, displayType: 'Event'}));
            items = [...items, ...filteredEvents];
        }

        setTasks(items);
    };

    useEffect(() => {
        loadTasks();
        window.addEventListener('storage', loadTasks);
        window.addEventListener('tasksUpdate', loadTasks);
        return () => {
            window.removeEventListener('storage', loadTasks);
            window.removeEventListener('tasksUpdate', loadTasks);
        };
    }, []);

    const toggleTask = (id: string) => {
        // Try tasks first
        const savedTasks = localStorage.getItem('tracktrack_tasks');
        if (savedTasks) {
            const allTasks: any[] = JSON.parse(savedTasks);
            const taskIndex = allTasks.findIndex(t => t.id === id);
            if (taskIndex > -1) {
                allTasks[taskIndex].completed = !allTasks[taskIndex].completed;
                localStorage.setItem('tracktrack_tasks', JSON.stringify(allTasks));
                window.dispatchEvent(new Event('tasksUpdate'));
                return;
            }
        }

        // Try calendar events
        const savedEvents = localStorage.getItem('tracktrack_calendar_events');
        if (savedEvents) {
            const allEvents: any[] = JSON.parse(savedEvents);
            const eventIndex = allEvents.findIndex(e => e.id === id);
            if (eventIndex > -1) {
                allEvents[eventIndex].completed = !allEvents[eventIndex].completed;
                localStorage.setItem('tracktrack_calendar_events', JSON.stringify(allEvents));
                window.dispatchEvent(new Event('tasksUpdate'));
                return;
            }
        }
    };

    return (
        <div className={styles.todaysEventsPage}>
            <div className={styles.header}>
                <Link to="/tasks" className={styles.backLink}>
                    <ArrowLeft size={20} /> Back to All Tasks
                </Link>
                <h1 className={styles.title}>Today's Events</h1>
                <p className={styles.subtitle}>{format(new Date(), 'EEEE, MMMM do, yyyy')}</p>
            </div>

            {tasks.length > 0 ? (
                <div className={styles.taskList}>
                    {tasks.map((task) => (
                        <div
                            key={task.id}
                            className={`glass-panel ${styles.taskItem} ${task.completed ? styles.completedTask : ''}`}
                        >
                            <button className={styles.checkButton} onClick={() => toggleTask(task.id)}>
                                {task.completed ? (
                                    <CheckCircle2 size={24} className={styles.checkedIcon} />
                                ) : (
                                    <Circle size={24} className={styles.uncheckedIcon} />
                                )}
                            </button>
                            <div className={styles.taskContent}>
                                <div className={styles.titleRow}>
                                    <span className={styles.taskTitle}>{task.title}</span>
                                    <span className={styles.typeBadge}>{task.displayType}</span>
                                </div>
                                <div className={styles.taskMeta}>
                                    <span className={styles.metaBadge}>
                                        <Calendar size={14} /> Today
                                    </span>
                                    <span className={`${styles.metaBadge} ${styles.priorityBadge} ${styles[(task.priority || 'medium') + 'Priority']}`}>
                                        <Flag size={14} /> {task.priority || 'medium'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={`glass-panel ${styles.emptyState}`}>
                    <Calendar size={48} className={styles.emptyIcon} />
                    <h3>No events for today</h3>
                    <p>You're all caught up! Why not add a new task?</p>
                    <Link to="/tasks" className={styles.addButton}>Go to Tasks</Link>
                </div>
            )}
        </div>
    );
}
