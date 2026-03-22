import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Calendar, Flag, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { subscribeToTasks, subscribeToCalendarEvents, updateTask, updateCalendarEvent } from '../services/dataService';
import styles from './TodaysEvents.module.css';

export function TodaysEvents() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [displayItems, setDisplayItems] = useState<any[]>([]);

    useEffect(() => {
        const unsubTasks = subscribeToTasks(setTasks);
        const unsubEvents = subscribeToCalendarEvents(setEvents);
        return () => {
            unsubTasks();
            unsubEvents();
        };
    }, []);

    useEffect(() => {
        const today = format(new Date(), 'yyyy-MM-dd');
        
        const todaysTasks = tasks
            .filter(t => t.dueDate && format(new Date(t.dueDate), 'yyyy-MM-dd') === today)
            .map(t => ({ ...t, displayType: 'Task' }));

        const todaysEvents = events
            .filter(e => e.date && format(new Date(e.date), 'yyyy-MM-dd') === today)
            .map(e => ({ ...e, displayType: 'Event' }));

        setDisplayItems([...todaysTasks, ...todaysEvents]);
    }, [tasks, events]);

    const toggleTask = async (id: string) => {
        const item = displayItems.find(i => i.id === id);
        if (!item) return;

        try {
            if (item.displayType === 'Task') {
                await updateTask(id, { completed: !item.completed });
            } else {
                await updateCalendarEvent(id, { completed: !item.completed });
            }
        } catch (error) {
            console.error("Error toggling item:", error);
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

            {displayItems.length > 0 ? (
                <div className={styles.taskList}>
                    {displayItems.map((task) => (
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
