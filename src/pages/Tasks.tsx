import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Flag, CheckCircle2, Circle, GripVertical, Edit2, X } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { format } from 'date-fns';
import { subscribeToTasks, addTask, updateTask, deleteTask } from '../services/dataService';
import styles from './Tasks.module.css';

import type { Task } from '../data/mockTasks';

export function Tasks() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToTasks((fetchedTasks) => {
            setTasks(fetchedTasks);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('high');
    
    // Edit Modal State
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>('high');

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        // Find the maximum position in the current priority to put it at the end
        const samePriorityTasks = tasks.filter(t => t.priority === newTaskPriority);
        const maxPos = samePriorityTasks.length > 0 
            ? Math.max(...samePriorityTasks.map(t => t.position || 0)) 
            : 0;

        const newTask = {
            title: newTaskTitle,
            completed: false,
            priority: newTaskPriority,
            dueDate: new Date().toISOString(),
            position: maxPos + 1000 // Space out positions
        };
        
        try {
            await addTask(newTask);
            setNewTaskTitle('');
        } catch (error) {
            console.error("Error adding task:", error);
        }
    };

    const toggleTask = async (id: string, completed: boolean) => {
        try {
            await updateTask(id, { completed: !completed });
        } catch (error) {
            console.error("Error toggling task:", error);
        }
    };

    const handleDeleteTask = async (id: string) => {
        if (!confirm('Are you sure you want to delete this task?')) return;
        try {
            await deleteTask(id);
        } catch (error) {
            console.error("Error deleting task:", error);
        }
    };

    const handleEditClick = (task: Task) => {
        setEditingTask(task);
        setEditTitle(task.title);
        setEditPriority(task.priority);
    };

    const handleUpdateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTask || !editTitle.trim()) return;

        try {
            await updateTask(editingTask.id, {
                title: editTitle,
                priority: editPriority
            });
            setEditingTask(null);
        } catch (error) {
            console.error("Error updating task:", error);
        }
    };

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const destPriority = destination.droppableId as 'low' | 'medium' | 'high';
        const columnTasks = tasks
            .filter(t => t.priority === destPriority)
            .sort((a, b) => (a.position || 0) - (b.position || 0));

        // If it's a cross-column move, remove it from the source first in our logic
        // But for calculating the new position, we just care about the destination column
        const updatedColumnTasks = [...columnTasks];
        if (source.droppableId === destination.droppableId) {
            const [removed] = updatedColumnTasks.splice(source.index, 1);
            updatedColumnTasks.splice(destination.index, 0, removed);
        }

        let newPosition: number;
        const index = destination.index;

        if (updatedColumnTasks.length === 0) {
            newPosition = 1000;
        } else if (index === 0) {
            // Moved to the top
            const firstPos = updatedColumnTasks[source.droppableId === destination.droppableId ? 1 : 0]?.position || 0;
            newPosition = firstPos - 1000;
        } else if (index >= updatedColumnTasks.length - (source.droppableId === destination.droppableId ? 0 : 1)) {
            // Moved to the bottom
            const lastPos = updatedColumnTasks[updatedColumnTasks.length - (source.droppableId === destination.droppableId ? 2 : 1)]?.position || 0;
            newPosition = lastPos + 1000;
        } else {
            // Moved between two items
            // Simplified logic: just get the neighbors in the target state
            // Re-filtering is safer
            const neighbors = [...columnTasks];
            if (source.droppableId === destination.droppableId) {
                const [removed] = neighbors.splice(source.index, 1);
                neighbors.splice(destination.index, 0, removed);
            } else {
                neighbors.splice(destination.index, 0, {} as any); // placeholder
            }

            const prevTask = neighbors[index - 1];
            const nextTask = neighbors[index + 1];
            
            if (prevTask && nextTask) {
                newPosition = ((prevTask.position || 0) + (nextTask.position || 0)) / 2;
            } else if (prevTask) {
                newPosition = (prevTask.position || 0) + 1000;
            } else if (nextTask) {
                newPosition = (nextTask.position || 0) - 1000;
            } else {
                newPosition = 1000;
            }
        }

        try {
            await updateTask(draggableId, { 
                priority: destPriority,
                position: newPosition
            });
        } catch (error) {
            console.error("Error updating task after drag:", error);
        }
    };

    const highTasks = tasks.filter(t => t.priority === 'high');
    const mediumTasks = tasks.filter(t => t.priority === 'medium');
    const lowTasks = tasks.filter(t => t.priority === 'low');

    const renderTaskCard = (task: Task, index: number) => (
        <Draggable key={task.id} draggableId={task.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`glass-panel ${styles.taskItem} ${task.completed ? styles.completedTask : ''} ${snapshot.isDragging ? styles.dragging : ''}`}
                >
                    <div {...provided.dragHandleProps} className={styles.dragHandle}>
                        <GripVertical size={18} />
                    </div>
                    <button className={styles.checkButton} onClick={() => toggleTask(task.id, task.completed)}>
                        {task.completed ? <CheckCircle2 size={24} className={styles.checkedIcon} /> : <Circle size={24} className={styles.uncheckedIcon} />}
                    </button>
                    <div className={styles.taskContent}>
                        <span className={styles.taskTitle}>{task.title}</span>
                        <div className={styles.taskMeta}>
                            <span className={styles.metaBadge}>
                                <Calendar size={14} /> {task.dueDate ? format(new Date(task.dueDate), 'MMM d') : 'No date'}
                            </span>
                        </div>
                    </div>
                    <div className={styles.taskActions}>
                        <button className={styles.editButton} onClick={() => handleEditClick(task)} title="Edit Task">
                            <Edit2 size={18} />
                        </button>
                        <button className={styles.deleteButton} onClick={() => handleDeleteTask(task.id)} title="Delete Task">
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            )}
        </Draggable>
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
                        <button type="submit" className={styles.addButton} disabled={!newTaskTitle.trim() || isLoading}>
                            <Plus size={18} /> {isLoading ? 'Working...' : 'Add Task'}
                        </button>
                    </div>
                </form>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
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
                        <Droppable droppableId="high">
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={styles.columnContent}
                                >
                                    {highTasks.map((t, i) => renderTaskCard(t, i))}
                                    {provided.placeholder}
                                    {highTasks.length === 0 && (
                                        <div className={styles.emptyColumn}>No high priority tasks</div>
                                    )}
                                </div>
                            )}
                        </Droppable>
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
                        <Droppable droppableId="medium">
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={styles.columnContent}
                                >
                                    {mediumTasks.map((t, i) => renderTaskCard(t, i))}
                                    {provided.placeholder}
                                    {mediumTasks.length === 0 && (
                                        <div className={styles.emptyColumn}>No medium priority tasks</div>
                                    )}
                                </div>
                            )}
                        </Droppable>
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
                        <Droppable droppableId="low">
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={styles.columnContent}
                                >
                                    {lowTasks.map((t, i) => renderTaskCard(t, i))}
                                    {provided.placeholder}
                                    {lowTasks.length === 0 && (
                                        <div className={styles.emptyColumn}>No low priority tasks</div>
                                    )}
                                </div>
                            )}
                        </Droppable>
                    </div>
                </div>
            </DragDropContext>

            {/* Edit Task Modal */}
            {editingTask && (
                <div className={styles.modalOverlay}>
                    <div className={`glass-panel ${styles.modalContent}`}>
                        <div className={styles.modalHeader}>
                            <h2>Edit Task</h2>
                            <button className={styles.closeBtn} onClick={() => setEditingTask(null)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateTask} className={styles.editForm}>
                            <div className={styles.formGroup}>
                                <label>Task Title</label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    placeholder="Task title"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Priority</label>
                                <select
                                    value={editPriority}
                                    onChange={(e) => setEditPriority(e.target.value as any)}
                                    className={styles.prioritySelect}
                                >
                                    <option value="high">High Priority</option>
                                    <option value="medium">Medium Priority</option>
                                    <option value="low">Low Priority</option>
                                </select>
                            </div>
                            <div className={styles.formActions}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setEditingTask(null)}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.saveBtn}>
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
