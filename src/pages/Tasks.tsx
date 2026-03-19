import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Flag, CheckCircle2, Circle } from 'lucide-react';
import { format } from 'date-fns';
import styles from './Tasks.module.css';

import { initialTasks } from '../data/mockTasks';
import type { Task } from '../data/mockTasks';

export function Tasks() {
    const [tasks, setTasks] = useState<Task[]>(() => {
        const saved = localStorage.getItem('tracktrack_tasks');
        return saved ? JSON.parse(saved) : initialTasks;
    });

    useEffect(() => {
        localStorage.setItem('tracktrack_tasks', JSON.stringify(tasks));
    }, [tasks]);

    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('high');

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        const newTask: Task = {
            id: Date.now().toString(),
            title: newTaskTitle,
            completed: false,
            priority: newTaskPriority,
            dueDate: new Date().toISOString()
        };
        setTasks([newTask, ...tasks]);
        setNewTaskTitle('');
    };

    const toggleTask = (id: string) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const deleteTask = (id: string) => {
        setTasks(tasks.filter(t => t.id !== id));
    };

    const highTasks = tasks.filter(t => t.priority === 'high');
    const mediumTasks = tasks.filter(t => t.priority === 'medium');
    const lowTasks = tasks.filter(t => t.priority === 'low');

    const renderTaskCard = (task: Task) => (
        <div key={task.id} className={`glass-panel ${styles.taskItem} ${task.completed ? styles.completedTask : ''}`}>
            <button className={styles.checkButton} onClick={() => toggleTask(task.id)}>
                {task.completed ? <CheckCircle2 size={24} className={styles.checkedIcon} /> : <Circle size={24} className={styles.uncheckedIcon} />}
            </button>
            <div className={styles.taskContent}>
                <span className={styles.taskTitle}>{task.title}</span>
                <div className={styles.taskMeta}>
                    <span className={styles.metaBadge}>
                        <Calendar size={14} /> {format(new Date(task.dueDate), 'MMM d')}
                    </span>
                </div>
            </div>
            <button className={styles.deleteButton} onClick={() => deleteTask(task.id)}>
                <Trash2 size={18} />
            </button>
        </div>
    );

    return (
        <div className={styles.tasksPage}>
            <div className={styles.header}>
                <h1 className={styles.title}>Tasks</h1>
                <p className={styles.subtitle}>Manage your daily to-dos</p>
            </div>

            <div className={`glass-panel ${styles.addTaskCard}`}>
                <form onSubmit={handleAddTask} className={styles.addTaskForm}>
                    <input
                        type="text"
                        placeholder="What needs to be done?"
                        className={styles.taskInput}
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                    />
                    <div className={styles.taskActions}>
                        <select
                            value={newTaskPriority}
                            onChange={(e) => setNewTaskPriority(e.target.value as any)}
                            className={styles.prioritySelect}
                        >
                            <option value="high">High Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="low">Low Priority</option>
                        </select>
                        <button type="submit" className={styles.addButton} disabled={!newTaskTitle.trim()}>
                            <Plus size={18} /> Add Task
                        </button>
                    </div>
                </form>
            </div>

            <div className={styles.boardContainer}>
                {/* High Priority Column */}
                <div className={styles.priorityColumn}>
                    <div className={`${styles.columnHeader} ${styles.highHeader}`}>
                        <div className={styles.headerLeft}>
                            <Flag size={18} />
                            <h3>High Priority</h3>
                        </div>
                        <span className={styles.taskCount}>{highTasks.length}</span>
                    </div>
                    <div className={styles.columnContent}>
                        {highTasks.map(renderTaskCard)}
                        {highTasks.length === 0 && (
                            <div className={styles.emptyColumn}>No high priority tasks</div>
                        )}
                    </div>
                </div>

                {/* Medium Priority Column */}
                <div className={styles.priorityColumn}>
                    <div className={`${styles.columnHeader} ${styles.mediumHeader}`}>
                        <div className={styles.headerLeft}>
                            <Flag size={18} />
                            <h3>Medium Priority</h3>
                        </div>
                        <span className={styles.taskCount}>{mediumTasks.length}</span>
                    </div>
                    <div className={styles.columnContent}>
                        {mediumTasks.map(renderTaskCard)}
                        {mediumTasks.length === 0 && (
                            <div className={styles.emptyColumn}>No medium priority tasks</div>
                        )}
                    </div>
                </div>

                {/* Low Priority Column */}
                <div className={styles.priorityColumn}>
                    <div className={`${styles.columnHeader} ${styles.lowHeader}`}>
                        <div className={styles.headerLeft}>
                            <Flag size={18} />
                            <h3>Low Priority</h3>
                        </div>
                        <span className={styles.taskCount}>{lowTasks.length}</span>
                    </div>
                    <div className={styles.columnContent}>
                        {lowTasks.map(renderTaskCard)}
                        {lowTasks.length === 0 && (
                            <div className={styles.emptyColumn}>No low priority tasks</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
